import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RegisterPage.scss';

export const RegisterPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = (e) => {
        e.preventDefault(); // Zapobiega przeładowaniu strony

        // Podstawowa walidacja formularza
        if (!loginInput || !password || !confirmPassword) {
            setError('Wypełnij wszystkie pola.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Podane hasła nie są identyczne.');
            return;
        }

        // Jeśli walidacja przejdzie, czyścimy błąd i wysyłamy dane
        setError('');
        console.log('Wysyłam dane rejestracji:', { loginInput, password });

        // Tutaj w przyszłości dodasz wywołanie API, np.:
        // await register(loginInput, password);
        // navigate('/login');
    };

    return (
        <div className="register-container">
            <form className="register-card" onSubmit={handleRegister}>
                <h2 className="register-card__title">Zarejestruj się</h2>

                <div className="input-group">
                    <User className="input-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Login"
                        value={loginInput}
                        onChange={e => setLoginInput(e.target.value)}
                        className="register-card__input"
                    />
                </div>

                <div className="input-group">
                    <Lock className="input-icon" size={18} />
                    <input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={e => setPassword(e.target.value.trim())}
                        className="register-card__input"
                    />
                </div>

                <div className="input-group">
                    <Lock className="input-icon" size={18} />
                    <input
                        type="password"
                        placeholder="Powtórz hasło"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value.trim())}
                        className="register-card__input"
                    />
                </div>

                {error && <p className="register-card__error">{error}</p>}

                <button type="submit" className="register-card__button">
                    Zarejestruj
                </button>
                <p className="register-card__login">
                    Masz już konto? <Link to="/login">Zaloguj się</Link>.
                </p>
            </form>
        </div>
    );
};