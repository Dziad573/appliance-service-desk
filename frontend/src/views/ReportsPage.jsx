import React, { useEffect, useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { Clock, Filter, Search, Wrench, AlertCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import './home.scss';
import './ReportsPage.scss';

export const ReportsPage = () => {
    const { reports, fetchReports, fetchReportsByUserId, user } = useStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        if (!user) return;

        if (user.role === 'admin') {
            fetchReports();
        } else if (user.id) {
            fetchReportsByUserId(user.id);
        }
    }, [user, fetchReports, fetchReportsByUserId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Brak daty';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('pl-PL', options);
    };

    const filteredReports = useMemo(() => {
        if (!reports) return [];

        let result = [...reports];

        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (r) =>
                    r.device_name.toLowerCase().includes(term) ||
                    r.issue_description.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'ALL') {
            result = result.filter((r) => r.status === statusFilter);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [reports, searchTerm, statusFilter, sortOrder]);

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'zakończone':
                return <span className="status-badge status-badge--success"><CheckCircle2 size={14} /> Zakończone</span>;
            case 'w trakcie':
                return <span className="status-badge status-badge--warning"><Clock size={14} /> W trakcie</span>;
            default:
                return <span className="status-badge status-badge--new"><AlertCircle size={14} /> {status || 'Nowe'}</span>;
        }
    };

    return (
        <div className="reports-page reports-page-container">
            <section className="hero">
                <div className="hero__overlay">
                    <h1 className="hero__title">Panel zgłoszeń</h1>
                    <p className="hero__subtitle">
                        {user?.role === 'admin' 
                            ? 'Panel Administratora - Podgląd wszystkich zgłoszeń w systemie' 
                            : 'Twoje zgłoszenia reklamacyjne i serwisowe'}
                    </p>
                </div>
            </section>

            <section className="stats-bar">
                <div className="stat-card">
                    <h3>Wszystkie</h3>
                    <p>{reports.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Wyświetlane</h3>
                    <p>{filteredReports.length}</p>
                </div>
            </section>

            <section className="content">
                <div className="content__container">
                    
                    <div className="filters-bar">
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Szukaj urządzenia lub opisu..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <label><Filter size={16} /> Status:</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="ALL">Wszystkie</option>
                                <option value="Nowe">Nowe</option>
                                <option value="W trakcie">W trakcie</option>
                                <option value="Zakończone">Zakończone</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Sortuj:</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="asc">Od najstarszych (domyślnie)</option>
                                <option value="desc">Od najnowszych</option>
                            </select>
                        </div>
                    </div>

                    <div className="reports-grid">
                        {filteredReports && filteredReports.length > 0 ? (
                            filteredReports.map((report) => (
                                <div key={report.id} className="report-card">
                                    <div className="report-card__header">
                                        <div className="device-info">
                                            <Wrench size={20} className="device-icon" />
                                            <h4>{report.device_name}</h4>
                                        </div>
                                        {getStatusBadge(report.status)}
                                    </div>

                                    <div className="report-card__body">
                                        <p className="issue-desc"><strong>Opis usterki:</strong> {report.issue_description}</p>
                                    </div>

                                    <div className="report-card__footer">
                                        <span className="report-date">
                                            <Clock size={14} /> {formatDate(report.created_at)}
                                        </span>
                                        {user?.role === 'admin' && (
                                            <span className="report-user">
                                                <UserIcon size={14} /> User ID: {report.user_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-reports">
                                <AlertCircle size={48} />
                                <p>Brak zgłoszeń spełniających kryteria wyszukiwania.</p>
                            </div>
                        )}
                    </div>

                </div>
            </section>
        </div>
    );
};