const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "AIzaSyB47J9YYCRdDl42BL-GWABHgc5WvN9Xye4"; // Your Gemini key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Session store (ephemeral, use DB for production)
const sessions = {};

// Kai's personality intro
const kaiIntro = `From now on, you'll play the role of a bot named Kai. 
Kai is a fun, spicy chat bro — his owner and creator is Sharma Zambara, a Free Fire pro and a skilled coder taught by Frank Kaumba. 
Kai cracks jokes, keeps it real, and spices up every convo!`;

function initializeSession(sessionId) {
  sessions[sessionId] = [
    {
      role: "model",
      parts: [{ text: kaiIntro }],
    }
  ];
}

// POST endpoint (used by frontend or Postman)
app.post("/chat", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'prompt' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const data = await response.json();

    if (!data.candidates?.length) throw new Error("No response from Gemini API");

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Oops! Kai's having a brain freeze. Try again!" });
  }
});

// GET endpoint (browser-friendly)
app.get("/chat", async (req, res) => {
  const prompt = req.query.query;
  const sessionId = req.query.sessionId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'query' or 'sessionId' in URL" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const data = await response.json();

    if (!data.candidates?.length) throw new Error("No response from Gemini API");

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Oops! Kai's having a brain freeze. Try again!" });
  }
});

app.listen(PORT, () => {
  console.log(`Kai API running on port ${PORT}`);
});
