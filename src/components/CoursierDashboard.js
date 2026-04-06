import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, coursierService } from '../services/api';
import PageLayout from './PageLayout';
import './CoursierDashboard.css';

const CoursierDashboard = () => {
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [coursierInfo, setCoursierInfo] = useState(null);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, coursierResponse, soldeResponse] = await Promise.all([
          authService.getMe(),
          coursierService.getProfile().catch(() => ({ success: false })),
          coursierService.getSolde().catch(() => null),
        ]);

        if (userResponse.success) {
          setUserInfo(userResponse.user);
        }

        if (coursierResponse.success) {
          setCoursierInfo(coursierResponse.data.coursier);
        }

        if (soldeResponse?.success) {
          setSolde(soldeResponse.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const getStatutBadge = (statut) => {
    const badges = {
      disponible: { label: 'Disponible', class: 'available', icon: '✅' },
      en_livraison: { label: 'En livraison', class: 'delivering', icon: '🚴' },
      hors_service: { label: 'Hors service', class: 'offline', icon: '⛔' },
    };
    return badges[statut] || { label: statut, class: '', icon: '' };
  };

  if (!coursierInfo) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="coursier-dashboard-container">
          <div className="coursier-dashboard-card fade-in">
            <div className="not-coursier-message">
              <h2>🚴 Vous n'êtes pas encore coursier</h2>
              <p>Pour devenir coursier, vous devez être validé par un administrateur.</p>
              <p>Contactez l'administration pour plus d'informations.</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const statutInfo = getStatutBadge(coursierInfo.statut);

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="coursier-dashboard-container">
        <div className="coursier-dashboard-card fade-in">
          <div className="dashboard-header">
            <div>
              <h1>🚴 Espace coursier</h1>
              <p className="dashboard-subtitle">
                Bienvenue, {userInfo?.nom || user?.nom || 'Coursier'}
              </p>
            </div>
          </div>

          {!coursierInfo.estActif && (
            <div className="alert-warning">
              <span>⏳</span>
              <span>Votre compte est en attente de validation par un administrateur</span>
            </div>
          )}

          <div className="user-info">
            <div className="info-card">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <label>Téléphone</label>
                <p>{userInfo?.telephone || user?.telephone}</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🚴</div>
              <div className="info-content">
                <label>Statut</label>
                <p className={`statut-badge ${statutInfo.class}`}>
                  {statutInfo.icon} {statutInfo.label}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">🚗</div>
              <div className="info-content">
                <label>Véhicule</label>
                <p>
                  {coursierInfo.vehicule?.type || 'Non spécifié'}
                  {coursierInfo.vehicule?.marque && ` - ${coursierInfo.vehicule.marque}`}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📦</div>
              <div className="info-content">
                <label>Livraisons</label>
                <p>{coursierInfo.nombreLivraisons || 0} livraisons</p>
              </div>
            </div>

            <div className="info-card highlight-revenue">
              <div className="info-icon">💰</div>
              <div className="info-content">
                <label>Revenus totaux</label>
                <p className="revenue-amount">
                  {coursierInfo.revenus ? coursierInfo.revenus.toLocaleString('fr-FR') : 0} FCFA
                </p>
                <p className="revenue-note">50% du montant de chaque livraison</p>
              </div>
            </div>

            {coursierInfo.note > 0 && (
              <div className="info-card">
                <div className="info-icon">⭐</div>
                <div className="info-content">
                  <label>Note</label>
                  <p>
                    {'⭐'.repeat(Math.round(coursierInfo.note))} ({coursierInfo.note.toFixed(1)})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Caisse banner ── */}
          {solde && solde.montantTotalCollecte > 0 && (
            <div className="cd-caisse-banner">
              <div className="cd-caisse-header">
                <span className="cd-caisse-dot" />
                <span className="cd-caisse-title">💼 Argent en votre possession</span>
                <span className="cd-caisse-nb">
                  {solde.nombreCommandes} livraison{solde.nombreCommandes > 1 ? 's' : ''}
                </span>
              </div>
              <div className="cd-caisse-amounts">
                <div className="cd-caisse-item cd-caisse-item--total">
                  <span className="cd-caisse-label">Total en caisse</span>
                  <span className="cd-caisse-value">
                    {Number(solde.montantTotalCollecte).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="cd-caisse-sep" />
                <div className="cd-caisse-item cd-caisse-item--comm">
                  <span className="cd-caisse-label">Votre commission (50%)</span>
                  <span className="cd-caisse-value">
                    {Number(solde.montantCommission).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="cd-caisse-sep" />
                <div className="cd-caisse-item cd-caisse-item--agence">
                  <span className="cd-caisse-label">À remettre à l'agence</span>
                  <span className="cd-caisse-value">
                    {Number(solde.montantAgence).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
              <div className="cd-caisse-notice">
                ⚠️ Rapportez ces fonds à l'agence dès que possible pour régulariser votre caisse.
              </div>
            </div>
          )}

          <div className="dashboard-actions">
            <div className="action-card">
              <h3>📋 Mes commandes</h3>
              <p>Voir et gérer toutes vos commandes</p>
              <Link
                to="/coursier/commandes"
                className="action-button"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                {coursierInfo.estActif ? 'Voir mes commandes' : 'Non disponible'}
              </Link>
            </div>

            <div className="action-card">
              <h3>💰 Revenus</h3>
              <p>Consulter mes revenus et paiements</p>
              <Link
                to="/coursier/revenus"
                className="action-button"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                {coursierInfo.estActif ? 'Voir mes revenus' : 'Non disponible'}
              </Link>
            </div>

            <div className="action-card">
              <h3>⚙️ Mon profil</h3>
              <p>Voir mes informations de coursier</p>
              <button className="action-button" onClick={() => window.location.reload()}>
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CoursierDashboard;

