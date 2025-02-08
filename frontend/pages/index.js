import { useState, useRef } from "react";
import axios from "axios";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null); // Reference for audio playback

  const sendMessage = async () => {
    if (!message.trim()) return; // Do not send empty message
    const newMessages = [...messages, { text: message, sender: "user" }];
    setMessages(newMessages);
    setMessage(""); // Clear input field after sending message

    try {
      setIsLoading(true);
      const res = await axios.post("http://127.0.0.1:5000/chat", { message });

      // Add AI text response to chat
      setMessages([...newMessages, { text: res.data.text_response, sender: "ai" }]);

      // Fetch and play the AI-generated speech
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

  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl; // Ensure correct dynamic filename
      audioRef.current.play();
    }
  };

  const endSession = () => {
    if (window.confirm("Are you sure you want to end this session? All messages will be cleared.")) {
      setMessages([]);
      setMessage("");

      // Stop AI voice playback
      if (audioRef.current) {
        audioRef.current.pause(); // Pause the audio
        audioRef.current.currentTime = 0; // Reset playback to the start
        audioRef.current.src = ""; // Clear audio source
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
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} // Listen for Enter key
            placeholder="Type your message..."
          />
          <button className={styles.button} onClick={sendMessage}>Send</button>
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