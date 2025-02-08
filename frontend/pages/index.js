import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [sentiment, setSentiment] = useState("");

  const sendMessage = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/chat", { message });
      setResponse(res.data.response);
      setSentiment(res.data.sentiment);
    } catch (error) {
      console.error("Error communicating with AI:", error);
      alert("There was an error connecting to the AI.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>SoulSync AI Therapist</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your thoughts here..."
        rows="4"
        style={{ width: "80%", padding: "10px" }}
      />
      <br />
      <button onClick={sendMessage} style={{ marginTop: "10px", padding: "10px" }}>
        Talk to AI
      </button>
      {response && (
        <div style={{ marginTop: "20px" }}>
          <h3>AI Response:</h3>
          <p>{response}</p>
          <h4>Detected Sentiment: {sentiment}</h4>
        </div>
      )}
    </div>
  );
}