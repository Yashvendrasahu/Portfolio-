import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataPath = path.join(__dirname, '../data/portfolio.json')

const portfolio = JSON.parse(
  fs.readFileSync(dataPath, 'utf-8')
)

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreProject(project, query) {
  const q = normalize(query)

  const searchableText = normalize(`
    ${project.name}
    ${project.category}
    ${project.description}
    ${project.technologies.join(' ')}
  `)

  const words = q.split(' ')

  let score = 0

  for (const word of words) {
    if (word.length < 2) continue

    if (searchableText.includes(word)) {
      score += 1
    }

    if (normalize(project.name).includes(word)) {
      score += 3
    }

    if (normalize(project.category).includes(word)) {
      score += 2
    }
  }

  return score
}

export function retrieveProjects(query, limit = 3) {
  const normalizedQuery = normalize(query)

  // 1. Exact project-name match
  const exactMatches = portfolio.projects.filter(project => {
    const projectName = normalize(project.name)

    return normalizedQuery.includes(projectName)
  })

  if (exactMatches.length > 0) {
    return exactMatches
      .slice(0, limit)
      .map(project => ({
        project,
        score: 100
      }))
  }

  // 2. Keyword-based retrieval
  const results = portfolio.projects
    .map(project => ({
      project,
      score: scoreProject(project, query)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return results
}

export function getPortfolio() {
  return portfolio
}

