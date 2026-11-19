import { Link, Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ConsentBanner from './ConsentBanner';
import { setConsent } from './analytics';

// The favicon's book and pen, drawn in currentColor so it takes the theme's
// accent colour. The favicon file's fixed blues are too dark on the dark theme.
function WordmarkIcon() {
  return (
    <svg viewBox='0 0 32 32' width='24' height='24' aria-hidden='true' focusable='false'>
      <path d='M6 4v24h20V4H6zm18 22H8V6h16v20z' />
      <path d='M10 8h12v2H10zM10 12h12v2H10zM10 16h8v2h-8z' />
      <path d='M22 14l2-2 2 2-2 2z' />
      <path d='M21 15l-3 3v2h2l3-3z' />
    </svg>
  );
}

// Renders the matched route, or `children` when used as the router's errorElement.
export default function Layout({ children }) {
  return (
    <>
    <a className='skip-link' href='#main'>Skip to content</a>
    <ConsentBanner />
    <header className='site-header'>
      <Link className='wordmark' to='/'>
        <WordmarkIcon />
        Blogify
      </Link>
      <NavBar />
    </header>
    <main id='main' tabIndex={-1}>
      {children ?? <Outlet />}
    </main>
    <footer>
      <button className='link-button' onClick={() => setConsent(null)}>Cookie settings</button>
    </footer>
    </>
  );
}
