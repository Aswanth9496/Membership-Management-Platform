import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminForgotPassword from './pages/admin/AdminForgotPassword'
import MemberLogin from './pages/member/MemberLogin'
import MemberRegister from './pages/member/MemberRegister'
import ForgotPassword from './pages/member/ForgotPassword'
import AdminPortal from './pages/admin/AdminPortal'
import AdminPrivateRoute from './components/admin/AdminPrivateRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import MembersManagement from './pages/admin/MembersManagement'
import EventsManagement from './pages/admin/EventsManagement'
import ProfileUpdateRequests from './pages/admin/ProfileUpdateRequests'
import TransactionsManagement from './pages/admin/TransactionsManagement'
import MemberPortal from './pages/MemberPortal'
import MemberPrivateRoute from './components/member/MemberPrivateRoute'
import UserProfile from './pages/member/UserProfile'
import EditProfile from './pages/member/EditProfile'
import UpdateRequests from './pages/member/UpdateRequests'
import MemberEvents from './pages/member/MemberEvents'
import Payments from './pages/member/Payments'
import MemberDashboard from './pages/member/MemberDashboard'
import MemberCertificate from './pages/member/MemberCertificate'
import MemberReferences from './pages/member/MemberReferences'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Main landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Admin Login - public */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          
          {/* Admin Portal - protected */}
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin" element={<AdminPortal />}>
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<MembersManagement />} />
              <Route path="events" element={<EventsManagement />} />
              <Route path="profile-updates" element={<ProfileUpdateRequests />} />
              <Route path="transactions" element={<TransactionsManagement />} />
              <Route path="analytics" element={<div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2></div>} />
              <Route path="settings" element={<div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Settings</h2></div>} />
            </Route>
          </Route>
          
          {/* Member Login & Registration - public */}
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/register" element={<MemberRegister />} />
          <Route path="/member/forgot-password" element={<ForgotPassword />} />
          
          {/* Member Portal - protected */}
          <Route element={<MemberPrivateRoute />}>
            <Route path="/member" element={<MemberPortal />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="profile/edit" element={<EditProfile />} />
              <Route path="profile/requests" element={<UpdateRequests />} />
              <Route path="events" element={<MemberEvents />} />
              <Route path="payments" element={<Payments />} />
              <Route path="certificate" element={<MemberCertificate />} />
              <Route path="references" element={<MemberReferences />} />
              <Route path="transactions" element={<div className="p-8"><h2 className="text-2xl font-bold text-gray-800 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">My Transactions</h2></div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
