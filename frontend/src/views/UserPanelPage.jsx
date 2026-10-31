import React from 'react';
import useStore from '../store/useStore';
import './home.scss';

export const UserPanelPage = () => {
    const { user } = useStore();

    return (
        <div className="homepage">
            <section className="hero">
                <div className="hero__overlay">
                    <h1 className="hero__title">UserPanelPage: {user ?  ` ${user.login}` : ''}</h1>
                    <p className="hero__subtitle">UserPanelPage</p>
                    <p className="hero__cta">Rozpocznij teraz</p>
                </div>
            </section>
        </div>
    );
};