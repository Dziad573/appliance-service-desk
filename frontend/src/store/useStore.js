import { create } from 'zustand';
import { getReports, getReportsByUserId } from '../services/reportsService';

const useStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    logout: () => {
        localStorage.removeItem('user');
        set({ user: null });
    },

    theme: 'dark',
    toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

    reports: [],
    
    setReports: (reports) => set({ reports }),
 
    fetchReports: async () => {
        try {
            const reports = await getReports();
            set({ reports });
        } catch (error) {
            console.error('Błąd pobierania zgłoszeń:', error);
        }
    },

    fetchReportsByUserId: async (userId) => {
        try {
            const reports = await getReportsByUserId(userId);
            set({ reports });
        } catch (error) {
            console.error('Błąd pobierania zgłoszeń użytkownika:', error);
        }
    }
}));

export default useStore;