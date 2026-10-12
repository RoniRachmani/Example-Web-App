import { NavLink } from "react-router-dom";
import { getAuth, signOut } from 'firebase/auth';
import useUser from "./useUser";

export default function NavBar() {
  const { isLoading, user } = useUser();

  // NavLink marks the link to the current page with aria-current="page",
  // which the styles in index.css pick up.
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
        {isLoading ? <li>Loading...</li> : (
          <>
          {user && (
            <>
            <li className='nav-user' style={{ color: 'white' }}>
              Logged in as {user.displayName || user.email}
            </li>
            <li>
              <NavLink to='/profile'>Profile</NavLink>
            </li>
            </>
          )}
          <li>
            {user
              ? <button onClick={() => signOut(getAuth())}>Log Out</button>
              : <NavLink to='/login'>Log In</NavLink>}
          </li>
          </>
        )}

      </ul>
    </nav>
  )
}
