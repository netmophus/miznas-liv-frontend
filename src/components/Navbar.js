import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🚚</span>
        </Link>

        {/* Menu desktop */}
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                Tableau de bord
              </Link>
              {user?.role === 'particulier' && (
                <Link to="/particulier/commandes" className="navbar-link">
                  Mes commandes
                </Link>
              )}
              {user?.role === 'coursier' && (
                <Link to="/coursier/commandes" className="navbar-link">
                  Mes commandes
                </Link>
              )}
              {user?.role === 'entreprise' && (
                <Link to="/particulier/commandes" className="navbar-link">
                  Mes commandes
                </Link>
              )}
              <div className="navbar-user">
                <button
                  className="user-menu-button"
                  onClick={toggleMenu}
                  aria-label="Menu utilisateur"
                >
                  <span className="user-avatar">
                    {user?.telephone?.slice(-2) || '👤'}
                  </span>
                  <span className="user-name">
                    {user?.nom || user?.telephone || 'Utilisateur'}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {isMenuOpen && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>👤</span> Mon profil
                    </Link>
                    <Link
                      to="/parametres"
                      className="dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>⚙️</span> Paramètres
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span>🚪</span> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Connexion
              </Link>
              <Link to="/register" className="navbar-button">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Menu mobile toggle */}
        <button
          className="navbar-toggle"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={isMenuOpen ? 'hamburger open' : 'hamburger'}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="navbar-mobile">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Tableau de bord
              </Link>
              <Link
                to="/commandes"
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Mes commandes
              </Link>
              <Link
                to="/profile"
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Mon profil
              </Link>
              <button className="mobile-link logout" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

