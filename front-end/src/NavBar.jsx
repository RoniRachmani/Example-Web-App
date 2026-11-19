import { NavLink } from "react-router-dom";
import { getAuth, signOut } from 'firebase/auth';
import useUser from "./useUser";

export default function NavBar() {
  const { isLoading, user } = useUser();

  // NavLink marks the link to the current page with aria-current="page",
  // which the styles in index.css pick up. The first account item gets
  // `nav-account`, which pushes it and everything after it to the right.
  return (
    <nav aria-label='Main'>
      <ul>
        <li>
          <NavLink to='/' end>Home</NavLink>
        </li>
        <li>
          <NavLink to='/about'>About</NavLink>
        </li>
        <li>
          <NavLink to='/articles'>Articles</NavLink>
        </li>
        {isLoading ? <li className='nav-account nav-user'>Loading...</li> : (
          <>
          {user && (
            <>
            <li className='nav-account nav-user'>
              Logged in as {user.displayName || user.email}
            </li>
            <li>
              <NavLink to='/profile'>Profile</NavLink>
            </li>
            </>
          )}
          <li className={user ? undefined : 'nav-account'}>
            {user
              ? <button onClick={() => signOut(getAuth())}>Log out</button>
              : <NavLink to='/login'>Log in</NavLink>}
          </li>
          </>
        )}
      </ul>
    </nav>
  )
}
