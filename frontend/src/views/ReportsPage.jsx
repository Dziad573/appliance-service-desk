
import React, { useEffect, useMemo, useState } from 'react';
import useStore from '../store/useStore';
import {
    Clock,
    Wrench,
    AlertCircle,
    CheckCircle2,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

import './home.scss';
import './ReportsPage.scss';

const PAGE_SIZE = 50;

export const ReportsPage = () => {
    const {
        reports = [],
        fetchReports,
        fetchReportsByUserId,
        user
    } = useStore();

    const isAdmin = user?.role === 'admin';

    const [filters, setFilters] = useState({
        id: '',
        device_name: '',
        issue_description: '',
        status: 'ALL',
        user_id: ''
    });

    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    const [currentPage, setCurrentPage] = useState(1);

    // Filtr daty
    const [dateFilterType, setDateFilterType] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        if (!user) return;

        if (isAdmin) {
            fetchReports();
        } else if (user.id) {
            fetchReportsByUserId(user.id);
        }
    }, [user, isAdmin, fetchReports, fetchReportsByUserId]);

    // Formatowanie daty
    const formatDate = (dateString) => {
        if (!dateString) return 'Brak daty';

        return new Date(dateString).toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Obsługa filtrów kolumn
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    // Czyszczenie wszystkich filtrów
    const clearFilters = () => {
        setFilters({
            id: '',
            device_name: '',
            issue_description: '',
            status: 'ALL',
            user_id: ''
        });

        setDateFilterType('ALL');
        setDateFrom('');
        setDateTo('');
    };

    // Sortowanie po kliknięciu nagłówka
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc'
                    ? 'desc'
                    : 'asc'
        }));
    };

    // Ikona sortowania
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown size={14} />;
        }

        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} />
            : <ArrowDown size={14} />;
    };

    // Filtrowanie i sortowanie reklamacji
    const filteredReports = useMemo(() => {
        let result = [...reports];

        // Filtry tekstowe i status
        Object.entries(filters).forEach(([key, value]) => {
            if (!value || value === 'ALL') return;

            result = result.filter((report) => {
                const fieldValue = report[key];

                if (fieldValue === null || fieldValue === undefined) {
                    return false;
                }

                return String(fieldValue)
                    .toLowerCase()
                    .includes(value.toLowerCase());
            });
        });

        // Filtrowanie daty zgłoszenia
        result = result.filter((report) => {
            if (!report.created_at) return false;

            const reportDate = new Date(report.created_at);

            if (Number.isNaN(reportDate.getTime())) return false;

            if (dateFilterType === 'FROM_TO') {
                if (dateFrom) {
                    const from = new Date(`${dateFrom}T00:00:00`);

                    if (reportDate < from) return false;
                }

                if (dateTo) {
                    const to = new Date(`${dateTo}T23:59:59.999`);

                    if (reportDate > to) return false;
                }
            }

            if (dateFilterType === 'OLDER' && dateFrom) {
                const date = new Date(`${dateFrom}T00:00:00`);

                if (reportDate >= date) return false;
            }

            if (dateFilterType === 'NEWER' && dateFrom) {
                const date = new Date(`${dateFrom}T23:59:59.999`);

                if (reportDate <= date) return false;
            }

            return true;
        });

        // Sortowanie
        result.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            let comparison = 0;

            if (sortConfig.key === 'created_at') {
                comparison =
                    new Date(aValue || 0) - new Date(bValue || 0);
            } else if (
                sortConfig.key === 'id' ||
                sortConfig.key === 'user_id'
            ) {
                comparison = Number(aValue || 0) - Number(bValue || 0);
            } else {
                comparison = String(aValue || '').localeCompare(
                    String(bValue || ''),
                    'pl',
                    { sensitivity: 'base' }
                );
            }

            return sortConfig.direction === 'asc'
                ? comparison
                : -comparison;
        });

        return result;
    }, [
        reports,
        filters,
        sortConfig,
        dateFilterType,
        dateFrom,
        dateTo
    ]);

    // Paginacja
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReports.length / PAGE_SIZE)
    );

    // Powrót na pierwszą stronę po zmianie filtrów lub sortowania
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortConfig, dateFilterType, dateFrom, dateTo]);

    // Zabezpieczenie przed wyjściem poza zakres stron
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;

        return filteredReports.slice(start, start + PAGE_SIZE);
    }, [filteredReports, currentPage]);

    // Status reklamacji
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'zakończone':
                return (
                    <span className="status-badge status-badge--success">
                        <CheckCircle2 size={14} />
                        Zakończone
                    </span>
                );

            case 'w trakcie':
                return (
                    <span className="status-badge status-badge--warning">
                        <Clock size={14} />
                        W trakcie
                    </span>
                );

            default:
                return (
                    <span className="status-badge status-badge--new">
                        <AlertCircle size={14} />
                        {status || 'Nowe'}
                    </span>
                );
        }
    };

    // Nagłówek sortowalnej kolumny
    const ColumnHeader = ({ label, column }) => (
        <button
            type="button"
            className="table-header__sort"
            onClick={() => handleSort(column)}
            title={`Sortuj według: ${label}`}
        >
            <span>{label}</span>
            {getSortIcon(column)}
        </button>
    );

    const firstItem = filteredReports.length
        ? (currentPage - 1) * PAGE_SIZE + 1
        : 0;

    const lastItem = Math.min(
        currentPage * PAGE_SIZE,
        filteredReports.length
    );

    return (
        <div className="reports-page reports-page-container">

            <section className="hero">
                <div className="hero__overlay">
                    <h1 className="hero__title">
                        {isAdmin ? 'Panel reklamacji' : 'Moje reklamacje'}
                    </h1>

                    <p className="hero__subtitle">
                        {isAdmin
                            ? 'Zarządzanie zgłoszeniami reklamacyjnymi'
                            : 'Lista Twoich zgłoszeń reklamacyjnych'}
                    </p>
                </div>
            </section>

            <section className="stats-bar">
                <div className="stat-card">
                    <h3>Wszystkie zgłoszenia</h3>
                    <p>{reports.length}</p>
                </div>

                <div className="stat-card">
                    <h3>Wyniki filtrowania</h3>
                    <p>{filteredReports.length}</p>
                </div>
            </section>

            <section className="content">
                <div className="content__container">

                    <div className="table-toolbar">
                        <div>
                            <h2>Lista zgłoszeń</h2>
                            <p>
                                Kliknij nagłówek kolumny, aby zmienić sortowanie.
                                Użyj pól pod nagłówkami, aby filtrować dane.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="clear-filters"
                            onClick={clearFilters}
                        >
                            Wyczyść filtry
                        </button>
                    </div>

                    {/* Tabela reklamacji */}
                    <div className="reports-table-wrapper">
                        <div className={`reports-table ${isAdmin ? 'reports-table--admin' : ''}`}>

                            {/* Nagłówki kolumn */}
                            <div className="table-header">

                                {/* 1. Numer zgłoszenia */}
                                <div className="table-header__cell">
                                    <ColumnHeader
                                        label="Nr zgłoszenia"
                                        column="id"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Filtruj..."
                                        value={filters.id}
                                        onChange={(e) => updateFilter('id', e.target.value)}
                                    />
                                </div>

                                {/* 2. Urządzenie */}
                                <div className="table-header__cell">
                                    <ColumnHeader
                                        label="Urządzenie"
                                        column="device_name"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Filtruj..."
                                        value={filters.device_name}
                                        onChange={(e) => updateFilter('device_name', e.target.value)}
                                    />
                                </div>

                                {/* 3. Opis usterki */}
                                <div className="table-header__cell">
                                    <ColumnHeader
                                        label="Opis usterki"
                                        column="issue_description"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Filtruj..."
                                        value={filters.issue_description}
                                        onChange={(e) => updateFilter('issue_description', e.target.value)}
                                    />
                                </div>

                                {/* 4. Status */}
                                <div className="table-header__cell">
                                    <ColumnHeader
                                        label="Status"
                                        column="status"
                                    />

                                    <select
                                        value={filters.status}
                                        onChange={(e) => updateFilter('status', e.target.value)}
                                    >
                                        <option value="ALL">Wszystkie</option>
                                        <option value="Nowe">Nowe</option>
                                        <option value="W trakcie">W trakcie</option>
                                        <option value="Zakończone">Zakończone</option>
                                    </select>
                                </div>

                                {/* 5. Data zgłoszenia */}
                                <div className="table-header__cell table-header__cell--date">
                                    <ColumnHeader
                                        label="Data zgłoszenia"
                                        column="created_at"
                                    />

                                    <select
                                        value={dateFilterType}
                                        onChange={(e) => setDateFilterType(e.target.value)}
                                    >
                                        <option value="ALL">Wszystkie</option>
                                        <option value="FROM_TO">Od – do</option>
                                        <option value="OLDER">Starsze niż</option>
                                        <option value="NEWER">Nowsze niż</option>
                                    </select>

                                    {dateFilterType === 'FROM_TO' && (
                                        <>
                                            <label>Od:</label>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                            />

                                            <label>Do:</label>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                        </>
                                    )}

                                    {(dateFilterType === 'OLDER' ||
                                        dateFilterType === 'NEWER') && (
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    )}
                                </div>

                                {/* 6. ID użytkownika - tylko administrator */}
                                {isAdmin && (
                                    <div className="table-header__cell">
                                        <ColumnHeader
                                            label="ID użytkownika"
                                            column="user_id"
                                        />

                                        <input
                                            type="text"
                                            placeholder="Filtruj..."
                                            value={filters.user_id}
                                            onChange={(e) => updateFilter('user_id', e.target.value)}
                                        />
                                    </div>
                                )}

                            </div>

                            {/* Wiersze danych */}
                            <div className="table-body">

                                {paginatedReports.length > 0 ? (
                                    paginatedReports.map((report) => (

                                        <div className="table-row" key={report.id}>

                                            {/* 1. Numer zgłoszenia */}
                                            <div className="table-cell table-cell--id">
                                                <strong>#{report.id}</strong>
                                            </div>

                                            {/* 2. Urządzenie */}
                                            <div className="table-cell table-cell--device">
                                                <Wrench size={17} />
                                                <span title={report.device_name}>
                                                    {report.device_name}
                                                </span>
                                            </div>

                                            {/* 3. Opis usterki */}
                                            <div
                                                className="table-cell table-cell--description"
                                                title={report.issue_description}
                                            >
                                                {report.issue_description}
                                            </div>

                                            {/* 4. Status */}
                                            <div className="table-cell">
                                                {getStatusBadge(report.status)}
                                            </div>

                                            {/* 5. Data zgłoszenia */}
                                            <div className="table-cell table-cell--date">
                                                <Clock size={15} />
                                                <span>{formatDate(report.created_at)}</span>
                                            </div>

                                            {/* 6. ID użytkownika */}
                                            {isAdmin && (
                                                <div className="table-cell table-cell--user">
                                                    <UserIcon size={15} />
                                                    <span>{report.user_id}</span>
                                                </div>
                                            )}

                                        </div>
                                    ))
                                ) : (
                                    <div className="no-reports">
                                        <AlertCircle size={40} />
                                        <p>
                                            Brak zgłoszeń spełniających kryteria filtrowania.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* Paginacja */}
                    {filteredReports.length > 0 && (
                        <div className="pagination">

                            <div className="pagination__info">
                                Wyświetlanie {firstItem}-{lastItem} z {filteredReports.length} zgłoszeń
                            </div>

                            <div className="pagination__controls">

                                <button
                                    className="pagination__button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    <ChevronLeft size={17} />
                                    Poprzednia
                                </button>

                                <span className="pagination__current">
                                    Strona {currentPage} z {totalPages}
                                </span>

                                <button
                                    className="pagination__button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    Następna
                                    <ChevronRight size={17} />
                                </button>

                            </div>
                        </div>
                    )}

                </div>
            </section>
        </div>
    );
};
