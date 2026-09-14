import { GoogleGenAI } from '@google/genai'

const portfolioContext = `
You are the AI assistant for Yashvendra Sahu's developer portfolio.
Answer questions about Yashvendra using ONLY the information below.

ABOUT:
Yashvendra Sahu is a BCA (Hons) student at AKS University, 2024-2027.
He focuses on modern web development, full-stack applications, AI-powered applications and RAG-based systems.

SKILLS:
C++, Data Structures and Algorithms, HTML, CSS, JavaScript, React, Vite, Tailwind CSS,
Node.js, Express.js, REST APIs, Supabase, Firebase, AI, RAG, Git and GitHub.

PROJECTS:
1. Catalog AI — Product Enhancement: AI-assisted product enhancement and cataloging focused on structured, review-ready product data.
2. ApniDukaan: merchant-focused application concept for small and less-technical shopkeepers, using React, Node.js, Supabase and AI-oriented workflows.
3. CineBook: movie booking web application using React and Supabase with QR-based booking confirmation.
4. KrishiMitra: React agriculture platform with weather, market, disease guidance, dashboard and chat experiences.
5. Parking Management System: parking application for tracking records and slot availability, being evolved toward React + Supabase.

AI / RAG:
Yashvendra is interested in practical AI-powered applications and RAG to ground AI responses in relevant information.

ACHIEVEMENTS:
Smart India Hackathon; AI / ML Internship; Google Kaggle AI Agents Intensive; AKS Develop Community.
`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })

    const ai = new GoogleGenAI({ apiKey })
    const prompt = `${portfolioContext}\n\nRULES:\n- Do not invent projects, skills, achievements, companies or experience.\n- If information is unavailable, say: "I don't have that information in Yashvendra's portfolio."\n- Keep the answer concise and useful.\n\nUSER QUESTION:\n${message}`

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { temperature: 0.4, maxOutputTokens: 300 },
    })

    return res.status(200).json({ answer: response.text || "I couldn't generate a response." })
  } catch (error) {
    console.error('Gemini API Error:', error)
    return res.status(500).json({ error: 'AI assistant is temporarily unavailable.' })
  }
}
