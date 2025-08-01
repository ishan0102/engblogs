import json

def get_post_insights(client, title, fullText, model="gpt-4.1-mini"):
    # Create a combined prompt for summary and buzzwords
    prompt = f"Create a one line description for a technical blogpost based on the title and full text I provide you. Also, give me a list of the top 5 most important buzzwords from the same. Respond only in JSON, using 'summary' and 'buzzwords' as the keys. Do not say what you're describing, i.e. don't start with 'this blogpost is about'.\n\nTitle: '{title}'\n\nFull Text: '{fullText}'"

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt},
    ]

    # Obtain completion for the prompt
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        response_format={"type": "json_object"},
    )

    # Extract results
    content = response.choices[0].message.content
    try:
        result = json.loads(content)
    except json.decoder.JSONDecodeError:
        import ipdb; ipdb.set_trace()
        return {"summary": "No summary generated.", "buzzwords": []}
    
    summary = result.get("summary", "No summary generated.")
    buzzwords = result.get("buzzwords", [])
    return {"summary": summary, "buzzwords": buzzwords}
