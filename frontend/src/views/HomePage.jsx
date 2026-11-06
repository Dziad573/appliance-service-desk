import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import {
    Wrench,
    Search,
    FileText,
    Lock,
    Clock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import './home.scss';

export const HomePage = () => {
    const { user, setUser, reports = [], fetchReportsByUserId } = useStore();
    const [searchQuery, setSearchQuery] = useState(''); // Stan do trzymania numeru zgłoszenia
    const navigate = useNavigate();

    useEffect(() => {
        const userId = JSON.parse(localStorage.getItem("user"))?.id;

        if (userId) {
            axios.get(`http://localhost:3001/users/${userId}`)
                .then(res => {
                    setUser(res.data);
                    // Pobierz zgłoszenia użytkownika do listy
                    fetchReportsByUserId(userId);
                })
                .catch(err => console.error('Błąd pobierania użytkownika:', err));
        }
    }, [setUser, fetchReportsByUserId]);

    // Sortowanie (najnowsze na górze) i ucięcie do 5 ostatnich dla podglądu na stronie głównej
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

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Szukam zgłoszenia o numerze:', searchQuery);
        // Tutaj w przyszłości dodasz np. navigate(`/status/${searchQuery}`)
    };

    return (
        <div className="homepage-modern">
            <main className="main-workspace">
                <div className="content-card">

                    {/* Nagłówek powitalny */}
                    <header className="dashboard-header">
                        <h2>{user ? `Witaj, ${user.login}!` : 'Panel Główny'}</h2>
                        <p>Zarządzaj swoimi zgłoszeniami serwisowymi i sprawdzaj status napraw.</p>
                    </header>

                    {/* Rząd kafelków (kwadratów) z szybkimi akcjami */}
                    <div className="dashboard-grid">
                        <div className="dashboard-widget" onClick={() => user && navigate('/new-report')} style={{ cursor: user ? 'pointer' : 'default' }}>
                            <div className="widget-icon blue"><Wrench size={24} /></div>
                            <h3>Nowa naprawa</h3>
                            <p>Zgłoś nowe urządzenie do serwisu</p>
                        </div>

                        {/* Zaktualizowany kafelek wyszukiwania */}
                        <div className="dashboard-widget search-widget">
                            <div className="widget-icon green"><Search size={24} /></div>
                            <h3>Sprawdź status</h3>
                            <form onSubmit={handleSearch} className="search-form">
                                <input
                                    type="text"
                                    className="status-input"
                                    placeholder="Wyszukaj po numerze zgłoszenia"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        </div>

                        {/* Historia (Zablokowana dla niezalogowanych) */}
                        <div className={`dashboard-widget ${!user ? 'locked' : ''}`} onClick={() => user && navigate('/user-reports')} style={{ cursor: user ? 'pointer' : 'default' }}>
                            <div className={`widget-icon ${!user ? 'gray' : 'purple'}`}>
                                {!user ? <Lock size={24} /> : <FileText size={24} />}
                            </div>
                            <h3>Historia</h3>
                            {user ? (
                                <p>Zakończone zlecenia serwisowe</p>
                            ) : (
                                <p className="locked-text">
                                    Tylko dla zalogowanych
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Większe obszary robocze na dole */}
                    <div className="dashboard-main-section">
                        <div className="placeholder-box large">
                            <div className="box-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Ostatnie zgłoszenia</h3>
                                {user && recentReports.length > 0 && (
                                    <button
                                        className="view-all-link"
                                        onClick={() => navigate('/user-reports')}
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Zobacz wszystkie
                                    </button>
                                )}
                            </div>

                            {user ? (
                                recentReports.length > 0 ? (
                                    <div className="recent-reports-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {recentReports.map(report => (
                                            <div
                                                key={report.id}
                                                className="recent-report-item"
                                                onClick={() => navigate(`/user-reports/${report.id}`)}
                                                style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff', cursor: 'pointer' }}
                                            >
                                                <div className="report-icon" style={{ backgroundColor: '#f3f4f6', color: '#6b7280', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '1rem' }}>
                                                    <Wrench size={20} />
                                                </div>
                                                <div className="report-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                    <span className="report-title" style={{ fontWeight: 600, fontSize: '1rem', color: '#1f2937' }}>{report.device_name}</span>
                                                    <span className="report-desc" style={{ fontSize: '0.85rem', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>{report.issue_description}</span>
                                                </div>
                                                <div className="report-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                    <span className="report-date" style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatDate(report.created_at)}</span>
                                                    {getStatusBadge(report.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <span>Brak aktywnych zgłoszeń. Tutaj pojawi się lista Twoich napraw.</span>
                                    </div>
                                )
                            ) : (
                                <div className="empty-state locked-bg">
                                    <div className="locked-content">
                                        <Lock size={36} className="lock-icon" />
                                        <span>Tylko dla zalogowanych</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="placeholder-box small">
                            <h3>Komunikaty systemu</h3>
                            <div className={`empty-state ${!user ? 'locked-bg' : ''}`}>
                                {user ? (
                                    <span>Wszystkie systemy działają poprawnie.</span>
                                ) : (
                                    <div className="locked-content">
                                        <Lock size={36} className="lock-icon" />
                                        <span>Tylko dla zalogowanych</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};