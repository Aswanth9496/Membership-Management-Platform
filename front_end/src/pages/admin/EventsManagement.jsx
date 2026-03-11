import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import adminEndpoints from '../../data/admin/admin_endpoints'

const EventsManagement = () => {
  const navigate = useNavigate()
  const { user: admin } = useSelector((state) => state.auth)
  
  // State for events and loading
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formErrors, setFormErrors] = useState([])

  // Filter and Pagination State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  const limit = 10

  // Modal States
  const [showEventModal, setShowEventModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [registrationsLoading, setRegistrationsLoading] = useState(false)

  // Form State for Create/Edit
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: 'Workshop',
    startDate: '',
    endDate: '',
    startTime: '10:00',
    endTime: '17:00',
    venueName: '',
    venueAddress: '',
    city: '',
    maxCapacity: 100,
    registrationDeadline: '',
    isPaid: false,
    price: 0,
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    status: 'published'
  })

  const eventTypes = ['Annual Meet', 'FAM Trip', 'Training', 'Workshop', 'Seminar', 'Conference', 'Other']
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Completed', value: 'completed' }
  ]

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await adminEndpoints.events.getAll({
        status: selectedStatus,
        eventType: selectedType,
        search: searchTerm,
        page: currentPage,
        limit
      })

      if (response?.success) {
        setEvents(response.data.events)
        setTotalPages(response.data.pagination.pages)
        setTotalEvents(response.data.pagination.total)
        setError(null)
      } else {
        setError('Failed to load events')
      }
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  // Handle Create/Update
  const handleEventSubmit = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      
      // Format payload to match Event.js schema
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        eventType: eventForm.eventType,
        eventDate: {
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime
        },
        venue: {
          name: eventForm.venueName,
          address: eventForm.venueAddress,
          city: eventForm.city
        },
        registration: {
          deadline: eventForm.registrationDeadline,
          maxCapacity: eventForm.maxCapacity
        },
        isPaid: eventForm.isPaid,
        price: eventForm.isPaid ? eventForm.price : 0,
        organizer: {
          contactPerson: eventForm.contactPerson,
          contactEmail: eventForm.contactEmail,
          contactPhone: eventForm.contactPhone,
          createdBy: admin?.id // Backend might handle this but good to have
        },
        status: eventForm.status
      }

      let response
      if (selectedEvent?._id) {
        response = await adminEndpoints.events.update(selectedEvent._id, payload)
      } else {
        response = await adminEndpoints.events.create(payload)
      }

      if (response?.success) {
        await fetchEvents()
        setShowEventModal(false)
        setSelectedEvent(null)
        setFormErrors([])
      }
    } catch (err) {
      console.error('Error saving event:', err)
      if (err.data?.errors) {
        setFormErrors(err.data.errors)
      } else {
        setFormErrors([err.message || 'Error connecting to server'])
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Delete
  const handleEventDelete = async () => {
    if (!selectedEvent?._id) return
    try {
      setActionLoading(true)
      const response = await adminEndpoints.events.delete(selectedEvent._id)
      if (response?.success) {
        await fetchEvents()
        setShowDeleteModal(false)
        setSelectedEvent(null)
      }
    } catch (err) {
      console.error('Error deleting event:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // View Registrations
  const viewRegistrations = async (event) => {
    try {
      setSelectedEvent(event)
      setShowRegistrationsModal(true)
      setRegistrationsLoading(true)
      const response = await adminEndpoints.events.getRegistrations(event._id)
      if (response?.success) {
        setRegistrations(response.data.registrations || [])
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
    } finally {
      setRegistrationsLoading(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (event) => {
    setSelectedEvent(event)
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'Workshop',
      startDate: event.eventDate?.startDate?.split('T')[0] || '',
      endDate: event.eventDate?.endDate?.split('T')[0] || '',
      startTime: event.eventDate?.startTime || '10:00',
      endTime: event.eventDate?.endTime || '17:00',
      venueName: event.venue?.name || '',
      venueAddress: event.venue?.address || '',
      city: event.venue?.city || '',
      maxCapacity: event.registration?.maxCapacity || 100,
      registrationDeadline: event.registration?.deadline?.split('T')[0] || '',
      isPaid: event.isPaid || false,
      price: event.price || 0,
      contactPerson: event.organizer?.contactPerson || '',
      contactEmail: event.organizer?.contactEmail || '',
      contactPhone: event.organizer?.contactPhone || '',
      status: event.status || 'published'
    })
    setShowEventModal(true)
  }

  // Export CSV Helper
  const exportToCSV = () => {
    if (!registrations.length) return
    
    const headers = ['Name', 'Email', 'Phone', 'Agency', 'Payment Status', 'Amount', 'Date']
    const data = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.establishment,
      reg.paymentStatus,
      reg.amount,
      new Date(reg.registrationDate).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...data].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `registrations-${selectedEvent.title.replace(/\s+/g, '-').toLowerCase()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    fetchEvents()
  }, [selectedStatus, selectedType, currentPage, searchTerm])

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-sky-100 text-sky-700 border-sky-200'
      case 'ongoing': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Event Management</h1>
          <p className="text-gray-500 text-sm font-medium">Create and coordinate official member events</p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null)
            setEventForm({
              title: '', description: '', eventType: 'Workshop', startDate: '', endDate: '',
              startTime: '10:00', endTime: '17:00', venueName: '', venueAddress: '', city: '',
              maxCapacity: 100, registrationDeadline: '', isPaid: false, price: 0, 
              contactPerson: '', contactEmail: '', contactPhone: '', status: 'published'
            })
            setShowEventModal(true)
          }}
          className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Plan New Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Categories</option>
            {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedStatus('')
              setSelectedType('')
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-sm scrollbar-thin scrollbar-thumb-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
            <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Synchronizing events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-bold">No events found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Detail</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Capacity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100 group-hover:bg-sky-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="max-w-[200px]">
                        <div className="font-bold text-gray-900 text-sm truncate" title={event.title}>{event.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{event.eventType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-gray-700">
                      {new Date(event.eventDate.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {event.eventDate.startTime} - {event.eventDate.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{event.venue?.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{event.venue?.city}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs font-bold text-gray-700">{event.registration?.currentCount}</span>
                      <span className="text-[10px] font-bold text-gray-300">/ {event.registration?.maxCapacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => viewRegistrations(event)}
                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all" 
                        title="View Participants"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => openEditModal(event)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" 
                        title="Edit Plan"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                        title="Delete Event"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">Showing page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Plan Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {selectedEvent ? 'Edit Event Plan' : 'Plan New Event'}
                </h2>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Logistics & Registration</p>
              </div>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 bg-gray-50/30">
              {formErrors.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">Action Required</span>
                  </div>
                  <ul className="space-y-1">
                    {formErrors.map((err, i) => (
                      <li key={i} className="text-[11px] font-medium text-red-500 list-disc list-inside">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4">
                {/* Basic Info */}
                <div className="md:col-span-6 space-y-3">
                  <h3 className="text-[9px] font-black text-sky-600 uppercase tracking-[0.2em] px-1">Basic Infrastructure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Event Title</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. Annual General Meet"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
                        value={eventForm.title}
                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Category</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-bold"
                        value={eventForm.eventType}
                        onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}
                      >
                        {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Event Description</label>
                      <textarea 
                        required 
                        rows={2}
                        placeholder="Brief summary of the event proceedings..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium resize-none"
                        value={eventForm.description}
                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="md:col-span-3 space-y-3">
                  <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] px-1">Timing & Date</h3>
                  <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Start Date</label>
                      <input 
                        required type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={eventForm.startDate}
                        onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">End Date</label>
                      <input 
                        required type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={eventForm.endDate}
                        onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Start Time</label>
                      <input 
                        required type="time" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={eventForm.startTime}
                        onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">End Time</label>
                      <input 
                        required type="time" className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                        value={eventForm.endTime}
                        onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="md:col-span-3 space-y-3">
                  <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] px-1">Venue Details</h3>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Name</label>
                      <input 
                        required type="text" placeholder="Hotel / Hall Name"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                        value={eventForm.venueName}
                        onChange={e => setEventForm({ ...eventForm, venueName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">City</label>
                        <input 
                          required type="text" placeholder="Kochi"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                          value={eventForm.city}
                          onChange={e => setEventForm({ ...eventForm, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Address</label>
                        <input 
                          required type="text" placeholder="Locality / Landmark"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                          value={eventForm.venueAddress}
                          onChange={e => setEventForm({ ...eventForm, venueAddress: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer Contact */}
                <div className="md:col-span-6 space-y-3">
                  <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Organizer Roster</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Contact Person</label>
                      <input 
                        required type="text" placeholder="Coordinator Name"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        value={eventForm.contactPerson}
                        onChange={e => setEventForm({ ...eventForm, contactPerson: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Official Email</label>
                      <input 
                        required type="email" placeholder="event@domain.com"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        value={eventForm.contactEmail}
                        onChange={e => setEventForm({ ...eventForm, contactEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Support Phone</label>
                      <input 
                        required type="tel" placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        value={eventForm.contactPhone}
                        onChange={e => setEventForm({ ...eventForm, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Rules */}
                <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-6 mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Max Capacity</label>
                    <input 
                      required type="number" 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-black text-center"
                      value={eventForm.maxCapacity}
                      onChange={e => setEventForm({ ...eventForm, maxCapacity: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Reg. Deadline</label>
                    <input 
                      required type="date" 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-bold"
                      value={eventForm.registrationDeadline}
                      onChange={e => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Pricing Model</label>
                    <select 
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-bold"
                      value={eventForm.isPaid ? 'paid' : 'free'}
                      onChange={e => setEventForm({ ...eventForm, isPaid: e.target.value === 'paid' })}
                    >
                      <option value="free">Free Access</option>
                      <option value="paid">Paid Ticket</option>
                    </select>
                  </div>
                </div>

                {eventForm.isPaid && (
                  <div className="md:col-span-6 bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-between animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">₹</div>
                      <div>
                        <div className="text-[9px] font-bold uppercase opacity-80 tracking-widest">Ticket Price</div>
                        <div className="text-xl font-black leading-none">Person Access</div>
                      </div>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-xl px-4 py-1 border border-white/20">
                      <span className="text-xl font-black mr-2">₹</span>
                      <input 
                        required type="number" placeholder="0.00"
                        className="bg-transparent border-none text-xl font-black w-24 focus:ring-0 p-0 text-white placeholder:text-white/30"
                        value={eventForm.price}
                        onChange={e => setEventForm({ ...eventForm, price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md pt-6 pb-2 grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-3.5 bg-sky-600 text-white rounded-xl font-bold text-[11px] tracking-widest uppercase shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Publish Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false)
                    setFormErrors([])
                  }}
                  className="py-3.5 bg-gray-100 text-gray-500 rounded-xl font-bold text-[11px] tracking-widest uppercase hover:bg-gray-200 transition-all"
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEvent?.title}</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Participant Roster • <span className="text-sky-600 font-bold">{registrations.length}</span> Total Confirmed
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  disabled={registrations.length === 0}
                  className="px-5 py-2.5 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold hover:bg-sky-100 transition-all border border-sky-100 disabled:opacity-50"
                >
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
              {registrationsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                  <div className="w-8 h-8 border-3 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold uppercase tracking-widest mt-2">Fetching Roster...</p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-200 shadow-sm mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold">No participants yet</p>
                  <p className="text-gray-400 text-xs mt-1">Registrations will appear here as members sign up.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center w-12">#</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Participant</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Agency</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {registrations.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-gray-300 text-center">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800 text-sm">{reg.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium">Reg: {new Date(reg.registrationDate).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-600 truncate max-w-[180px]">{reg.email}</div>
                            <div className="text-[10px] text-gray-400 font-bold mt-0.5">{reg.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-bold text-sky-700 truncate max-w-[200px]">{reg.establishment}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                              reg.paymentStatus === 'completed' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : reg.paymentStatus === 'free'
                                ? 'bg-gray-50 text-gray-500 border-gray-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {reg.paymentStatus === 'completed' ? `Paid ₹${reg.amount}` : reg.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2 italic">Cancel Event?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to permanently delete <strong>{selectedEvent?.title}</strong>? This action will remove all registration data and cannot be undone.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleEventDelete}
                disabled={actionLoading}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Scrubbing Database...' : 'Yes, Delete Completely'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedEvent(null)
                }}
                className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Keep Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsManagement
