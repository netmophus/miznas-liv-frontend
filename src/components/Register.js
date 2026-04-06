import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './Login.css';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    telephone: '',
    nom: '',
    prenom: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.telephone || formData.telephone.trim() === '') {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }
    if (!formData.nom || formData.nom.trim() === '') {
      setError('Veuillez entrer votre nom');
      return;
    }

    const normalizedPhone = formData.telephone.startsWith('+')
      ? formData.telephone
      : `+${formData.telephone}`;

    setLoading(true);
    try {
      const response = await authService.register(
        normalizedPhone,
        formData.nom.trim(),
        formData.prenom.trim(),
        formData.email.trim()
      );
      if (response.success) {
        localStorage.setItem('pendingPhone', normalizedPhone);
        setSuccess('Compte créé ! Code OTP envoyé, redirection…');
        setTimeout(() => navigate('/verify-otp'), 1400);
      } else {
        setError(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
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
            <h2>Rejoignez des milliers de clients satisfaits</h2>
            <p>Inscription gratuite. Payez uniquement à la livraison, sans abonnement ni frais cachés.</p>
            <div className="auth-features">
              {[
                { icon: '🎁', text: 'Inscription 100% gratuite' },
                { icon: '🚀', text: 'Première livraison en quelques minutes' },
                { icon: '📦', text: '3 formules de livraison disponibles' },
                { icon: '💬', text: 'Support disponible 7j/7' },
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

          {/* Logo mobile */}
          <Link to="/" className="auth-logo auth-logo--mobile">
            <img src="/logo.png" alt="MIZNAS Livraison" className="auth-logo-img auth-logo-img--mobile" />
          </Link>

          <div className="auth-form-header">
            <h1>Créer un compte ✨</h1>
            <p>Remplissez le formulaire ci-dessous pour rejoindre notre service de livraison.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Nom + Prénom */}
            <div className="reg-row">
              <div className="auth-field">
                <label htmlFor="nom">Nom <span className="auth-required">*</span></label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="auth-input"
                  disabled={loading}
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="prenom">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                  className="auth-input"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="auth-field">
              <label htmlFor="telephone">Numéro de téléphone <span className="auth-required">*</span></label>
              <div className="auth-input-wrap">
                <span className="auth-input-prefix">+</span>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="227 96 XX XX XX"
                  className="auth-input auth-input--prefix"
                  disabled={loading}
                  required
                />
              </div>
              <small className="auth-hint">Format international : +227 96 64 83 83</small>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email <span className="auth-optional">(optionnel)</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="auth-input"
                disabled={loading}
              />
            </div>

            {/* Type de compte (info) */}
            <div className="reg-account-type">
              <span>👤</span>
              <div>
                <strong>Compte particulier</strong>
                <p>Seuls les particuliers s'inscrivent ici. Les entreprises et livreurs sont créés par un administrateur.</p>
              </div>
            </div>

            {error && (
              <div className="auth-alert auth-alert--error">
                <span>⚠️</span><span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert auth-alert--success">
                <span>✅</span><span>{success}</span>
              </div>
            )}

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <><span className="auth-spinner" /> Création en cours…</>
              ) : (
                'Créer mon compte gratuit →'
              )}
            </button>
          </form>

          <div className="auth-form-footer">
            <p>Déjà inscrit ? <Link to="/login" className="auth-link">Se connecter</Link></p>
            <p><Link to="/" className="auth-link auth-link--muted">← Retour à l'accueil</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
