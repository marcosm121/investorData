import axios from 'axios';
import { NewsArticle } from './newsService';

const JINA_BASE = 'https://r.jina.ai/';
const JINA_TIMEOUT_MS = 8000;
const MIN_CONTENT_LENGTH = 200;

const JINA_DOMAIN_BLACKLIST = ['apnews.com'];

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

const BLOCK_PHRASES = ['anonymous access', 'access denied', 'enable javascript', '403 forbidden'];

function isBlocked(content: string): boolean {
  const lower = content.toLowerCase();
  return BLOCK_PHRASES.some(p => lower.includes(p)) || content.length < MIN_CONTENT_LENGTH;
}

export async function fetchArticleContent(article: NewsArticle): Promise<string> {
  const domain = getDomain(article.url);

  if (JINA_DOMAIN_BLACKLIST.includes(domain)) {
    console.log(`[jina] domain blacklisted, using fallback: ${domain}`);
    return `${article.title}. ${article.description}`;
  }

  try {
    const response = await axios.get(`${JINA_BASE}${article.url}`, {
      timeout: JINA_TIMEOUT_MS,
      headers: { Accept: 'text/plain' },
    });
    const content: string = response.data ?? '';

    if (isBlocked(content)) {
      console.log(`[jina] blocked or too short, using fallback: ${article.url}`);
      return `${article.title}. ${article.description}`;
    }

    // Truncate to ~3000 chars to keep Groq prompt manageable
    return content.slice(0, 3000);
  } catch (err) {
    console.log(`[jina] fetch failed, using fallback: ${article.url}`);
    return `${article.title}. ${article.description}`;
  }
}
