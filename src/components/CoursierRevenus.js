import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursierService, authService } from '../services/api';
import PageLayout from './PageLayout';
import './CoursierRevenus.css';

const CoursierRevenus = () => {
  const [coursierInfo, setCoursierInfo] = useState(null);
  const [commandesLivrees, setCommandesLivrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursierResponse, commandesResponse] = await Promise.all([
        coursierService.getProfile(),
        coursierService.getCommandes('livree'),
      ]);

      if (coursierResponse.success) {
        setCoursierInfo(coursierResponse.data.coursier);
      }

      if (commandesResponse.success) {
        setCommandesLivrees(commandesResponse.data.commandes || []);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenus = coursierInfo?.revenus || 0;
  const totalLivraisons = commandesLivrees.length;
  const revenuMoyen = totalLivraisons > 0 ? Math.round(totalRevenus / totalLivraisons) : 0;

  if (loading) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des revenus...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="coursier-revenus-container">
        <div className="revenus-header">
          <Link to="/dashboard" className="btn-back">
            ← Retour
          </Link>
          <h1>💰 Mes revenus</h1>
        </div>

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        <div className="stats-cards">
          <div className="stat-card highlight">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Revenus totaux</h3>
              <p className="stat-value">{totalRevenus.toLocaleString('fr-FR')} FCFA</p>
              <p className="stat-note">50% du montant de chaque livraison</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>Livraisons effectuées</h3>
              <p className="stat-value">{totalLivraisons}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Revenu moyen</h3>
              <p className="stat-value">{revenuMoyen.toLocaleString('fr-FR')} FCFA</p>
              <p className="stat-note">Par livraison</p>
            </div>
          </div>
        </div>

        <div className="revenus-details">
          <h2>📋 Détail des livraisons</h2>
          {commandesLivrees.length === 0 ? (
            <div className="empty-state">
              <p>📭 Aucune livraison effectuée</p>
              <p className="empty-subtitle">Vos revenus apparaîtront ici après chaque livraison</p>
            </div>
          ) : (
            <div className="commandes-list">
              {commandesLivrees.map((commande) => (
                <div key={commande._id} className="commande-revenue-card">
                  <div className="commande-revenue-header">
                    <div>
                      <h3>Commande #{commande._id.slice(-6).toUpperCase()}</h3>
                      <p className="commande-date">
                        Livrée le {new Date(commande.dateLivraison).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="revenue-badge">
                      <span className="revenue-label">Votre gain</span>
                      <span className="revenue-amount">
                        {commande.montantCoursier || Math.round(commande.montant * 0.5)} FCFA
                      </span>
                    </div>
                  </div>
                  <div className="commande-revenue-details">
                    <div className="detail-row">
                      <span>📍 Départ:</span>
                      <span>{commande.adresseDepart}</span>
                    </div>
                    <div className="detail-row">
                      <span>🎯 Arrivée:</span>
                      <span>{commande.adresseArrivee}</span>
                    </div>
                    <div className="detail-row">
                      <span>💰 Montant total:</span>
                      <span>{commande.montant} FCFA</span>
                    </div>
                    <div className="detail-row highlight">
                      <span>💵 Votre part (50%):</span>
                      <span className="revenue-highlight">
                        {commande.montantCoursier || Math.round(commande.montant * 0.5)} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CoursierRevenus;


