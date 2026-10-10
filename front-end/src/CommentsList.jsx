export default function CommentsList({ comments }) {
  return (
    <>
    <h3>Comments</h3>
    {comments.length === 0 && <p>No comments yet.</p>}
    {comments.map((comment, index) => (
      // Comments are only ever added at the end, so an index is a stable key.
      // Their text isn't unique: two people can post the same thing.
      // eslint-disable-next-line @eslint-react/no-array-index-key
      <div className='comment' key={index}>
        <h4>{comment.postedBy}</h4>
        <p>{comment.text}</p>
      </div>
    ))}
    </>
  );
}
