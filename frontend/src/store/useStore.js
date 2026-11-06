import { create } from 'zustand';
import { getReports, getReportsByUserId, createReport } from '../services/reportsService';

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
    },

    addNewReport: async (reportData) => {
        try {
            const newReport = await createReport(reportData);
            set((state) => ({ reports: [newReport, ...state.reports] }));
            return true;
        } catch (error) {
            console.error('Błąd podczas dodawania zgłoszenia:', error);
            return false;
        }
    }
}));

export default useStore;