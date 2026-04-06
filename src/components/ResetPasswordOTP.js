import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './ResetPasswordOTP.css';

const ResetPasswordOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [telephone, setTelephone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le numéro de téléphone depuis le localStorage
    const resetPhone = localStorage.getItem('resetPhone');
    if (resetPhone) {
      setTelephone(resetPhone);
    } else {
      // Si pas de numéro, rediriger vers forgot-password
      navigate('/forgot-password');
    }
  }, [navigate]);

  useEffect(() => {
    // Démarrer le compte à rebours de 60 secondes
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index, value) => {
    // Ne permettre que les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Passer au champ suivant automatiquement
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Supprimer et revenir au champ précédent
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(telephone);
      if (response.success) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Erreur lors de l\'envoi du code');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors de l\'envoi du code. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Veuillez entrer le code complet à 6 chiffres');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyResetOTP(telephone, otpCode);
      
      if (response.success) {
        // Stocker l'OTP vérifié pour la page suivante
        localStorage.setItem('verifiedResetOTP', otpCode);
        // Rediriger vers la page de définition du nouveau mot de passe
        navigate('/reset-password');
      } else {
        setError(response.message || 'Code OTP invalide');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Code OTP invalide ou expiré. Veuillez réessayer.'
      );
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="reset-otp-container fade-in">
        <div className="reset-otp-card">
          <div className="reset-otp-header">
            <button 
              className="back-button"
              onClick={() => navigate('/forgot-password')}
              aria-label="Retour"
            >
              ←
            </button>
            <h2>Vérification</h2>
            <p className="reset-otp-subtitle">
              Entrez le code à 6 chiffres envoyé au
              <br />
              <strong>{telephone}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-otp-form">
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="otp-input"
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="alert alert-error slide-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Vérification...</span>
                </>
              ) : (
                'Vérifier'
              )}
            </button>
          </form>

          <div className="reset-otp-footer">
            <p>Vous n'avez pas reçu le code ?</p>
            <button
              className="resend-button"
              onClick={handleResend}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ResetPasswordOTP;

