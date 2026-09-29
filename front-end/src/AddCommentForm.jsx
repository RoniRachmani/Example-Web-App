import { useState } from 'react';

export default function AddCommentForm({ onAddComment }) {
  const [commentText, setCommentText] = useState('');

  return (
    <div>
      <h3>Add a Comment</h3>
      <label>
        Comment:
        <input type="text" maxLength={1000} value={commentText} onChange={e => setCommentText(e.target.value)} />
      </label>
      <button disabled={!commentText.trim()} onClick={() => {
        onAddComment({ commentText });
        setCommentText('');
      }}>Add Comment</button>
    </div>
  )
}