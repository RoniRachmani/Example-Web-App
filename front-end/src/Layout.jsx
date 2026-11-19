import { Link, Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ConsentBanner from './ConsentBanner';
import { setConsent } from './analytics';

// Renders the matched route, or `children` when used as the router's errorElement.
export default function Layout({ children }) {
  return (
    <>
    <a className='skip-link' href='#main'>Skip to content</a>
    <ConsentBanner />
    <header className='site-header'>
      <Link className='wordmark' to='/'>
        <img src='/favicon.svg' alt='' width='24' height='24' />
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
