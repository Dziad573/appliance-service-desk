import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import './TopBar.scss';

export const TopBar = () => {
    const { user, logout } = useStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="topbar-prz">
            <div className="topbar-prz__logo">
                <Link to="/" className="text-logo">
                    Serwis Urządzeń
                </Link>
            </div>

            <div className="topbar-prz__actions">
                {!user ? (
                    <>
                        <Link to="/login" className="btn btn-register">Zaloguj</Link>
                        <Link to="/register" className="btn btn-register">Zarejestruj</Link>
                    </>
                ) : (
                    <>
                        <Link to="/user-panel" className="btn btn-register">Panel Użytkownika</Link>
                        <button onClick={handleLogout} className="btn btn-login" style={{ marginLeft: '10px' }}>
                            Wyloguj
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};