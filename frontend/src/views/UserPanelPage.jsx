import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
    PlusCircle,
    ClipboardList,
    Clock,
    AlertCircle,
    CheckCircle2,
    Wrench,
    X,
    Send
} from 'lucide-react';
import './UserPanelPage.scss';

export const UserPanelPage = () => {
    const { user, reports = [], fetchReportsByUserId, addNewReport } = useStore();
    const navigate = useNavigate();

    // Stan modalu i formularza nowego zgłoszenia (wypełnianego przez klienta)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [issueDescription, setIssueDescription] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pobieranie zgłoszeń użytkownika przy wejściu na stronę
    useEffect(() => {
        if (user?.id) {
            fetchReportsByUserId(user.id);
        }
    }, [user, fetchReportsByUserId]);

    // Obsługa wysyłania formularza przez klienta
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!deviceName.trim() || !issueDescription.trim()) {
            setFormError('Wypełnij nazwę urządzenia oraz opis usterki.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        // Wysyłamy dane dokładnie w strukturze oczekiwanej przez tabelę reports
        const success = await addNewReport({
            user_id: user.id,
            device_name: deviceName,
            issue_description: issueDescription,
            status: 'Nowe' // Domyślny status dla klienta
        });

        setIsSubmitting(false);

        if (success) {
            setDeviceName('');
            setIssueDescription('');
            setIsModalOpen(false);
        } else {
            setFormError('Nie udało się dodać zgłoszenia. Spróbuj ponownie.');
        }
    };

    // Sortowanie (najnowsze na górze) i ucięcie do 5 ostatnich
    const recentReports = [...reports]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5);

    // Formatowanie daty
    const formatDate = (dateString) => {
        if (!dateString) return 'Brak daty';
        return new Date(dateString).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Funkcja generująca odznakę statusu
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'zakończone':
                return (
                    <span className="badge badge--success">
                        <CheckCircle2 size={14} /> Zakończone
                    </span>
                );
            case 'w trakcie':
                return (
                    <span className="badge badge--warning">
                        <Clock size={14} /> W trakcie
                    </span>
                );
            default:
                return (
                    <span className="badge badge--new">
                        <AlertCircle size={14} /> {status || 'Nowe'}
                    </span>
                );
        }
    };

    return (
        <div className="user-panel-container">
            <main className="main-workspace">
                <div className="content-card">

                    {/* Nagłówek panelu */}
                    <header className="dashboard-header">
                        <h2>Panel Użytkownika{user ? `: ${user.login}` : ''}</h2>
                        <p>Zarządzaj swoimi zleceniami i dodawaj nowe zgłoszenia serwisowe.</p>
                    </header>

                    {/* Kafelki głównych akcji */}
                    <div className="dashboard-grid">
                        <div className="dashboard-widget" onClick={() => setIsModalOpen(true)}>
                            <div className="widget-icon blue">
                                <PlusCircle size={28} />
                            </div>
                            {/* Kliknięcie w h3 uruchamia modal */}
                            <h3 onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
                                Nowe zlecenie
                            </h3>
                            <p>Zgłoś nowe urządzenie do naprawy</p>
                        </div>

                        <div className="dashboard-widget" onClick={() => navigate('/user-reports')}>
                            <div className="widget-icon green">
                                <ClipboardList size={28} />
                            </div>
                            <h3>Moje zlecenia</h3>
                            <p>Przeglądaj historię i status wszystkich zgłoszeń</p>
                        </div>
                    </div>

                    {/* Sekcja z podglądem listy ostatnich zleceń */}
                    <div className="dashboard-main-section">
                        <div className="placeholder-box">
                            <div className="box-header-row">
                                <h3>Ostatnie zlecenia</h3>
                                {recentReports.length > 0 && (
                                    <button
                                        className="view-all-link"
                                        onClick={() => navigate('/user-reports')}
                                    >
                                        Zobacz wszystkie
                                    </button>
                                )}
                            </div>

                            {recentReports.length > 0 ? (
                                <div className="recent-reports-list">
                                    {recentReports.map(report => (
                                        <div
                                            key={report.id}
                                            className="recent-report-item"
                                            onClick={() => navigate(`/user-reports/${report.id}`)}
                                        >
                                            <div className="report-icon">
                                                <Wrench size={20} />
                                            </div>
                                            <div className="report-info">
                                                <span className="report-title">{report.device_name}</span>
                                                <span className="report-desc">{report.issue_description}</span>
                                            </div>
                                            <div className="report-meta">
                                                <span className="report-date">{formatDate(report.created_at)}</span>
                                                {getStatusBadge(report.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <ClipboardList size={40} className="empty-icon" />
                                    <span>Nie masz jeszcze żadnych zgłoszeń.</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            {/* Formularz zgłoszeń*/}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Nowe zgłoszenie serwisowe</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label>Nazwa urządzenia / Model *</label>
                                <input
                                    type="text"
                                    placeholder="np. Pralka Bosch / Ekspres DeLonghi"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Opis usterki / Problem *</label>
                                <textarea
                                    rows="4"
                                    placeholder="Opisz co dokładnie się dzieje z urządzeniem..."
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {formError && <p className="form-error">{formError}</p>}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                >
                                    <Send size={16} /> {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};