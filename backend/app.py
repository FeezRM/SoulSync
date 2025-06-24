import os
import boto3
from openai import OpenAI
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import wave
import uuid
import json
import csv
import atexit

# Load environment variables
load_dotenv()
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ca-central-1")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Initialize AWS clients
transcribe_client = boto3.client(
    "transcribe",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
)
polly_client = boto3.client(
    "polly",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
)
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION,
)

# Initialize OpenAI client
OPENAI_ENDPOINT = "https://models.github.ai/inference"
OPENAI_MODEL = "openai/gpt-4.1"
openai_client = OpenAI(
    base_url=OPENAI_ENDPOINT,
    api_key=GITHUB_TOKEN,
)

app = Flask(__name__)
CORS(app)

# Track generated wav files for cleanup
GENERATED_WAV_FILES = []


# Function: Upload file to S3
def upload_to_s3(file_path, bucket_name, s3_filename):
    s3_client.upload_file(file_path, bucket_name, s3_filename)
    return f"s3://{bucket_name}/{s3_filename}"


# Function: Convert Speech to Text using AWS Transcribe
def speech_to_text(audio_file):
    bucket_name = "my-ai-audio-bucket"
    output_bucket = "my-ai-transcript-bucket"
    s3_filename = str(uuid.uuid4()) + ".wav"

    s3_uri = upload_to_s3(audio_file, bucket_name, s3_filename)
    transcribe_job_name = "transcription-" + str(uuid.uuid4())

    transcribe_client.start_transcription_job(
        TranscriptionJobName=transcribe_job_name,
        Media={"MediaFileUri": s3_uri},
        MediaFormat="wav",
        LanguageCode="en-US",
        OutputBucketName=output_bucket,
    )

    while True:
        response = transcribe_client.get_transcription_job(
            TranscriptionJobName=transcribe_job_name
        )
        status = response["TranscriptionJob"]["TranscriptionJobStatus"]
        if status in ["COMPLETED", "FAILED"]:
            break

    if status == "COMPLETED":
        transcript_key = f"{transcribe_job_name}.json"
        transcript_data = (
            s3_client.get_object(Bucket=output_bucket, Key=transcript_key)["Body"]
            .read()
            .decode("utf-8")
        )

        transcript_json = json.loads(transcript_data)
        transcript_text = transcript_json["results"]["transcripts"][0]["transcript"]
        latest_message = transcript_text.strip()
        return latest_message if latest_message else "Could not extract speech"

    return "Transcription failed"


# Function: Generate AI Response using OpenAI
def generate_ai_response(user_input):
    prompt = f"""
    You are an AI therapist named SoulSync. Your job is to provide short but meaningful responses that:
    1. **Acknowledge** the user's emotions or situation.
    2. **Give clear, actionable advice** to help them improve their mental well-being.

    Be **concise** (2-3 sentences max) and **empathetic**. Your responses should be **non-judgmental** and encourage **practical steps**.
    """
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": user_input},
    ]
    response = openai_client.chat.completions.create(
        messages=messages,
        temperature=1.0,
        top_p=1.0,
        model=OPENAI_MODEL,
    )
    return response.choices[0].message.content.strip()


# Function: Convert text to speech using AWS Polly
def text_to_speech(response_text):
    unique_id = str(uuid.uuid4())
    audio_file_path = f"response_{unique_id}.wav"

    response = polly_client.synthesize_speech(
        Text=response_text, OutputFormat="pcm", VoiceId="Joanna"
    )

    with wave.open(audio_file_path, "wb") as audio_file:
        audio_file.setnchannels(1)
        audio_file.setsampwidth(2)
        audio_file.setframerate(16000)
        audio_file.writeframes(response["AudioStream"].read())

    GENERATED_WAV_FILES.append(audio_file_path)
    return audio_file_path


# Load racial slurs from CSV file
RACIAL_SLURS = []
RACIAL_SLURS_CSV = os.path.join(os.path.dirname(__file__), "racial_slurs.csv")
try:
    with open(RACIAL_SLURS_CSV, newline="", encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            # Skip comments and empty lines
            if row and not row[0].strip().startswith("#"):
                RACIAL_SLURS.append(row[0].strip().lower())
except Exception as e:
    print(f"Warning: Could not load racial slurs list: {e}")


def contains_racial_slur(text):
    text_lower = text.lower()
    for slur in RACIAL_SLURS:
        if slur and slur in text_lower:
            return True
    return False


@app.route("/chat", methods=["POST"])
def chat():
    user_input = ""
    transcribed_text = ""

    if "audio" in request.files:
        audio_file = request.files["audio"]
        audio_path = "temp_audio.wav"
        audio_file.save(audio_path)
        transcribed_text = speech_to_text(audio_path)
        user_input = transcribed_text

    elif request.is_json:
        data = request.get_json()
        user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    if contains_racial_slur(user_input):
        return (
            jsonify(
                {
                    "error": "Your message contains language that is not allowed. Please re-enter your message without racial slurs."
                }
            ),
            400,
        )

    ai_response = generate_ai_response(user_input)
    audio_response_path = text_to_speech(ai_response)

    return jsonify(
        {
            "text_response": ai_response,
            "audio_response": request.host_url
            + f"audio/{os.path.basename(audio_response_path)}",
            "transcribed_text": transcribed_text,
        }
    )


@app.route("/audio/<filename>", methods=["GET"])
def get_audio(filename):
    return send_file(filename, mimetype="audio/wav")


@app.route("/end_session", methods=["POST"])
def end_session():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    deleted_files = []
    for filename in os.listdir(backend_dir):
        if filename.endswith(".wav"):
            file_path = os.path.join(backend_dir, filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    deleted_files.append(filename)
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")
    return jsonify({"deleted": deleted_files}), 200


# Cleanup function to delete all .wav files in the backend folder on exit
def cleanup_wav_files():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    for filename in os.listdir(backend_dir):
        if filename.endswith(".wav"):
            file_path = os.path.join(backend_dir, filename)
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")


if __name__ == "__main__":
    app.run(debug=True)
