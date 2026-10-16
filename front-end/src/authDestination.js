import articles from './article-content';

// Only accept destinations the app owns, including the profile's login entry.
export function authDestination(state) {
  const from = state?.from;
  const isArticle = articles.some(article => [
    `/articles/${article.name}`, `/articles/${article.name}#comments`,
  ].includes(from));
  return isArticle || from === '/profile' ? from : '/articles';
}
