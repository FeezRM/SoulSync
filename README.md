# Soul Sync - AI Mental Health Support Tool

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Used](#tech-used)
- [Backend Requirements](#backend-requirements)
- [Setup](#setup)
- [How to Run](#how-to-run)

## Overview
Soul Sync is an AI-powered mental health support tool that allows users to interact via both **text and speech**. It responds in **both text and voice** while utilizing a **3D human model**, creating a more immersive therapy-like session. 

Soul Sync provides a **non-stigmatized, judgment-free** environment where users can be open about their struggles. It offers **guidance, support, and strategies** to improve mental well-being.

### **Key Benefits**
- **24/7 AI mental health support** ensuring users can access help anytime.
- **Not a replacement for human therapists**, but addresses accessibility issues.
- Built using **Next.js, Unity, C#, Python, Flask, Gemini API, AWS S3, AWS Transcribe, and AWS Polly**.

---

## Features

✅ **Text & Speech Interaction** – Users can interact via speech and text and receive responses in both formats.

✅ **AI Therapy** – Utilizes **Gemini API** to have intelligent conversations and provide **mental health guidance**.

✅ **Speech Processing** – Uses **AWS Transcribe** (speech-to-text) and **AWS Polly** (text-to-speech) for seamless interactions.

✅ **Security & Efficiency** – Secure user data with **AWS S3**, manage backend via **Flask**, and protect API keys using **environment variables**.

✅ **Cross-Platform Accessibility** – Built with **Next.js for the web UI**, and **Unity & C# for an interactive AI therapist model**.

✅ **Human Model Integration** – A **3D AI therapist** in Unity that can change facial expressions to humanize interactions.

---

## Tech Used

### **Frontend**
- **Next.js** - Web UI
- **C# & Unity** - Interactive AI Therapist Model

### **Backend**
- **Flask** - Python API for request handling

### **AI Model**
- **Gemini API** - AI-generated therapy responses

### **Speech Processing**
- **AWS Transcribe** - Converts speech to text
- **AWS Polly** - Converts text to speech

### **Data Storage**
- **AWS S3** - Secure storage for user interactions

---

## Backend Requirements

Ensure you have the following Python dependencies installed:

---

## How to Run

### Prerequisites
- Python 3.x
- Node.js & npm
- AWS credentials (for S3, Transcribe, Polly)
- A valid GITHUB_TOKEN for OpenAI API access (see below)

### Environment Variables
Create a `.env` file in the `backend/` directory with the following:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ca-central-1
GITHUB_TOKEN=your_github_token_here
```

### Running the Application

#### On macOS/Linux:
```
./build_and_run.sh
```

#### On Windows:
```
build_and_run.bat
```

This will start both the backend (Flask) and frontend (Next.js) servers.
