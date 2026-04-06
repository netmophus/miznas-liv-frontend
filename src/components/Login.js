import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import './Login.css';

const Login = () => {
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!telephone || telephone.trim() === '') {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    const normalizedPhone = telephone.startsWith('+') ? telephone : `+${telephone}`;
    setLoading(true);

    try {
      const response = await authService.sendOTP(normalizedPhone);
      if (response.success) {
        setSuccess('Code OTP envoyé ! Redirection…');
        localStorage.setItem('pendingPhone', normalizedPhone);
        setTimeout(() => navigate('/verify-otp'), 1200);
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du code OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du code OTP. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Panneau gauche (branding) ── */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <Link to="/" className="auth-logo">
            <img src="/logo.png" alt="MIZNAS Livraison" className="auth-logo-img" />
          </Link>
          <div className="auth-brand-content">
            <h2>Livraisons rapides<br />à Niamey</h2>
            <p>Confiez vos colis à nos livreurs professionnels. Suivi en temps réel, paiement à la livraison.</p>
            <div className="auth-features">
              {[
                { icon: '⚡', text: 'Livraison en moins de 2h' },
                { icon: '📍', text: 'Suivi GPS en temps réel' },
                { icon: '💵', text: 'Paiement à la réception' },
                { icon: '🔒', text: 'Service sécurisé et fiable' },
              ].map((f, i) => (
                <div key={i} className="auth-feature">
                  <span className="auth-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="auth-left-blob" />
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {/* En-tête mobile */}
          <Link to="/" className="auth-logo auth-logo--mobile">
            <img src="/logo.png" alt="MIZNAS Livraison" className="auth-logo-img auth-logo-img--mobile" />
          </Link>

          <div className="auth-form-header">
            <h1>Bon retour 👋</h1>
            <p>Entrez votre numéro pour recevoir un code OTP de connexion.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="telephone">Numéro de téléphone</label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix">+</span>
                <input
                  type="tel"
                  id="telephone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="227 96 XX XX XX"
                  className="auth-input auth-input--prefix"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
              <small className="auth-hint">Format international : +227 96 64 83 83</small>
            </div>

            {error && (
              <div className="auth-alert auth-alert--error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert auth-alert--success">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <><span className="auth-spinner" /> Envoi en cours…</>
              ) : (
                'Envoyer le code OTP →'
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>Pas encore de compte ? <Link to="/register" className="auth-link">S'inscrire gratuitement</Link></p>
            <p><Link to="/forgot-password" className="auth-link auth-link--muted">Mot de passe oublié ?</Link></p>
            <p><Link to="/" className="auth-link auth-link--muted">← Retour à l'accueil</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
