import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation du numéro de téléphone
    if (!telephone || telephone.trim() === '') {
      setError('Veuillez entrer votre numéro de téléphone');
      return;
    }

    // Normaliser le numéro (ajouter + si absent)
    const normalizedPhone = telephone.startsWith('+') ? telephone : `+${telephone}`;

    setLoading(true);

    try {
      const response = await authService.forgotPassword(normalizedPhone);
      
      if (response.success) {
        setSuccess('Code OTP envoyé avec succès !');
        // Stocker le numéro de téléphone pour la page suivante
        localStorage.setItem('resetPhone', normalizedPhone);
        
        // Rediriger vers la vérification OTP après 1 seconde
        setTimeout(() => {
          navigate('/reset-otp');
        }, 1000);
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du code OTP');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors de l\'envoi du code OTP. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="forgot-password-container fade-in">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>🔐 Mot de passe oublié</h1>
            <p className="subtitle">
              Entrez votre numéro de téléphone pour recevoir un code de réinitialisation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="telephone">Numéro de téléphone</label>
              <div className="input-wrapper">
                <span className="input-prefix">+</span>
                <input
                  type="tel"
                  id="telephone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="22796648383"
                  className="form-input"
                  disabled={loading}
                  required
                />
              </div>
              <small className="form-hint">
                Format: +22796648383 (avec indicatif pays)
              </small>
            </div>

            {error && (
              <div className="alert alert-error slide-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success slide-in">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                'Envoyer le code de réinitialisation'
              )}
            </button>
          </form>

          <div className="forgot-password-footer">
            <p>
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link to="/login" className="link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ForgotPassword;

