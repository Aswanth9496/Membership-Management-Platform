import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { memberEndpoints } from '../../data/member'

const MemberEvents = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [allResponse, myResponse] = await Promise.all([
        memberEndpoints.events.getAll(),
        memberEndpoints.events.getMyEvents()
      ])
      if (allResponse.success) setEvents(allResponse.data.events)
      if (myResponse.success) setMyEvents(myResponse.data.events)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message || 'Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleShowDetails = async (eventId) => {
    try {
      setDetailsLoading(true)
      const response = await memberEndpoints.events.getDetails(eventId)
      if (response.success) {
        setSelectedEvent(response.data.event)
      } else {
        alert(response.message || 'Failed to fetch event details')
      }
    } catch (err) {
      console.error('Error fetching event details:', err)
      alert('Error fetching event details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      setRegisterLoading(true)
      const response = await memberEndpoints.events.register(eventId)
      if (response.success) {
        if (!response.data.isPaid) {
          alert('Successfully registered for the event!')
          setSelectedEvent(null)
          fetchData()
        } else {
          const { razorpayKeyId, order, memberDetails } = response.data
          const options = {
            key: razorpayKeyId,
            amount: order.amount,
            currency: order.currency,
            name: 'Association Events',
            description: `Registration for ${selectedEvent.title}`,
            order_id: order.id,
            handler: async (response) => {
              try {
                const verifyRes = await memberEndpoints.events.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
                if (verifyRes.success) {
                  alert('Payment successful and registration confirmed!')
                  setSelectedEvent(null)
                  fetchData()
                } else {
                  alert('Payment verification failed.')
                }
              } catch (err) {
                console.error('Verification error:', err)
                alert('An error occurred during payment verification.')
              }
            },
            prefill: {
              name: memberDetails.name,
              email: memberDetails.email,
              contact: memberDetails.contact
            },
            theme: { color: '#2563eb' }
          }
          const rzp = new window.Razorpay(options)
          rzp.open()
        }
      } else {
        alert(response.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      alert(err.message || 'Registration failed')
    } finally {
      setRegisterLoading(false)
    }
  }

  const EventRow = ({ event, isRegistered }) => (
    <div 
      onClick={() => handleShowDetails(event._id)}
      className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group animate-fadeUp relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-center gap-6 flex-1">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all shadow-sm">
           <span className="text-[10px] font-black text-blue-600 group-hover:text-white uppercase tracking-tighter transition-colors">
              {new Date(event.eventDate.startDate).toLocaleDateString('en-US', { month: 'short' })}
           </span>
           <span className="text-xl font-black text-slate-800 group-hover:text-white leading-none transition-colors">
              {new Date(event.eventDate.startDate).getDate()}
           </span>
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
             <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-100 group-hover:bg-white transition-colors">
                {event.eventType}
             </span>
             <h3 className="text-base font-black text-slate-800 truncate group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                {event.title}
             </h3>
             {isRegistered && (
               <span className="px-2 py-0.5 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm animate-pulse">
                 Registered
               </span>
             )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400">
             <p className="text-[11px] font-bold flex items-center gap-2">
                <span className="text-sm">📍</span> {event.venue.city}, {event.venue.name}
             </p>
             <p className="text-[11px] font-bold flex items-center gap-2">
                <span className="text-sm">🕒</span> {event.eventDate.startTime} - {event.eventDate.endTime}
             </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-none pt-4 md:pt-0">
         <div className="flex flex-col items-start md:items-end">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Entry Fee</p>
            <p className={`text-base font-black ${event.isPaid ? 'text-slate-900 font-black' : 'text-green-600 uppercase tracking-tighter'}`}>
               {event.isPaid ? `₹${event.price}` : 'FREE'}
            </p>
         </div>
         <div className="flex flex-col items-start md:items-end">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Availability</p>
            <p className="text-[11px] font-black text-slate-800">
               {event.registration?.maxCapacity ? (event.registration.maxCapacity - (event.registration.currentCount || 0)) : 0} Slots
             </p>
         </div>
         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-45 transition-all shadow-inner">
            <span className="text-lg">→</span>
         </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayedEvents = activeTab === 'all' ? events : myEvents
  const isEventRegistered = (eventId) => myEvents.some(me => me._id === eventId)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeUp p-2 md:p-6 mb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-600/30">🗓️</div>
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Events Hub</h2>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] pl-1">Official Association Engagements & Registrations</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Available ({events.length})
          </button>
          <button 
            onClick={() => setActiveTab('my')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my' ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
          >
            My Registrations ({myEvents.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 border border-red-100 rounded-[2rem] text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-4 animate-shake shadow-lg shadow-red-500/5">
          <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-lg">⚠️</span> {error}
        </div>
      )}

      {/* List Container */}
      <div className="grid grid-cols-1 gap-5">
        {displayedEvents.length > 0 ? (
          displayedEvents.map(event => (
            <EventRow key={event._id} event={event} isRegistered={isEventRegistered(event._id)} />
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center space-y-6">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mx-auto opacity-40 shadow-inner">📅</div>
             <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Events Found</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Stay tuned for upcoming association meets</p>
             </div>
          </div>
        )}
      </div>

      {/* FIXED PREMIUM OVERLAY */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 pointer-events-auto">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-fadeIn cursor-pointer"
            onClick={() => setSelectedEvent(null)}
          ></div>
          
          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-4xl max-h-[95vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-scaleIn border border-white/40">
            {/* Header with Visual Element */}
            <div className="bg-slate-900 p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]"></div>
               <div className="absolute -bottom-10 left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-[80px]"></div>
               
               <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
                      {selectedEvent.eventType}
                    </span>
                    {selectedEvent.isActive && (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight drop-shadow-md">{selectedEvent.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <span>📍 {selectedEvent.venue.name}, {selectedEvent.venue.city}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    <span>🕒 {selectedEvent.eventDate.startTime} - {selectedEvent.eventDate.endTime}</span>
                  </div>
               </div>

               <button 
                 onClick={() => setSelectedEvent(null)}
                 className="relative z-10 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all font-black text-xl shadow-2xl backdrop-blur-md"
               >
                 ✕
               </button>
            </div>

            {/* Scrollable Core Content */}
            <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-14 scrollbar-hide">
               
               {/* Metadata Dashboard */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { label: 'Start Date', val: new Date(selectedEvent.eventDate.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'End Date', val: new Date(selectedEvent.eventDate.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Registration Price', val: selectedEvent.isPaid ? `₹${selectedEvent.price}` : 'FREE', color: !selectedEvent.isPaid ? 'text-green-600' : 'text-slate-900' },
                    { label: 'Capacity Status', val: `${selectedEvent.registration.currentCount} / ${selectedEvent.registration.maxCapacity} Seats` }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 px-4 border-l-4 border-blue-600/20">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{item.label}</p>
                       <p className={`text-xs font-black leading-tight ${item.color || 'text-slate-900'}`}>{item.val}</p>
                    </div>
                  ))}
               </div>

               {/* Description Box */}
               <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative group overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-white flex items-center justify-center text-2xl shadow-sm rounded-full opacity-20 group-hover:opacity-100 transition-opacity">📝</div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-4 h-1 bg-blue-600 rounded-full"></span>
                    Full Event Information
                  </h4>
                  <p className="text-sm text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description || 'No additional information provided.'}
                  </p>
               </div>

               {/* COMPREHENSIVE DATA GRID (The "Entire Data" Section) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Location & Venue */}
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Detailed Facility Info</h4>
                     <div className="space-y-5">
                        <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">🏢</div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Venue Details</p>
                              <p className="text-xs font-black text-slate-800 leading-tight">{selectedEvent.venue.name}</p>
                              <p className="text-[10px] font-bold text-slate-500">{selectedEvent.venue.address}, {selectedEvent.venue.city}</p>
                              {selectedEvent.venue.state && <p className="text-[10px] font-bold text-slate-500">{selectedEvent.venue.state} {selectedEvent.venue.pinCode}</p>}
                           </div>
                        </div>

                        {selectedEvent.venue.mapLink && (
                          <div className="pl-14">
                            <a href={selectedEvent.venue.mapLink} target="_blank" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-800 pb-0.5 transition-all">
                               View Global Location ↗
                            </a>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Organizer Details */}
                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Primary Contact Point</h4>
                     <div className="space-y-5">
                        <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shadow-sm">👤</div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Host / Liaison</p>
                              <p className="text-xs font-black text-slate-800">{selectedEvent.organizer.contactPerson}</p>
                              <p className="text-[10px] font-bold text-slate-500">📞 {selectedEvent.organizer.contactPhone}</p>
                              <p className="text-[10px] font-bold text-slate-500">✉️ {selectedEvent.organizer.contactEmail}</p>
                           </div>
                        </div>
                        <div className="pl-14 pt-2 border-t border-slate-50">
                           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1 italic">Authorized By</p>
                           <p className="text-[9px] font-black text-slate-400">{selectedEvent.organizer.createdBy.fullName} ({selectedEvent.organizer.createdBy.role})</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Registration Intelligence */}
               <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                     <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Entry Requirements</h4>
                     <p className="text-sm font-bold opacity-80 leading-relaxed">Ensure you register before the deadline of <span className="text-white font-black">{new Date(selectedEvent.registration.deadline).toLocaleString()}</span>. Late entries are strictly prohibited.</p>
                  </div>
                  <div className="flex gap-10 border-t md:border-t-none md:border-l border-white/10 pt-8 md:pt-0 md:pl-10">
                     <div className="text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">Max Capacity</p>
                        <p className="text-3xl font-black">{selectedEvent.registration.maxCapacity}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-tighter mb-1">Reserved</p>
                        <p className="text-3xl font-black">{selectedEvent.registration.currentCount}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer Control Bar */}
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-xl">🛡️</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Verified Payment Gate</p>
                    <p className="text-[10px] font-bold text-slate-400">SSL Encrypted Transactions via Razorpay</p>
                  </div>
               </div>
               
               {isEventRegistered(selectedEvent._id) ? (
                 <div className="w-full md:w-auto px-16 py-5 bg-green-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-green-500/30 flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
                    Entry Passport Generated
                 </div>
               ) : (
                 <button 
                   onClick={() => handleRegister(selectedEvent._id)}
                   disabled={registerLoading || !selectedEvent.registration.isOpen}
                   className="w-full md:w-auto px-16 py-5 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50 active:scale-95 group font-black flex items-center justify-center gap-4"
                 >
                   {registerLoading ? (
                     <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                      <>
                        <span className="group-hover:scale-110 transition-transform">{selectedEvent.isPaid ? '🔒 SECURE CHECKOUT' : '⚡ INSTANT BOOKING'}</span>
                        <div className="w-px h-6 bg-white/20"></div>
                        <span className="text-blue-200">{selectedEvent.isPaid ? `PAY ₹${selectedEvent.price}` : 'JOIN FREE'}</span>
                      </>
                   )}
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberEvents
