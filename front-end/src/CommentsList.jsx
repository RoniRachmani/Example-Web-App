const DATE_FORMAT = { year: 'numeric', month: 'short', day: 'numeric' };

export default function CommentsList({ comments }) {
  return (
    <>
    {comments.length === 0 && <p>No comments yet.</p>}
    {comments.map((comment, index) => (
      // Comments are only ever added at the end, so an index is a stable key.
      // Their text isn't unique: two people can post the same thing.
      // eslint-disable-next-line @eslint-react/no-array-index-key
      <div className='comment' key={index}>
        <h3>{comment.postedBy}</h3>
        {/* Older comments were saved without a date */}
        {comment.postedAt && (
          <time dateTime={comment.postedAt}>
            {new Date(comment.postedAt).toLocaleDateString(undefined, DATE_FORMAT)}
          </time>
        )}
        <p>{comment.text}</p>
      </div>
    ))}
    </>
  );
}
