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
    user_description = data.get('aesthetic', '')
    target_url = data.get('url', '')

    try:
        # Step 1: Get style from OpenAI
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": """Output ONLY JSON with these EXACT fields:
                    {
                        "color": "#RRGGBB",
                        "backgroundColor": "#RRGGBB", 
                        "dotStyle": "rounded" or "square"
                    }"""
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

        # Step 2: Generate QR code
        payload = {
            "data": target_url,
            "config": {
                "body": style_json['dotStyle'],
                "eye": "frame0",
                "eyeBall": "ball0",
                "bodyColor": style_json['color'],
                "bgColor": style_json['backgroundColor'],
                "gradientType": "none",
                "gradientOnEyes": False
            },
            "size": 800,
            "file": "png"
        }

        qr_response = requests.post(
            "https://api.qrcode-monkey.com/qr/custom",
            json=payload,
            timeout=10
        )

        if qr_response.status_code != 200:
            raise ValueError(f"QR API error: {qr_response.status_code}")

        # Return the PNG image directly as base64
        return jsonify({
            "success": True,
            "qrImage": base64.b64encode(qr_response.content).decode('utf-8'),
            "imageType": "png",
            "style": style_json
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "type": type(e).__name__,
            "advice": "Check your input and try again"
        }), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)