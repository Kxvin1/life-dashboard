import os
import sys
from openai import OpenAI
from app.core.config import settings


def test_openai_connection():
    """Test the connection to OpenAI API"""

    # Check if API key is set
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        print("Error: OPENAI_API_KEY is not set in the .env file.")
        print("Please add it to your .env file: OPENAI_API_KEY='your-api-key'")
        sys.exit(1)

    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)

        # Make a simple test call
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {
                    "role": "user",
                    "content": "Hello, this is a test message. Please respond with 'OpenAI connection successful!'",
                },
            ],
            max_tokens=20,
        )

        # Print the response
        print("OpenAI API Response:")
        print(response.choices[0].message.content)
        print("\nConnection test successful!")

    except Exception as e:
        print(f"Error connecting to OpenAI API: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    test_openai_connection()
