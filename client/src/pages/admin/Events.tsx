import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash,
    X,
    Users
} from 'lucide-react';
import api from '../../services/api/axios';
import MySwal from '../../utils/swal';
import { CSVLink } from 'react-csv';

interface TravelEvent {
    id: string;
    title: string;
    eventType: string;
    description: string;
    startDate: string;
    endDate: string;
    venueName: string;
    venueAddress: string;
    city: string;
    registered: number;
    capacity: number;
    status: 'draft' | 'published' | 'ongoing' | 'completed';
}

export default function Events() {
    const [events, setEvents] = useState<TravelEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create & Edit Event Form State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
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
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Registrations View State
    const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
    const [eventRegistrations, setEventRegistrations] = useState<{ eventTitle: string, totalRegistrations: number, registrations: any[] }>({ eventTitle: '', totalRegistrations: 0, registrations: [] });
    const [registrationsLoading, setRegistrationsLoading] = useState(false);

    const handleViewRegistrations = async (eventId: string, title: string) => {
        try {
            setRegistrationsLoading(true);
            setIsRegistrationsModalOpen(true);
            const response = await api.get(`/api/admin/events/${eventId}/registrations`);
            setEventRegistrations(response.data.data);
        } catch (err: any) {
            MySwal.fire('Error', err.response?.data?.message || 'Failed to fetch registrations', 'error');
            setIsRegistrationsModalOpen(false);
        } finally {
            setRegistrationsLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/events');
            const eventData = (response.data?.data?.events || []).map((e: any) => ({
                id: e._id,
                title: e.title,
                description: e.description,
                eventType: e.eventType,
                startDate: e.eventDate.startDate,
                endDate: e.eventDate.endDate,
                venueName: e.venue.name,
                venueAddress: e.venue.address,
                city: e.venue.city,
                registered: e.registration.currentCount,
                capacity: e.registration.maxCapacity,
                status: e.status
            }));
            setEvents(eventData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const openEditForm = async (id: string) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/admin/events/${id}`);
            const ev = data.data.event;
            setEventForm({
                title: ev.title || '',
                description: ev.description || '',
                eventType: ev.eventType || 'Workshop',
                startDate: ev.startDate?.split('T')[0] || ev.eventDate?.startDate?.split('T')[0] || '',
                endDate: ev.endDate?.split('T')[0] || ev.eventDate?.endDate?.split('T')[0] || '',
                startTime: ev.startTime || ev.eventDate?.startTime || '10:00',
                endTime: ev.endTime || ev.eventDate?.endTime || '17:00',
                venueName: ev.venue?.name || '',
                venueAddress: ev.venue?.address || '',
                city: ev.venue?.city || '',
                maxCapacity: ev.registration?.maxCapacity || 100,
                registrationDeadline: ev.registration?.deadline?.split('T')[0] || '',
                isPaid: ev.isPaid || false,
                price: ev.price || 0,
                contactPerson: ev.organizer?.contactPerson || '',
                contactEmail: ev.organizer?.contactEmail || '',
                contactPhone: ev.organizer?.contactPhone || '',
            });
            setEditingEventId(id);
            setIsEventModalOpen(true);
        } catch (err) {
            MySwal.fire('Error', 'Failed to fetch event details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id: string) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/admin/events/${id}`);
            const ev = data.data.event;
            MySwal.fire({
                title: `<span class="italic text-slate-800 font-extrabold tracking-tight">${ev.title}</span>`,
                html: `
                    <div class="text-left text-sm flex flex-col gap-3 font-medium text-slate-600 mt-2 bg-slate-50 p-6 rounded-2xl ring-1 ring-slate-100">
                        <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Status</span> <span class="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-slate-200 text-slate-700">${ev.status}</span></div>
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Type</span> <span class="text-slate-900 font-bold">${ev.eventType}</span></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Date Time</span> <span class="text-slate-900 font-bold">${new Date(ev.startDate || ev.eventDate?.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span> <span class="text-slate-400 text-xs ml-1">to ${new Date(ev.endDate || ev.eventDate?.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></div>
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Time</span> <span class="text-slate-900 font-bold">${ev.startTime || ev.eventDate?.startTime} - ${ev.endTime || ev.eventDate?.endTime}</span></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Venue</span> <span class="text-slate-900 font-bold truncate max-w-full block">${ev.venue?.name}, ${ev.venue?.city}</span></div>
                            <div><span class="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Registrations</span> <span class="text-slate-900 font-bold">${ev.registration?.currentCount || 0} / ${ev.registration?.maxCapacity || 0}</span></div>
                        </div>
                        <p class="mt-2 text-slate-500 italic max-h-40 overflow-y-auto leading-relaxed border-l-2 border-slate-300 pl-4 py-1">${ev.description}</p>
                    </div>
                `,
                width: '600px',
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'Close Window',
                customClass: {
                    htmlContainer: 'p-0',
                    title: 'p-5 pt-8 text-2xl'
                }
            });
        } catch (err: any) {
            MySwal.fire('Error', 'Unable to fetch details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
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
                    contactPhone: eventForm.contactPhone
                }
            };

            if (editingEventId) {
                await api.patch(`/api/admin/events/${editingEventId}`, payload);
                MySwal.fire({
                    title: 'Updated!',
                    text: 'Event details have been successfully updated.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                const createPayload = { ...payload, status: 'published' };
                await api.post('/api/admin/events', createPayload);
                MySwal.fire({
                    title: 'Success!',
                    text: 'New event has been created and published.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            setIsEventModalOpen(false);
            setEditingEventId(null);
            fetchInitialData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.errors ? err.response?.data?.errors.join('\n') : err.response?.data?.message || 'Failed to save event';
            MySwal.fire({
                title: 'Error',
                text: errorMsg,
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (id: string, title: string) => {
        const result = await MySwal.fire({
            title: 'Delete Event?',
            text: `Are you sure you want to permanently delete "${title}"? This cannot be reversed.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await api.delete(`/api/admin/events/${id}`);
                setEvents(prev => prev.filter(e => e.id !== id));
                MySwal.fire({
                    title: 'Deleted!',
                    text: 'The event has been securely removed.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err: any) {
                MySwal.fire('Error', err.response?.data?.message || 'Unable to delete event', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChangeStatus = async (id: string, currentStatus: string) => {
        const { value: newStatus } = await MySwal.fire({
            title: 'Update Event Status',
            input: 'select',
            inputOptions: {
                draft: 'Draft',
                published: 'Published',
                ongoing: 'Ongoing',
                completed: 'Completed'
            },
            inputValue: currentStatus,
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#94a3b8'
        });

        if (newStatus && newStatus !== currentStatus) {
            try {
                setLoading(true);
                await api.patch(`/api/admin/events/${id}`, { status: newStatus });
                setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus as any } : e));
                MySwal.fire({
                    title: 'Updated',
                    text: `Event status dynamically set to ${newStatus}.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err: any) {
                MySwal.fire('Error', err.response?.data?.message || 'Unable to change status', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusBadge = (status: TravelEvent['status']) => {
        switch (status) {
            case 'published':
                return 'bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200';
            case 'ongoing':
                return 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200 animate-pulse';
            case 'completed':
                return 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200';
            case 'draft':
            default:
                return 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200';
        }
    };

    const filteredEvents = events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto p-4 md:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight italic text-primary">Event Management</h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1 font-medium italic">Create, monitor, and coordinate official operations.</p>
                </div>

                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <div className="relative group w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Events..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full md:w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingEventId(null);
                            setEventForm({
                                title: '', description: '', eventType: 'Workshop', startDate: '', endDate: '',
                                startTime: '10:00', endTime: '17:00', venueName: '', venueAddress: '', city: '',
                                maxCapacity: 100, registrationDeadline: '', isPaid: false, price: 0, contactPerson: '', contactEmail: '', contactPhone: '',
                            });
                            setIsEventModalOpen(true);
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        <Plus size={16} /> Plan Event
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col w-full pb-8">
                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Title & Type</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Registrations</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-20 text-slate-400 italic font-medium">Synchronizing database...</td></tr>
                                ) : filteredEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                                    <Calendar size={24} className="opacity-50" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No events found</h3>
                                                <p className="text-xs font-medium text-slate-500 max-w-[250px] leading-relaxed">
                                                    There are no events matching your criteria.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEvents.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="max-w-[250px] pr-4">
                                                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate" title={event.title}>{event.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                        {event.eventType}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-700">
                                                {new Date(event.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                {new Date(event.startDate).getTime() !== new Date(event.endDate).getTime() ? `to ${new Date(event.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : '1 Day Event'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-700 font-bold max-w-[200px] truncate" title={event.venueName}>
                                                    <MapPin size={12} className="text-slate-400" /> {event.venueName}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pl-5">
                                                    {event.city}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <Users size={12} className="text-blue-500" />
                                                <span className="text-xs font-bold text-slate-700">{event.registered}</span>
                                                <span className="text-[10px] font-black text-slate-300">/ {event.capacity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={() => handleChangeStatus(event.id, event.status)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-md cursor-pointer ${getStatusBadge(event.status)}`}
                                                title="Click to Change Status"
                                            >
                                                {event.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleViewRegistrations(event.id, event.title)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all" title="View Registrations">
                                                    <Users size={18} />
                                                </button>
                                                <button onClick={() => handleViewDetails(event.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="View Details">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => openEditForm(event.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Edit Event">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteEvent(event.id, event.title)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Profile">
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile / Tablet Card View */}
                <div className="lg:hidden flex flex-col gap-4 w-full">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400 italic font-medium">Synchronizing database...</div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col items-center justify-center gap-3 animate-[fadeIn_0.5s_ease-out]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 ring-4 ring-white shadow-sm mb-2">
                                    <Calendar size={24} className="opacity-50" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">No events found</h3>
                            </div>
                        </div>
                    ) : filteredEvents.map((event) => (
                        <div key={event.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5 relative overflow-hidden transition-all hover:border-blue-200">
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 pr-2">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold border border-slate-100 flex-shrink-0">
                                        <Calendar size={20} className="sm:hidden" />
                                        <Calendar size={24} className="hidden sm:block" />
                                    </div>
                                    <div className="flex flex-col pt-0.5 min-w-0 w-full">
                                        <div className="font-extrabold text-slate-900 leading-tight text-[15px] sm:text-base break-words line-clamp-2">{event.title}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 sm:mt-1.5 truncate">{event.eventType}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status and Action Row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-1 border-t border-slate-100 pt-3">
                                <button
                                    onClick={() => handleChangeStatus(event.id, event.status)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${getStatusBadge(event.status)}`}
                                >
                                    {event.status}
                                </button>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    <button onClick={() => handleViewRegistrations(event.id, event.title)} className="flex-1 sm:flex-none flex justify-center p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 bg-slate-50 rounded-xl text-xs transition-colors" title="View Registrations"><Users size={16} /></button>
                                    <button onClick={() => handleViewDetails(event.id)} className="flex-1 sm:flex-none flex justify-center p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 rounded-xl text-xs transition-colors"><Eye size={16} /></button>
                                    <button onClick={() => openEditForm(event.id)} className="flex-1 sm:flex-none flex justify-center p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50 rounded-xl text-xs transition-colors"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteEvent(event.id, event.title)} className="flex-1 sm:flex-none flex justify-center p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50 rounded-xl text-xs transition-colors"><Trash size={16} /></button>
                                </div>
                            </div>

                            {/* Data Grid */}
                            <div className="bg-slate-50/60 rounded-2xl p-4 grid grid-cols-2 gap-y-4 gap-x-3 border border-slate-100/50 mt-1">
                                <div className="min-w-0">
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Schedule</div>
                                    <div className="text-[13px] sm:text-xs font-bold text-slate-700 truncate">{new Date(event.startDate).toLocaleDateString()}</div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Location</div>
                                    <div className="text-[13px] sm:text-xs font-bold text-slate-700 truncate">{event.city}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Users size={10} /> Registrations</div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}></div>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-500 text-right">{event.registered} / {event.capacity} Filled</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create / Edit Event Modal */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full my-8 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">{editingEventId ? 'Edit Event Plan' : 'New Event Plan'}</h2>
                                <p className="text-xs font-medium text-slate-500 italic mt-0.5">Define session logistics and capacity.</p>
                            </div>
                            <button onClick={() => setIsEventModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Title</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:italic" placeholder="e.g. Travel Summit Kochi 2026" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                    <textarea required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none h-24 placeholder:italic" placeholder="Outline event agenda and participation benefits..." value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Category</label>
                                    <select required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.eventType} onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Annual Meet">Annual Meet</option>
                                        <option value="FAM Trip">FAM Trip</option>
                                        <option value="Training">Training</option>
                                        <option value="Seminar">Seminar</option>
                                        <option value="Conference">Conference</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Max Capacity</label>
                                    <input required type="number" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.maxCapacity} onChange={e => setEventForm({ ...eventForm, maxCapacity: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Venue Name</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:italic" placeholder="Lulu Convention Center" value={eventForm.venueName} onChange={e => setEventForm({ ...eventForm, venueName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Venue Address</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:italic" placeholder="Edappally, NH 66" value={eventForm.venueAddress} onChange={e => setEventForm({ ...eventForm, venueAddress: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:italic" placeholder="Kochi" value={eventForm.city} onChange={e => setEventForm({ ...eventForm, city: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Date</label>
                                    <input required type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Date</label>
                                    <input required type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Start Time</label>
                                    <input required type="time" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.startTime} onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">End Time</label>
                                    <input required type="time" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.endTime} onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deadline Date</label>
                                    <input required type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.registrationDeadline} onChange={e => setEventForm({ ...eventForm, registrationDeadline: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment Type</label>
                                    <select required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.isPaid ? 'Paid' : 'Free'} onChange={e => setEventForm({ ...eventForm, isPaid: e.target.value === 'Paid', price: e.target.value === 'Free' ? 0 : eventForm.price })}>
                                        <option value="Free">Free Event</option>
                                        <option value="Paid">Paid Event (Requires Payment Gateway)</option>
                                    </select>
                                </div>
                                {eventForm.isPaid && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price (₹)</label>
                                        <input required type="number" min="1" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.price || ''} onChange={e => setEventForm({ ...eventForm, price: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                )}
                                <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-4">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Organizer Details</h4>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Person</label>
                                    <input required type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.contactPerson} onChange={e => setEventForm({ ...eventForm, contactPerson: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Email</label>
                                    <input required type="email" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.contactEmail} onChange={e => setEventForm({ ...eventForm, contactEmail: e.target.value })} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Phone (10 digits)</label>
                                    <input required type="tel" pattern="[6-9][0-9]{9}" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" value={eventForm.contactPhone} onChange={e => setEventForm({ ...eventForm, contactPhone: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                {editingEventId ? <><Edit size={18} /> Update Official Event</> : <><Plus size={18} /> Publish Official Event</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Registrations Modal */}
            {isRegistrationsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white sm:rounded-[2.5rem] shadow-2xl max-w-5xl w-full h-[100vh] sm:h-[85vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shrink-0">
                            <div className="flex items-start justify-between sm:block w-full sm:w-auto">
                                <div className="pr-4 max-w-full">
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight break-words">{eventRegistrations.eventTitle}</h2>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Total Registrations: <span className="font-bold text-slate-700">{eventRegistrations.totalRegistrations}</span></p>
                                </div>
                                <button onClick={() => setIsRegistrationsModalOpen(false)} className="sm:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                {eventRegistrations.registrations.length > 0 && (
                                    <CSVLink
                                        data={eventRegistrations.registrations}
                                        filename={`registrations-${eventRegistrations.eventTitle.replace(/\s+/g, '-').toLowerCase()}.csv`}
                                        className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center rounded-xl text-xs font-bold transition-colors border border-emerald-200"
                                    >
                                        Export CSV
                                    </CSVLink>
                                )}
                                <button onClick={() => setIsRegistrationsModalOpen(false)} className="hidden sm:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 sm:p-6 w-full">
                            {registrationsLoading ? (
                                <div className="flex justify-center items-center h-full text-slate-400 italic">Loading registrations...</div>
                            ) : eventRegistrations.registrations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                                    <Users size={48} className="text-slate-300" />
                                    <p className="text-slate-500 font-medium">No registrations found for this event yet.</p>
                                </div>
                            ) : (
                                <div className="w-full">
                                    {/* Desktop / Tablet Table View */}
                                    <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse table-auto min-w-[700px]">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Participant Name</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Contact Details</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Agency / Estab.</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Reg. Date</th>
                                                        <th className="px-6 py-4 text-xs font-bold text-slate-500">Payment Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {eventRegistrations.registrations.map((reg, idx) => (
                                                        <tr key={reg.id || idx} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-slate-900 break-words">{reg.name}</div>
                                                            </td>
                                                            <td className="px-6 py-4 max-w-[200px]">
                                                                <div className="text-sm font-medium text-slate-700 break-all">{reg.email}</div>
                                                                <div className="text-xs text-slate-500 mt-0.5">{reg.phone}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 max-w-[200px] truncate" title={reg.establishment}>{reg.establishment}</td>
                                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                                {new Date(reg.registrationDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {reg.paymentStatus === 'free' ? (
                                                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md tracking-wider">Free</span>
                                                                ) : reg.paymentStatus === 'completed' ? (
                                                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-md tracking-wider border border-emerald-200">Paid - ₹{reg.amount}</span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase rounded-md tracking-wider border border-amber-200">Pending</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Mobile Cards View */}
                                    <div className="md:hidden flex flex-col gap-4">
                                        {eventRegistrations.registrations.map((reg, idx) => (
                                            <div key={reg.id || idx} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 shadow-sm transition-all hover:border-blue-200">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="font-bold text-slate-900 break-words flex-1 text-base">{reg.name}</div>
                                                    <div className="shrink-0 mt-0.5">
                                                        {reg.paymentStatus === 'free' ? (
                                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded-md tracking-wider inline-block">Free</span>
                                                        ) : reg.paymentStatus === 'completed' ? (
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase rounded-md tracking-wider border border-emerald-200 inline-block">Paid - ₹{reg.amount}</span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[9px] font-bold uppercase rounded-md tracking-wider border border-amber-200 inline-block">Pending</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><Users size={12} className="text-blue-500" /> Contact</div>
                                                    <div className="text-sm font-medium text-slate-700 break-all">{reg.email}</div>
                                                    <div className="text-sm text-slate-600">{reg.phone}</div>
                                                </div>

                                                <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1.5"><MapPin size={12} className="text-purple-500" /> Agency / Estab.</div>
                                                    <div className="text-sm font-medium text-slate-700 break-words">{reg.establishment}</div>
                                                </div>

                                                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-1">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Calendar size={12} className="text-emerald-500" /> Reg. Date</div>
                                                    <div className="text-sm text-slate-600 font-bold">
                                                        {new Date(reg.registrationDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
