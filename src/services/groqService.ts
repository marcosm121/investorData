import axios from 'axios';
import { NewsArticle } from './newsService';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function selectTopArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
  const numbered = articles
    .map((a, i) => `${i}. [${a.category}] ${a.title}`)
    .join('\n');

  const prompt = `Sos un analista financiero. Dado el siguiente listado de noticias, seleccioná los 5 índices más relevantes para un inversor argentino. Respondé únicamente con un array JSON de enteros, sin texto adicional. Ejemplo: [2, 7, 15, 23, 31]\n\n${numbered}`;

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
  const prompt = `Dado el siguiente contenido de un artículo periodístico, escribí un resumen conciso en español en formato markdown (máximo 150 palabras). Usá un título H3 y 2-3 párrafos breves.\n\nTítulo: ${article.title}\nContenido: ${content}`;

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

  return response.data.choices[0].message.content.trim();
}
