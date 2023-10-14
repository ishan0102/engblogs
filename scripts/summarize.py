import json

import openai
import tiktoken


def num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613"):
    """Return the number of tokens used by a list of messages."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        print("Warning: model not found. Using cl100k_base encoding.")
        encoding = tiktoken.get_encoding("cl100k_base")
    if model in {
        "gpt-3.5-turbo-0613",
        "gpt-3.5-turbo-16k-0613",
        "gpt-4-0314",
        "gpt-4-32k-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
    }:
        tokens_per_message = 3
        tokens_per_name = 1
    elif model == "gpt-3.5-turbo-0301":
        tokens_per_message = 4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        tokens_per_name = -1  # if there's a name, the role is omitted
    elif "gpt-3.5-turbo" in model:
        # print("Warning: gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613.")
        return num_tokens_from_messages(messages, model="gpt-3.5-turbo-0613")
    elif "gpt-4" in model:
        # print("Warning: gpt-4 may update over time. Returning num tokens assuming gpt-4-0613.")
        return num_tokens_from_messages(messages, model="gpt-4-0613")
    else:
        raise NotImplementedError(
            f"""num_tokens_from_messages() is not implemented for model {model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens."""
        )
    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


def get_post_insights(title, fullText, model="gpt-3.5-turbo"):
    # Set maximum number of tokens
    max_tokens = 4096

    # Create a combined prompt for summary and buzzwords
    prompt = f"Create a one line description for a technical blogpost based on the title and full text I provide you. Also, give me a list of the top 5 most important buzzwords from the same. Respond only in JSON, using 'summary' and 'buzzwords' as the keys. Do not say what you're describing, i.e. don't start with 'this blogpost is about'.\n\nTitle: '{title}'\n\nFull Text: '{fullText}'"

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt},
    ]

    # Get the number of tokens for the message
    num_tokens = num_tokens_from_messages(messages, model=model)

    # Shorten the fullText if the total number of tokens exceeds max_tokens
    while num_tokens > max_tokens:
        print("Shortening fullText")
        fullText = fullText[: int(len(fullText) * 0.9)]
        prompt = f"Create a one line description for a technical blogpost based on the title and full text I provide you. Also, give me a list of the top 5 most important buzzwords from the same. Respond only in JSON, using 'summary' and 'buzzwords' as the keys. Do not say what you're describing, i.e. don't start with 'this blogpost is about'.\n\nTitle: '{title}'\n\nFull Text: '{fullText}'"
        messages[-1]["content"] = prompt
        num_tokens = num_tokens_from_messages(messages, model=model)

    # Obtain completion for the prompt
    completion = openai.ChatCompletion.create(model=model, messages=messages)

    # Extract results
    content = completion.choices[0].message["content"]
    try:
        result = json.loads(content)
    except json.decoder.JSONDecodeError:
        return {"summary": "No summary generated.", "buzzwords": []}
    
    summary = result.get("summary", "No summary generated.")
    buzzwords = result.get("buzzwords", [])
    return {"summary": summary, "buzzwords": buzzwords}
