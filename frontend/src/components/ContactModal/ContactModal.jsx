import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import useStore from '../../store/useStore';
import './ContactModal.scss';

export default function ContactModal({ reportId, title = "Ogólne zgłoszenie" }) {
    const { user } = useStore();
    const isAdmin = user?.role === 'admin';

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const [formData, setFormData] = useState({
        user_name: isAdmin ? 'Serwis USWB' : (user?.login || ''),
        user_email: '',
        user_subject: isAdmin ? `Wycena naprawy dla zgłoszenia #${reportId}` : '',
        user_message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage('');

        const recipientEmail = isAdmin ? formData.user_email : 'uswb.app@gmail.com';
        const displayEmail = isAdmin ? 'uswb.app@gmail.com' : formData.user_email;
        const replyToEmail = isAdmin ? 'uswb.app@gmail.com' : formData.user_email;

        const headerTitle = isAdmin 
            ? `Wycena naprawy dla zgłoszenia #${reportId}` 
            : `Nowe pytanie do zgłoszenia #${reportId}`;

        const introText = isAdmin
            ? `Otrzymano oficjalną wycenę od serwisu ${formData.user_name}.`
            : `Otrzymano nową wiadomość od użytkownika ${formData.user_name}. Prosimy o odpowiedź w najdogodniejszym terminie.`;

        const senderTitle = isAdmin ? 'Nadawca' : 'Imię';
        const messageLabel = isAdmin ? 'Wycena:' : 'Treść wiadomości:';

        const templateParams = {
            report_id: reportId,
            title: title,
            user_name: formData.user_name,
            display_email: displayEmail,
            user_subject: formData.user_subject,
            user_message: formData.user_message,
            email: replyToEmail,
            to_email: recipientEmail,
            header_title: headerTitle,
            intro_text: introText,
            sender_title: senderTitle,
            message_label: messageLabel
        };

        const SERVICE_ID = 'service_hw91cww';
        const TEMPLATE_ID = 'template_g0uaba6';
        const PUBLIC_KEY = '5YR5D_s2RYZLSEGRs';

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                setStatusMessage(isAdmin ? 'Wycena została wysłana do klienta!' : 'Wiadomość została wysłana pomyślnie!');
                setLoading(false);
                setFormData({ 
                    user_name: isAdmin ? 'Serwis USWB' : (user?.login || ''), 
                    user_email: '', 
                    user_subject: isAdmin ? `Wycena naprawy dla zgłoszenia #${reportId}` : '', 
                    user_message: '' 
                });
                setTimeout(() => setIsOpen(false), 2000);
            })
            .catch((err) => {
                console.error('FAILED...', err);
                setStatusMessage('Wystąpił błąd podczas wysyłania. Spróbuj ponownie.');
                setLoading(false);
            });
    };

    return (
        <>
            <button 
                type="button"
                className={`report-question-btn ${isAdmin ? 'report-admin-btn' : ''}`}
                onClick={() => setIsOpen(true)}
            >
                {isAdmin ? 'Wyślij wycenę' : 'Zadaj pytanie'}
            </button>

            {isOpen && (
                <div className="report-modal-overlay">
                    <div className="report-modal-content">
                        <h3>
                            {isAdmin 
                                ? `Wyślij wycenę do zgłoszenia #${reportId}` 
                                : `Zadaj pytanie do zgłoszenia #${reportId}`}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="report-form-group">
                                <label>{isAdmin ? 'Nadawca / Serwis:' : 'Imię:'}</label>
                                <input 
                                    type="text" 
                                    name="user_name" 
                                    value={formData.user_name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="report-form-group">
                                <label>{isAdmin ? 'Email klienta (dokąd wysłać wycenę):' : 'Twój Email (kontaktowy):'}</label>
                                <input 
                                    type="email" 
                                    name="user_email" 
                                    value={formData.user_email} 
                                    onChange={handleChange} 
                                    placeholder="klient@example.com"
                                    required 
                                />
                            </div>

                            <div className="report-form-group">
                                <label>Temat:</label>
                                <input 
                                    type="text" 
                                    name="user_subject" 
                                    value={formData.user_subject} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="report-form-group">
                                <label>{isAdmin ? 'Wycena:' : 'Wiadomość:'}</label>
                                <textarea 
                                    name="user_message" 
                                    value={formData.user_message} 
                                    onChange={handleChange} 
                                    placeholder={isAdmin ? "Wpisz kwotę i zakres prac..." : "Opisz swoje pytanie..."}
                                    required 
                                    rows="4"
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            {statusMessage && (
                                <p className={`report-status-msg ${statusMessage.includes('błąd') ? 'error' : 'success'}`}>
                                    {statusMessage}
                                </p>
                            )}

                            <div className="report-modal-actions">
                                <button type="button" className="report-btn-secondary" onClick={() => setIsOpen(false)}>
                                    Anuluj
                                </button>
                                <button type="submit" className="report-btn-primary" disabled={loading}>
                                    {loading ? 'Wysyłanie...' : (isAdmin ? 'Wyślij wycenę' : 'Wyślij')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}