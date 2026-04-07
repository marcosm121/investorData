import axios from 'axios';
import { NewsArticle } from './newsService';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function fetchPrompt(slug: string): Promise<string> {
  const res = await fetch(`${process.env.PROMPT_SERVER_URL}/api/prompts/${slug}`, {
    headers: { 'x-api-key': process.env.PROMPT_API_KEY ?? '' },
  });
  if (!res.ok) throw new Error(`Failed to fetch prompt "${slug}": ${res.status} ${res.statusText}`);
  return res.text();
}

export async function selectTopArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const numbered = articles
    .map((a, i) => `${i}. [${a.category}] ${a.title}`)
    .join('\n');

  const basePrompt = await fetchPrompt('seleccion-de-articulos');
  const prompt = `${basePrompt}\n\n${numbered}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content: string = response.data.choices[0].message.content.trim();

  // Parse the JSON array from the response
  const match = content.match(/\[[\d,\s]+\]/);
  if (!match) throw new Error(`Groq returned unexpected format: ${content}`);

  const indices: number[] = JSON.parse(match[0]);
  return [...new Set(indices)]
    .filter(i => i >= 0 && i < articles.length)
    .slice(0, 5)
    .map(i => articles[i]);
}

export async function summarizeArticle(article: NewsArticle, content: string): Promise<string> {
  const safeContent = content.slice(0, 3000);
  const basePrompt = await fetchPrompt('resumen-de-articulo');
  const prompt = `${basePrompt}\n\nTítulo: ${article.title}\nContenido: ${safeContent}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const choices = response.data?.choices;
  if (!choices?.length) throw new Error(`Groq summarizeArticle returned no choices for: ${article.title}`);
  return choices[0].message.content.trim();
}
