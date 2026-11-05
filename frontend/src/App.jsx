import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';

import { HomePage } from './views/HomePage.jsx';
import { ReportsPage } from './views/ReportsPage.jsx';
import { LoginPage } from './views/LoginPage.jsx';
import { RegisterPage } from './views/RegisterPage.jsx';
import { UserPanelPage } from './views/UserPanelPage.jsx';
import { TopBar } from './components/TopBar/TopBar.jsx';
import { ReportDetailsPage } from './views/ReportDetailsPage.jsx';

export const App = () => {
    const { user } = useStore(); // {email, role, etc.} Zustand

    return (
        <Router>
            <TopBar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={user ? <Navigate to="/user-panel" /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/user-panel" /> : <RegisterPage />} />
                <Route path="/user-panel" element={user ? <UserPanelPage /> : <Navigate to="/login" />} />
                <Route path="/reports" element={user?.role === 'admin' ? <ReportsPage view="staff" /> : <Navigate to="/" />}/>
                <Route path="/user-reports" element={user?.role === 'user' ? <ReportsPage view="customer" /> : <Navigate to="/" />}/>  
                <Route path="/reports/:id" element={user?.role === 'admin' ? <ReportDetailsPage /> : <Navigate to="/" />}/>
                <Route path="/user-reports/:id" element={ user?.role === 'user' ? <ReportDetailsPage /> : <Navigate to="/" /> } />
            </Routes>
        </Router>
    );
};