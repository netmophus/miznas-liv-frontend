import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await authService.getMe();
        if (response.success) {
          setUserInfo(response.user);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </PageLayout>
    );
  }

  const displayUser = userInfo || user;

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Retour
            </button>
            <h1>👤 Mon profil</h1>
          </div>

          <div className="profile-content">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {displayUser?.nom?.charAt(0)?.toUpperCase() || '👤'}
              </div>
            </div>

            <div className="profile-info">
              <div className="info-section">
                <h2>Informations personnelles</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom</label>
                    <p>{displayUser?.nom || 'Non renseigné'}</p>
                  </div>
                  <div className="info-item">
                    <label>Prénom</label>
                    <p>{displayUser?.prenom || 'Non renseigné'}</p>
                  </div>
                  <div className="info-item">
                    <label>Téléphone</label>
                    <p>{displayUser?.telephone || 'Non renseigné'}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{displayUser?.email || 'Non renseigné'}</p>
                  </div>
                  <div className="info-item">
                    <label>Rôle</label>
                    <p className="role-badge">
                      {displayUser?.role === 'particulier' && '👤 Particulier'}
                      {displayUser?.role === 'entreprise' && '🏢 Entreprise'}
                      {displayUser?.role === 'coursier' && '🚴 Coursier'}
                      {displayUser?.role === 'admin' && '👑 Administrateur'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Compte vérifié</label>
                    <p>
                      {displayUser?.isVerified ? (
                        <span className="verified">✅ Oui</span>
                      ) : (
                        <span className="not-verified">❌ Non</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;


