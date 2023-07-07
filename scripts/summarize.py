import json
import random
import time

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
        tokens_per_message = (
            4  # every message follows <|start|>{role/name}\n{content}<|end|>\n
        )
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


def get_summary(title, description, model="gpt-3.5-turbo"):
    # Set maximum number of tokens
    max_tokens = 4096

    # The initial prompt
    prompt = f"Create a one line description for a technical blogpost based on the title and description I provide you. You should simply describe what the post is about. Respond only in JSON, using 'summary' as the key. Do not say what you're describing, i.e. don't start with 'this blogpost is about'.\n\nTitle: '{title}'\n\nDescription: '{description}'"
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt},
    ]

    # Get the number of tokens in the messages
    num_tokens = num_tokens_from_messages(messages, model=model)

    # Shorten the description until the total number of tokens is less than max_tokens
    while num_tokens > max_tokens:
        # Reduce the description by 10%
        description = description[: int(len(description) * 0.9)]
        # Update the prompt with the shortened description
        prompt = f"Create a one line description for a technical blogpost based on the title and description I provide you. You should simply describe what the post is about. Respond only in JSON, using 'summary' as the key. Do not say what you're describing, i.e. don't start with 'this blogpost is about'.\n\nTitle: '{title}'\n\nDescription: '{description}'"
        # Update the messages with the new prompt
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ]
        # Update the number of tokens
        num_tokens = num_tokens_from_messages(messages, model=model)

    # Define the maximum number of retries and the initial delay
    max_retries = 10
    delay = 1  # delay is in seconds

    for attempt in range(max_retries):
        try:
            # Generate the summary
            completion = openai.ChatCompletion.create(model=model, messages=messages)
            # If successful, break the loop and continue with the rest of the code
            break
        except openai.error.ServiceUnavailableError:
            # If a ServiceUnavailableError is caught, print a warning and wait
            print(
                f"Warning: OpenAI server is overloaded or not ready yet. Retrying in {delay} seconds..."
            )
            time.sleep(delay)
            # Double the delay for the next possible attempt, add some random value to prevent synchronized retries
            delay *= 2 + random.uniform(0, 1)

    # Get summary from the completion response
    summary_json = completion.choices[0].message["content"]
    try:
        # The response from the model is a JSON string. Parse it to get the actual summary.
        summary = json.loads(summary_json)["summary"]
        print(f"Got summary for {title}: {summary}")
    except json.JSONDecodeError:
        print(f"Could not generate summary for {title}")
        summary = "No summary generated due to decoding error"
    return summary
