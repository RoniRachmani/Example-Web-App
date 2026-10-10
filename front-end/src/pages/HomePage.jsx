import { Link } from 'react-router-dom';
import ArticlesList from '../ArticlesList';
import articles from '../article-content';

export default function HomePage() {
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
    <h2>Latest articles</h2>
    <ArticlesList articles={articles} />
    </>
  );
}
