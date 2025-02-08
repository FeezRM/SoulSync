import os
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize Google Gemini AI API
genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication


# Function: Generate Sentiment Analysis using Gemini
def generate_sentiment_analysis(user_input):
    """Ask Gemini to classify the user's emotion based on input text."""
    model = genai.GenerativeModel("gemini-pro")
    prompt = f"""
    Analyze the emotional tone of the following text and classify it into one of these categories:
    - Positive
    - Neutral
    - Negative
    - Angry
    - Anxious
    - Excited
    - Depressed

    Text: "{user_input}"

    Respond only with the sentiment classification.
    """
    response = model.generate_content(prompt)
    return response.text.strip()


# Function: Generate AI Response using Gemini
def generate_ai_response(user_input):
    """Generate an emotionally intelligent AI response."""
    sentiment = generate_sentiment_analysis(user_input)

    model = genai.GenerativeModel("gemini-pro")
    prompt = f"""
    You are an AI therapist. A user is talking to you. Based on their message, you must provide a thoughtful and empathetic response.
    
    The detected emotion is: {sentiment}.
    
    If the emotion is positive, be uplifting.
    If the emotion is negative, be comforting and understanding.
    If the user seems anxious, provide calming techniques.
    If the user seems depressed, offer support and suggest self-care methods.

    Here is the user's message: "{user_input}"

    Your response:
    """
    response = model.generate_content(prompt)
    return response.text.strip()


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    # Use Gemini for sentiment analysis
    sentiment = generate_sentiment_analysis(user_input)

    # Generate AI response using Gemini
    ai_response = generate_ai_response(user_input)

    return jsonify({"response": ai_response, "sentiment": sentiment})


if __name__ == "__main__":
    app.run(debug=True)
