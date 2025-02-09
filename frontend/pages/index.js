import { useState, useRef } from "react";
import axios from "axios";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Function to send text messages
  const sendMessage = async () => {
    if (!message.trim()) return;
    const newMessages = [...messages, { text: message, sender: "user" }];
    setMessages(newMessages);
    setMessage(""); // ✅ Keep input box empty after sending

    try {
      setIsLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/chat", { message });

      setMessages([...newMessages, { text: res.data.text_response, sender: "ai" }]);

      if (res.data.audio_response) {
        playAudio(res.data.audio_response);
      }
    } catch (error) {
      console.error("Error communicating with AI:", error);
      alert("There was an error connecting to the AI.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle audio playback
  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        setIsLoading(true);
        try {
          const res = await axios.post("http://127.0.0.1:5000/chat", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          // ✅ Add transcribed text as a user message, but keep input box empty
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: res.data.transcribed_text || "🎤 Voice message sent", sender: "user" },
            { text: res.data.text_response, sender: "ai" },
          ]);

          if (res.data.audio_response) {
            playAudio(res.data.audio_response);
          }
        } catch (error) {
          console.error("Error sending voice message:", error);
          alert("There was an error sending the voice message.");
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to access microphone.");
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Function to stop AI voice playback and reset session
  const endSession = () => {
    if (window.confirm("Are you sure you want to end this session? All messages will be cleared.")) {
      setMessages([]);
      setMessage("");

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.chatContainer}>
        <h1 className={styles.title}>SoulSync AI Therapist</h1>
        <div className={styles.chatBox}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.sender === "user" ? styles.userBubble : styles.aiBubble}>
              {msg.sender === "ai" && (
                <img src="/ai-avatar.png" alt="AI Therapist" className={styles.aiAvatar} />
              )}
              {msg.text}
            </div>
          ))}
        </div>
        {isLoading && <div className={styles.loading}>AI is typing...</div>}
        <div className={styles.inputContainer}>
          <input
            type="text"
            className={styles.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} // Enter key sends message
            placeholder="Type your message..."
          />
          <button className={styles.button} onClick={sendMessage}>Send</button>
        </div>
        <div className={styles.audioControls}>
          {isRecording ? (
            <button className={styles.recordingButton} onClick={stopRecording}>
              ⏹ Stop Recording
            </button>
          ) : (
            <button className={styles.recordButton} onClick={startRecording}>
              🎤 Record Voice
            </button>
          )}
        </div>
        <button className={styles.endSessionButton} onClick={endSession}>
          End Session
        </button>

        {/* Audio Player for AI response */}
        <audio ref={audioRef} style={{ display: "none" }} controls />
      </div>
    </div>
  );
}