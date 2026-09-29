import { useState } from 'react';
import { MAX_COMMENT_LENGTH, countChars } from './text';

export default function AddCommentForm({ onAddComment }) {
  const [commentText, setCommentText] = useState('');
  // Counted like the server does, so emoji aren't counted twice as with maxLength
  const length = countChars(commentText.trim());
  const isTooLong = length > MAX_COMMENT_LENGTH;

  return (
    <div>
      <h3>Add a Comment</h3>
      <label>
        Comment:
        <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} />
      </label>
      {isTooLong && <p>Comments can be at most {MAX_COMMENT_LENGTH} characters ({length} now).</p>}
      <button disabled={!length || isTooLong} onClick={() => {
        onAddComment({ commentText });
        setCommentText('');
      }}>Add Comment</button>
    </div>
  )
}