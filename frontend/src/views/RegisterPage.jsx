import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/registerService';
import './RegisterPage.scss';

export const RegisterPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!loginInput || !password || !confirmPassword) {
            setError('Wypełnij wszystkie pola.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Podane hasła nie są identyczne.');
            return;
        }

        try {
            setError('');
            setIsLoading(true);

            await register(loginInput, password);

            setIsLoading(false);
            navigate('/login');
        } catch (err) {
            setIsLoading(false);
            const errorMsg = err.response?.data?.message || 'Nie udało się zarejestrować. Spróbuj ponownie.';
            setError(errorMsg);
        }
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

                <button type="submit" className="register-card__button" disabled={isLoading}>
                    {isLoading ? 'Rejestrowanie...' : 'Zarejestruj'}
                </button>
                
                <p className="register-card__login">
                    Masz już konto? <Link to="/login">Zaloguj się</Link>.
                </p>
            </form>
        </div>
    );
};