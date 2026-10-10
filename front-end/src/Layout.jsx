import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import ConsentBanner from './ConsentBanner';
import { setConsent } from './analytics';

export default function Layout() {
  return (
    <>
    <ConsentBanner />
    <NavBar />
    <main>
      <Outlet />
    </main>
    <footer>
      <button className='link-button' onClick={() => setConsent(null)}>Cookie settings</button>
    </footer>
    </>
  );
}
