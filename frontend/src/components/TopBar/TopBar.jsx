import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import useStore from '../../store/useStore';
import './TopBar.scss';

export const TopBar = () => {
    const { user, logout } = useStore();
    const location = useLocation();
    const isUserPanelPage = location.pathname === '/user-panel';

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="topbar-prz">
            <div className="topbar-prz__logo">
                <Link to="/" className="text-logo">
                    <span>Serwis Urządzeń</span>
                </Link>
            </div>

            <div className="topbar-prz__actions">
                {user && (
                    <>
                        <span className="topbar-prz__user">
                            <UserRound size={15} />
                            {user.login || user.username || 'Użytkownik'}
                        </span>
                        {user.role === 'user' && !isUserPanelPage && (
                            <Link to="/user-panel" className="btn btn-user-panel">
                                Panel użytkownika
                            </Link>
                        )}
                        <button onClick={handleLogout} className="btn btn-login">
                            Wyloguj
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};