import { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api/axios';

interface RazorpayPaymentOptions {
    user: any;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export const useRazorpayPayment = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async ({ user, onSuccess, onError }: RazorpayPaymentOptions) => {
        try {
            setIsProcessing(true);

            // 1. Create Order
            const orderRes = await api.post('/api/payment/create-order');
            const data = orderRes.data.data;

            // 2. Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                Swal.fire('Error', 'Razorpay SDK failed to load. Are you online?', 'error');
                if (onError) onError(new Error('SDK failing to load'));
                return;
            }

            // 3. Configure Razorpay options
            const options = {
                key: data.keyId,
                amount: data.amount * 100, // Handle paise/rupees correctly based on backend
                currency: data.currency || "INR",
                name: "TechFinit",
                description: data.paymentType === 'renewal' ? "Membership Renewal" : "Membership Registration",
                order_id: data.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await api.post('/api/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Payment Successful!',
                                text: 'Your membership has been successfully updated.',
                                confirmButtonColor: '#2563eb'
                            });

                            if (onSuccess) onSuccess();
                        }
                    } catch (err: any) {
                        Swal.fire('Verification Failed', err.response?.data?.message || 'Payment succeeded but verification failed on server.', 'error');
                        if (onError) onError(err);
                    }
                },
                prefill: {
                    name: data.memberDetails?.name || user?.fullName || '',
                    email: data.memberDetails?.email || user?.email || '',
                    contact: data.memberDetails?.contact || user?.mobile || ''
                },
                theme: {
                    color: "#2563eb"
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                Swal.fire('Payment Failed', response.error.description, 'error');
                if (onError) onError(new Error(response.error.description));
            });
            paymentObject.open();

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: error.response?.data?.message || 'Something went wrong initiating payment.',
                confirmButtonColor: '#2563eb'
            });
            if (onError) onError(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        isProcessing,
        handlePayment
    };
};
