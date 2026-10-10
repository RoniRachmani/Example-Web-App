import { useState } from 'react';
import { useParams, useLoaderData } from 'react-router-dom';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import CommentsList from '../CommentsList';
import AddCommentForm from '../AddCommentForm';
import articles from '../article-content';
import useUser from '../useUser';
import { apiErrorMessage } from '../errorMessages';

async function authHeaders(user) {
  const token = user && await user.getIdToken();
  return token ? { authtoken: token } : {};
}

export default function ArticlePage() {
  const { name } = useParams();
  const data = useLoaderData();
  const [upvotes, setUpvotes] = useState(data.upvotes);
  const [upvoted, setUpvoted] = useState(data.upvoted);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [upvoteError, setUpvoteError] = useState('');
  const [comments, setComments] = useState(data.comments);

  const { user } = useUser();

  const article = articles.find(a => a.name === name);

  async function onUpvoteClicked() {
    setIsUpvoting(true);
    setUpvoteError('');
    try {
      const response = await axios.post('/api/articles/' + name + '/upvote', null, { headers: await authHeaders(user) });
      setUpvotes(response.data.upvotes);
      setUpvoted(true);
    } catch (e) {
      if (e.response?.status === 403) {
        // Already counted, e.g. from another tab
        setUpvoted(true);
      } else {
        setUpvoteError(apiErrorMessage(e, "Your upvote couldn't be saved."));
      }
    } finally {
      setIsUpvoting(false);
    }
  }

  // Throws if the comment wasn't saved, so the form can keep the text and say so.
  async function onAddComment(text) {
    const response = await axios.post('/api/articles/' + name + '/comments', { text }, { headers: await authHeaders(user) });
    setComments(response.data.comments);
  }

  return (
    <>
    <title>{`${article.title} | Blogify`}</title>
    <h1>{article.title}</h1>
    {user && (
      <button disabled={upvoted || isUpvoting} onClick={onUpvoteClicked}>
        {upvoted ? 'Upvoted' : 'Upvote'}
      </button>
    )}
    {upvoteError && <p role='alert'>{upvoteError}</p>}
    <p>This article has {upvotes} {upvotes === 1 ? 'upvote' : 'upvotes'}</p>
    {article.content.map(p => <p key={p}>{p}</p>)}
    {user
      ? <AddCommentForm onAddComment={onAddComment} />
      : <p>Log in to add a comment</p>}
    <CommentsList comments={comments} />
    </>
  );
}

export async function loader({ params }) {
  // Thrown responses are caught by the route's errorElement, which shows NotFoundPage.
  if (!articles.some(a => a.name === params.name)) {
    throw new Response('Not Found', { status: 404 });
  }

  // A signed-in visitor sends their token, so the response says whether they've
  // already upvoted. Wait for Firebase to restore the session first.
  const auth = getAuth();
  await auth.authStateReady();

  const response = await axios.get('/api/articles/' + params.name, { headers: await authHeaders(auth.currentUser) });
  const { upvotes, upvoted, comments } = response.data;
  return { upvotes, upvoted, comments };
}
