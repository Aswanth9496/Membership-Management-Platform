import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Protects all admin routes.
 * If the admin is NOT authenticated, redirect to login with `replace` so
 * the browser back button cannot navigate back into the protected area.
 */
const AdminPrivateRoute = () => {
  const isAuthenticated = useSelector(state => state.auth.admin.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export default AdminPrivateRoute
