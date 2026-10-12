import { Link, useLoaderData } from 'react-router-dom';
import ArticlesList from '../ArticlesList';
import articles from '../article-content';

const POPULAR_COUNT = 2;

export default function HomePage() {
  const stats = useLoaderData();
  // Most upvoted first. Ties, and articles with no counts, keep their usual order.
  const popular = articles
    .toSorted((a, b) => (stats[b.name]?.upvotes ?? 0) - (stats[a.name]?.upvotes ?? 0))
    .slice(0, POPULAR_COUNT);

  return (
    <>
    <title>Blogify | Read. Write. React.</title>
    <h1>Welcome to Blogify</h1>
    <p>
      Short, practical articles on building full-stack JavaScript apps with React,
      Node.js and MongoDB. Each one gets you from zero to something that works,
      then points you to what to learn next.
    </p>
    <p>
      <Link to='/create-account'>Create a free account</Link> to upvote the articles
      you find useful and join the conversation in the comments.
    </p>
    <h2>Popular articles</h2>
    <ArticlesList articles={popular} stats={stats} />
    <p><Link to='/articles'>See all {articles.length} articles</Link></p>
    </>
  );
}
