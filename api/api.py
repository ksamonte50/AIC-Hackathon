from openai import OpenAI
import os
from dotenv import load_dotenv, find_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

_ = load_dotenv(find_dotenv())
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

@app.route('/generate-qr', methods=['POST'])
def generate_qr_style():
    data = request.json
    user_description = data.get('aesthetic', '')
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """You are a QR code style designer. Given a description, output a valid JSON object with double quotes for all property names and string values. The JSON should specify:
                {
                    "color": "#XXXXXX" (hex color code),
                    "backgroundColor": "#XXXXXX" (hex color code),
                    "dotStyle": "string",
                    "cornerStyle": "string",
                    "gradient": "string" (optional)
                }
                Always use 6-digit hex color codes with the # prefix for colors (e.g. "#FF0000" for red, "#FFFFFF" for white).
                Only output the raw JSON, no markdown formatting or explanation."""
            },
            {
                "role": "user",
                "content": user_description
            }
        ]
    )
    
    response_content = completion.choices[0].message.content.strip()
    try:
        # Try to parse the JSON to validate it
        import json
        style_json = json.loads(response_content)
        
        # Validate that colors are hex codes
        for color_field in ['color', 'backgroundColor']:
            if color_field in style_json:
                color = style_json[color_field]
                if not color.startswith('#') or len(color) != 7:
                    return jsonify({
                        "error": f"Invalid hex color code for {color_field}",
                        "raw_response": response_content
                    }), 400
        
        return jsonify({
            "style": style_json,
            "url": data.get('url', '')
        })
    except json.JSONDecodeError:
        return jsonify({
            "error": "Invalid JSON response from AI",
            "raw_response": response_content
        }), 400

if __name__ == '__main__':
    app.run(port=5001, debug=True)