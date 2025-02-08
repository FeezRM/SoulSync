import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import whisper  # For speech-to-text
from textblob import TextBlob  # For sentiment analysis

# Load environment variables from .env
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend communication

# Initialize OpenAI API client
client = openai.OpenAI(api_key=OPENAI_API_KEY)


# Function: Convert Speech to Text
def transcribe_audio(audio_path):
    model = whisper.load_model("base")  # Load Whisper Model (Free Version)
    result = model.transcribe(audio_path)
    return result["text"]


# Function: Sentiment Analysis
def analyze_sentiment(text):
    sentiment = TextBlob(text).sentiment.polarity
    if sentiment > 0.1:
        return "positive"
    elif sentiment < -0.1:
        return "negative"
    else:
        return "neutral"


# Function: Generate AI Response
def generate_ai_response(user_input):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a compassionate AI therapist."},
            {"role": "user", "content": user_input},
        ],
        max_tokens=150,
    )
    return response.choices[0].message["content"].strip()


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    sentiment = analyze_sentiment(user_input)
    ai_response = generate_ai_response(user_input)
    return jsonify({"response": ai_response, "sentiment": sentiment})


if __name__ == "__main__":
    app.run(debug=True)
