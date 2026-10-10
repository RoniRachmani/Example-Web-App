import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <>
    <title>About | Blogify</title>
    <h1>About Blogify</h1>
    <p>
      Blogify is a blog about building web apps with JavaScript from front to back.
      The articles skip the theory you don&apos;t need yet and focus on getting
      something running, so you learn by building.
    </p>
    <h2>How it&apos;s built</h2>
    <p>
      Blogify practises what it preaches. The site is a React app, served by a
      Node.js and Express server that stores upvotes and comments in MongoDB.
      Sign-in is handled by Firebase Authentication, and the whole thing runs on
      Google App Engine.
    </p>
    <h2>Joining in</h2>
    <p>
      Anyone can read the <Link to='/articles'>articles</Link>. With a free account
      you can upvote the ones you like and leave comments. Your display name is
      shown on your comments. Please keep comments
      friendly and on topic.
    </p>
    </>
  );
}
