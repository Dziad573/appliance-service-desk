import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Boxes, Package, Settings, ArrowRight } from 'lucide-react';
import './AdminHomePage.scss';

const modules = [
  { title: 'Panel reklamacji', description: 'Przeglądaj zgłoszenia, zarządzaj ich statusem i obsługą.', detail: 'Lista wszystkich reklamacji', to: '/reports', Icon: ClipboardList, tone: 'blue' },
  { title: 'Panel stanu magazynowego', description: 'Kontroluj dostępność urządzeń i części oraz przyjmuj dostawy.', detail: 'Stany i przyjęcia magazynowe', to: '/inventory', Icon: Boxes, tone: 'green' },
  { title: 'Katalog itemów', description: 'Zarządzaj urządzeniami, komponentami i częściami obsługiwanymi przez serwis.', detail: 'Modele urządzeń i komponenty', to: '/inventory/items', Icon: Package, tone: 'purple' },
  { title: 'Konfiguracja serwisu', description: 'Zarządzaj markami oraz magazynami wykorzystywanymi w systemie.', detail: 'Marki i magazyny', to: '/inventory/config', Icon: Settings, tone: 'orange' },
];

export const AdminHomePage = () => {
  const navigate = useNavigate();
  return (
    <main className="admin-home">
      <section className="admin-home__intro">
        <span className="admin-home__eyebrow">CENTRUM ZARZĄDZANIA</span>
        <h1>Panel administratora</h1>
        <p>Wybierz obszar systemu, którym chcesz zarządzać.</p>
      </section>
      <section className="admin-home__grid" aria-label="Moduły systemu">
        {modules.map(({ title, description, detail, to, Icon, tone }) => (
          <button type="button" className="admin-home-card" key={to} onClick={() => navigate(to)}>
            <span className={`admin-home-card__icon admin-home-card__icon--${tone}`}><Icon size={25} /></span>
            <span className="admin-home-card__body"><strong>{title}</strong><span>{description}</span><small>{detail}</small></span>
            <ArrowRight className="admin-home-card__arrow" size={19} />
          </button>
        ))}
      </section>
    </main>
  );
};
