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
import { getItems } from '../services/inventoryService';

export const UserPanelPage = () => {
    const { user, reports = [], fetchReportsByUserId, addNewReport } = useStore();
    const navigate = useNavigate();

    // Stan modalu i formularza nowego zgłoszenia (wypełnianego przez klienta)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const emptyForm = {
        customer_name: '', customer_email: '', customer_phone: '',
        customer_country: 'Polska', customer_language: 'Polski',
        serial_number: '', serial_number_unavailable: false,
        manufacturer: '', product_model: '', item_id: '', custom_device: false, purchase_date: '',
        issue_description: '', complaint_type: 'Gwarancyjna'
    };
    const [form, setForm] = useState(emptyForm);
    const [catalogItems, setCatalogItems] = useState([]);
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const catalogBrands = [...new Map(
        catalogItems
            .filter(item => item.brand?.id != null)
            .map(item => [String(item.brand.id), item.brand])
    ).values()].sort((a, b) => (a.brand_name || '').localeCompare(b.brand_name || '', 'pl'));
    const brandItems = catalogItems.filter(item => String(item.brand?.id ?? item.brand_id) === String(selectedBrandId));
    const updateField = (name, value) => setForm(current => ({ ...current, [name]: value }));
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { getItems(true).then(items => setCatalogItems(items.filter(item => item.item_type === 'device'))).catch(err => console.error('Nie udało się pobrać katalogu urządzeń:', err)); }, []);

    // Pobieranie zgłoszeń użytkownika przy wejściu na stronę
    useEffect(() => {
        if (user?.id) {
            fetchReportsByUserId(user.id);
        }
    }, [user, fetchReportsByUserId]);

    // Obsługa wysyłania formularza przez klienta
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const required = ['customer_name', 'customer_email', 'customer_phone', 'customer_country',
            'customer_language', 'purchase_date', 'issue_description', 'complaint_type'];
        if (form.custom_device && (!form.manufacturer.trim() || !form.product_model.trim())) {
            setFormError('Podaj producenta i model urządzenia.'); return;
        }
        if (!form.custom_device && !form.item_id) {
            setFormError('Wybierz urządzenie z katalogu lub zaznacz, że nie ma go na liście.'); return;
        }
        if (required.some(key => !String(form[key] || '').trim()) ||
            (!form.serial_number_unavailable && !form.serial_number.trim())) {
            setFormError('Uzupełnij wymagane pola. Podaj numer seryjny lub zaznacz jego brak.');
            return;
        }

        setIsSubmitting(true);
        setFormError('');

        const success = await addNewReport({
            user_id: user.id,
            ...form,
            status: 'Nowe'
        });

        setIsSubmitting(false);

        if (success) {
            setForm(emptyForm);
            setSelectedBrandId('');
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
        const normalized = (status || 'Nowe').toLocaleLowerCase('pl-PL');
        const statusStyles = {
            'nowe': 'new',
            'przyjęte do realizacji': 'accepted',
            'diagnoza': 'diagnosis',
            'w naprawie': 'repair',
            'testy / kontrola jakości': 'testing',
            'gotowe do odbioru / wysyłki': 'ready',
            'zakończone': 'success',
            'zakończona': 'success',
            'odrzucone': 'rejected',
            'anulowane': 'cancelled'
        };
        const tone = statusStyles[normalized] || 'new';
        const Icon = ['success', 'ready'].includes(tone) ? CheckCircle2
            : ['accepted', 'diagnosis', 'repair', 'testing'].includes(tone) ? Wrench
            : AlertCircle;

        return (
            <span className={`badge badge--${tone}`}>
                <Icon size={14} /> {status || 'Nowe'}
            </span>
        );
    };

    return (
        <div className="user-panel-container">
            <main className="main-workspace">
                <div className="content-card">

                    {/* Nagłówek panelu */}
                    <header className="dashboard-header">
                        <h2>Panel użytkownika</h2>
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

                        <form onSubmit={handleFormSubmit} className="new-report-form">
                            <div className="form-sections">
                                <section className="form-section">
                                    <h4>Dane zgłaszającego</h4>
                                    <div className="form-fields">
                                        <div className="form-group"><label>Imię i nazwisko *</label><input value={form.customer_name} onChange={e => updateField('customer_name', e.target.value)} required autoComplete="name" /></div>
                                        <div className="form-group"><label>Adres e-mail *</label><input type="email" value={form.customer_email} onChange={e => updateField('customer_email', e.target.value)} required autoComplete="email" /></div>
                                        <div className="form-group"><label>Numer telefonu *</label><input type="tel" value={form.customer_phone} onChange={e => updateField('customer_phone', e.target.value)} required autoComplete="tel" /></div>
                                        <div className="form-group"><label>Kraj *</label><select value={form.customer_country} onChange={e => updateField('customer_country', e.target.value)} required><option>Polska</option><option>Niemcy</option><option>Czechy</option><option>Słowacja</option><option>Ukraina</option><option>Wielka Brytania</option><option>Inny</option></select></div>
                                        <div className="form-group"><label>Język kontaktu *</label><select value={form.customer_language} onChange={e => updateField('customer_language', e.target.value)} required><option>Polski</option><option>Angielski</option><option>Niemiecki</option><option>Czeski</option><option>Słowacki</option><option>Ukraiński</option></select></div>
                                    </div>
                                </section>

                                <section className="form-section">
                                    <h4>Dane urządzenia</h4>
                                    <div className="form-fields">
                                        <div className="form-group">
                                            <label>Marka *</label>
                                            <select
                                                value={selectedBrandId}
                                                disabled={form.custom_device}
                                                required={!form.custom_device}
                                                onChange={e => {
                                                    setSelectedBrandId(e.target.value);
                                                    updateField('item_id', '');
                                                }}
                                            >
                                                <option value="">Wybierz markę</option>
                                                {catalogBrands.map(brand => (
                                                    <option key={brand.id} value={brand.id}>{brand.brand_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Urządzenie *</label>
                                            <select
                                                value={form.item_id}
                                                disabled={form.custom_device || !selectedBrandId}
                                                required={!form.custom_device}
                                                onChange={e => updateField('item_id', e.target.value)}
                                            >
                                                <option value="">{selectedBrandId ? 'Wybierz urządzenie' : 'Najpierw wybierz markę'}</option>
                                                {brandItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.item_name}{item.model_number ? ` (${item.model_number})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <label className="serial-unavailable form-field-full">
                                            <input
                                                type="checkbox"
                                                checked={form.custom_device}
                                                onChange={e => {
                                                    updateField('custom_device', e.target.checked);
                                                    updateField('item_id', '');
                                                    setSelectedBrandId('');
                                                }}
                                            />
                                            Nie ma mojego urządzenia na liście
                                        </label>
                                        {form.custom_device && (
                                            <>
                                                <div className="form-group">
                                                    <label>Producent *</label>
                                                    <input value={form.manufacturer} onChange={e => updateField('manufacturer', e.target.value)} placeholder="np. Bosch" required />
                                                </div>
                                                <div className="form-group">
                                                    <label>Produkt / model *</label>
                                                    <input value={form.product_model} onChange={e => updateField('product_model', e.target.value)} placeholder="np. Serie 6 WGG244Z" required />
                                                </div>
                                            </>
                                        )}
                                        <div className="form-group">
                                            <label>Numer seryjny {!form.serial_number_unavailable && '*'}</label>
                                            <input value={form.serial_number} onChange={e => updateField('serial_number', e.target.value)} disabled={form.serial_number_unavailable} required={!form.serial_number_unavailable} />
                                            <label className="serial-unavailable">
                                                <input type="checkbox" checked={form.serial_number_unavailable} onChange={e => { updateField('serial_number_unavailable', e.target.checked); if (e.target.checked) updateField('serial_number', ''); }} />
                                                Nie posiadam numeru seryjnego
                                            </label>
                                        </div>
                                        <div className="form-group"><label>Data zakupu *</label><input type="date" value={form.purchase_date} onChange={e => updateField('purchase_date', e.target.value)} required /></div>
                                    </div>
                                </section>

                                <section className="form-section form-section-wide">
                                    <h4>Informacje o reklamacji</h4>
                                    <div className="form-fields">
                                        <div className="form-group"><label>Typ reklamacji *</label><select value={form.complaint_type} onChange={e => updateField('complaint_type', e.target.value)} required><option>Gwarancyjna</option><option>Rękojmia</option><option>Pogwarancyjna</option><option>Inna</option></select></div>
                                        <div className="form-group form-group-wide"><label>Opis usterki *</label><textarea rows="4" placeholder="Opisz dokładnie problem, objawy i okoliczności występowania usterki..." value={form.issue_description} onChange={e => updateField('issue_description', e.target.value)} required /></div>
                                    </div>
                                </section>
                            </div>

                            {formError && <p className="form-error">{formError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Anuluj</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}><Send size={16} /> {isSubmitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};