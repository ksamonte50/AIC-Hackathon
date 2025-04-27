from openai import OpenAI
import os
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import requests
import re
import traceback
import base64

app = Flask(__name__)
CORS(app)

_ = load_dotenv(find_dotenv())
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def extract_json_from_ai_response(raw_text):
    """Parse OpenAI response into JSON"""
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Could not parse JSON from: {raw_text[:200]}")

@app.route('/generate-qr', methods=['POST'])
def generate_qr_style():
    data = request.json
    print("Received request:", json.dumps(data, indent=2))
    user_description = data.get('aesthetic', '')
    target_url = data.get('url', '')

    try:
        # Step 1: Get style from OpenAI
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a QR code style designer. Based on a description from the user, output ONLY JSON with these EXACT fields:
                    {
                        "dotStyle": "square", 
                                    "mosaic", 
                                    "dot", 
                                    "circle", 
                                    "circle-zebra", 
                                    "circle-zebra-vertical", 
                                    "circular", 
                                    "edge-cut", 
                                    "edge-cut-smooth", 
                                    "japnese", 
                                    "leaf", 
                                    "pointed", 
                                    "pointed-edge-cut", 
                                    "pointed-in", 
                                    "pointed-in-smooth", 
                                    "pointed-smooth", 
                                    "round", 
                                    "rounded-in", 
                                    "rounded-in-smooth", 
                                    "rounded-pointed", 
                                    "star", or
                                    "diamond", // Shape of the dots
                        "eyeStyle": "frame#", // Shape of the eye squares (# should be replaced with a number between 0 to 16, see below for options)
                        "eyeBallStyle": "ball#", // Shape of the eye balls (# should be replaced with a number between 0 to 19, see below for options)
                        "bodyColor": "#RRGGBB",  // Main dots color
                        "bgColor": "#RRGGBB",    // Background color
                        "eyeColor": "#RRGGBB",   // Color of the eyes as HEX values.
                        "eyeBallColor": "#RRGGBB", // Color of the eye balls as HEX values.
                        "gradientColor1": "#RRGGBB", // Color 1 for gradient color of body as HEX.
                        "gradientColor2": "#RRGGBB", // Color 2 for gradient color of body as HEX.
                        "gradientType": "radial", "linear", "none", // Type of gradient
                        "gradientOnEyes": "true" or "false", // Whether to apply gradient on eyes
                        "logo": ""
                    }

                    Eye Style (frame#) Key:
                    frame0 = "Square - Sharp Corners"
                    frame1 = "Rounded Square - Top Only"
                    frame2 = "Rounded Square - Two Corners"
                    frame3 = "Square - Bottom Corners Rounded"
                    frame4 = "Dotted Square"
                    frame5 = "Wavy Square"
                    frame6 = "Chunky Rounded Square"
                    frame7 = "Dashed Square"
                    frame8 = "Rough/Grungy Square"
                    frame10 = "Wavy Dotted Square"
                    frame11 = "Tight Dotted Square"
                    frame12 = "Perfect Circle"
                    frame13 = "Fully Rounded Square"
                    frame14 = "Tilted/Skewed Square"
                    frame16 = "Jagged/Broken Square"

                    Eye Ball Style (ball#) Key:
                    ball0 = "Solid Square"
                    ball1 = "Top Left Rounded Square"
                    ball2 = "Top Right Rounded Square"
                    ball3 = "Bottom Left Rounded Square"
                    ball5 = "Cluster of Circles"
                    ball6 = "Two Corners Rounded"
                    ball7 = "Jagged Square"
                    ball8 = "Rough Square"
                    ball10 = "Flower-like Cluster"
                    ball11 = "Curved Side Square"
                    ball12 = "Vertical Ovals (Triple)"
                    ball13 = "Horizontal Ovals (Triple)"
                    ball14 = "Perfect Circle"
                    ball15 = "Fully Rounded Square"
                    ball16 = "Tilted/Skewed Square"
                    ball17 = "Cut Corner Square"
                    ball18 = "Inward Curved Square"
                    ball19 = "Exploding Star Shape"

                    eyeColor and eyeBallColor should be the same for all three eye squares.
                    Ensure that the gradient colors are different from the body color.
                    Ensure bgColor and bodyColor have sufficient contrast for QR scanning."""
                },
                {
                    "role": "user",
                    "content": user_description
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        style_json = extract_json_from_ai_response(completion.choices[0].message.content)
        print("OpenAI response:", json.dumps(style_json, indent=2))

        # Step 2: Generate QR code with proper color configuration
        payload = {
            "data": target_url,
            "config": {
                "body": style_json['dotStyle'],
                "eye": style_json['eyeStyle'],
                "eyeBall": style_json['eyeBallStyle'],
                "bodyColor": style_json['bodyColor'],
                "bgColor": style_json['bgColor'],
                "eye1Color": style_json['eyeColor'],  # Color for all three eye squares
                "eye2Color": style_json['eyeColor'],
                "eye3Color": style_json['eyeColor'],
                "eyeBall1Color": style_json['eyeBallColor'],
                "eyeBall2Color": style_json['eyeBallColor'],
                "eyeBall3Color": style_json['eyeBallColor'],
                "gradientColor1": style_json['gradientColor1'],
                "gradientColor2": style_json['gradientColor2'],
                "gradientType": style_json['gradientType'],
                "gradientOnEyes": style_json['gradientOnEyes'],
                "logo":""
            },
            "size": 800,
            "file": "png"
        }

        print("QR API request:", json.dumps(payload, indent=2))
        qr_response = requests.post(
            "https://api.qrcode-monkey.com/qr/custom",
            json=payload,
            timeout=10
        )

        if qr_response.status_code != 200:
            print(f"QR API error: Status {qr_response.status_code}")
            raise ValueError(f"QR API error: {qr_response.status_code}")

        response_data = {
            "success": True,
            "qrImage": base64.b64encode(qr_response.content).decode('utf-8'),
            "imageType": "png",
            "style": style_json
        }
        print("Sending successful response with QR code")
        return jsonify(response_data)

    except Exception as e:
        error_response = {
            "error": str(e),
            "type": type(e).__name__,
            "advice": "Check your color contrast and try again"
        }
        print("Error occurred:", json.dumps(error_response, indent=2))
        print("Traceback:", traceback.format_exc())
        return jsonify(error_response), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)