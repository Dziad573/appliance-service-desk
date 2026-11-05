
import React, { useEffect, useRef, useState } from 'react';
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
    MessageCircle,
    Send,
    Reply,
    X
} from 'lucide-react';

import useStore from '../store/useStore';
import { getReportById } from '../services/reportsService';
import { getComments, addComment } from '../services/commentsService';
import { updateReportStatus, pauseReport, resumeReport, getReportStatusHistory } from '../services/reportStatusService';

import './ReportDetailsPage.scss';

export const ReportDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useStore();

    const isAdmin = user?.role === 'admin';

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState('');
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [sendingComment, setSendingComment] = useState(false);
    const [statusHistory, setStatusHistory] = useState([]);
    const [statusBusy, setStatusBusy] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [showPauseForm, setShowPauseForm] = useState(false);
    const [pauseReason, setPauseReason] = useState('');
    const [pauseNote, setPauseNote] = useState('');
    const commentsListRef = useRef(null);
    const commentRefs = useRef({});

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

    const backToList = () => {
        navigate(isAdmin ? '/reports' : '/user-reports');
    };

    // Pobieranie komentarzy dla aktualnie otwartej reklamacji
    useEffect(() => {
        if (!report?.id) return;

        let cancelled = false;
        const fetchComments = async () => {
            try {
                setCommentsLoading(true);
                setCommentsError('');
                const data = await getComments(report.id);
                if (!cancelled) setComments(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!cancelled) {
                    setCommentsError(err.response?.data?.error || 'Nie udało się pobrać komentarzy.');
                }
            } finally {
                if (!cancelled) setCommentsLoading(false);
            }
        };

        fetchComments();
        return () => { cancelled = true; };
    }, [report?.id]);

    const processStatuses = [
        'Nowe',
        'Przyjęte do realizacji',
        'Diagnoza',
        'W naprawie',
        'Testy / kontrola jakości',
        'Gotowe do odbioru / wysyłki'
    ];
    const terminalStatuses = ['Zakończona', 'Odrzucona', 'Anulowana'];
    const pauseReasons = ['Oczekiwanie na klienta', 'Oczekiwanie na części', 'Oczekiwanie na dostawcę', 'Problem techniczny', 'Inny powód'];

    const loadStatusHistory = async () => {
        if (!report?.id) return;
        try { setStatusHistory(await getReportStatusHistory(report.id)); }
        catch (err) { console.error('Nie udało się pobrać historii statusów:', err); }
    };

    useEffect(() => { loadStatusHistory(); }, [report?.id]);

    const handleStatusChange = async (nextStatus) => {
        if (!isAdmin || statusBusy) return;
        try {
            setStatusBusy(true); setStatusError('');
            const updated = await updateReportStatus(report.id, nextStatus, user?.id);
            setReport(updated);
            await loadStatusHistory();
        } catch (err) { setStatusError(err.response?.data?.message || 'Nie udało się zmienić statusu.'); }
        finally { setStatusBusy(false); }
    };

    const handlePause = async (event) => {
        event.preventDefault();
        if (!pauseReason || statusBusy) return;
        try {
            setStatusBusy(true); setStatusError('');
            const updated = await pauseReport(report.id, pauseReason, pauseNote, user?.id);
            setReport(updated); setShowPauseForm(false); setPauseReason(''); setPauseNote('');
            await loadStatusHistory();
        } catch (err) { setStatusError(err.response?.data?.message || 'Nie udało się wstrzymać reklamacji.'); }
        finally { setStatusBusy(false); }
    };

    const handleResume = async () => {
        try {
            setStatusBusy(true); setStatusError('');
            const updated = await resumeReport(report.id, user?.id);
            setReport(updated); await loadStatusHistory();
        } catch (err) { setStatusError(err.response?.data?.message || 'Nie udało się wznowić reklamacji.'); }
        finally { setStatusBusy(false); }
    };

    const currentStatusIndex = processStatuses.indexOf(report?.status);
    const isTerminal = terminalStatuses.includes(report?.status);
    const canCancel = report?.status === 'Nowe';
    const canReject = report?.status === 'Diagnoza';
    const isLastProcessStage = report?.status === 'Gotowe do odbioru / wysyłki';
    const nextProcessStatus = currentStatusIndex >= 0
        ? processStatuses[currentStatusIndex + 1]
        : null;

    // Po dodaniu komentarza przewiń listę do najnowszej wiadomości
    useEffect(() => {
        if (commentsListRef.current) {
            commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
    }, [comments]);

    const submitComment = async (event) => {
        event.preventDefault();
        const content = commentText.trim();
        if (!content || !user?.id || !report?.id || sendingComment) return;

        try {
            setSendingComment(true);
            setCommentsError('');
            const createdComment = await addComment(report.id, {
                user_id: user.id,
                content,
                parent_comment_id: replyTo?.id ?? null
            });
            setComments((current) => [...current, createdComment]);
            setCommentText('');
            setReplyTo(null);
        } catch (err) {
            setCommentsError(err.response?.data?.error || 'Nie udało się wysłać komentarza.');
        } finally {
            setSendingComment(false);
        }
    };

    const jumpToComment = (commentId) => {
        const element = commentRefs.current[commentId];
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('comment-item--highlight');
        window.setTimeout(() => element.classList.remove('comment-item--highlight'), 1800);
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


                        </div>

                        {/* Pasek postępu i sterowanie statusem */}
                        <section className="details-card report-progress-card">
                            <div className="report-progress-heading">
                                <div>
                                    <h2>Przebieg reklamacji</h2>
                                    <p>Etapy realizacji zgłoszenia</p>
                                </div>
                            </div>
                            <div className={`report-progress-track ${report.is_paused ? 'is-paused' : ''} ${isTerminal ? 'is-terminal' : ''}`} role="list" aria-label="Etapy reklamacji">
                                {processStatuses.map((step, index) => {
                                    const done = currentStatusIndex >= 0 && index < currentStatusIndex;
                                    const active = index === currentStatusIndex;
                                    const completed = isTerminal && report.status === 'Zakończona' || done;
                                    return (
                                        <div key={step} role="listitem" className={`report-progress-segment ${completed ? 'is-done' : ''} ${active ? 'is-active' : ''} ${report.is_paused && active ? 'is-paused' : ''}`}>
                                            <span className="report-progress-segment__text">{completed ? '✓' : step}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {isTerminal && <div className={`report-terminal-result report-terminal-result--${report.status === 'Zakończona' ? 'success' : report.status === 'Odrzucona' ? 'rejected' : 'cancelled'}`}>{report.status === 'Zakończona' ? 'Reklamacja zakończona' : report.status === 'Odrzucona' ? 'Reklamacja odrzucona' : 'Reklamacja anulowana'}</div>}
                            {report.is_paused && <div className="report-paused-info"><strong>Reklamacja wstrzymana — {report.pause_reason}</strong>{report.pause_note && <p>{report.pause_note}</p>}<small>Wstrzymano: {formatDate(report.paused_at)}</small></div>}
                            {isAdmin && !isTerminal && <div className="report-progress-actions">
                                {!report.is_paused ? <>
                                    <button type="button" className="report-action-button report-action-button--primary" disabled={statusBusy || !nextProcessStatus && !isLastProcessStage} onClick={() => handleStatusChange(isLastProcessStage ? 'Zakończona' : nextProcessStatus)}>
                                        {isLastProcessStage ? 'Zakończ reklamację' : '✓  Oznacz etap jako zakończony'}
                                    </button>
                                    <button type="button" className="report-action-button" disabled={statusBusy} onClick={() => setShowPauseForm(v => !v)}>Wstrzymaj reklamację</button>
                                    {canCancel && <button type="button" className="report-action-button report-action-button--subtle" disabled={statusBusy} onClick={() => handleStatusChange('Anulowana')}>Anuluj reklamację</button>}
                                    {canReject && <div className="report-terminal-actions">
                                        <button type="button" className="report-action-button report-action-button--subtle" disabled={statusBusy} onClick={() => handleStatusChange('Odrzucona')}>Odrzuć reklamację</button>
                                        <button type="button" className="report-action-button report-action-button--subtle" disabled={statusBusy} onClick={() => handleStatusChange('Zakończona')}>Zakończ bez naprawy</button>
                                    </div>}
                                </> : <button type="button" className="report-action-button report-action-button--primary" disabled={statusBusy} onClick={handleResume}>Wznów reklamację</button>}
                            </div>}
                            {showPauseForm && <form className="report-pause-form" onSubmit={handlePause}>
                                <label>Powód wstrzymania<select value={pauseReason} onChange={e => setPauseReason(e.target.value)} required><option value="">Wybierz powód...</option>{pauseReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}</select></label>
                                <label>Dodatkowe informacje<textarea value={pauseNote} onChange={e => setPauseNote(e.target.value)} rows={2} placeholder="Opcjonalny opis..." /></label>
                                <button type="submit" className="report-action-button report-action-button--primary" disabled={statusBusy || !pauseReason}>Potwierdź wstrzymanie</button>
                            </form>}
                            {statusError && <p className="report-status-error">{statusError}</p>}
                            <div className="report-status-history"><strong>Historia statusów</strong>{statusHistory.length === 0 ? <p>Brak zapisanych zmian.</p> : statusHistory.map(item => <div className="report-status-history__item" key={item.id}><span>{formatDate(item.created_at)} · {item.changedBy?.login || (item.changed_by ? `Użytkownik #${item.changed_by}` : 'System')}</span><strong>{item.action === 'pause' ? `Wstrzymano: ${item.reason}` : item.action === 'resume' ? 'Wznowiono reklamację' : `${item.old_status || '—'} → ${item.new_status}`}</strong>{item.note && <small>{item.note}</small>}</div>)}</div>
                        </section>

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

                                {/* Komunikator komentarzy */}
                                <section className="details-card comments-card">
                                    <div className="details-card__header">
                                        <div className="details-card__icon">
                                            <MessageCircle size={19} />
                                        </div>
                                        <div>
                                            <h2>Komentarze</h2>
                                            <p>Rozmowa dotycząca reklamacji</p>
                                        </div>
                                        <span className="comments-count">{comments.length}</span>
                                    </div>

                                    <div className="comments-list" ref={commentsListRef}>
                                        {commentsLoading ? (
                                            <p className="comments-empty">Ładowanie komentarzy...</p>
                                        ) : comments.length === 0 ? (
                                            <p className="comments-empty">Brak komentarzy. Rozpocznij rozmowę.</p>
                                        ) : comments.map((comment) => (
                                            <article
                                                key={comment.id}
                                                ref={(node) => { commentRefs.current[comment.id] = node; }}
                                                className={`comment-item ${String(comment.user_id) === String(user?.id) ? 'comment-item--own' : ''}`}
                                            >
                                                <div className="comment-meta">
                                                    <strong>{comment.author?.login || `Użytkownik #${comment.user_id}`}</strong>
                                                    <span>{formatDate(comment.created_at)}</span>
                                                </div>

                                                {comment.parent && (
                                                    <button
                                                        type="button"
                                                        className="comment-parent-link"
                                                        onClick={() => jumpToComment(comment.parent.id)}
                                                    >
                                                        <Reply size={13} />
                                                        Odpowiedź na komentarz #{comment.parent.id}: {comment.parent.content}
                                                    </button>
                                                )}

                                                <div className="comment-bubble">{comment.content}</div>
                                                <button
                                                    type="button"
                                                    className="comment-reply-button"
                                                    onClick={() => setReplyTo(comment)}
                                                    title="Odpowiedz na komentarz"
                                                >
                                                    <Reply size={14} /> Odpowiedz
                                                </button>
                                            </article>
                                        ))}
                                    </div>

                                    {commentsError && <p className="comments-error">{commentsError}</p>}

                                    {replyTo && (
                                        <div className="comment-replying">
                                            <span>Odpowiadasz na komentarz #{replyTo.id} ({replyTo.author?.login || `użytkownik #${replyTo.user_id}`})</span>
                                            <button type="button" onClick={() => setReplyTo(null)} aria-label="Anuluj odpowiedź">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <form className="comment-composer" onSubmit={submitComment}>
                                        <textarea
                                            value={commentText}
                                            onChange={(event) => setCommentText(event.target.value)}
                                            placeholder="Napisz komentarz..."
                                            rows={2}
                                            maxLength={5000}
                                        />
                                        <button type="submit" disabled={!commentText.trim() || sendingComment} aria-label="Wyślij komentarz">
                                            <Send size={17} />
                                        </button>
                                    </form>
                                </section>

                            </aside>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
