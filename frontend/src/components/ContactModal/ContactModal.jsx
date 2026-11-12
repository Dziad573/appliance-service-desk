import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import './ContactModal.scss';

export default function ContactModal({ reportId, title = "Ogólne zgłoszenie" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        user_subject: '',
        user_message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage('');

        const templateParams = {
            report_id: reportId,
            title: title,
            user_name: formData.user_name,
            user_email: formData.user_email,
            user_subject: formData.user_subject,
            user_message: formData.user_message,
            email: formData.user_email
        };

        const SERVICE_ID = 'service_hw91cww';
        const TEMPLATE_ID = 'template_g0uaba6';
        const PUBLIC_KEY = '5YR5D_s2RYZLSEGRs';

        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then((response) => {
                console.log('SUCCESS!', response.status, response.text);
                setStatusMessage('Wiadomość została wysłana pomyślnie!');
                setLoading(false);
                setFormData({ user_name: '', user_email: '', user_subject: '', user_message: '' });
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
                className="report-question-btn"
                onClick={() => setIsOpen(true)}
            >
                Zadaj pytanie
            </button>

            {isOpen && (
                <div className="report-modal-overlay">
                    <div className="report-modal-content">
                        <h3>Zadaj pytanie do zgłoszenia #{reportId}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="report-form-group">
                                <label>Imię:</label>
                                <input 
                                    type="text" 
                                    name="user_name" 
                                    value={formData.user_name} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>

                            <div className="report-form-group">
                                <label>Twój Email:</label>
                                <input 
                                    type="email" 
                                    name="user_email" 
                                    value={formData.user_email} 
                                    onChange={handleChange} 
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
                                <label>Wiadomość:</label>
                                <textarea 
                                    name="user_message" 
                                    value={formData.user_message} 
                                    onChange={handleChange} 
                                    required 
                                    rows="4"
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
                                    {loading ? 'Wysyłanie...' : 'Wyślij'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}