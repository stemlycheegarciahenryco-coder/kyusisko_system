import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const role = localStorage.getItem('userRole');

  if (!role) {
    // Not logged in? Send to login
    return <Navigate to="/" replace />;
  }

  

  // Allowed? Show the sub-routes (the Layouts)
  return <Outlet />;
};

export default ProtectedRoute;