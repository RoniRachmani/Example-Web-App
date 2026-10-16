import { Link } from 'react-router-dom';
import articles from './article-content';

import { authDestination } from './authDestination';

export default function AuthContext({ state, creating = false }) {
  const destination = authDestination(state);
  const article = articles.find(article => destination.split('#')[0] === `/articles/${article.name}`);
  return article ? (
    <>
      <p>{creating ? 'Create an account' : 'Log in'} to {destination.endsWith('#comments') ? 'comment on' : 'upvote'} <strong>{article.title}</strong>. You’ll return here after {creating ? 'signing up' : 'logging in'}.</p>
      <p><Link to={destination}>Back to article</Link></p>
    </>
  ) : creating ? <p>Create a free account to comment on articles and upvote your favorites.</p> : null;
}
