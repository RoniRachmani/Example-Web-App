import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ConsentBanner from './ConsentBanner';
import { setConsent } from './analytics';

// Renders the matched route, or `children` when used as the router's errorElement.
export default function Layout({ children }) {
  return (
    <>
    <a className='skip-link' href='#main'>Skip to content</a>
    <ConsentBanner />
    <NavBar />
    <main id='main' tabIndex={-1}>
      {children ?? <Outlet />}
    </main>
    <footer>
      <button className='link-button' onClick={() => setConsent(null)}>Cookie settings</button>
    </footer>
    </>
  );
}
