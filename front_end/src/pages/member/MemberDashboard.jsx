import { useSelector } from 'react-redux'
import ReferenceVerification from '../../components/member/ReferenceVerification'

const MemberDashboard = () => {
  const { user } = useSelector(state => state.auth.member || {})

  const stats = [
    { label: 'Membership Year', value: '2025', subValue: 'Renewed Apr 1, 2025' },
    { label: 'Events Attended', value: '4', subValue: 'This membership year' },
    { label: 'Referrals Made', value: '6', subValue: '6 converted to members' },
  ]

  const activities = [
    { icon: '📜', title: 'Membership Certificate Downloaded', time: 'Today, 9:15 AM', status: 'completed' },
    { icon: '📅', title: 'Registered for Annual Meet 2025', time: 'Jul 9, 2025 • ₹1,200 paid', status: 'completed' },
    { icon: '🔄', title: 'Membership Renewed — ₹4,500', time: 'Apr 1, 2025', status: 'completed' },
    { icon: '✅', title: 'Membership Approved by Association', time: 'Mar 15, 2025', status: 'completed' },
  ]

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Your Dashboard</h2>
        <p className="text-sm text-slate-500">Here's a summary of your membership and upcoming activities.</p>
      </div>

      {/* Membership Status Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl">
             ✅
           </div>
           <div>
             <h3 className="text-xl font-bold text-slate-800">Membership Active</h3>
             <p className="text-sm text-slate-500">Your membership is in good standing. All features are unlocked.</p>
           </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
             Valid till March 2026
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">8 months remaining</p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-blue-600 text-xl">📢</span>
        <p className="text-sm text-blue-700 font-medium">
          Annual General Meet 2025 <span className="font-bold">registration is open</span>. Seats filling fast — only 23 left! <a href="#" className="font-bold underline">Register Now →</a>
        </p>
      </div>

      {/* Reference Verification Requests (Conditional) */}
      <ReferenceVerification />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
            <h4 className="text-4xl font-extrabold text-slate-800 mb-1">{stat.value}</h4>
            <p className="text-[10px] font-bold text-slate-400">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Journey & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-8">
               <span className="text-red-500">📌</span>
               <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Membership Journey</h4>
            </div>
            
            <div className="relative flex items-center justify-between px-4">
              <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2 z-0 mx-8"></div>
              <div className="absolute left-0 right-1/2 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 z-0 mx-8"></div>
              
              {[
                { label: 'Applied', done: true },
                { label: 'Docs Verified', done: true },
                { label: 'Payment Done', done: true },
                { label: 'Approved', done: true },
                { label: 'Active!', done: false, special: '🎖️' }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] transition-colors ${
                    step.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {step.special ? step.special : step.done ? '✓' : ''}
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-tight transition-colors ${
                    step.done ? 'text-emerald-600' : 'text-slate-400'
                  }`}>{step.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
               <span className="text-lg">🎉</span>
               <p className="text-xs text-emerald-700 font-semibold italic">Congratulations! Your membership is fully active and all features are unlocked.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 h-full">
            <div className="flex items-center gap-2 mb-8">
               <span className="text-orange-500">⚡</span>
               <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Recent Activity</h4>
            </div>
            
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-0 bottom-4 w-0.5 bg-slate-50"></div>
              
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm z-10 relative shrink-0">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-700 truncate">{activity.title}</h5>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberDashboard
