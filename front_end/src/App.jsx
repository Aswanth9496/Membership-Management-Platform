import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import LandingPage from './pages/LandingPage'
import AdminLogin from './pages/admin/AdminLogin'
import MemberLogin from './pages/member/MemberLogin'
import MemberRegister from './pages/member/MemberRegister'
import AdminPortal from './pages/admin/AdminPortal'
import AdminDashboard from './pages/admin/AdminDashboard'
import MembersManagement from './pages/admin/MembersManagement'
import EventsManagement from './pages/admin/EventsManagement'
import ProfileUpdateRequests from './pages/admin/ProfileUpdateRequests'
import TransactionsManagement from './pages/admin/TransactionsManagement'
import MemberPortal from './pages/MemberPortal'
import UserProfile from './pages/member/UserProfile'
import EditProfile from './pages/member/EditProfile'
import UpdateRequests from './pages/member/UpdateRequests'
import MemberEvents from './pages/member/MemberEvents'
import Payments from './pages/member/Payments'
import MemberDashboard from './pages/member/MemberDashboard'
import MemberCertificate from './pages/member/MemberCertificate'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Main landing page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin Portal with nested routes */}
          <Route path="/admin" element={<AdminPortal />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<MembersManagement />} />
            <Route path="events" element={<EventsManagement />} />
            <Route path="profile-updates" element={<ProfileUpdateRequests />} />
            <Route path="transactions" element={<TransactionsManagement />} />
            <Route path="analytics" element={<div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2></div>} />
            <Route path="settings" element={<div className="p-6"><h2 className="text-2xl font-bold text-gray-800">Settings</h2></div>} />
          </Route>
          
          {/* Member Login & Registration */}
          <Route path="/member/login" element={<MemberLogin />} />
          <Route path="/member/register" element={<MemberRegister />} />
          
          {/* Member Portal */}
          <Route path="/member" element={<MemberPortal />}>
            <Route index element={<MemberDashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            <Route path="profile/requests" element={<UpdateRequests />} />
            <Route path="events" element={<MemberEvents />} />
            <Route path="payments" element={<Payments />} />
            <Route path="certificate" element={<MemberCertificate />} />
            <Route path="transactions" element={<div className="p-8"><h2 className="text-2xl font-bold text-gray-800 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">My Transactions</h2></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
