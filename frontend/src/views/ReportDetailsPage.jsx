
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    FileText,
    Wrench,
    User,
    CalendarDays,
    Hash,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

import useStore from '../store/useStore';
import { getReportById } from '../services/reportsService';

import './ReportDetailsPage.scss';

export const ReportDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useStore();

    const isAdmin = user?.role === 'admin';

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pobieranie danych reklamacji
    useEffect(() => {
        let cancelled = false;

        const fetchReport = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getReportById(id);

                if (cancelled) return;

                // Użytkownik może zobaczyć tylko własne zgłoszenie
                if (!isAdmin && String(data.user_id) !== String(user?.id)) {
                    setError('Nie masz uprawnień do wyświetlenia tej reklamacji.');
                    return;
                }

                setReport(data);

            } catch (err) {
                if (!cancelled) {
                    if (err.response?.status === 404) {
                        setError('Nie znaleziono reklamacji o podanym numerze.');
                    } else {
                        setError('Nie udało się pobrać danych reklamacji.');
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (id && user) {
            fetchReport();
        }

        return () => {
            cancelled = true;
        };
    }, [id, user, isAdmin]);

    // Formatowanie daty
    const formatDate = (dateString) => {
        if (!dateString) return 'Brak danych';

        return new Date(dateString).toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Status reklamacji
    const getStatus = (status) => {
        switch (status?.toLowerCase()) {
            case 'zakończone':
                return {
                    className: 'success',
                    icon: <CheckCircle2 size={16} />,
                    label: 'Zakończone'
                };

            case 'w trakcie':
                return {
                    className: 'warning',
                    icon: <Clock size={16} />,
                    label: 'W trakcie'
                };

            default:
                return {
                    className: 'new',
                    icon: <AlertCircle size={16} />,
                    label: status || 'Nowe'
                };
        }
    };

    const backToList = () => {
        navigate(isAdmin ? '/reports' : '/user-reports');
    };

    return (
        <div className="report-details-page">

            <div className="report-details-container">

                {/* Powrót do listy */}
                <button
                    className="report-back-button"
                    onClick={backToList}
                >
                    <ArrowLeft size={18} />
                    Powrót do listy reklamacji
                </button>

                {loading ? (
                    <div className="report-details-message">
                        Ładowanie danych reklamacji...
                    </div>
                ) : error ? (
                    <div className="report-details-message report-details-message--error">
                        <AlertCircle size={24} />
                        <p>{error}</p>
                    </div>
                ) : report && (
                    <>
                        {/* Nagłówek rekordu */}
                        <div className="report-details-header">

                            <div className="report-details-header__main">
                                <span className="report-details-eyebrow">
                                    REKLAMACJA #{report.id}
                                </span>

                                <h1>{report.device_name}</h1>

                                <p>
                                    Szczegóły zgłoszenia reklamacyjnego
                                </p>
                            </div>

                            <div className={`report-details-status report-details-status--${getStatus(report.status).className}`}>
                                {getStatus(report.status).icon}
                                {getStatus(report.status).label}
                            </div>

                        </div>

                        {/* Zawartość strony */}
                        <div className="report-details-layout">

                            {/* Główna kolumna */}
                            <main className="report-details-main">

                                {/* Informacje podstawowe */}
                                <section className="details-card">

                                    <div className="details-card__header">
                                        <div className="details-card__icon">
                                            <FileText size={19} />
                                        </div>

                                        <div>
                                            <h2>Informacje o zgłoszeniu</h2>
                                            <p>Podstawowe dane reklamacji</p>
                                        </div>
                                    </div>

                                    <div className="details-fields">

                                        <div className="details-field">
                                            <span>Numer zgłoszenia</span>
                                            <strong>
                                                <Hash size={15} />
                                                {report.id}
                                            </strong>
                                        </div>

                                        <div className="details-field">
                                            <span>Urządzenie</span>
                                            <strong>
                                                <Wrench size={15} />
                                                {report.device_name || 'Brak danych'}
                                            </strong>
                                        </div>

                                        <div className="details-field">
                                            <span>Data zgłoszenia</span>
                                            <strong>
                                                <CalendarDays size={15} />
                                                {formatDate(report.created_at)}
                                            </strong>
                                        </div>

                                        <div className="details-field">
                                            <span>Aktualny status</span>
                                            <strong>
                                                {getStatus(report.status).label}
                                            </strong>
                                        </div>

                                        {isAdmin && (
                                            <div className="details-field">
                                                <span>ID użytkownika</span>
                                                <strong>
                                                    <User size={15} />
                                                    {report.user_id}
                                                </strong>
                                            </div>
                                        )}

                                    </div>
                                </section>

                                {/* Opis usterki */}
                                <section className="details-card">

                                    <div className="details-card__header">
                                        <div className="details-card__icon">
                                            <AlertCircle size={19} />
                                        </div>

                                        <div>
                                            <h2>Opis zgłoszonej usterki</h2>
                                            <p>Informacje przekazane przez zgłaszającego</p>
                                        </div>
                                    </div>

                                    <div className="report-description">
                                        {report.issue_description || 'Brak opisu usterki.'}
                                    </div>

                                </section>

                            </main>

                            {/* Panel boczny */}
                            <aside className="report-details-sidebar">

                                <section className="details-card">

                                    <div className="details-card__header">
                                        <div className="details-card__icon">
                                            <Clock size={19} />
                                        </div>

                                        <div>
                                            <h2>Informacje dodatkowe</h2>
                                            <p>Metadane zgłoszenia</p>
                                        </div>
                                    </div>

                                    <div className="sidebar-field">
                                        <span>Numer reklamacji</span>
                                        <strong>#{report.id}</strong>
                                    </div>

                                    <div className="sidebar-field">
                                        <span>Utworzono</span>
                                        <strong>{formatDate(report.created_at)}</strong>
                                    </div>

                                    {isAdmin && (
                                        <div className="sidebar-field">
                                            <span>Zgłaszający (ID)</span>
                                            <strong>{report.user_id}</strong>
                                        </div>
                                    )}

                                </section>

                            </aside>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
