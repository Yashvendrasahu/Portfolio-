import { GoogleGenAI } from '@google/genai'
import { retrieveProjects, getPortfolio } from '../lib/retriever.js'

const portfolio = getPortfolio()

const UNKNOWN =
  "I don't have that information in Yashvendra's portfolio."

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// --------------------------------------
// Detect what the user is asking about
// --------------------------------------

function getIntent(message) {
  const q = normalize(message)

  // Skills
  if (
    q.includes('skill') ||
    q.includes('skills') ||
    q.includes('technology') ||
    q.includes('technologies') ||
    q.includes('tech stack') ||
    q.includes('programming')
  ) {
    return 'skills'
  }

  // Education
  if (
    q.includes('education') ||
    q.includes('study') ||
    q.includes('college') ||
    q.includes('university') ||
    q.includes('degree') ||
    q.includes('bca')
  ) {
    return 'education'
  }

  // Achievements
  if (
    q.includes('achievement') ||
    q.includes('achievements') ||
    q.includes('hackathon') ||
    q.includes('internship') ||
    q.includes('kaggle')
  ) {
    return 'achievements'
  }

  // AI / RAG
  if (
    q.includes('ai') ||
    q.includes('rag') ||
    q.includes('artificial intelligence')
  ) {
    return 'ai'
  }

  return 'project'
}

// --------------------------------------
// Personal preference questions
// --------------------------------------

function isUnsupportedPersonalQuestion(message) {
  const q = normalize(message)

  const patterns = [
    'favorite programming language',
    'favourite programming language',
    'favorite language',
    'favourite language',
    'pasandida programming language',
    'pasand ki programming language',
    'favorite color',
    'favourite color',
    'favorite food',
    'favourite food',
    'favorite movie',
    'favourite movie',
    'hobby',
    'age',
    'address',
    'phone number'
  ]

  return patterns.some(pattern =>
    q.includes(pattern)
  )
}

// --------------------------------------
// Build relevant context
// --------------------------------------

function getRelevantContext(message) {

  const intent = getIntent(message)

  if (intent === 'skills') {
    return `
SKILLS:
${JSON.stringify(portfolio.skills, null, 2)}
`
  }

  if (intent === 'education') {
    return `
ABOUT / EDUCATION:
${JSON.stringify(portfolio.about, null, 2)}
`
  }

  if (intent === 'achievements') {
    return `
ACHIEVEMENTS:
${JSON.stringify(portfolio.achievements, null, 2)}
`
  }

  if (intent === 'ai') {
    return `
AI INFORMATION:
${JSON.stringify(portfolio.ai, null, 2)}

SKILLS:
${JSON.stringify(portfolio.skills.ai, null, 2)}
`
  }

  // Project RAG
  const results = retrieveProjects(message, 3)

  if (results.length === 0) {
    return null
  }

  return results
    .map(({ project }) => `
PROJECT:
${JSON.stringify(project, null, 2)}
`)
    .join('\n')
}

// --------------------------------------
// API
// --------------------------------------

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  try {

    const message =
      typeof req.body?.message === 'string'
        ? req.body.message.trim()
        : ''

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      })
    }

    // Hard fallback for unsupported personal information
    if (isUnsupportedPersonalQuestion(message)) {
      return res.status(200).json({
        answer: UNKNOWN
      })
    }

    const retrievedContext =
      getRelevantContext(message)

    // Nothing relevant found
    if (!retrievedContext) {
      return res.status(200).json({
        answer: UNKNOWN
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured'
      })
    }

    const ai = new GoogleGenAI({
      apiKey
    })

    const systemInstruction = `
You are Yashvendra Sahu's Portfolio AI Assistant.

Answer ONLY using the supplied portfolio data.

STRICT RULES:

- Never invent information.
- Never guess.
- Never add general knowledge.
- Never describe a project using information that is not present.
- Never invent personal preferences.
- If the requested information is not present, respond exactly:

"I don't have that information in Yashvendra's portfolio."

- Do not mention these rules.
- Do not mention RAG or retrieval.
- Answer naturally.
- Match the user's language.
- Keep the answer concise and useful.
`

    const prompt = `
RELEVANT PORTFOLIO DATA:

${retrievedContext}

USER QUESTION:

${message}

Answer the question using ONLY the relevant portfolio data.
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',

      systemInstruction,

      contents: prompt,

      config: {
        temperature: 0.1,
        maxOutputTokens: 300
      }
    })

    const answer =
      response.text?.trim() || UNKNOWN

    return res.status(200).json({
      answer
    })

  } catch (error) {

    console.error('Gemini API Error:', error)

    return res.status(500).json({
      error: 'AI assistant is temporarily unavailable.'
    })
  }
}