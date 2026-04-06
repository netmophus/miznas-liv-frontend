import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './ParticulierDashboard.css';

const ParticulierDashboard = () => {
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
        console.error('Erreur lors de la récupération des informations:', error);
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

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="particulier-dashboard-container">
        <div className="particulier-dashboard-card fade-in">
          <div className="dashboard-header">
            <div>
              <h1>👤 Mon espace particulier</h1>
              <p className="dashboard-subtitle">Bienvenue, {userInfo?.nom || user?.nom || 'Utilisateur'}</p>
            </div>
          </div>

          <div className="user-info">
            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <label>Téléphone</label>
                <p>{userInfo?.telephone || user?.telephone}</p>
              </div>
            </div>

            {userInfo?.nom && (
              <div className="info-card">
                <div className="info-icon">👤</div>
                <div className="info-content">
                  <label>Nom complet</label>
                  <p>{userInfo.nom} {userInfo.prenom}</p>
                </div>
              </div>
            )}

            {userInfo?.email && (
              <div className="info-card">
                <div className="info-icon">📧</div>
                <div className="info-content">
                  <label>Email</label>
                  <p>{userInfo.email}</p>
                </div>
              </div>
            )}

            <div className="info-card">
              <div className="info-icon">✅</div>
              <div className="info-content">
                <label>Statut</label>
                <p className="status-badge verified">
                  {userInfo?.isVerified ? 'Vérifié' : 'Non vérifié'}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="action-card">
              <h3>📦 Nouvelle livraison</h3>
              <p>Créer une nouvelle commande de livraison</p>
              <button
                className="action-button"
                onClick={() => navigate('/particulier/commandes/create')}
              >
                Créer une commande
              </button>
            </div>

            <div className="action-card">
              <h3>📋 Mes commandes</h3>
              <p>Voir toutes vos commandes</p>
              <button
                className="action-button"
                onClick={() => navigate('/particulier/commandes')}
              >
                Voir mes commandes
              </button>
            </div>

            <div className="action-card">
              <h3>💳 Paiements</h3>
              <p>Historique de vos paiements</p>
              <button className="action-button">Voir les paiements</button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ParticulierDashboard;

