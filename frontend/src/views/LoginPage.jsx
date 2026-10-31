import React, { useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './LoginPage.scss';
import { login } from '../services/loginService';

export const LoginPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { setUser } = useStore();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const userData = await login(loginInput, password);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setError('');
            navigate('/');
        } catch (err) {
            console.log(loginInput, password);
            setError('Nieprawidłowy login lub hasło.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-card__title">Zaloguj się</h2>

                <div className="input-group">
                    <Mail className="input-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Login"
                        value={loginInput}
                        onChange={e => setLoginInput(e.target.value)}
                        className="login-card__input"
                    />
                </div>

                <div className="input-group">
                    <Lock className="input-icon" size={18} />
                    <input
                        type="password"
                        placeholder="Hasło"
                        value={password}
                        onChange={e => setPassword(e.target.value.trim())}
                        className="login-card__input"
                    />
                </div>

                {error && <p className="login-card__error">{error}</p>}

                <button className="login-card__button" onClick={handleLogin}>
                    Zaloguj
                </button>
            </div>
        </div>
    );
};