import { useLoaderData } from 'react-router-dom';
import ArticlesList from "../ArticlesList";
import articles from "../article-content";

export default function ArticlesListPage() {
  const stats = useLoaderData();

  return (
    <>
    <title>Articles | Blogify</title>
    <h1>Articles</h1>
    <ArticlesList articles={articles} stats={stats} />
    </>
  );
}
