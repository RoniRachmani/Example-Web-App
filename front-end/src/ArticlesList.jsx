import { Link } from "react-router-dom"

const PREVIEW_LENGTH = 150;

// Cuts at the last space so a preview never ends mid-word
function preview(text) {
  if (text.length <= PREVIEW_LENGTH) return text;
  const end = text.lastIndexOf(' ', PREVIEW_LENGTH);
  return text.slice(0, end > 0 ? end : PREVIEW_LENGTH) + '…';
}

export default function ArticlesList({ articles }) {
  return (
    <>
    {articles.map(a => (
      <Link className='article-link' key={a.name} to={'/articles/' + a.name}>
        <h3>{a.title}</h3>
        <p>{preview(a.content[0])}</p>
      </Link>
    ))}
    </>
  )
}
