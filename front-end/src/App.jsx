import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage';
import ArticlesListPage from './pages/ArticlesListPage';
import ArticlePage, { loader as articleLoader } from './pages/ArticlePage';
import Layout from './Layout';
import { loadArticleStats } from './articleStats';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const routes = [{
  path: '/',
  element: <Layout />,
  // Inside the layout, so a broken link still has the nav bar to leave by
  errorElement: <Layout><NotFoundPage /></Layout>,
  children: [{
    path: '/',
    element: <HomePage />,
    loader: loadArticleStats,
  }, {
    path: '/about',
    element: <AboutPage />
  }, {
    path: '/articles',
    element: <ArticlesListPage />,
    loader: loadArticleStats,
  }, {
    path: '/articles/:name', // -> /articles/learn-react
    element: <ArticlePage />,
    loader: articleLoader,
  }, {
    path: '/login',
    element: <LoginPage />,
  }, {
    path: '/create-account',
    element: <CreateAccountPage />
  }, {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  }, {
    path: '/profile',
    element: <ProfilePage />,
  }]
}]

const router = createBrowserRouter(routes);

function App() {
  return (
    <>
    <RouterProvider router={router} />
    </>
  );
}

export default App
