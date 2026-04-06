import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursierService } from '../services/api';
import PageLayout from './PageLayout';
import './CoursierRegister.css';

const CoursierRegister = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vehiculeType: 'moto',
    numeroPlaque: '',
    marque: '',
    modele: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCoursier, setIsCoursier] = useState(false);
  const [coursierProfile, setCoursierProfile] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Vérifier si l'utilisateur est déjà coursier
    checkCoursierStatus();
  }, [isAuthenticated, navigate]);

  const checkCoursierStatus = async () => {
    try {
      const response = await coursierService.getProfile();
      if (response.success) {
        setIsCoursier(true);
        setCoursierProfile(response.data.coursier);
        // Pré-remplir le formulaire avec les données existantes
        if (response.data.coursier.vehicule) {
          setFormData({
            vehiculeType: response.data.coursier.vehicule.type || 'moto',
            numeroPlaque: response.data.coursier.vehicule.numeroPlaque || '',
            marque: response.data.coursier.vehicule.marque || '',
            modele: response.data.coursier.vehicule.modele || '',
          });
        }
      }
    } catch (err) {
      // L'utilisateur n'est pas encore coursier
      setIsCoursier(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);

    try {
      if (isCoursier) {
        // Mise à jour
        const response = await coursierService.updateProfile(formData);
        if (response.success) {
          setSuccess('Profil coursier mis à jour avec succès !');
          setCoursierProfile(response.data.coursier);
        }
      } else {
        // Inscription
        const response = await coursierService.register(formData);
        if (response.success) {
          setSuccess('Inscription réussie ! Votre demande est en attente de validation par un administrateur.');
          setIsCoursier(true);
          setCoursierProfile(response.data.coursier);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors de l\'inscription. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="coursier-register-container fade-in">
        <div className="coursier-register-card">
          <div className="coursier-register-header">
            <h1>🚴 Devenir coursier</h1>
            <p className="subtitle">
              {isCoursier 
                ? 'Mettez à jour vos informations de coursier'
                : 'Rejoignez notre équipe de coursiers et gagnez de l\'argent en livrant des colis'
              }
            </p>
          </div>

          {isCoursier && coursierProfile && (
            <div className="coursier-status">
              <div className={`status-badge ${coursierProfile.estActif ? 'active' : 'pending'}`}>
                {coursierProfile.estActif ? (
                  <>
                    <span>✅</span>
                    <span>Compte actif - Vous pouvez recevoir des commandes</span>
                  </>
                ) : (
                  <>
                    <span>⏳</span>
                    <span>En attente de validation par un administrateur</span>
                  </>
                )}
              </div>
              <div className="status-info">
                <p><strong>Statut:</strong> {coursierProfile.statut}</p>
                <p><strong>Livraisons effectuées:</strong> {coursierProfile.nombreLivraisons || 0}</p>
                {coursierProfile.note > 0 && (
                  <p><strong>Note:</strong> {'⭐'.repeat(Math.round(coursierProfile.note))} ({coursierProfile.note.toFixed(1)})</p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="coursier-register-form">
            <div className="form-group">
              <label htmlFor="vehiculeType">Type de véhicule *</label>
              <select
                id="vehiculeType"
                name="vehiculeType"
                value={formData.vehiculeType}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
                required
              >
                <option value="moto">Moto</option>
                <option value="velo">Vélo</option>
                <option value="voiture">Voiture</option>
                <option value="pied">À pied</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="marque">Marque</label>
                <input
                  type="text"
                  id="marque"
                  name="marque"
                  value={formData.marque}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: Yamaha"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="modele">Modèle</label>
                <input
                  type="text"
                  id="modele"
                  name="modele"
                  value={formData.modele}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ex: MT-07"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numeroPlaque">Numéro de plaque</label>
              <input
                type="text"
                id="numeroPlaque"
                name="numeroPlaque"
                value={formData.numeroPlaque}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: AB-123-CD"
                disabled={loading}
              />
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
                  <span>{isCoursier ? 'Mise à jour...' : 'Inscription...'}</span>
                </>
              ) : (
                isCoursier ? 'Mettre à jour mon profil' : 'S\'inscrire comme coursier'
              )}
            </button>
          </form>

          <div className="coursier-register-footer">
            <p>
              💡 <strong>Comment ça marche ?</strong>
            </p>
            <ul>
              <li>Remplissez ce formulaire pour demander à devenir coursier</li>
              <li>Un administrateur validera votre demande</li>
              <li>Une fois validé, vous pourrez recevoir et accepter des commandes de livraison</li>
              <li>Vous serez payé pour chaque livraison effectuée</li>
            </ul>
            <p className="note">
              ⚠️ <strong>Note:</strong> Seuls les particuliers peuvent devenir coursiers. 
              Les coursiers sont créés et validés par un administrateur.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CoursierRegister;

