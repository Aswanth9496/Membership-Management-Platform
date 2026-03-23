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
  const [modalError, setModalError] = useState(null)

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
        setModalError(null)
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
                // Use the UNIFIED verification endpoint
                const verifyRes = await memberEndpoints.payments.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
                if (verifyRes.success) {
                  alert('Registration confirmed! Check your My Registrations tab.')
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

          // 5. Catch payment failure (Foreground fall-back)
          rzp.on('payment.failed', async function (response) {
              console.error('Event payment failed:', response.error);
              try {
                  await memberEndpoints.payments.reportFailure({
                      order_id: response.error.metadata.order_id,
                      payment_id: response.error.metadata.payment_id,
                      error_details: {
                          code: response.error.code,
                          description: response.error.description,
                          reason: response.error.reason
                      }
                  });
                  alert(`Payment Failed: ${response.error.description || 'Reason unknown'}`);
                  fetchData(); // Refresh to show failure status if needed
              } catch (reportErr) {
                  console.error('Failed to report event payment error:', reportErr);
              }
          });

          rzp.open()
        }
      } else {
        setModalError(response.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setModalError(err.message || 'Registration failed')
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
              {event.eventDate?.startDate ? new Date(event.eventDate.startDate).toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
           </span>
           <span className="text-xl font-black text-slate-800 group-hover:text-white leading-none transition-colors">
              {event.eventDate?.startDate ? new Date(event.eventDate.startDate).getDate() : '-'}
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
                <span className="text-sm">📍</span> {event.venue?.city || 'Location TBA'}{event.venue?.name ? `, ${event.venue.name}` : ''}
             </p>
             <p className="text-[11px] font-bold flex items-center gap-2">
                <span className="text-sm">🕒</span> {event.eventDate?.startTime || 'TBA'} - {event.eventDate?.endTime || 'TBA'}
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
    <>
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeUp p-2 md:p-6 mb-20 font-sans">
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
      </div>

      {/* FIXED PREMIUM OVERLAY - MOVED OUTSIDE ANIMATED CONTAINER FOR PERFECT ALIGNMENT */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* backdrop: Clean Semi-transparent (Blur removed) */}
          <div 
            className="absolute inset-0 bg-slate-900/60 transition-opacity"
            onClick={() => setSelectedEvent(null)}
          ></div>
          
          {/* Modal Card - Compact & Neat */}
          <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleIn border border-slate-200">
            
            {/* Header: Compact */}
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                    {selectedEvent.eventType}
                  </span>
                  {selectedEvent.isActive && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 text-[8px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {selectedEvent.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-lg bg-slate-200/50 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center text-slate-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content Area: Compact Small Lettering */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
              
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-shake">
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-sm">⚠️</span>
                  <span className="flex-1">{modalError}</span>
                  <button onClick={() => setModalError(null)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
              )}

              {/* Core Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {[
                  { label: 'Event Date', val: selectedEvent.eventDate?.startDate ? new Date(selectedEvent.eventDate.startDate).toLocaleDateString() : 'TBA', icon: '📅' },
                  { label: 'Schedule', val: `${selectedEvent.eventDate?.startTime || 'TBA'} - ${selectedEvent.eventDate?.endTime || 'TBA'}`, icon: '🕒' },
                  { label: 'Deadline', val: selectedEvent.registration?.deadline ? new Date(selectedEvent.registration.deadline).toLocaleDateString() : 'TBA', icon: '⌛' },
                  { label: 'Availability', val: `${(selectedEvent.registration?.maxCapacity || 0) - (selectedEvent.registration?.currentCount || 0)} Slots Left`, icon: '🎟️' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="opacity-60">{item.icon}</span> {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-blue-600 rounded-full"></span>
                  Description
                </h4>
                <div className="text-[11px] text-slate-600 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-sm whitespace-pre-wrap">
                  {selectedEvent.description || 'No additional information provided.'}
                </div>
              </div>

              {/* Venue & Link Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Facility & Location</p>
                  {selectedEvent.venue?.mapLink && (
                    <a 
                      href={selectedEvent.venue.mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1"
                    >
                      🔗 View Link
                    </a>
                  )}
                </div>
                <div className="flex gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                   <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-sm">🏢</div>
                   <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-slate-800">{selectedEvent.venue?.name || 'TBA'}</p>
                      <p className="text-[10px] font-medium text-slate-500">{selectedEvent.venue?.address || 'TBA'}, {selectedEvent.venue?.city}</p>
                   </div>
                </div>
              </div>

              {/* Organizer Roster */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizer Roster</p>
                <div className="grid grid-cols-1 gap-2">
                   {/* Primary */}
                   <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">P</div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-slate-800">{selectedEvent.organizer?.primary?.name || 'TBA'}</p>
                          <p className="text-[9px] font-bold text-blue-600/70 uppercase">Primary Contact</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-700">{selectedEvent.organizer?.primary?.phone}</p>
                         <p className="text-[9px] font-medium text-slate-400">{selectedEvent.organizer?.primary?.email}</p>
                      </div>
                   </div>

                   {/* Secondary 1 */}
                   {selectedEvent.organizer?.secondary1?.name && (
                     <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-xs font-bold">S1</div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800">{selectedEvent.organizer.secondary1.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Support Contact</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-700">{selectedEvent.organizer.secondary1.phone}</p>
                           <p className="text-[9px] font-medium text-slate-400">{selectedEvent.organizer.secondary1.email}</p>
                        </div>
                     </div>
                   )}

                   {/* Secondary 2 */}
                   {selectedEvent.organizer?.secondary2?.name && (
                     <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-xs font-bold">S2</div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800">{selectedEvent.organizer.secondary2.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Support Contact</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-700">{selectedEvent.organizer.secondary2.phone}</p>
                           <p className="text-[9px] font-medium text-slate-400">{selectedEvent.organizer.secondary2.email}</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Action Bar: Compact */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registration Fee</p>
                 <p className="text-lg font-black text-slate-900 leading-none">
                   {selectedEvent.isPaid ? `₹${selectedEvent.price}` : 'FREE'}
                 </p>
              </div>

              {isEventRegistered(selectedEvent._id) ? (
                <div className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-600/10">
                   <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                   Registered
                </div>
              ) : (
                <button 
                  onClick={() => handleRegister(selectedEvent._id)}
                  disabled={registerLoading || !selectedEvent.registration?.isOpen}
                  className="px-8 py-3 bg-blue-600 hover:bg-slate-900 text-white rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {registerLoading ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{selectedEvent.isPaid ? 'Proceed' : 'Register Now'}</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MemberEvents
