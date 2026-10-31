import React from 'react';
import useStore from '../../store/useStore';
import { Link } from 'react-router-dom';
import './TopBar.scss';
export const TopBar = () => {
    const { user, logout } = useStore();

    const handleLogout = () => {
        logout();
    };

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="top-bar">
            <Link to="/">
                <h1 className="top-bar__title">Uslugi Sieciowe w Biznesie</h1>
            </Link>

                <div className="top-bar__nav">
                    {user != null && user.role == 'admin' && (
                        <Link to="/reports">
                            <button className="top-bar__button">Zgłoszenia</button>
                        </Link>
                    )}

                    {user != null && user.role == 'user' && (
                        <Link to="/user-reports">
                            <button className="top-bar__button">Historia zgłoszeń</button>
                        </Link>
                    )}

                    {!user ? (
                        <div>
                            <Link to="/login">
                                <button className="top-bar__button">Zaloguj</button>
                            </Link>
                            <Link to="/register">
                                <button className="top-bar__button">Zarejestruj</button>
                            </Link>
                        </div>
                    ) : (
                        <div className='top-bar__user'>
                                <button className="top-bar__button" onClick={() => toggleMenu()}>
                                    Konto
                                </button>
                            {isMenuOpen && (
                                <div className="top-bar__dropdown">
                                    <h2 className="top-bar__name">Użytkownik: {user.login}</h2>
                                    <Link to="/user-panel">
                                        <button className="top-bar__button">Panel użytkownika</button>
                                    </Link>
                                    <Link to="/login">
                                        <button className="top-bar__button" onClick={handleLogout}>Wyloguj</button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

        </div>
    );
}