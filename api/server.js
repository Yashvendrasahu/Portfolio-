import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const portfolioContext = `
You are the AI assistant for Yashvendra Sahu's developer portfolio.

Your job is to answer questions about Yashvendra using ONLY the portfolio
information provided below.

ABOUT:
Yashvendra Sahu is a BCA (Hons) student at AKS University.
Education period: 2024-2027.
He focuses on modern web development, full-stack applications,
AI-powered applications and RAG-based systems.

SKILLS:
- C++
- Data Structures and Algorithms
- HTML
- CSS
- JavaScript
- React
- Vite
- Tailwind CSS
- Node.js
- Express.js
- REST APIs
- Supabase
- Firebase
- AI
- RAG
- Git
- GitHub

PROJECTS:

1. Catalog AI - Product Enhancement
An AI-assisted product enhancement and cataloging project.
It focuses on converting raw product information into structured,
review-ready catalog data using AI-assisted enrichment and classification.

2. ApniDukaan
A merchant-focused application concept for small and less-technical
shopkeepers.
It aims to simplify product entry, orders and business workflows.
Technologies include React, Node.js, Supabase and AI-oriented workflows.

3. CineBook
A movie booking web application built using React and Supabase.
It includes a movie booking workflow and QR-based booking confirmation.

4. KrishiMitra
A React-based agriculture platform.
It contains weather, market, disease guidance, dashboard and chat features.

5. Parking Management System
A parking management application for tracking parking records
and parking slot availability.
The project is being evolved toward React and Supabase.

AI AND RAG:
Yashvendra is interested in building AI-powered applications
and using Retrieval-Augmented Generation (RAG) to ground AI responses
in relevant information.

EDUCATION:
BCA (Hons)
AKS University
2024-2027
`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const prompt = `
${portfolioContext}

IMPORTANT RULES:
- Answer only from the portfolio information above.
- Do not invent projects, skills, achievements, companies or experience.
- If the requested information is not available, clearly say:
  "I don't have that information in Yashvendra's portfolio."
- Keep answers concise and useful.
- Speak naturally as Yashvendra's portfolio assistant.
- You can use bullet points when useful.

USER QUESTION:
${message}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 300,
      },
    });

    const answer = response.text;

    res.json({
      answer: answer || "I couldn't generate a response.",
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    res.status(500).json({
      error: "AI assistant is temporarily unavailable.",
    });
  }
});

app.listen(3001, () => {
  console.log("AI server running on http://localhost:3001");
});