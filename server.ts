import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load portfolio context data
let portfolio: any = {
  about: {
    name: 'Yashvendra Sahu',
    education: 'BCA (Hons)',
    university: 'AKS University',
    duration: '2024-2027',
    focus: ['Modern Web Development', 'Full-Stack Applications', 'AI-Powered Applications', 'RAG-Based Systems']
  },
  skills: {
    programming: ['C++', 'JavaScript'],
    web: ['HTML', 'CSS', 'React', 'Vite', 'Tailwind CSS'],
    backend: ['Node.js', 'Express.js', 'REST APIs'],
    database: ['Supabase', 'Firebase'],
    ai: ['AI', 'RAG', 'AI-powered applications'],
    tools: ['Git', 'GitHub']
  },
  projects: [
    {
      id: 'catalog-ai',
      name: 'Catalog AI',
      category: 'AI Product Enhancement',
      description: 'AI-assisted product enhancement and cataloging focused on structured, review-ready product data.',
      technologies: ['AI/ML', 'LLM APIs', 'React', 'Node.js', 'Firebase']
    },
    {
      id: 'apnidukaan',
      name: 'ApniDukaan',
      category: 'Merchant Application',
      description: 'A merchant-focused application concept for small and less-technical shopkeepers.',
      technologies: ['React', 'Node.js', 'Supabase', 'AI-oriented workflows']
    },
    {
      id: 'cinebook',
      name: 'CineBook',
      category: 'Movie Booking',
      description: 'A movie booking web application with QR-based booking confirmation.',
      technologies: ['React', 'Supabase', 'QR']
    },
    {
      id: 'krishimitra',
      name: 'KrishiMitra',
      category: 'Agriculture Platform',
      description: 'A React agriculture platform with weather, market, disease guidance, dashboard and chat experiences.',
      technologies: ['React', 'Vite', 'Tailwind CSS', 'Axios']
    },
    {
      id: 'parking-management',
      name: 'Parking Management System',
      category: 'Parking Management',
      description: 'A parking application for tracking parking records and slot availability.',
      technologies: ['React', 'Supabase']
    }
  ],
  ai: {
    focus: ['AI-powered applications', 'RAG', 'LLM-based workflows'],
    goal: 'Use AI with relevant information to produce grounded and useful responses.'
  },
  achievements: [
    'Smart India Hackathon',
    'AI/ML Internship',
    'Google Kaggle AI Agents Intensive',
    'AKS Develop Community'
  ]
};

