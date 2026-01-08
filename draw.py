from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8045/v1",
    api_key="sk-428e163ee79742b1ac41a9397072dc43"
)

response = client.chat.completions.create(
    model="gemini-3-pro-image",
    extra_body={ "size": "1024x1024" },
    messages=[{
        "role": "user",
        "content": "Draw a futuristic city"
    }]
)

print(response.choices[0].message.content)