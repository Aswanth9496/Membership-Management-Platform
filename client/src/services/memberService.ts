import api from './api/axios';

export const memberService = {
    getProfile: async () => {
        const response = await api.get('/api/member/profile');
        return response.data;
    },

    getMyEvents: async () => {
        try {
            const response = await api.get('/api/member/events/my-events');
            return response.data;
        } catch (error) {
            // Return empty events gracefully as per original logic
            return { data: { events: [] } };
        }
    }
};
