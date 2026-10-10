import { useState } from 'react';
import { MAX_COMMENT_LENGTH, countChars } from './text';
import { apiErrorMessage } from './errorMessages';

export default function AddCommentForm({ onAddComment }) {
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  // Counted like the server does, so emoji aren't counted twice as with maxLength
  const length = countChars(commentText.trim());
  const isTooLong = length > MAX_COMMENT_LENGTH;

  async function submit(e) {
    e.preventDefault();
    setIsPosting(true);
    setError('');
    try {
      await onAddComment(commentText);
      setCommentText('');
    } catch (err) {
      // Keep the text, so nothing is lost if they try again
      setError(apiErrorMessage(err, "Your comment couldn't be posted."));
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <form className='comment-form' onSubmit={submit}>
      <h3>Add a Comment</h3>
      <label>
        Comment
        <textarea rows={4} value={commentText} onChange={e => setCommentText(e.target.value)} />
      </label>
      {isTooLong && <p>Comments can be at most {MAX_COMMENT_LENGTH} characters ({length} now).</p>}
      {error && <p role='alert'>{error}</p>}
      <button type='submit' disabled={!length || isTooLong || isPosting}>Add Comment</button>
    </form>
  )
}
