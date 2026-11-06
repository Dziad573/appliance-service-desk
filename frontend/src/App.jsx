
import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import useStore from './store/useStore';

import { HomePage } from './views/HomePage.jsx';
import { ReportsPage } from './views/ReportsPage.jsx';
import { LoginPage } from './views/LoginPage.jsx';
import { RegisterPage } from './views/RegisterPage.jsx';
import { UserPanelPage } from './views/UserPanelPage.jsx';
import { TopBar } from './components/TopBar/TopBar.jsx';
import { ReportDetailsPage } from './views/ReportDetailsPage.jsx';

// Domyślna strona zależna od roli użytkownika
const getRedirectPath = (user) => {
    if (user?.role === 'admin') return '/reports';
    if (user?.role === 'user') return '/user-panel';

    return '/login';
};

export const App = () => {
    const { user } = useStore();

    return (
        <Router>
            <TopBar />

            <Routes>
                {/* Strona główna */}
                <Route
                    path="/"
                    element={
                        user
                            ? <Navigate to={getRedirectPath(user)} replace />
                            : <HomePage />
                    }
                />

                {/* Logowanie */}
                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate to={getRedirectPath(user)} replace />
                            : <LoginPage />
                    }
                />

                {/* Rejestracja */}
                <Route
                    path="/register"
                    element={
                        user
                            ? <Navigate to={getRedirectPath(user)} replace />
                            : <RegisterPage />
                    }
                />

                {/* Panel użytkownika - tylko customer */}
                <Route
                    path="/user-panel"
                    element={
                        user?.role === 'user'
                            ? <UserPanelPage />
                            : <Navigate to={getRedirectPath(user)} replace />
                    }
                />

                {/* Reports - tylko admin */}
                <Route
                    path="/reports"
                    element={
                        user?.role === 'admin'
                            ? <ReportsPage view="staff" />
                            : <Navigate to={getRedirectPath(user)} replace />
                    }
                />

                {/* Zgłoszenia klienta - tylko customer */}
                <Route
                    path="/user-reports"
                    element={
                        user?.role === 'user'
                            ? <ReportsPage view="customer" />
                            : <Navigate to={getRedirectPath(user)} replace />
                    }
                />

                {/* Szczegóły zgłoszenia - admin */}
                <Route
                    path="/reports/:id"
                    element={
                        user?.role === 'admin'
                            ? <ReportDetailsPage />
                            : <Navigate to={getRedirectPath(user)} replace />
                    }
                />

                {/* Szczegóły zgłoszenia - customer */}
                <Route
                    path="/user-reports/:id"
                    element={
                        user?.role === 'user'
                            ? <ReportDetailsPage />
                            : <Navigate to={getRedirectPath(user)} replace />
                    }
                />

                {/* Nieznane adresy */}
                <Route
                    path="*"
                    element={
                        <Navigate to={getRedirectPath(user)} replace />
                    }
                />
            </Routes>
        </Router>
    );
};
