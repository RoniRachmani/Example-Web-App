import { Link } from "react-router-dom"
import { countOf, readingMinutes } from './articleStats';

const PREVIEW_LENGTH = 150;

// Cuts at the last space so a preview never ends mid-word
function preview(text) {
  if (text.length <= PREVIEW_LENGTH) return text;
  const end = text.lastIndexOf(' ', PREVIEW_LENGTH);
  return text.slice(0, end > 0 ? end : PREVIEW_LENGTH) + '…';
}

// `stats` is what loadArticleStats resolved to. An article with no counts
// (the request failed, or it isn't in the database yet) shows only its reading time.
export default function ArticlesList({ articles, stats = {} }) {
  return (
    <>
    {articles.map(a => {
      const counts = stats[a.name];
      const details = [
        `${readingMinutes(a)} min read`,
        ...(counts ? [countOf(counts.upvotes, 'upvote'), countOf(counts.comments, 'comment')] : []),
      ];

      return (
        <Link className='article-link' key={a.name} to={'/articles/' + a.name}>
          <h3>{a.title}</h3>
          <p>{preview(a.content[0])}</p>
          <p className='article-details'>{details.join(' · ')}</p>
        </Link>
      );
    })}
    </>
  )
}
