import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, Boxes, Package, Settings, PackagePlus, PackageMinus } from 'lucide-react';
import './AdminSidebar.scss';

const links = [
  { to: '/admin-panel', label: 'Panel główny', Icon: ClipboardList, end: true },
  { to: '/inventory', label: 'Stany magazynowe', Icon: Boxes, end: true },
  { to: '/inventory/receipts', label: 'Zatowarowania magazynu', Icon: PackagePlus },
  { to: '/inventory/issues', label: 'Wydania magazynowe', Icon: PackageMinus },
  { to: '/inventory/items', label: 'Katalog itemów', Icon: Package },
  { to: '/inventory/config', label: 'Konfiguracja serwisu', Icon: Settings },
];

export const AdminSidebar = ({ expanded, onNavigate }) => (
  <aside className={`admin-sidebar ${expanded ? 'admin-sidebar--expanded' : ''}`} aria-label="Menu administratora">
    <nav>
      {links.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} title={label} onClick={onNavigate} className={({ isActive }) => `admin-sidebar__link ${isActive ? 'active' : ''}`}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  </aside>
);
