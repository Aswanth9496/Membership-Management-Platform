import { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { memberService } from '../services/memberService';
import Swal from 'sweetalert2';

export const useDashboard = () => {
    const { user } = useAppSelector((state: any) => state.auth);
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (user?.role && user.role !== 'member') {
                navigate('/admin/dashboard', { replace: true });
                return;
            }

            try {
                const [profileRes, eventsRes] = await Promise.all([
                    memberService.getProfile(),
                    memberService.getMyEvents()
                ]);

                setProfile(profileRes.data.member || profileRes.data.user);
                setMyEvents(eventsRes.data.events || []);
            } catch (error) {
                console.error('Failed to fetch profile', error);
                Swal.fire('Error', 'Could not load your secure dashboard.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, navigate]);

    const recentPayments = useMemo(() => {
        let payments: any[] = [];

        if (profile?.payment?.amount > 0) {
            payments.push({
                id: 'reg_payment',
                date: profile.payment.paymentDate || profile.createdAt || new Date(),
                description: 'Membership Registration',
                amount: profile.payment.amount,
                status: profile.payment.status
            });
        }

        if (profile?.renewalHistory && Array.isArray(profile.renewalHistory)) {
            profile.renewalHistory.forEach((ren: any, i: number) => {
                if (ren.amount > 0) {
                    payments.push({
                        id: `ren_${i}`,
                        date: ren.renewalDate || new Date(),
                        description: 'Membership Renewal',
                        amount: ren.amount,
                        status: ren.status
                    });
                }
            });
        }

        if (myEvents && Array.isArray(myEvents)) {
            myEvents.forEach((evt: any) => {
                const reg = evt.registrationDetails;
                if (reg?.amount > 0) {
                    payments.push({
                        id: `evt_${evt.id}`,
                        date: reg.registeredAt || evt.eventDate?.startDate || new Date(),
                        description: `Event Ticket: ${evt.title}`,
                        amount: reg.amount,
                        status: reg.paymentStatus || 'completed'
                    });
                }
            });
        }

        return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    }, [profile, myEvents]);

    const fullName = profile?.fullName || user?.name || 'Alex Johnson';
    const firstName = fullName.split(' ')[0] || 'Alex';

    return {
        profile,
        loading,
        user,
        myEvents,
        recentPayments,
        firstName,
        navigate
    };
};
