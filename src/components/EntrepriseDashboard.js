import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import PageLayout from './PageLayout';
import './EntrepriseDashboard.css';

const EntrepriseDashboard = () => {
  const { user } = useAuth();
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
      <div className="entreprise-dashboard-container">
        <div className="entreprise-dashboard-card fade-in">
          <div className="dashboard-header">
            <div>
              <h1>🏢 Espace entreprise</h1>
              <p className="dashboard-subtitle">Bienvenue, {userInfo?.nom || user?.nom || 'Entreprise'}</p>
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
                <div className="info-icon">🏢</div>
                <div className="info-content">
                  <label>Nom de l'entreprise</label>
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
              <div className="info-icon">💼</div>
              <div className="info-content">
                <label>Type de compte</label>
                <p className="role-badge entreprise">Entreprise</p>
              </div>
            </div>
          </div>

          <div className="dashboard-actions">
            <div className="action-card">
              <h3>📦 Nouvelle commande</h3>
              <p>Créer une nouvelle commande de livraison</p>
              <button className="action-button">Créer une commande</button>
            </div>

            <div className="action-card">
              <h3>📋 Mes commandes</h3>
              <p>Voir toutes les commandes de l'entreprise</p>
              <button className="action-button">Voir les commandes</button>
            </div>

            <div className="action-card">
              <h3>📊 Statistiques</h3>
              <p>Consulter les statistiques de livraison</p>
              <button className="action-button">Voir les stats</button>
            </div>

            <div className="action-card">
              <h3>💳 Facturation</h3>
              <p>Gérer les factures et paiements mensuels</p>
              <button className="action-button">Voir la facturation</button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default EntrepriseDashboard;

