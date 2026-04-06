import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './ResetPassword.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [telephone, setTelephone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le numéro de téléphone et l'OTP depuis le localStorage
    const resetPhone = localStorage.getItem('resetPhone');
    const verifiedOTP = localStorage.getItem('verifiedResetOTP');

    if (resetPhone && verifiedOTP) {
      setTelephone(resetPhone);
      setOtp(verifiedOTP);
    } else {
      // Si pas de données, rediriger vers forgot-password
      navigate('/forgot-password');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(telephone, otp, password);
      
      if (response.success) {
        setSuccess('Mot de passe réinitialisé avec succès !');
        
        // Nettoyer le localStorage
        localStorage.removeItem('resetPhone');
        localStorage.removeItem('verifiedResetOTP');
        
        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors de la réinitialisation. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="reset-password-container fade-in">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>🔑 Nouveau mot de passe</h1>
            <p className="subtitle">
              Définissez un nouveau mot de passe pour votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="password">Nouveau mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Minimum 6 caractères"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher/Masquer le mot de passe"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="form-hint">
                Le mot de passe doit contenir au moins 6 caractères
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Répétez le mot de passe"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Afficher/Masquer le mot de passe"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
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
                  <span>Réinitialisation...</span>
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>

          <div className="reset-password-footer">
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

export default ResetPassword;