try {
  const portfolioPath = path.join(process.cwd(), 'data', 'portfolio.json');
  if (fs.existsSync(portfolioPath)) {
    portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not load data/portfolio.json directly, using fallback structure.', e);
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreProject(project: any, query: string) {
  const q = normalize(query);
  const searchableText = normalize(`
    ${project.name}
    ${project.category}
    ${project.description}
    ${(project.technologies || []).join(' ')}
  `);

  const words = q.split(' ');
  let score = 0;

  for (const word of words) {
    if (word.length < 2) continue;
    if (searchableText.includes(word)) score += 1;
    if (normalize(project.name).includes(word)) score += 3;
    if (normalize(project.category).includes(word)) score += 2;
  }

  return score;
}

function retrieveProjects(query: string, limit = 3) {
  const normalizedQuery = normalize(query);
  const exactMatches = (portfolio.projects || []).filter((project: any) => {
    return normalizedQuery.includes(normalize(project.name));
  });

  if (exactMatches.length > 0) {
    return exactMatches.slice(0, limit).map((project: any) => ({ project, score: 100 }));
  }

  return (portfolio.projects || [])
    .map((project: any) => ({ project, score: scoreProject(project, query) }))
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);
}

function getIntent(message: string) {
  const q = normalize(message);
  if (q.includes('skill') || q.includes('technology') || q.includes('tech stack') || q.includes('programming') || q.includes('language')) {
    return 'skills';
  }
  if (q.includes('education') || q.includes('study') || q.includes('college') || q.includes('university') || q.includes('degree') || q.includes('bca')) {
    return 'education';
  }
  if (q.includes('achievement') || q.includes('hackathon') || q.includes('internship') || q.includes('kaggle')) {
    return 'achievements';
  }
  if (q.includes('ai') || q.includes('rag') || q.includes('model') || q.includes('llm') || q.includes('artificial intelligence')) {
    return 'ai';
  }
  return 'project';
}

function getRelevantContext(message: string) {
  const intent = getIntent(message);
  if (intent === 'skills') {
    return `SKILLS:\n${JSON.stringify(portfolio.skills, null, 2)}`;
  }
  if (intent === 'education') {
    return `ABOUT / EDUCATION:\n${JSON.stringify(portfolio.about, null, 2)}`;
  }
  if (intent === 'achievements') {
    return `ACHIEVEMENTS:\n${JSON.stringify(portfolio.achievements, null, 2)}`;
  }
  if (intent === 'ai') {
    return `AI INFORMATION:\n${JSON.stringify(portfolio.ai, null, 2)}\nSKILLS:\n${JSON.stringify(portfolio.skills?.ai, null, 2)}`;
  }
  const results = retrieveProjects(message, 3);
  if (results.length === 0) {
    return `PORTFOLIO SUMMARY:\n${JSON.stringify({ about: portfolio.about, skills: portfolio.skills, projects: portfolio.projects }, null, 2)}`;
  }
  return results.map(({ project }) => `PROJECT:\n${JSON.stringify(project, null, 2)}`).join('\n');
}

function buildDirectAnswer(message: string): string {
  const intent = getIntent(message);
  if (intent === 'skills') {
    const prog = (portfolio.skills?.programming || []).join(', ');
    const web = (portfolio.skills?.web || []).join(', ');
    const backend = (portfolio.skills?.backend || []).join(', ');
    const db = (portfolio.skills?.database || []).join(', ');
    return `Yashvendra's core skills include: Programming (${prog}), Frontend (${web}), Backend (${backend}), Databases (${db}), and AI/RAG workflows.`;
  }
  if (intent === 'education') {
    return `Yashvendra is pursuing ${portfolio.about?.education} at ${portfolio.about?.university} (${portfolio.about?.duration}), focusing on modern web development and practical AI systems.`;
  }
  if (intent === 'achievements') {
    const ach = (portfolio.achievements || []).join(', ');
    return `Yashvendra's key achievements include: ${ach}.`;
  }
  if (intent === 'ai') {
    return `Yashvendra specializes in AI-powered applications, RAG (Retrieval-Augmented Generation), and grounding LLMs in structured product and domain data.`;
  }
  const results = retrieveProjects(message, 2);
  if (results.length > 0) {
    const p = results[0].project;
    return `${p.name} (${p.category}): ${p.description}. Technologies used: ${p.technologies?.join(', ')}.`;
  }
  return `Yashvendra is a Full Stack & AI developer specializing in React, Node.js, Supabase, and RAG-powered applications.`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is configured, use Gemini SDK with RAG context
    if (apiKey) {
      // Prioritize high-throughput flash-lite and flash models
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const retrievedContext = getRelevantContext(message);

      const systemInstruction = `
You are Yashvendra Sahu's Portfolio AI Assistant.
Answer naturally, accurately and concisely using ONLY the supplied portfolio data.

RULES:
- Answer based on the portfolio information.
- If information is not in the portfolio, politely state: "I don't have that information in Yashvendra's portfolio."
- Keep the response concise, helpful, and professional.
`;

      const prompt = `
RELEVANT PORTFOLIO DATA:
${retrievedContext}

USER QUESTION:
${message}
`;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2,
              maxOutputTokens: 300,
            },
          });

          const answer = response.text?.trim();
          if (answer) {
            return res.json({ answer });
          }
        } catch (geminiError) {
          console.warn(`Model ${model} call failed, trying next candidate:`, geminiError);
        }
      }
    }

    // Direct fallback response using grounded portfolio knowledge
    const fallbackAnswer = buildDirectAnswer(message);
    return res.json({ answer: fallbackAnswer });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'AI assistant is temporarily unavailable.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
