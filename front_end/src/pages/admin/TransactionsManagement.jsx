import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { adminEndpoints } from '../../data/admin'

const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const navigate = useNavigate()
  const admin = useSelector(state => state.auth.admin)

  // Dummy data as requested by user
  const dummyTransactions = [
    {
      id: 'dummy-1',
      transactionId: 'TXN-ABC-123',
      eventName: 'Annual Tech Summit 2026',
      participantName: 'Rahul Kumar',
      email: 'rahul@example.com',
      amountPaid: 1500,
      paymentMethod: 'UPI',
      paymentStatus: 'completed',
      paymentDate: new Date().toISOString()
    },
    {
      id: 'dummy-2',
      transactionId: 'TXN-XYZ-789',
      eventName: 'Startup Networking Meet',
      participantName: 'Priya Sharma',
      email: 'priya@startup.in',
      amountPaid: 800,
      paymentMethod: 'Credit Card',
      paymentStatus: 'pending',
      paymentDate: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'dummy-3',
      transactionId: 'TXN-LMN-456',
      eventName: 'Workshop: AI Basics',
      participantName: 'John Doe',
      email: 'john.doe@gmail.com',
      amountPaid: 450,
      paymentMethod: 'Net Banking',
      paymentStatus: 'completed',
      paymentDate: new Date(Date.now() - 172800000).toISOString()
    }
  ]

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await adminEndpoints.payments.getAll()
      
      if (response && response.success) {
        // If API returns data, use it; otherwise, use dummy data as fallback
        setTransactions(response.data.length > 0 ? response.data : dummyTransactions)
      } else {
        // Set dummy data even on error to fulfill user request
        setTransactions(dummyTransactions)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setTransactions(dummyTransactions) // Fallback to dummy data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!admin.isAuthenticated) {
      navigate('/admin/login')
      return
    }
    fetchTransactions()
  }, [navigate, admin.isAuthenticated])

  const filteredTransactions = transactions.filter(txn => {
    const matchesStatus = filterStatus === 'all' || txn.paymentStatus === filterStatus
    const matchesSearch = txn.eventName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         txn.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         txn.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800'
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Transactions Management</h1>
        <p className="text-gray-600">Monitor and track all event registration payments</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by ID, event or participant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {['all', 'completed', 'pending', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-sky-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{txn.transactionId}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{txn.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{txn.eventName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{txn.participantName}</div>
                        <div className="text-xs text-gray-500">{txn.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">₹{txn.amountPaid}</div>
                      <div className="text-[10px] text-gray-500">{txn.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(txn.paymentStatus)}`}>
                        {txn.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(txn.paymentDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(txn.paymentDate).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
        <div>Showing {filteredTransactions.length} transactions</div>
        {transactions.some(t => t.id.startsWith('dummy-')) && (
          <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
            💡 Showing demonstration data
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionsManagement
