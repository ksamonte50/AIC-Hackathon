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
                "content": "You are a QR code style designer. Given a description, output a JSON object specifying 'color', 'backgroundColor', 'dotStyle', 'cornerStyle', and 'gradient' if needed."
            },
            {
                "role": "user",
                "content": user_description
            }
        ]
    )
    
    return jsonify({
        "style": completion.choices[0].message.content,
        "url": data.get('url', '')
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
