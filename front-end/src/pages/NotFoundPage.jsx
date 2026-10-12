import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <>
    <title>Page Not Found | Blogify</title>
    <h1>Page Not Found</h1>
    <p>
      This page doesn&apos;t exist. The link you followed may be broken, or the
      page may have moved.
    </p>
    <p>
      <Link to='/articles'>Browse the articles</Link> or go back to
      the <Link to='/'>home page</Link>.
    </p>
    </>
  );
}
