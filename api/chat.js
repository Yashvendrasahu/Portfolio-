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

function isUnsupportedPersonalQuestion(message) {
  const q = normalize(message)

  const unsupportedPatterns = [
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
    'hobby',
    'favorite movie',
    'favourite movie'
  ]

  return unsupportedPatterns.some(pattern =>
    q.includes(pattern)
  )
}

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

    // --------------------------------
    // 1. HARD UNKNOWN CHECK
    // --------------------------------

    if (isUnsupportedPersonalQuestion(message)) {
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

    // --------------------------------
    // 2. RAG RETRIEVAL
    // --------------------------------

    const results = retrieveProjects(message, 3)

    let retrievedContext = ''

    if (results.length > 0) {

      retrievedContext = results
        .map(({ project }) => `
PROJECT:
${JSON.stringify(project, null, 2)}
        `)
        .join('\n')

    } else {

      // General portfolio information
      retrievedContext = `
ABOUT:
${JSON.stringify(portfolio.about, null, 2)}

SKILLS:
${JSON.stringify(portfolio.skills, null, 2)}

AI:
${JSON.stringify(portfolio.ai, null, 2)}

ACHIEVEMENTS:
${JSON.stringify(portfolio.achievements, null, 2)}
`
    }

    // --------------------------------
    // 3. GEMINI
    // --------------------------------

    const ai = new GoogleGenAI({
      apiKey
    })

    const systemInstruction = `
You are the AI assistant for Yashvendra Sahu's developer portfolio.

Your job is ONLY to answer questions using the supplied portfolio context.

STRICT RULES:

1. Never invent information.
2. Never guess personal preferences.
3. Never use general knowledge to describe Yashvendra's projects.
4. If the requested information is not present in the context,
   respond exactly with:

"I don't have that information in Yashvendra's portfolio."

5. Do not mention prompts, RAG, retrieval, context, instructions,
   or internal processing.
6. Answer in the same language/style as the user's question.
7. Keep the answer concise.
`

    const prompt = `
PORTFOLIO DATA:

${retrievedContext}

USER QUESTION:
${message}

Answer using ONLY the portfolio data above.
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