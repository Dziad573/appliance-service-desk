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
    X,
    Package,
    Plus,
    RotateCcw,
    DollarSign,
    Check
} from 'lucide-react';

import useStore from '../store/useStore';
import { getReportById, updateServiceNote, saveQualityResult, getReportPricing, saveReportPricing, sendReportPricing, decideReportPricing } from '../services/reportsService';
import { getComments, addComment } from '../services/commentsService';
import { updateReportStatus, pauseReport, resumeReport, getReportStatusHistory } from '../services/reportStatusService';
import { getReportParts, issueReportPart, returnReportPart, getItems, getResources, getWarehouses } from '../services/inventoryService';
import ContactModal from '../components/ContactModal/ContactModal';
import emailjs from '@emailjs/browser';

import './ReportDetailsPage.scss';

// Wycena jest częścią przebiegu reklamacji i jest zapisywana w bazie danych.
const RepairCostSection = ({ report, isAdmin, user, onSaved, onDecision, stockItems, stockResources }) => {
    const [parts, setParts] = useState(report.pricingParts || []);
    const [labor, setLabor] = useState(Number(report.labor_cost || 0));
    const [modal, setModal] = useState(false);
    const [itemId, setItemId] = useState('');
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [issueType, setIssueType] = useState('non_warranty');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const editable = isAdmin && ['Diagnoza', 'W naprawie'].includes(report.status) && !report.is_paused;
    const total = parts.reduce((sum, p) => sum + (p.charge_customer === false ? 0 : Number(p.unit_price) * Number(p.quantity)), 0) + Number(labor || 0);
    const normalizePricingParts = rows => (rows || []).map(p => ({ item_id: p.item_id ?? null, item_name: p.item_name, part_number: p.part_number || null, quantity: Number(p.quantity), unit_price: Number(p.unit_price), charge_customer: p.charge_customer !== false }));
    const hasPricing = parts.length > 0 || Number(labor) > 0;
    const pricingDirty = Number(labor) !== Number(report.labor_cost || 0) || JSON.stringify(normalizePricingParts(parts)) !== JSON.stringify(normalizePricingParts(report.pricingParts || []));
    const selected = stockItems.find(i => String(i.id) === String(itemId));
    const stock = stockResources.filter(r => String(r.item_id) === String(itemId)).reduce((n, r) => n + Number(r.quantity || 0), 0);
    useEffect(() => { setParts(report.pricingParts || []); setLabor(Number(report.labor_cost || 0)); }, [report.pricingParts, report.labor_cost]);
    const addPart = () => {
        if (!selected) return;
        setParts(v => [...v, { item_id: selected.id, item_name: selected.item_name, part_number: selected.part_number || '', quantity: Number(quantity), unit_price: Number(price), charge_customer: issueType === 'non_warranty' }]);
        setItemId(''); setQuantity(1); setPrice(0); setIssueType('non_warranty');
    };
    const save = async () => {
        setBusy(true); setError(''); setNotice('');
        try {
            const result = await saveReportPricing(report.id, { user_id: user.id, pricing_required: parts.length > 0 || Number(labor || 0) > 0, labor_cost: Number(labor || 0), parts });
            onSaved(result); setModal(false); setNotice('Wycena została zapisana. Nie została jeszcze wysłana klientowi.');
        } catch (e) { setError(e.response?.data?.message || 'Nie udało się zapisać wyceny.'); }
        finally { setBusy(false); }
    };
const send = async () => {
    if (!window.confirm('Wysłać wycenę klientowi i wstrzymać reklamację do czasu odpowiedzi?')) return;
    
    setBusy(true); 
    setError('');
    setNotice('');

    try {
        const updated = await sendReportPricing(report.id, user.id);

        const clientEmail = report.customer_email?.trim();
        if (clientEmail) {
            const formattedParts = parts.length > 0 
                ? parts.map(p => `• ${p.item_name} (PN: ${p.part_number || '—'}) - ${p.quantity} szt. x ${Number(p.unit_price).toFixed(2)} zł = ${(Number(p.unit_price) * Number(p.quantity)).toFixed(2)} zł`).join('\n')
                : 'Brak części (tylko robocizna/usługa)';

            const laborCost = Number(labor || 0).toFixed(2);
            const totalCost = total.toFixed(2);

            const pricingDetailsMessage = `Zatwierdzona wycena naprawy:\n\n${formattedParts}\n\nRobocizna: ${laborCost} zł\n-----------------------------------\nŁĄCZNY KOSZT: ${totalCost} zł`;

            const templateParams = {
                report_id: report.id,
                title: report.device_name || 'Ogólne zgłoszenie',
                user_name: 'Serwis USWB',
                user_email: 'uswb.app@gmail.com',
                display_email: 'uswb.app@gmail.com',
                user_subject: `Wycena naprawy dla zgłoszenia #${report.id}`,
                user_message: pricingDetailsMessage,
                email: 'uswb.app@gmail.com',
                to_email: clientEmail,
                header_title: `Wycena naprawy dla zgłoszenia #${report.id}`,
                intro_text: `Otrzymano oficjalną wycenę od serwisu Serwis USWB. Prosimy o zapoznanie się z kosztorysem w panelu klienta.`,
                sender_title: 'Nadawca',
                message_label: 'Szczegóły wyceny (Kosztorys):'
            };

            const SERVICE_ID = 'service_hw91cww';
            const TEMPLATE_ID = 'template_g0uaba6';
            const PUBLIC_KEY = '5YR5D_s2RYZLSEGRs';

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        }

        onSaved({ report: updated, parts }); 
        setNotice('Wycena wysłana. Reklamacja oczekuje na odpowiedź klienta.');
    } catch (e) {
        console.error('Błąd wysyłania wyceny:', e);
        setError(e.response?.data?.message || 'Nie udało się wysłać wyceny.');
    } finally {
        setBusy(false);
    }
};
    const decision = async accepted => {
        setBusy(true); setError('');
        try { onDecision(await decideReportPricing(report.id, user.id, accepted)); }
        catch (e) { setError(e.response?.data?.message || 'Nie udało się zapisać decyzji.'); }
        finally { setBusy(false); }
    };
    return <section className="details-card pricing-card">
        <div className="details-card__header"><div className="details-card__icon"><DollarSign size={19}/></div><div><h2>Wycena naprawy</h2><p>Rozliczenie części i robocizny</p></div></div>
        {isAdmin ? <>
            {hasPricing ? <div className="admin-pricing__parts-list">
                <div className="pricing-detail-rows">{parts.map((p,i)=><div className="repair-part-row pricing-detail-row" key={p.id || i}><div className="repair-part-row__main"><strong>{p.item_name}</strong><span>PN: {p.part_number || '—'} · {p.quantity} szt. ·  {p.charge_customer === false ? 'Gwarancyjna / bezpłatna' : 'Pozagwarancyjna / płatna'} · {p.charge_customer === false ? '0,00 zł' : `${Number(p.unit_price).toFixed(2)} zł/szt. · Razem: ${(Number(p.unit_price)*Number(p.quantity)).toFixed(2)} zł`}</span></div>{editable && <button type="button" className="report-action-button report-action-button--subtle" onClick={()=>setParts(v=>v.filter((_,idx)=>idx!==i))} title="Usuń"><X size={14}/></button>}</div>)}</div>
                {Number(labor || 0) > 0 && <div className="admin-pricing__labor"><label>Robocizna</label><strong>{Number(labor || 0).toFixed(2)} zł</strong></div>}
                <div className="admin-pricing__summary">Kwota wyceny: <strong>{total.toFixed(2)} zł</strong></div>
            </div> : <p className="repair-parts-empty">Nie dodano jeszcze wyceny.</p>}
            {report.pricing_sent_at && <p className="service-note-message">Wycena wysłana klientowi. {report.price_accepted === true ? 'Zaakceptowana.' : report.price_accepted === false ? 'Odrzucona.' : 'Oczekuje na odpowiedź.'}</p>}
            {editable && <div className="repair-modal__actions"><button className="report-action-button report-action-button--primary" type="button" onClick={()=>setModal(true)}>{hasPricing ? 'Edytuj wycenę' : 'Dodaj wycenę'}</button>{hasPricing && <button className="report-action-button" type="button" disabled={busy || pricingDirty || (!report.pricing_sent_at && !hasPricing)} onClick={send}>Wyślij wycenę klientowi</button>}</div>}
        </> : <>
            {report.pricing_required && hasPricing ? <>
                <div className="admin-pricing__parts-list"><h4>Wycena serwisu</h4><div className="pricing-detail-rows">{parts.map((p,i)=><div className="repair-part-row pricing-detail-row" key={p.id || i}><div className="repair-part-row__main"><strong>{p.item_name}</strong><span>PN: {p.part_number || '—'} · Ilość: {p.quantity} szt. · {p.charge_customer === false ? 'Bezpłatna' : `${Number(p.unit_price).toFixed(2)} zł/szt. · Razem: ${(Number(p.unit_price)*Number(p.quantity)).toFixed(2)} zł`}</span></div></div>)}</div></div>
                <div className="admin-pricing__summary">Kwota wyceny: <strong>{Number(report.total_cost || total).toFixed(2)} zł</strong></div>
                {report.pricing_sent_at && report.price_accepted === null && <div className="user-pricing__actions"><p><strong>Wymagana decyzja</strong><span>Zaakceptuj lub odrzuć wycenę, aby serwis mógł kontynuować.</span></p><div className="user-pricing__buttons"><button type="button" className="report-action-button report-action-button--primary" disabled={busy} onClick={()=>decision(true)}><Check size={16}/> Akceptuję wycenę</button><button type="button" className="report-action-button report-action-button--danger" disabled={busy} onClick={()=>decision(false)}><X size={16}/> Odrzucam wycenę</button></div></div>}
                {report.price_accepted === true && <p className="pricing-status-notice success">Wycena została zaakceptowana.</p>}
                {report.price_accepted === false && <p className="pricing-status-notice error">Wycena została odrzucona. Reklamacja zamknięta.</p>}
            </> : <p>Wycena nie została jeszcze przygotowana.</p>}
        </>}
        {notice && <p className="service-note-message">{notice}</p>}{error && <p className="service-note-message service-note-message--error">{error}</p>}
        {modal && <div className="repair-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><form className="repair-modal repair-pricing-modal" onSubmit={e=>{e.preventDefault();save();}}>
            <div className="repair-modal__header"><div><h2>Wycena naprawy</h2><p>Wartości są zapisywane w bazie. Wysłanie klientowi to osobna czynność.</p></div><button type="button" onClick={()=>setModal(false)}><X size={20}/></button></div>
            <div className="pricing-modal-layout"><div className="pricing-modal-form">
            <label>Część<select value={itemId} onChange={e=>{setItemId(e.target.value);const it=stockItems.find(a=>String(a.id)===e.target.value);setPrice(Number(it?.sale_price || 0));}}><option value="">Wybierz z katalogu</option>{stockItems.filter(i=>(!report.manufacturer || i.brand?.brand_name?.toLowerCase()===report.manufacturer.toLowerCase())).map(i=><option key={i.id} value={i.id}>{i.brand?.brand_name} — {i.item_name} ({i.part_number || 'bez PN'})</option>)}</select></label>
            {selected && <p className="text-muted">PN: {selected.part_number || '—'} · Stan magazynowy: {stock} szt.</p>}
            <div className="repair-modal__form-row"><label>Ilość<input type="number" min="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>Cena jednostkowa (zł)<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label></div>
            <label>Rodzaj pobrania / rozliczenia<select value={issueType} onChange={e=>setIssueType(e.target.value)}><option value="warranty">Gwarancyjna — bezpłatna dla klienta</option><option value="non_warranty">Pozagwarancyjna — płatna</option></select></label>
            <button type="button" className="report-action-button" disabled={!selected} onClick={addPart}><Plus size={15}/> Dodaj pozycję</button>
            <label>Robocizna (zł)<input type="number" min="0" step="0.01" value={labor} onChange={e=>setLabor(e.target.value)}/></label>
            </div><aside className="pricing-modal-list"><h3>Pozycje wyceny</h3>{parts.length ? parts.map((p,i)=><div className="repair-part-row" key={p.id || i}><div className="repair-part-row__main"><strong>{p.item_name}</strong><span>PN: {p.part_number || '—'} · {p.quantity} szt. · {p.charge_customer === false ? 'Bezpłatna' : `${p.unit_price} zł/szt.`}</span></div><button type="button" className="report-action-button report-action-button--subtle" onClick={()=>setParts(v=>v.filter((_,idx)=>idx!==i))}><X size={15}/></button></div>) : <p className="text-muted">Brak dodanych pozycji.</p>}<div className="admin-pricing__summary">Kwota wyceny: <strong>{total.toFixed(2)} zł</strong></div></aside></div>
            {error && <p className="service-note-message service-note-message--error">{error}</p>}
            <div className="repair-modal__actions"><button type="button" className="report-action-button" onClick={()=>setModal(false)}>Anuluj</button><button type="submit" className="report-action-button report-action-button--primary" disabled={busy}>{busy?'Zapisywanie...':'Zapisz wycenę'}</button></div>
        </form></div>}
    </section>;
};

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
    const [diagnosisDraft, setDiagnosisDraft] = useState('');
    const [repairResultDraft, setRepairResultDraft] = useState('');
    const [serviceNoteBusy, setServiceNoteBusy] = useState(false);
    const [serviceNoteError, setServiceNoteError] = useState('');
    const [serviceNoteSuccess, setServiceNoteSuccess] = useState('');
    const [reportParts, setReportParts] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [stockResources, setStockResources] = useState([]);
    const [stockWarehouses, setStockWarehouses] = useState([]);
    const [repairCodeDraft, setRepairCodeDraft] = useState('success');
    const [addBrokenStock, setAddBrokenStock] = useState(false);
    const [brokenWarehouseId, setBrokenWarehouseId] = useState('');
    const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
    const [showRepairResultModal, setShowRepairResultModal] = useState(false);
    const [showPartModal, setShowPartModal] = useState(false);
    const [partForm, setPartForm] = useState({ item_id: '', warehouse_id: '', quantity: 1, issue_type: 'warranty' });
    const [partsBusy, setPartsBusy] = useState(false);
    const [partsError, setPartsError] = useState('');
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

                const pricing = await getReportPricing(id);
                data.pricingParts = pricing.parts || [];
                data.price_accepted = data.price_accepted === undefined ? null : data.price_accepted;
                setReport(data);
                setDiagnosisDraft(data.diagnosis_description || '');
                setRepairResultDraft(data.repair_result || '');

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
        if (!isAdmin || !report?.id) return;

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
    }, [report?.id, isAdmin]);

    const processStatuses = [
        'Nowe',
        'Przyjęte do realizacji',
        'Diagnoza',
        'W naprawie',
        'Testy QA',
        'Gotowe do wysyłki'
    ];
    const terminalStatuses = ['Zakończona', 'Zakończona niepowodzeniem', 'Odrzucona', 'Anulowana'];
    const pauseReasons = ['Oczekiwanie na klienta', 'Oczekiwanie na części', 'Oczekiwanie na dostawcę', 'Problem techniczny', 'Inny powód'];

    const loadStatusHistory = async () => {
        if (!report?.id) return;
        try { setStatusHistory(await getReportStatusHistory(report.id)); }
        catch (err) { console.error('Nie udało się pobrać historii statusów:', err); }
    };

    useEffect(() => { loadStatusHistory(); }, [report?.id]);

    const loadReportParts = async () => {
        if (!report?.id) return;
        try {
            // Lista wykorzystanych części jest widoczna również dla klienta.
            // Dane katalogu i magazynu są potrzebne wyłącznie administratorowi do pobierania kolejnych części.
            const parts = await getReportParts(report.id);
            setReportParts(Array.isArray(parts) ? parts : []);

            if (isAdmin) {
                const [items, resources, warehouses] = await Promise.all([
                    getItems(true), getResources(), getWarehouses()
                ]);
                setStockItems((items || []).filter(item => item.item_type === 'component' && item.is_active));
                setStockResources((resources || []).filter(resource => resource.quantity > 0 && resource.warehouse?.warehouse_type !== 'broken'));
                setStockWarehouses(warehouses || []);
            }
        } catch (err) {
            setPartsError(err.response?.data?.message || 'Nie udało się pobrać listy wykorzystanych części.');
        }
    };
    useEffect(() => { loadReportParts(); }, [report?.id, isAdmin]);

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

    const saveServiceNote = async (field) => {
        if (!isAdmin || !report?.id || serviceNoteBusy) return;
        const value = field === 'diagnosis_description' ? diagnosisDraft : repairResultDraft;
        try {
            setServiceNoteBusy(true);
            setServiceNoteError('');
            setServiceNoteSuccess('');
            const updated = await updateServiceNote(report.id, field, value, user?.id);
            setReport(updated);
            setDiagnosisDraft(updated.diagnosis_description || '');
            setRepairResultDraft(updated.repair_result || '');
            setServiceNoteSuccess('Zapisano zmiany.');
            return true;
        } catch (err) {
            setServiceNoteError(err.response?.data?.message || 'Nie udało się zapisać danych serwisowych.');
            return false;
        } finally {
            setServiceNoteBusy(false);
        }
    };

    const submitPartIssue = async (event) => {
        event.preventDefault();
        if (!report?.id || !user?.id || partsBusy) return;
        try {
            setPartsBusy(true); setPartsError('');
            await issueReportPart(report.id, { ...partForm, item_id: Number(partForm.item_id), warehouse_id: Number(partForm.warehouse_id), quantity: Number(partForm.quantity), issued_by: user.id });
            setPartForm({ item_id: '', warehouse_id: '', quantity: 1, issue_type: 'warranty' });
            setShowPartModal(false);
            await loadReportParts();
        } catch (err) { setPartsError(err.response?.data?.message || 'Nie udało się pobrać części.'); }
        finally { setPartsBusy(false); }
    };

    const handlePartReturn = async (partId) => {
        if (!window.confirm('Czy na pewno zwrócić tę część do magazynu?')) return;
        try {
            setPartsBusy(true); setPartsError('');
            await returnReportPart(report.id, partId, user?.id);
            await loadReportParts();
        } catch (err) { setPartsError(err.response?.data?.message || 'Nie udało się zwrócić części.'); }
        finally { setPartsBusy(false); }
    };

    const handlePricingSaved = (result) => {
        const updated = result.report || result;
        setReport(prev => ({ ...prev, ...updated, pricingParts: result.parts || prev.pricingParts || [] }));
    };
    const handleAcceptPrice = (updated) => setReport(prev => ({ ...prev, ...updated }));

    const selectedPartResources = stockResources.filter(resource => String(resource.item_id) === String(partForm.item_id));

    const currentStatusIndex = processStatuses.indexOf(report?.status);
    const isTerminal = terminalStatuses.includes(report?.status);
    const canCancel = report?.status === 'Nowe';
    const canReject = report?.status === 'Diagnoza';
    const isLastProcessStage = report?.status === 'Gotowe do wysyłki';
    const nextProcessStatus = currentStatusIndex >= 0
        ? processStatuses[currentStatusIndex + 1]
        : null;
    const canEditDiagnosis = isAdmin && ['Diagnoza', 'W naprawie'].includes(report?.status);
    const canEditRepairResult = isAdmin && report?.status === 'Testy QA';
    const reachedQualityControl = currentStatusIndex >= 4 || statusHistory.some(item => item.new_status === 'Testy QA' || item.old_status === 'Testy QA' || item.new_status === 'Gotowe do wysyłki' || item.old_status === 'Gotowe do wysyłki');
    const showRepairResult = reachedQualityControl || Boolean(report?.repair_result);

    const complaintType = report?.complaint_type?.toLowerCase() || '';
    const isWarrantyOrComplaint = complaintType === 'gwarancyjna' || complaintType === 'reklamacja' || complaintType === 'gwarancja';
    const hasPricingPartsOrLabor = report && (Number(report.labor_cost) > 0 || (report.parts && report.parts.length > 0));

    // Po dodaniu komentarza przewiń listę do najnowszej wiadomości
    useEffect(() => {
        if (commentsListRef.current) {
            commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
    }, [comments]);

    const submitComment = async (event) => {
        event.preventDefault();
        const content = commentText.trim();
        if (!isAdmin || !content || !user?.id || !report?.id || sendingComment) return;

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

                                <h1 className="report-details-name">{report.device_name} <ContactModal reportId={report.id} title={report.device_name} /></h1>


                                <p>
                                    Szczegóły zgłoszenia reklamacyjnego
                                </p>
                            </div>


                        </div>

                        {!isAdmin && report.pricing_required && report.pricing_sent_at && report.price_accepted === null && (
                            <div className="pricing-status-notice pricing-status-notice--pending">
                                <Clock size={18} /> {isAdmin ? 'Wycena została wysłana. Oczekiwanie na decyzję klienta.' : 'Wymagana akcja: serwis przesłał wycenę. Otwórz sekcję wyceny i zaakceptuj ją lub odrzuć.'}
                            </div>
                        )}
                        {report.pricing_required && report.price_accepted === true && (
                            <div className="pricing-status-notice success" style={{ marginBottom: '16px' }}><Check size={18} /> Wycena została zaakceptowana.</div>
                        )}
                        {report.pricing_required && report.price_accepted === false && (
                            <div className="pricing-status-notice error" style={{ marginBottom: '16px' }}><X size={18} /> Wycena została odrzucona.</div>
                        )}

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
                            {isTerminal && <div className={`report-terminal-result report-terminal-result--${report.status === 'Zakończona' ? 'success' : report.status === 'Zakończona niepowodzeniem' || report.status === 'Odrzucona' ? 'rejected' : 'cancelled'}`}>{report.status === 'Zakończona' ? 'Reklamacja zakończona' : report.status === 'Zakończona niepowodzeniem' ? 'Reklamacja zakończona niepowodzeniem' : report.status === 'Odrzucona' ? 'Reklamacja odrzucona' : 'Reklamacja anulowana'}</div>}
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

                        </section>

                        {/* Panel diagnozy i pobranych części */}
                        {isAdmin && ['Diagnoza', 'W naprawie'].includes(report.status) && (
                            <section className="details-card repair-workspace">
                                <div className="details-card__header"><div className="details-card__icon"><Wrench size={19} /></div><div><h2>Przebieg reklamacji</h2><p>Diagnoza, części, wycena i realizacja naprawy</p></div></div>
                                <div className="repair-workspace__grid">
                                    <div className="repair-workspace__diagnosis">
                                        <div className="repair-workspace__panel-heading"><h3>Opis diagnozy</h3><button type="button" className="report-action-button report-action-button--primary" onClick={() => setShowDiagnosisModal(true)}>Edytuj opis</button></div>
                                        <div className="report-description repair-workspace__description">{report.diagnosis_description || 'Diagnoza nie została jeszcze uzupełniona.'}</div>
                                    </div>
                                    <div className="repair-workspace__parts">
                                        <div className="repair-workspace__panel-heading"><h3><Package size={17} /> Pobrane części</h3><button type="button" className="report-action-button report-action-button--primary" onClick={() => { setPartsError(''); setShowPartModal(true); }}><Plus size={15} /> Pobierz części</button></div>
                                        {reportParts.length === 0 ? <p className="repair-parts-empty">Nie pobrano jeszcze żadnych części do tej reklamacji.</p> : <div className="repair-parts-list">{reportParts.map(part => <div className={`repair-part-row ${part.returned_at ? 'repair-part-row--returned' : ''}`} key={part.id}><div className="repair-part-row__main"><strong>{part.item?.brand?.brand_name} — {part.item?.item_name}</strong><span>{part.item?.part_number || part.item?.model_number || '—'} · {part.warehouse?.warehouse_name} · pobrano {new Date(part.created_at).toLocaleDateString('pl-PL')}</span></div><strong className="repair-part-row__quantity">{part.quantity} szt.</strong><span className={`repair-part-type repair-part-type--${part.issue_type}`}>{part.issue_type === 'warranty' ? 'Gwarancyjna' : 'Pozagwarancyjna'}</span>{part.returned_at ? <span className="report-part-returned">Zwrócona · {new Date(part.returned_at).toLocaleDateString('pl-PL')}</span> : <button type="button" className="report-action-button report-action-button--subtle" disabled={partsBusy} onClick={() => handlePartReturn(part.id)} title="Zwróć do magazynu"><RotateCcw size={14} /> Zwróć</button>}</div>)}</div>}
                                        {partsError && <p className="service-note-message service-note-message--error">{partsError}</p>}
                                    </div>
                                    <RepairCostSection report={report} isAdmin={true} user={user} onSaved={handlePricingSaved} onDecision={handleAcceptPrice} stockItems={stockItems} stockResources={stockResources} />
                                </div>
                            </section>
                        )}


                        {isAdmin && canEditRepairResult && (
                            <section className="details-card repair-result-editor">
                                <div className="repair-workspace__panel-heading"><div><h3>Rezultat naprawy</h3><p>Uzupełnij wynik po wykonaniu naprawy</p></div><button type="button" className="report-action-button report-action-button--primary" onClick={() => { setRepairCodeDraft(report.repair_code || 'success'); setAddBrokenStock(false); setBrokenWarehouseId(''); setShowRepairResultModal(true); }}>Edytuj rezultat</button></div>
                                <div className="report-description">{report.repair_result || 'Rezultat naprawy nie został jeszcze uzupełniony.'}</div>
                            </section>
                        )}

                        {showRepairResultModal && (
                            <div className="repair-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowRepairResultModal(false); }}>
                                <form className="repair-modal" onSubmit={async e => { e.preventDefault(); if (serviceNoteBusy) return; try { setServiceNoteBusy(true); setServiceNoteError(''); const updated = await saveQualityResult(report.id, { user_id: user?.id, repair_result: repairResultDraft, repair_code: repairCodeDraft, add_to_broken: addBrokenStock, broken_warehouse_id: brokenWarehouseId || null }); setReport(updated); setShowRepairResultModal(false); await loadStatusHistory(); } catch (err) { setServiceNoteError(err.response?.data?.message || 'Nie udało się zapisać wyniku QA.'); } finally { setServiceNoteBusy(false); } }}>
                                    <div className="repair-modal__header"><div><h2>Rezultat naprawy</h2><p>Opisz wykonane czynności i wynik naprawy</p></div><button type="button" onClick={() => setShowRepairResultModal(false)}><X size={20} /></button></div>
                                    <label className="quality-result-code">Kod naprawy<select value={repairCodeDraft} onChange={e => setRepairCodeDraft(e.target.value)}><option value="success">Naprawa zakończona powodzeniem</option><option value="failure">Naprawa zakończona niepowodzeniem</option></select></label>
                                    <textarea rows={6} value={repairResultDraft} onChange={e => setRepairResultDraft(e.target.value)} placeholder="Opisz wykonane czynności i rezultat naprawy..." />
                                    {repairCodeDraft === 'failure' && report.item_id && <div className="quality-broken-option"><label><input type="checkbox" checked={addBrokenStock} onChange={e => setAddBrokenStock(e.target.checked)} /> Dodaj urządzenie do magazynu uszkodzonych</label>{addBrokenStock && <select required value={brokenWarehouseId} onChange={e => setBrokenWarehouseId(e.target.value)}><option value="">Wybierz magazyn uszkodzonych</option>{stockWarehouses.filter(w => w.warehouse_type === 'broken').map(w => <option key={w.id} value={w.id}>{w.warehouse_name}</option>)}</select>}</div>}
                                    {serviceNoteError && <p className="service-note-message service-note-message--error">{serviceNoteError}</p>}
                                    <div className="repair-modal__actions"><button type="button" className="report-action-button" onClick={() => setShowRepairResultModal(false)}>Anuluj</button><button type="submit" className="report-action-button report-action-button--primary" disabled={serviceNoteBusy}>{serviceNoteBusy ? 'Zapisywanie...' : 'Zapisz rezultat'}</button></div>
                                </form>
                            </div>
                        )}

                        {showDiagnosisModal && (
                            <div className="repair-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowDiagnosisModal(false); }}>
                                <form className="repair-modal" onSubmit={async e => { e.preventDefault(); const saved = await saveServiceNote('diagnosis_description'); if (saved) setShowDiagnosisModal(false); }}>
                                    <div className="repair-modal__header"><div><h2>Opis diagnozy</h2><p>Uzupełnij ustalenia technika</p></div><button type="button" onClick={() => setShowDiagnosisModal(false)}><X size={20} /></button></div>
                                    <textarea rows={7} value={diagnosisDraft} onChange={e => setDiagnosisDraft(e.target.value)} placeholder="Opisz przeprowadzoną diagnozę, wykryte przyczyny i ustalenia technika..." />
                                    {serviceNoteError && <p className="service-note-message service-note-message--error">{serviceNoteError}</p>}
                                    <div className="repair-modal__actions"><button type="button" className="report-action-button" onClick={() => setShowDiagnosisModal(false)}>Anuluj</button><button type="submit" className="report-action-button report-action-button--primary" disabled={serviceNoteBusy}>{serviceNoteBusy ? 'Zapisywanie...' : 'Zapisz opis'}</button></div>
                                </form>
                            </div>
                        )}

                        {showPartModal && (
                            <div className="repair-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowPartModal(false); }}>
                                <form className="repair-modal" onSubmit={submitPartIssue}>
                                    <div className="repair-modal__header"><div><h2>Pobierz część z magazynu</h2><p>Wybierz część i określ sposób rozliczenia</p></div><button type="button" onClick={() => setShowPartModal(false)}><X size={20} /></button></div>
                                    <label>Część<select required value={partForm.item_id} onChange={e => setPartForm(v => ({ ...v, item_id: e.target.value, warehouse_id: '' }))}><option value="">Wybierz część</option>{stockItems.filter(item => stockResources.some(resource => String(resource.item_id) === String(item.id))).map(item => <option key={item.id} value={item.id}>{item.brand?.brand_name} — {item.item_name} {item.part_number ? `(${item.part_number})` : ''}</option>)}</select></label>
                                    <label>Magazyn<select required value={partForm.warehouse_id} disabled={!partForm.item_id} onChange={e => setPartForm(v => ({ ...v, warehouse_id: e.target.value }))}><option value="">Wybierz magazyn</option>{selectedPartResources.map(resource => <option key={resource.warehouse_id} value={resource.warehouse_id}>{resource.warehouse?.warehouse_name} — dostępne: {resource.quantity}</option>)}</select></label>
                                    <div className="repair-modal__form-row"><label>Ilość<input type="number" min="1" step="1" required value={partForm.quantity} max={selectedPartResources.find(r => String(r.warehouse_id) === String(partForm.warehouse_id))?.quantity || undefined} onChange={e => setPartForm(v => ({ ...v, quantity: e.target.value }))} /></label><label>Rodzaj pobrania<select value={partForm.issue_type} onChange={e => setPartForm(v => ({ ...v, issue_type: e.target.value }))}><option value="warranty">Gwarancyjna</option><option value="non_warranty">Pozagwarancyjna</option></select></label></div>
                                    {partsError && <p className="service-note-message service-note-message--error">{partsError}</p>}
                                    <div className="repair-modal__actions"><button type="button" className="report-action-button" onClick={() => setShowPartModal(false)}>Anuluj</button><button type="submit" className="report-action-button report-action-button--primary" disabled={partsBusy}>{partsBusy ? 'Pobieranie...' : 'Potwierdź pobranie'}</button></div>
                                </form>
                            </div>
                        )}

                        {/* Zawartość strony */}
                        <div className="report-details-layout">

                            {/* Główna kolumna */}
                            <main className="report-details-main">

                                {/* Informacje podstawowe */}
                                <details className="details-card details-card--collapsible" open>

                                    <summary className="details-card__header">
                                        <div className="details-card__icon">
                                            <FileText size={19} />
                                        </div>

                                        <div>
                                            <h2>Informacje o zgłoszeniu</h2>
                                            <p>Podstawowe dane reklamacji</p>
                                        </div>
                                    </summary>

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
                                </details>

                                {isAdmin && (
                                    <details className="details-card details-card--collapsible" open>
                                        <summary className="details-card__header"><div className="details-card__icon"><User size={19} /></div><div><h2>Dane zgłaszającego</h2><p>Dane kontaktowe przekazane w formularzu</p></div></summary>
                                        <div className="details-fields">
                                            <div className="details-field"><span>Imię i nazwisko</span><strong>{report.customer_name || 'Brak danych'}</strong></div>
                                            <div className="details-field"><span>Adres e-mail</span><strong>{report.customer_email || 'Brak danych'}</strong></div>
                                            <div className="details-field"><span>Telefon</span><strong>{report.customer_phone || 'Brak danych'}</strong></div>
                                            <div className="details-field"><span>Kraj</span><strong>{report.customer_country || 'Brak danych'}</strong></div>
                                            <div className="details-field"><span>Język kontaktu</span><strong>{report.customer_language || 'Brak danych'}</strong></div>
                                        </div>
                                    </details>
                                )}

                                <details className="details-card details-card--collapsible" open>
                                    <summary className="details-card__header"><div className="details-card__icon"><Wrench size={19} /></div><div><h2>Dane urządzenia</h2><p>Informacje identyfikujące produkt</p></div></summary>
                                    <div className="details-fields">
                                        <div className="details-field"><span>Producent</span><strong>{report.manufacturer || 'Brak danych'}</strong></div>
                                        <div className="details-field"><span>Model produktu</span><strong>{report.product_model || report.device_name || 'Brak danych'}</strong></div>
                                        <div className="details-field"><span>Numer seryjny</span><strong>{report.serial_number_unavailable ? 'Nie podano / niedostępny' : (report.serial_number || 'Brak danych')}</strong></div>
                                        <div className="details-field"><span>Data zakupu</span><strong>{report.purchase_date ? new Date(report.purchase_date).toLocaleDateString('pl-PL') : 'Brak danych'}</strong></div>
                                        <div className="details-field"><span>Typ reklamacji</span><strong>{report.complaint_type || 'Brak danych'}</strong></div>
                                    </div>
                                </details>

                                {/* Opis usterki */}
                                <details className="details-card details-card--collapsible" open>

                                    <summary className="details-card__header">
                                        <div className="details-card__icon">
                                            <AlertCircle size={19} />
                                        </div>

                                        <div>
                                            <h2>Opis zgłoszonej usterki</h2>
                                            <p>Informacje przekazane przez zgłaszającego</p>
                                        </div>
                                    </summary>

                                    <div className="report-description">
                                        {report.issue_description || 'Brak opisu usterki.'}
                                    </div>

                                </details>

                                {isAdmin && isTerminal && report.pricing_required && report.pricing_sent_at && <details className="details-card details-card--collapsible pricing-history-card"><summary className="details-card__header"><div className="details-card__icon"><DollarSign size={19}/></div><div><h2>Wycena naprawy</h2><p>Podsumowanie wyceny zapisanej w trakcie reklamacji</p></div></summary><div className="admin-pricing__parts-list"><div className="pricing-detail-rows">{(report.pricingParts || []).map((p,i)=><div className="repair-part-row pricing-detail-row" key={p.id || i}><div className="repair-part-row__main"><strong>{p.item_name}</strong><span>PN: {p.part_number || '—'} · Ilość: {p.quantity} szt. · {p.charge_customer === false ? 'Bezpłatna' : `${Number(p.unit_price).toFixed(2)} zł/szt. · Razem: ${(Number(p.unit_price)*Number(p.quantity)).toFixed(2)} zł`}</span></div></div>)}</div><div className="admin-pricing__summary">Kwota wyceny: <strong>{Number(report.total_cost || 0).toFixed(2)} zł</strong></div></div></details>}

                                {!isAdmin && <RepairCostSection report={report} isAdmin={false} user={user} onSaved={handlePricingSaved} onDecision={handleAcceptPrice} stockItems={stockItems} stockResources={stockResources} />}

                                {/* Klient widzi podsumowanie danych serwisowych; administrator ma je w panelu diagnozy / naprawy. */}
                                {!isAdmin && <details className="details-card service-notes-card details-card--collapsible" open>
                                    <summary className="details-card__header"><div className="details-card__icon"><Wrench size={19} /></div><div><h2>Dane serwisowe</h2><p>Informacje uzupełniane przez technika</p></div></summary>
                                    <div className="service-note-readonly">
                                        <div className="service-note-readonly__item"><span>Opis diagnozy</span><p>{report.diagnosis_description || 'Diagnoza nie została jeszcze uzupełniona.'}</p></div>
                                        {showRepairResult && <div className="service-note-readonly__item"><span>Rezultat naprawy</span><p>{report.repair_result || 'Rezultat naprawy nie został jeszcze uzupełniona.'}</p></div>}
                                    </div>
                                </details>}

                                {/* Podsumowanie wykorzystanych części w głównej kolumnie szczegółów. */}
                        {(!isAdmin || !['Diagnoza', 'W naprawie'].includes(report.status)) && (
                            <section className="details-card report-used-parts">
                                <div className="details-card__header">
                                    <div className="details-card__icon"><Package size={19} /></div>
                                    <div>
                                        <h2>Wykorzystane części</h2>
                                        <p>Podsumowanie części pobranych do realizacji tej reklamacji</p>
                                    </div>
                                </div>
                                {reportParts.length === 0 ? (
                                    <p className="repair-parts-empty">Nie pobrano jeszcze żadnych części do tej reklamacji.</p>
                                ) : <div className="repair-parts-list report-used-parts__list">
                                    {reportParts.map(part => (
                                        <div className={`repair-part-row ${part.returned_at || part.status === 'returned' ? 'repair-part-row--returned' : ''}`} key={part.id}>
                                            <div className="repair-part-row__main">
                                                <strong>{[part.item?.brand?.brand_name, part.item?.item_name].filter(Boolean).join(' — ') || 'Pozycja katalogowa'}</strong>
                                                <span>
                                                    {part.item?.part_number || part.item?.model_number || 'Brak numeru'} ·
                                                    {' '}{part.warehouse?.warehouse_name || 'Magazyn nieznany'} ·
                                                    {' '}pobrano {part.created_at ? new Date(part.created_at).toLocaleDateString('pl-PL') : '—'}
                                                </span>
                                            </div>
                                            <strong className="repair-part-row__quantity">{part.quantity} szt.</strong>
                                            <span className={`repair-part-type repair-part-type--${part.issue_type}`}>
                                                {part.issue_type === 'warranty' ? 'Gwarancyjna' : 'Pozagwarancyjna'}
                                            </span>
                                            {(part.returned_at || part.status === 'returned') && (
                                                <span className="report-part-returned">
                                                    Zwrócona{part.returned_at ? ` · ${new Date(part.returned_at).toLocaleDateString('pl-PL')}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>}
                            </section>
                        )}

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

                                {/* Komentarze są dostępne wyłącznie dla administratora */}
                                {isAdmin && <section className="details-card comments-card">
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
                                </section>}

                            </aside>

                        </div>

                        <details className="details-card report-history-card">
                            <summary className="details-card__header"><div className="details-card__icon"><Clock size={19} /></div><div><h2>Historia statusów</h2><p>Pełna historia zmian i wstrzymań reklamacji</p></div><span className="comments-count">{statusHistory.length}</span></summary>
                            <div className="report-status-history">{statusHistory.length === 0 ? <p>Brak zapisanych zmian.</p> : statusHistory.map(item => <div className="report-status-history__item" key={item.id}><span>{formatDate(item.created_at)} · {item.changedBy?.login || (item.changed_by ? `Użytkownik #${item.changed_by}` : 'System')}</span><strong>{item.action === 'pause' ? `Wstrzymano: ${item.reason}` : item.action === 'resume' ? 'Wznowiono reklamację' : `${item.old_status || '—'} → ${item.new_status}`}</strong>{item.note && <small>{item.note}</small>}</div>)}</div>
                        </details>
                    </>
                )}

            </div>
        </div>
    );
};