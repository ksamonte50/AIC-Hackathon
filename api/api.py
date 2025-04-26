from openai import OpenAI
import os

from dotenv import load_dotenv, find_dotenv

_ = load_dotenv(find_dotenv())

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
print("API Key: ", os.getenv('OPENAI_API_KEY'))

completion = client.chat.completions.create(
    model="gpt-4o-mini",
    store=True,
    messages=[
        {
            "role": "system",
            "content": "You are a QR code style designer. Given a description, output a JSON object specifying 'color', 'backgroundColor', 'dotStyle', 'cornerStyle', and 'gradient' if needed."
        },
        {
            "role": "user",
            "content": "I want a soft pastel-themed QR code with rounded corners."
        }
    ]
)

print(completion.choices[0].message);
