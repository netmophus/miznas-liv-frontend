import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen, onToggle, currentPath }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/admin/stats',
      icon: '📊',
      label: 'Statistiques',
      exact: true,
    },
    {
      path: '/admin/users',
      icon: '👥',
      label: 'Utilisateurs',
    },
    {
      path: '/admin/commandes',
      icon: '📦',
      label: 'Commandes',
    },
    {
      path: '/admin/coursiers',
      icon: '🚴',
      label: 'Coursiers',
    },
    {
      path: '/admin/types-livraison',
      icon: '🚚',
      label: 'Types de livraison',
    },
    {
      path: '/admin/fonds',
      icon: '💰',
      label: 'Gestion des fonds',
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle}></div>}
      <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🚚</span>
            {isOpen && <span className="logo-text">Admin</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && onToggle()}
            >
              <span className="nav-icon">{item.icon}</span>
              {isOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/dashboard"
            className="nav-item"
            onClick={() => window.innerWidth < 768 && onToggle()}
          >
            <span className="nav-icon">🏠</span>
            {isOpen && <span className="nav-label">Tableau de bord</span>}
          </Link>
          <button className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {isOpen && <span className="nav-label">Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

