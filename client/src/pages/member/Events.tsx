import React, { useEffect, useState } from 'react';
import {
    Calendar,
    MapPin,
    ArrowRight,
    Loader2,
    Search,
    CheckCircle2,
    X
} from 'lucide-react';
import api from '../../services/axios';
import Swal from 'sweetalert2';
import { useAppSelector } from '../../store/hooks';

interface Event {
    id: string;
    title: string;
    description: string;
    eventType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    venueName: string;
    city: string;
    fee: number;
    capacity: number;
    registered: number;
    status: string;
}

export default function Events() {
    const { user } = useAppSelector((state: any) => state.auth);
    const [events, setEvents] = useState<Event[]>([]);
    const [myEvents, setMyEvents] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [registrationLoading, setRegistrationLoading] = useState<string | null>(null);

    // Modal State
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const fetchEventsState = async () => {
        try {
            const [eventsResp, myEventsResp] = await Promise.all([
                api.get('/api/events?status=published'),
                api.get('/api/member/events/my-events')
            ]);

            const formattedEvents = (eventsResp.data.data.events || []).map((ev: any) => ({
                id: ev._id,
                title: ev.title,
                description: ev.description,
                eventType: ev.eventType,
                startDate: ev.eventDate?.startDate,
                endDate: ev.eventDate?.endDate,
                startTime: ev.eventDate?.startTime,
                endTime: ev.eventDate?.endTime,
                venueName: ev.venue?.name,
                city: ev.venue?.city,
                fee: ev.registration?.fee || 0,
                capacity: ev.registration?.maxCapacity || 0,
                registered: ev.registration?.currentCount || 0,
                status: ev.status
            }));

            const registeredIds = (myEventsResp.data.data.events || []).map((ev: any) => ev.id || ev._id);

            setEvents(formattedEvents);
            setMyEvents(registeredIds);
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventsState();
    }, []);

    const openRegisterModal = (event: Event) => {
        setFormData({
            name: user?.fullName || user?.name || '',
            email: user?.email || '',
            phone: user?.mobile || user?.phone || ''
        });
        setSelectedEvent(event);
    };

    const confirmRegistration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;

        const event = selectedEvent;
        setSelectedEvent(null); // close modal immediately

        try {
            setRegistrationLoading(event.id);

            // Attempt registration with form data payload
            const response = await api.post(`/api/member/events/register/${event.id}`, formData);
            const data = response.data.data;

            if (data.isFree) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registered Successfully!',
                    text: `You are now registered for ${event.title}.`,
                    confirmButtonColor: '#2563eb'
                });
                fetchEventsState();
                return;
            }

            // Paid Event - load Razorpay
            const res = await loadRazorpayScript();
            if (!res) {
                Swal.fire('Error', 'Razorpay SDK failed to load. Are you online?', 'error');
                return;
            }

            const options = {
                key: data.razorpayKeyId || data.order?.key,
                amount: data.order.amount * 100, // Handle paise/rupees correctly based on backend
                currency: data.order.currency || "INR",
                name: "Karapuzha Water Scapes",
                description: `Registration for ${event.title}`,
                order_id: data.order.id,
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await api.post('/api/member/events/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyResponse.data.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Payment Successful!',
                                text: 'Your registration is confirmed.',
                                confirmButtonColor: '#2563eb'
                            });
                            fetchEventsState();
                        }
                    } catch (err) {
                        Swal.fire('Verification Failed', 'Payment succeeded but verification failed. Please contact support.', 'error');
                    }
                },
                prefill: {
                    name: data.memberDetails?.name || '',
                    email: data.memberDetails?.email || '',
                    contact: data.memberDetails?.contact || ''
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                Swal.fire('Payment Failed', response.error.description, 'error');
            });
            paymentObject.open();

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: error.response?.data?.message || 'Something went wrong.',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setRegistrationLoading(null);
        }
    };

    const getMonthShort = (dateString: string) => {
        if (!dateString) return 'TBA';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    };

    const getDay = (dateString: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        const day = d.getDate();
        return day < 10 ? `0${day}` : day.toString();
    };

    // Random colors for event cards background to mimic dashboard
    const getGradientByIndex = (index: number) => {
        const gradients = [
            'from-slate-300 to-slate-500',
            'from-slate-400 to-slate-700',
            'from-blue-300 to-blue-500',
            'from-emerald-300 to-emerald-500',
            'from-amber-300 to-amber-500',
            'from-purple-300 to-purple-500'
        ];
        return gradients[index % gradients.length];
    };

    const filteredEvents = events.filter(e =>
        e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto font-sans text-slate-900 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-2">
                <div>
                    <p className="text-[11px] font-bold text-blue-600 tracking-[0.15em] uppercase mb-2">Activities</p>
                    <h1 className="text-[32px] sm:text-[40px] leading-none font-bold tracking-tight text-slate-900">
                        Event Registry
                    </h1>
                </div>

                <div className="relative group w-full md:w-72 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search summits & events..."
                        className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-full shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-[20px] border border-slate-200 p-12 text-center shadow-sm border-dashed">
                    <div className="flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-400 rounded-full mx-auto mb-6">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No Events Found</h3>
                    <p className="text-slate-500 mt-3 leading-relaxed max-w-md mx-auto">
                        There are currently no events matching your search or scheduled for the future. Check back later!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredEvents.map((event, index) => {
                        const isRegistered = myEvents.includes(event.id);
                        const bgGradient = getGradientByIndex(index);
                        const isRegistering = registrationLoading === event.id;
                        const isFull = event.registered >= event.capacity;

                        return (
                            <div key={event.id} className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
                                <div className={`h-[140px] bg-gradient-to-br ${bgGradient} relative p-4 flex flex-col justify-between items-start`}>
                                    <div className="absolute top-4 right-4 bg-white rounded-lg flex flex-col items-center justify-center w-[46px] h-[52px] shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-[-2px]">{getMonthShort(event.startDate)}</span>
                                        <span className="text-[18px] font-black leading-none text-slate-900">{getDay(event.startDate)}</span>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between w-full">
                                        <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                                            {event.eventType || 'Event'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2 gap-2">
                                        <h3 className="font-bold text-[16px] leading-snug line-clamp-2">{event.title}</h3>
                                        <div className="bg-slate-50 text-slate-700 text-xs font-bold px-2 py-1 rounded-md shrink-0 border border-slate-200">
                                            {event.fee > 0 ? `₹${event.fee}` : 'Free'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium mb-3">
                                        <MapPin size={14} className="shrink-0 text-slate-400" />
                                        <span className="truncate">{event.venueName}, {event.city}</span>
                                    </div>

                                    <p className="text-[13px] text-slate-500 line-clamp-2 mb-5 leading-relaxed flex-1">
                                        {event.description}
                                    </p>

                                    {/* Footer Section */}
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                            {event.registered}/{event.capacity} Filled
                                        </div>
                                        <div>
                                            {isRegistered ? (
                                                <button disabled className="bg-[#E8F8EE] text-[#05A660] font-bold text-[13px] py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-default">
                                                    <CheckCircle2 size={16} />
                                                    Registered
                                                </button>
                                            ) : isFull ? (
                                                <button disabled className="bg-slate-100 text-slate-400 font-bold text-[13px] py-2 px-4 rounded-xl cursor-not-allowed">
                                                    Event Full
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openRegisterModal(event)}
                                                    disabled={isRegistering}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-200 disabled:opacity-70"
                                                >
                                                    {isRegistering ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>Register <ArrowRight size={14} /></>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Registration Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Confirm Registration</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">{selectedEvent.title}</p>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={confirmRegistration} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedEvent(null)}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    Proceed <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
