# Yashvendra Sahu — Developer Portfolio

A modern, responsive developer portfolio built with **React + Vite + Tailwind CSS**, featuring project case studies, skills, achievements, an AI-powered portfolio assistant, and a Vercel-ready serverless API.

## ✨ Highlights

- 🎨 Modern responsive portfolio UI
- ⚡ React + Vite for a fast development experience
- 💻 Developer-focused project showcase
- 🤖 AI-powered portfolio assistant using Google Gemini
- 🧠 AI / RAG-focused skills and experience section
- 📱 Mobile-friendly design
- 🧩 Project case-study modal
- 🏆 Achievements and learning journey
- 📩 Contact section
- 🚀 Vercel-ready deployment
- 🔐 Gemini API key kept server-side using environment variables

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript
- Lucide React
- Framer Motion

### Backend / API
- Vercel Serverless Functions
- Google Gemini API

### Other
- Git & GitHub
- REST APIs
- Supabase
- Firebase
- AI / RAG

## 📂 Featured Projects

### 1. Catalog AI — Product Enhancement
AI-assisted product enhancement and cataloging application focused on converting raw product information into structured, review-ready catalog data.

### 2. ApniDukaan
A merchant-focused application concept designed to simplify product entry, orders, and business workflows for small and less-technical shopkeepers.

### 3. CineBook
A movie booking web application built with React and Supabase, including a booking workflow and QR-based booking confirmation.

### 4. KrishiMitra
A React-based agriculture platform with weather, market, disease guidance, dashboard, and chat features.

### 5. Parking Management System
A parking management application for tracking parking records and parking-slot availability, being evolved toward React + Supabase.

## 🤖 AI Portfolio Assistant

The portfolio includes an AI assistant powered by Google Gemini.

The assistant is designed to answer questions about:

- Yashvendra's skills
- Projects
- Education
- AI / RAG interests
- Portfolio experience

The Gemini API key is **not stored in the frontend**. The request is sent to the serverless `/api/chat` endpoint, which securely uses the environment variable.

## 📁 Project Structure

```text
portfolio_src/
├── api/
│   └── chat.js
├── public/
├── src/
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Yashvendrasahu/Portfolio-.git
cd Portfolio-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add Gemini API key

Create a local environment file and add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

**Never commit `.env` or expose the API key in frontend code.**

### 4. Start the development server

```bash
npm run dev
```

## 🌐 Deploy on Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Set the framework to **Vite** if Vercel does not detect it automatically.
4. Add the following environment variable in Vercel:

```text
GEMINI_API_KEY
```

5. Deploy.

The portfolio frontend is served by Vercel and the AI assistant uses the serverless `/api/chat` endpoint.

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key used by the serverless AI endpoint |

Do not add real API keys to GitHub.

## 📌 Future Improvements

- Full RAG pipeline using Supabase + pgvector
- AI-powered project search
- Blog / technical articles
- GitHub API integration
- More interactive project demos
- Analytics dashboard
- Improved AI assistant memory and retrieval

## 👨‍💻 About

**Yashvendra Sahu**  
BCA (Hons) — AKS University  
2024–2027

Focused on:

- Web Development
- Full-Stack Applications
- AI-powered Applications
- Retrieval-Augmented Generation (RAG)
- Data Structures & Algorithms

## ⭐ Support

If you find this portfolio useful or inspiring, consider giving the repository a ⭐ on GitHub.
