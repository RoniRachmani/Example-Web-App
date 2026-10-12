import axios from 'axios';

const WORDS_PER_MINUTE = 200;

// Route loader for pages that list articles. Resolves to the upvote and comment
// counts by article name: { 'learn-react': { upvotes: 4, comments: 3 } }. The
// counts are extras, so a failed request gives {} and the list shows without them.
export async function loadArticleStats() {
  try {
    const response = await axios.get('/api/articles');
    return Object.fromEntries(response.data.map(({ name, upvotes, comments }) => [name, { upvotes, comments }]));
  } catch {
    return {};
  }
}

export function readingMinutes(article) {
  const words = article.content.join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// "1 upvote", "2 upvotes"
export function countOf(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
