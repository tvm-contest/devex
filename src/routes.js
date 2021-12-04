import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from './layouts/dashboard';
import LogoOnlyLayout from './layouts/LogoOnlyLayout';
//
import DashboardApp from './pages/DashboardApp';
import Nfts from './pages/Nfts';
import CreateNft from './pages/CreateNft';
// import Blog from './pages/Blog';
import User from './pages/User';
import NotFound from './pages/Page404';
import Login from './pages/Login';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { path: '/dashboard', element: <DashboardApp /> },
        { path: 'user', element: <User /> },
        { path: 'nfts', element: <Nfts /> },
        { path: 'create', element: <CreateNft /> },
        // { path: 'blog', element: <Blog /> },
        { path: 'login', element: <Login /> }
      ]
    },
    {
      path: '/',
      element: <LogoOnlyLayout />,
      children: [
        { path: '404', element: <NotFound /> },
        { path: '/', element: <Navigate to="/dashboard" /> },
        { path: '*', element: <Navigate to="/404" /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> }
  ]);
}
