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

function isGreeting(message: string): boolean {
  const q = normalize(message);
  const greetings = [
    'h', 'hi', 'hello', 'hey', 'heyy', 'hola', 'namaste', 'namaskar',
    'kaise ho', 'kaisa hai', 'kya haal hai', 'good morning', 'good evening',
    'good afternoon', 'hii', 'hiii', 'wassup', 'sup', 'yo'
  ];
  return greetings.includes(q) || (q.length <= 4 && (q.startsWith('hi') || q.startsWith('he') || q === 'h'));
}

function isHindiOrHinglish(message: string): boolean {
  const q = normalize(message);
  const hindiWords = [
    'batao', 'kya', 'hai', 'kaise', 'kaisa', 'bare', 'me', 'mein',
    'ke', 'ki', 'ka', 'ko', 'karo', 'kahan', 'bataiye', 'kuch', 'bhi',
    'padhai', 'shiksha', 'kaam', 'chahiye', 'karna', 'karke', 'aap', 'tum'
  ];
  return hindiWords.some(w => q.split(' ').includes(w));
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

function retrieveProjects(query: string, limit = 5) {
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

function buildDirectAnswer(message: string): string {
  const isHindi = isHindiOrHinglish(message);
  const q = normalize(message);

  if (isGreeting(message)) {
    if (isHindi) {
      return "Namaste! Main Yashvendra Sahu ka AI Portfolio Assistant hoon. Aap mujhse unke projects, skills, education ya achievements ke bare mein pooch sakte hain.";
    }
    return "Hi there! I am Yashvendra Sahu's Portfolio AI Assistant. Feel free to ask me about his projects, skills, education, experience, or tech stack!";
  }

  // Skills
  if (
    q.includes('skill') || q.includes('technology') || q.includes('tech stack') ||
    q.includes('programming') || q.includes('language') || q.includes('stack') ||
    q.includes('kya aata') || q.includes('tools')
  ) {
    const prog = (portfolio.skills?.programming || []).join(', ');
    const web = (portfolio.skills?.web || []).join(', ');
    const backend = (portfolio.skills?.backend || []).join(', ');
    const db = (portfolio.skills?.database || []).join(', ');
    const ai = (portfolio.skills?.ai || []).join(', ');

    if (isHindi) {
      return `Yashvendra ke main technical skills yeh hain:\n\n• Programming Languages: ${prog}\n• Frontend: ${web}\n• Backend: ${backend}\n• Databases: ${db}\n• AI & Machine Learning: ${ai}\n• Tools: Git, GitHub`;
    }
    return `Here are Yashvendra's core skills:\n\n• Programming: ${prog}\n• Web / Frontend: ${web}\n• Backend: ${backend}\n• Databases: ${db}\n• AI & ML: ${ai}\n• Tools: Git, GitHub`;
  }

  // Education
  if (
    q.includes('education') || q.includes('study') || q.includes('college') ||
    q.includes('university') || q.includes('degree') || q.includes('bca') ||
    q.includes('padhai') || q.includes('shiksha')
  ) {
    if (isHindi) {
      return `Yashvendra ${portfolio.about?.university} se ${portfolio.about?.education} (${portfolio.about?.duration}) kar rahe hain. Unka main focus Full-Stack Web Development aur AI-Powered / RAG applications banane par hai.`;
    }
    return `Yashvendra is currently pursuing ${portfolio.about?.education} at ${portfolio.about?.university} (${portfolio.about?.duration}), with a focus on modern full-stack web development and AI-powered systems.`;
  }

  // Achievements
  if (
    q.includes('achievement') || q.includes('hackathon') || q.includes('internship') ||
    q.includes('kaggle') || q.includes('award') || q.includes('experience') || q.includes('journey')
  ) {
    const ach = (portfolio.achievements || []).map((a: string) => `• ${a}`).join('\n');
    if (isHindi) {
      return `Yashvendra ke mukhya achievements aur highlights:\n\n${ach}`;
    }
    return `Here are Yashvendra's key achievements and highlights:\n\n${ach}`;
  }

  // AI & RAG
  if (
    q.includes('ai') || q.includes('rag') || q.includes('model') ||
    q.includes('llm') || q.includes('artificial intelligence')
  ) {
    if (isHindi) {
      return `Yashvendra AI-powered applications aur RAG (Retrieval-Augmented Generation) workflows par focus karte hain, jisme LLMs ko structured data aur domain context ke sath connect karke reliable aur accurate outputs banaye jaate hain.`;
    }
    return `Yashvendra specializes in building practical AI applications and RAG (Retrieval-Augmented Generation) workflows, grounding LLMs with real-world data and structured backend APIs.`;
  }

  // Contact / Resume / Hire
  if (
    q.includes('contact') || q.includes('email') || q.includes('mail') ||
    q.includes('hire') || q.includes('resume') || q.includes('cv') ||
    q.includes('linkedin') || q.includes('github') || q.includes('sampark')
  ) {
    if (isHindi) {
      return "Aap Yashvendra se email: yadvendrasingrual@gmail.com par contact kar sakte hain ya unke LinkedIn (yashvendra-sahu) aur GitHub (Yashvendrasahu) profiles check kar sakte hain.";
    }
    return "You can reach Yashvendra via email at yadvendrasingrual@gmail.com, or connect on LinkedIn (yashvendra-sahu) and GitHub (Yashvendrasahu).";
  }

  // Projects
  const matched = retrieveProjects(message, 5);
  const isGeneralProjectQuery = q.includes('project') || q.includes('kaam') || q.includes('work') || q.includes('build');

  if (matched.length > 0 && !isGeneralProjectQuery) {
    const p = matched[0].project;
    if (isHindi) {
      return `📌 ${p.name} (${p.category}):\n${p.description}\n\nTechnologies: ${p.technologies?.join(', ')}`;
    }
    return `📌 ${p.name} (${p.category}):\n${p.description}\n\nTechnologies: ${p.technologies?.join(', ')}`;
  }

  // List of all projects
  if (isGeneralProjectQuery || matched.length > 0) {
    const list = (portfolio.projects || []).map((p: any) =>
      `• ${p.name} (${p.category}): ${p.description} [Tech: ${p.technologies?.join(', ')}]`
    ).join('\n\n');

    if (isHindi) {
      return `Yashvendra ke mukhya projects yeh hain:\n\n${list}`;
    }
    return `Here are Yashvendra's featured projects:\n\n${list}`;
  }

  if (isHindi) {
    return "Yashvendra ek Full Stack & AI Developer hain jo React, Node.js, Supabase, aur RAG-based AI applications build karte hain. Aap unke projects, skills, education ya contact ke bare me pooch sakte hain.";
  }
  return "Yashvendra is a Full Stack & AI Developer specializing in React, Node.js, Supabase, and RAG applications. Ask me about his projects, skills, education, or experience!";
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

    // If Gemini API Key is configured, use Gemini SDK with full rich context
    if (apiKey) {
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `
You are Yashvendra Sahu's friendly, articulate, and intelligent Portfolio AI Assistant.

PORTFOLIO INFORMATION:
${JSON.stringify(portfolio, null, 2)}
Contact Info:
- Email: yadvendrasingrual@gmail.com
- GitHub: https://github.com/Yashvendrasahu
- LinkedIn: https://www.linkedin.com/in/yashvendra-sahu-4b8070310

INSTRUCTIONS & BEHAVIOR:
1. GREETINGS: If the user greets (e.g. "hi", "hello", "h", "namaste", "kaise ho", "hey"), greet them warmly and politely invite them to explore Yashvendra's projects, tech stack, education, or achievements.
2. LANGUAGE: Answer in the same language/script the user is using (Hindi, Hinglish, or English).
3. ACCURACY: Base answers accurately on Yashvendra's portfolio data.
4. PROJECTS: When asked about projects or "projects ke bare me batao", list and describe his major projects (Catalog AI, ApniDukaan, CineBook, KrishiMitra, Parking Management System) with technologies used, clearly and completely.
5. FORMATTING: Use clean bullet points, emojis where appropriate, and ensure your answer is complete (never cut off mid-sentence).
6. OUT OF SCOPE: For personal questions outside the portfolio (e.g., favorite food, personal relationships), politely explain that you can only answer questions related to Yashvendra's portfolio, skills, projects, and professional background.
`;

      const prompt = `User query: ${message}`;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.3,
              maxOutputTokens: 1000,
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
