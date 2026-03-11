import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Payments = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  // Dummy payment data
  const payments = [
    { 
      id: 'PAY-88291', 
      description: 'Annual Membership Renewal 2025', 
      amount: 15000, 
      date: '2025-01-15', 
      status: 'completed',
      method: 'Razorpay - UPI',
      category: 'membership'
    },
    { 
      id: 'PAY-77310', 
      description: 'Event Registration: Annual Travel Expo', 
      amount: 2500, 
      date: '2024-11-20', 
      status: 'completed',
      method: 'Razorpay - Card',
      category: 'event'
    },
    { 
      id: 'PAY-66421', 
      description: 'Directory Listing Fee', 
      amount: 1200, 
      date: '2024-09-05', 
      status: 'completed',
      method: 'Bank Transfer',
      category: 'other'
    },
    { 
      id: 'PAY-55102', 
      description: 'Event Registration: Networking Dinner', 
      amount: 1800, 
      date: '2024-12-10', 
      status: 'failed',
      method: 'Razorpay - UPI',
      category: 'event'
    },
    { 
      id: 'PAY-44391', 
      description: 'Certificate Issuance Fee', 
      amount: 500, 
      date: '2025-02-10', 
      status: 'pending',
      method: 'Razorpay - QR',
      category: 'other'
    }
  ]

  const filteredPayments = activeTab === 'all' 
    ? payments 
    : payments.filter(p => p.status === activeTab)

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-colors">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${color}`}>
        {icon}
      </div>
    </div>
  )

  const StatusBadge = ({ status }) => {
    const styles = {
      completed: 'bg-green-50 text-green-600 border-green-100',
      failed: 'bg-red-50 text-red-600 border-red-100',
      pending: 'bg-amber-50 text-amber-600 border-amber-100'
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeUp p-2 md:p-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">My Payments</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Transaction History & Billing</p>
        </div>
        
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2">
          <span>💳</span> New Payment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Spent" value="₹21,000" icon="💰" color="bg-blue-50 text-blue-600" />
        <StatCard label="Last Payment" value="₹500" icon="🗓️" color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Pending Due" value="₹0" icon="🕒" color="bg-amber-50 text-amber-600" />
      </div>

      {/* Main Content */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 w-fit">
            {['all', 'completed', 'pending', 'failed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-600 outline-none focus:border-blue-200 transition-all w-full md:w-64"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-500">{new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono text-slate-600">{p.id}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{p.description}</td>
                  <td className="px-6 py-4 font-black text-slate-800">₹{p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium">No transactions found matching your filter.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">💡</div>
          <p className="text-[10px] text-slate-500 font-medium">Need help with a payment? Contact our support at info@ktm.com</p>
        </div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Powered by Stripe & Razorpay</p>
      </div>
    </div>
  )
}

export default Payments
