import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useStore from '../store/useStore';
import './home.scss';
export const HomePage = () => {
    const { 
        theme,
        
        setUser,
        setUpcomingCampaigns,
        setTopCampaigns,
        setNumberOfCampaigns,
        setNumberOfInfluencers,
        setNumberOfLikes,

        user,
        upcomingCampaigns,
        topCampaigns,
        numberOfCampaigns,
        numberOfInfluencers,
        numberOfLikesForAllCampaigns,

    } = useStore();
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const userId = JSON.parse(localStorage.getItem("user"))?.id;

        if (userId) {
            axios.get(`http://localhost:3001/users/${userId}`)
                .then(res => {
                    console.log('Dane użytkownika:', res.data);
                    setUser(res.data);
                })
                .catch(err => console.error('Błąd pobierania użytkownika:', err));
        }
    }, []);


    return (
        <div className="homepage">

            <section className="hero">
                <div className="hero__overlay">
                    <h1 className="hero__title">{user ?  `Witaj, ${user.login} !` : ''}</h1>
                    <h1 className="hero__title">Złóż reklamację bez żadnych problemów</h1>
                    <p className="hero__cta">Rozpocznij teraz</p>
                </div>
            </section>


            <section className="section section--cta">
                <h2 className="section__title">Dołącz do naszej platformy</h2>
                <div className="cta-buttons">
                    <button className="cta-button influencer">
                        <i className="fas fa-user-astronaut"></i> Zarejestruj się jako klient
                    </button>
                    <button className="cta-button manager">
                        <i className="fas fa-chart-line"></i> Zarejestruj się jako serwisant
                    </button>
                </div>
            </section>

        </div>
    );
};