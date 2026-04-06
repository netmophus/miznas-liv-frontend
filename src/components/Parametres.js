import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLayout from './PageLayout';
import './Parametres.css';

const ROLE_CONFIG = {
  particulier: { icon: '👤', label: 'Particulier',    color: '#667eea', bg: '#eef2ff' },
  entreprise:  { icon: '🏢', label: 'Entreprise',     color: '#f59e0b', bg: '#fffbeb' },
  coursier:    { icon: '🏍️', label: 'Livreur',        color: '#10b981', bg: '#f0fdf4' },
  admin:       { icon: '👑', label: 'Administrateur', color: '#ef4444', bg: '#fef2f2' },
};

const SECTIONS = [
  {
    id: 'compte',
    icon: '👤',
    label: 'Compte',
    color: '#667eea',
    items: [
      {
        id: 'profil',
        icon: '🪪',
        title: 'Informations personnelles',
        desc: 'Nom, prénom, email, téléphone',
        action: 'navigate',
        to: '/profile',
        cta: 'Voir le profil',
      },
    ],
  },
  {
    id: 'securite',
    icon: '🔒',
    label: 'Sécurité',
    color: '#8b5cf6',
    items: [
      {
        id: 'password',
        icon: '🔑',
        title: 'Mot de passe',
        desc: 'Modifier ou réinitialiser votre mot de passe',
        action: 'navigate',
        to: '/forgot-password',
        cta: 'Modifier',
      },
    ],
  },
  {
    id: 'application',
    icon: '⚙️',
    label: 'Application',
    color: '#10b981',
    items: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Notifications',
        desc: 'Gérer les alertes et rappels de livraison',
        action: 'soon',
      },
      {
        id: 'langue',
        icon: '🌐',
        title: 'Langue',
        desc: 'Français — changer la langue de l\'interface',
        action: 'soon',
      },
    ],
  },
  {
    id: 'support',
    icon: '💬',
    label: 'Aide & Support',
    color: '#f59e0b',
    items: [
      {
        id: 'aide',
        icon: '❓',
        title: 'Centre d\'aide',
        desc: 'FAQ, guides et tutoriels d\'utilisation',
        action: 'soon',
      },
      {
        id: 'contact',
        icon: '📞',
        title: 'Contacter le support',
        desc: '+227 96 64 83 83 — contact@livraison.ne',
        action: 'soon',
      },
    ],
  },
];

const Parametres = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const roleInfo = ROLE_CONFIG[user?.role] || ROLE_CONFIG.particulier;
  const initials = [user?.nom, user?.prenom]
    .filter(Boolean)
    .map(n => n.charAt(0).toUpperCase())
    .join('') || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="pm-bg">
        <div className="pm-wrapper">

          {/* ── En-tête navigation ── */}
          <div className="pm-topbar">
            <button className="pm-back-btn" onClick={() => navigate(-1)}>
              ← Retour
            </button>
            <h1 className="pm-page-title">Paramètres</h1>
          </div>

          {/* ── Carte profil ── */}
          <div className="pm-profile-card">
            <div className="pm-avatar">
              {initials}
              <span className="pm-avatar-verified" title="Compte vérifié">
                {user?.isVerified ? '✅' : '⚠️'}
              </span>
            </div>
            <div className="pm-profile-info">
              <h2>
                {[user?.nom, user?.prenom].filter(Boolean).join(' ') || 'Utilisateur'}
              </h2>
              <p>{user?.telephone}</p>
              {user?.email && <p>{user.email}</p>}
            </div>
            <span
              className="pm-role-badge"
              style={{ background: roleInfo.bg, color: roleInfo.color }}
            >
              {roleInfo.icon} {roleInfo.label}
            </span>
          </div>

          {/* ── Sections de paramètres ── */}
          {SECTIONS.map((section) => (
            <div key={section.id} className="pm-section">
              <div className="pm-section-head">
                <span className="pm-section-icon" style={{ background: section.color + '18', color: section.color }}>
                  {section.icon}
                </span>
                <h3 className="pm-section-title">{section.label}</h3>
              </div>

              <div className="pm-items">
                {section.items.map((item) => (
                  <SettingItem
                    key={item.id}
                    item={item}
                    onClick={item.action === 'navigate' ? () => navigate(item.to) : null}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ── Zone danger — déconnexion ── */}
          <div className="pm-section pm-section--danger">
            <div className="pm-section-head">
              <span className="pm-section-icon pm-section-icon--danger">🚪</span>
              <h3 className="pm-section-title">Session</h3>
            </div>
            <div className="pm-items">
              <div className="pm-item pm-item--danger" onClick={() => setShowLogoutConfirm(true)}>
                <div className="pm-item-icon pm-item-icon--danger">🚪</div>
                <div className="pm-item-body">
                  <span className="pm-item-title pm-item-title--danger">Se déconnecter</span>
                  <span className="pm-item-desc">Fermer la session sur cet appareil</span>
                </div>
                <span className="pm-item-arrow">›</span>
              </div>
            </div>
          </div>

          {/* ── Version ── */}
          <p className="pm-version">SwiftLivraison · v1.0.0</p>

        </div>
      </div>

      {/* ── Modal confirmation déconnexion ── */}
      {showLogoutConfirm && (
        <div className="pm-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-icon">🚪</div>
            <h2>Se déconnecter ?</h2>
            <p>Vous serez redirigé vers la page de connexion. Vos données sont conservées.</p>
            <div className="pm-modal-actions">
              <button className="pm-modal-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Annuler
              </button>
              <button className="pm-modal-confirm" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

/* ── Composant ligne de paramètre ── */
const SettingItem = ({ item, onClick }) => {
  const isSoon = item.action === 'soon';

  return (
    <div
      className={`pm-item ${isSoon ? 'pm-item--soon' : 'pm-item--active'}`}
      onClick={!isSoon ? onClick : undefined}
      role={!isSoon ? 'button' : undefined}
      tabIndex={!isSoon ? 0 : undefined}
      onKeyDown={!isSoon ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="pm-item-icon">{item.icon}</div>
      <div className="pm-item-body">
        <span className="pm-item-title">{item.title}</span>
        <span className="pm-item-desc">{item.desc}</span>
      </div>
      {isSoon ? (
        <span className="pm-soon-badge">Bientôt</span>
      ) : (
        <span className="pm-item-arrow">›</span>
      )}
    </div>
  );
};

export default Parametres;
