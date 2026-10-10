import ArticlesList from "../ArticlesList";
import articles from "../article-content";

export default function ArticlesListPage() {
  return (
    <>
    <title>Articles | Blogify</title>
    <h1>Articles</h1>
    <ArticlesList articles={articles} />
    </>
  );
}