import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Protects all member routes.
 * If the member is NOT authenticated, redirect to login (with `replace` so
 * the browser back button cannot navigate back into the protected area).
 */
const MemberPrivateRoute = () => {
  const isAuthenticated = useSelector(state => state.auth.member.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/member/login" replace />
}

export default MemberPrivateRoute
