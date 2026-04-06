import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursierService } from '../services/api';
import CoursierLocationTracker from './CoursierLocationTracker';
import PageLayout from './PageLayout';
import './CoursierCommandes.css';

const CoursierCommandes = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ── Modals ── */
  const [showRecupModal,   setShowRecupModal]   = useState(false);
  const [commandeToRecup,  setCommandeToRecup]  = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [commandeToConfirm, setCommandeToConfirm] = useState(null);

  /* ── Toast inline ── */
  const [toast, setToast] = useState({ type: '', msg: '' });

  /* ── Cartes dépliables ── */
  const [openCards, setOpenCards] = useState({});
  const toggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: '', msg: '' }), 4000);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const commandesRes = await coursierService.getCommandes();
      if (commandesRes.success) setCommandes(commandesRes.data.commandes);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  /* ── Démarrer ── */
  const handleDemarrer = async (commandeId) => {
    try {
      const response = await coursierService.demarrerLivraison(commandeId);
      if (response.success) {
        showToast('success', 'Livraison démarrée ! Le GPS est maintenant actif.');
        fetchData();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors du démarrage');
    }
  };

  /* ── Ouvrir modal récupération ── */
  const handleRecupererColis = (commande) => {
    setCommandeToRecup(commande);
    setShowRecupModal(true);
  };

  /* ── Confirmer récupération (action réelle) ── */
  const confirmRecuperation = async () => {
    if (!commandeToRecup) return;
    try {
      const response = await coursierService.recupererColis(commandeToRecup._id);
      if (response.success) {
        setShowRecupModal(false);
        setCommandeToRecup(null);
        const type = commandeToRecup.typeCommande;
        const msg =
          type === 'collecte_livraison'
            ? 'Colis récupéré ! Rendez-vous au point B — le destinataire vous paiera à l\'arrivée.'
            : type === 'depuis_etablissement'
            ? 'Commande récupérée ! Rendez-vous chez le destinataire qui vous paiera.'
            : 'Colis récupéré ! Vous pouvez maintenant livrer au destinataire.';
        showToast('success', msg);
        fetchData();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la récupération');
    }
  };

  /* ── Livrer ── */
  const handleLivrer = async (commandeId, typeCommande) => {
    try {
      const response = await coursierService.livrerCommande(commandeId);
      if (response.success) {
        const commande = response.data.commande;
        setCommandeToConfirm(commande);
        setShowPaymentModal(true);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la livraison';
      showToast('error', msg);
      console.error('Erreur livraison:', err.response?.data);
    }
  };

  /* ── Confirmer paiement ── */
  const handleConfirmerPaiement = async () => {
    if (!commandeToConfirm) return;
    try {
      const response = await coursierService.confirmerPaiement(commandeToConfirm._id);
      if (response.success) {
        showToast('success', 'Réception de l\'argent confirmée !');
        setShowPaymentModal(false);
        setCommandeToConfirm(null);
        fetchData();
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la confirmation');
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      en_attente:     { label: 'En attente',     class: 'pending',     icon: '⏳' },
      acceptee:       { label: 'Acceptée',        class: 'accepted',    icon: '✅' },
      en_cours:       { label: 'En cours',        class: 'in-progress', icon: '🚴' },
      colis_recupere: { label: 'Colis récupéré', class: 'collected',   icon: '📦' },
      livree:         { label: 'Livrée',          class: 'delivered',   icon: '✅' },
      annulee:        { label: 'Annulée',         class: 'cancelled',   icon: '❌' },
    };
    return badges[statut] || { label: statut, class: '', icon: '' };
  };

  if (loading && commandes.length === 0) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      </PageLayout>
    );
  }

  const commandeEnCours = commandes.find(c => c.statut === 'en_cours' || c.statut === 'acceptee');

  /* ── helpers for recup modal ── */
  const recupTitle = (type) => {
    if (type === 'collecte_livraison')   return 'Confirmer la récupération au point A';
    if (type === 'depuis_etablissement') return 'Confirmer la récupération au restaurant';
    return 'Confirmer la récupération du colis';
  };

  const recupIcon = (type) => {
    if (type === 'depuis_etablissement') return '🏪';
    return '📦';
  };

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      {commandeEnCours && <CoursierLocationTracker commandeId={commandeEnCours._id} />}

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`cc-toast cc-toast--${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="coursier-commandes-container">
        <div className="coursier-commandes-header">
          <h1>📦 Mes commandes</h1>
          <div className="info-message">
            <p>ℹ️ Les commandes vous sont affectées par l'administrateur. Vous verrez ici uniquement les commandes qui vous ont été assignées.</p>
          </div>
        </div>

        {error && (
          <div className="error-message"><p>⚠️ {error}</p></div>
        )}

        <div className="commandes-list">
          {commandes.length === 0 ? (
            <div className="empty-state">
              <p>📭 Aucune commande assignée</p>
              <p className="empty-subtitle">L'administrateur vous affectera des commandes lorsque disponibles</p>
            </div>
          ) : (
            commandes.map((commande) => {
              const statutInfo = getStatutBadge(commande.statut);
              const isOpen = !!openCards[commande._id];
              return (
                <div key={commande._id} className={`commande-card ${isOpen ? 'commande-card--open' : ''}`}>
                  {/* ── En-tête cliquable ── */}
                  <div className="commande-header commande-header--clickable" onClick={() => toggleCard(commande._id)}>
                    <div>
                      <h3>Commande #{commande._id.slice(-6).toUpperCase()}</h3>
                      <p className="commande-client">Client: {commande.client?.nom || ''} {commande.client?.prenom || ''}</p>
                      <p className="commande-phone">{commande.client?.telephone}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={`statut-badge ${statutInfo.class}`}>
                        {statutInfo.icon} {statutInfo.label}
                      </span>
                      <span className={`cc-chevron ${isOpen ? 'cc-chevron--open' : ''}`}>›</span>
                    </div>
                  </div>

                  {/* ── Résumé adresses (toujours visible) ── */}
                  <div className="cc-card-summary" onClick={() => toggleCard(commande._id)}>
                    <span className="cc-summary-dot cc-summary-dot--a">A</span>
                    <span className="cc-summary-addr">{commande.adresseDepart}</span>
                    <span className="cc-summary-arrow">→</span>
                    <span className="cc-summary-dot cc-summary-dot--b">B</span>
                    <span className="cc-summary-addr">{commande.adresseArrivee}</span>
                  </div>

                  {/* ── Corps dépliable ── */}
                  <div className={`cc-card-body ${isOpen ? 'cc-card-body--open' : ''}`}>
                  <div className="commande-details">
                    <div className="detail-item">
                      <span className="detail-label">
                        {commande.typeCommande === 'collecte_livraison'
                          ? '📍 Point A (Récupération):'
                          : commande.typeCommande === 'depuis_etablissement'
                          ? '📍 Restaurant/Établissement:'
                          : '📍 Départ:'}
                      </span>
                      <span className="detail-value">{commande.adresseDepart}</span>
                    </div>

                    {(commande.typeCommande === 'collecte_livraison' || commande.typeCommande === 'depuis_etablissement') && commande.contactPointA && (
                      <div className="detail-item highlight-contact">
                        <span className="detail-label">
                          📞 {commande.typeCommande === 'depuis_etablissement' ? 'Contact restaurant:' : 'Contact point A:'}
                        </span>
                        <span className="detail-value">
                          {commande.contactPointA.nom} — {commande.contactPointA.telephone}
                          {commande.contactPointA.instructions && (
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '5px' }}>
                              💡 {commande.contactPointA.instructions}
                            </div>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="detail-item">
                      <span className="detail-label">
                        {commande.typeCommande === 'collecte_livraison'
                          ? '🎯 Point B (Livraison - Paiement):'
                          : commande.typeCommande === 'depuis_etablissement'
                          ? '🎯 Destination (Livraison - Paiement):'
                          : '🎯 Arrivée:'}
                      </span>
                      <span className="detail-value">{commande.adresseArrivee}</span>
                    </div>

                    {commande.description && (
                      <div className="detail-item" style={commande.typeCommande === 'depuis_etablissement' ? { backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' } : {}}>
                        <span className="detail-label">
                          📝 {commande.typeCommande === 'depuis_etablissement' ? 'Commande à récupérer:' : 'Description:'}
                        </span>
                        <span className="detail-value">{commande.description}</span>
                      </div>
                    )}

                    {commande.typeCommande && (
                      <div className="detail-item">
                        <span className="detail-label">📋 Type:</span>
                        <span className="detail-value">
                          {commande.typeCommande === 'livraison_directe'    && '📦 Livraison directe'}
                          {commande.typeCommande === 'collecte_livraison'   && '🔄 Collecte + Livraison'}
                          {commande.typeCommande === 'depuis_etablissement' && '🏪 Depuis établissement'}
                        </span>
                      </div>
                    )}

                    <div className="detail-item highlight-contact">
                      <span className="detail-label">
                        📞 Contact point B (destinataire{commande.typeCommande !== 'livraison_directe' ? ' — vous serez payé ici' : ''}):
                      </span>
                      <span className="detail-value">
                        {commande.nomDestinataire} — {commande.telephoneDestinataire}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">💰 Montant commande:</span>
                      <span className="detail-value">{commande.montant} FCFA</span>
                    </div>

                    {commande.statut === 'livree' && commande.montantCoursier && (
                      <div className="detail-item highlight-revenue">
                        <span className="detail-label">💵 Votre gain:</span>
                        <span className="detail-value revenue-amount">{commande.montantCoursier} FCFA (50%)</span>
                      </div>
                    )}

                    <div className="detail-item">
                      <span className="detail-label">📅 Date:</span>
                      <span className="detail-value">{new Date(commande.dateCreation).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>{/* /commande-details */}

                  <div className="commande-actions">
                    {commande.statut === 'acceptee' && (
                      <>
                        <button className="btn-action btn-start" onClick={() => handleDemarrer(commande._id)}>
                          🚴 Démarrer la livraison
                        </button>
                        <Link to={`/coursier/tracking/${commande._id}`} className="btn-action btn-track">
                          🗺️ Voir sur la carte
                        </Link>
                      </>
                    )}

                    {commande.statut === 'en_cours' && (
                      <>
                        <Link to={`/coursier/tracking/${commande._id}`} className="btn-action btn-track">
                          🗺️ Suivre sur la carte
                        </Link>
                        <button
                          className="btn-action btn-collect"
                          onClick={() => handleRecupererColis(commande)}
                        >
                          {commande.typeCommande === 'livraison_directe'
                            ? '📦 Confirmer récupération chez le client'
                            : commande.typeCommande === 'collecte_livraison'
                            ? '📦 Confirmer récupération au point A'
                            : '📦 Confirmer récupération au restaurant'}
                        </button>
                      </>
                    )}

                    {commande.statut === 'colis_recupere' && (
                      <>
                        <Link to={`/coursier/tracking/${commande._id}`} className="btn-action btn-track">
                          🗺️ Suivre sur la carte
                        </Link>
                        <button
                          className="btn-action btn-deliver"
                          onClick={() => handleLivrer(commande._id, commande.typeCommande)}
                        >
                          ✅ {commande.typeCommande === 'livraison_directe'
                            ? 'Marquer comme livrée'
                            : 'Livrer au destinataire (qui vous paiera)'}
                        </button>
                      </>
                    )}

                    {commande.statut === 'livree' && (
                      <>
                        <span className="delivered-badge">
                          ✅ Livrée le {new Date(commande.dateLivraison).toLocaleDateString('fr-FR')}
                        </span>
                        {!commande.estPaye && (
                          <button
                            className="btn-action btn-confirm-payment"
                            onClick={() => { setCommandeToConfirm(commande); setShowPaymentModal(true); }}
                          >
                            💰 Confirmer la réception de l'argent
                          </button>
                        )}
                        {commande.estPaye && <span className="paid-badge">✅ Paiement confirmé</span>}
                      </>
                    )}
                  </div>{/* /commande-actions */}
                  </div>{/* /cc-card-body */}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MODAL — Récupération colis (Point A)
      ══════════════════════════════════════════ */}
      {showRecupModal && commandeToRecup && (
        <div className="modal-overlay" onClick={() => { setShowRecupModal(false); setCommandeToRecup(null); }}>
          <div className="modal-content recup-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="recup-modal-header">
              <div className="recup-modal-icon">{recupIcon(commandeToRecup.typeCommande)}</div>
              <div className="recup-modal-title">
                <h2>{recupTitle(commandeToRecup.typeCommande)}</h2>
                <span className="recup-modal-id">#{commandeToRecup._id.slice(-6).toUpperCase()}</span>
              </div>
              <button className="modal-close" onClick={() => { setShowRecupModal(false); setCommandeToRecup(null); }}>×</button>
            </div>

            {/* Body */}
            <div className="modal-body">

              {/* Route A → B */}
              <div className="recup-route">

                {/* Point A */}
                <div className="recup-point recup-point--a">
                  <div className="recup-dot recup-dot--a">A</div>
                  <div className="recup-point-body">
                    <div className="recup-point-label">
                      {commandeToRecup.typeCommande === 'depuis_etablissement'
                        ? 'Restaurant / Établissement'
                        : 'Point A — Récupération du colis'}
                    </div>
                    <div className="recup-point-addr">{commandeToRecup.adresseDepart}</div>
                    {commandeToRecup.contactPointA && (
                      <div className="recup-contact">
                        <span>📞 {commandeToRecup.contactPointA.nom}</span>
                        {commandeToRecup.contactPointA.telephone && (
                          <span>📱 {commandeToRecup.contactPointA.telephone}</span>
                        )}
                        {commandeToRecup.contactPointA.instructions && (
                          <span className="recup-instructions">
                            💡 {commandeToRecup.contactPointA.instructions}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connecteur */}
                <div className="recup-connector">
                  <div className="recup-vline" />
                  <div className="recup-arrow">↓</div>
                  <div className="recup-vline" />
                </div>

                {/* Point B */}
                <div className="recup-point recup-point--b">
                  <div className="recup-dot recup-dot--b">B</div>
                  <div className="recup-point-body">
                    <div className="recup-point-label">
                      {commandeToRecup.typeCommande === 'livraison_directe'
                        ? 'Arrivée — Destinataire'
                        : 'Point B — Livraison & Paiement'}
                    </div>
                    <div className="recup-point-addr">{commandeToRecup.adresseArrivee}</div>
                    <div className="recup-contact">
                      <span>📞 {commandeToRecup.nomDestinataire}</span>
                      {commandeToRecup.telephoneDestinataire && (
                        <span>📱 {commandeToRecup.telephoneDestinataire}</span>
                      )}
                      {commandeToRecup.instructionsDestinataire && (
                        <span className="recup-instructions">
                          💡 {commandeToRecup.instructionsDestinataire}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bandeau paiement */}
              {commandeToRecup.typeCommande !== 'livraison_directe' && (
                <div className="recup-payment-banner">
                  <div className="recup-payment-icon">💰</div>
                  <div className="recup-payment-text">
                    <strong>Le destinataire vous paiera à la livraison</strong>
                    <span>
                      Après confirmation, rendez-vous au point B.
                      Le destinataire vous réglera la course en échange du colis.
                    </span>
                  </div>
                  <div className="recup-payment-amount">
                    {Number(commandeToRecup.montant || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              )}

              {/* Description / commande */}
              {commandeToRecup.description && (
                <div className="recup-desc">
                  <span className="recup-desc-label">
                    {commandeToRecup.typeCommande === 'depuis_etablissement' ? '🍽️ Commande à récupérer' : '📝 Contenu du colis'}
                  </span>
                  <span className="recup-desc-text">{commandeToRecup.description}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                className="btn-modal btn-cancel"
                onClick={() => { setShowRecupModal(false); setCommandeToRecup(null); }}
              >
                Pas encore
              </button>
              <button className="btn-modal btn-confirm-recup" onClick={confirmRecuperation}>
                ✅ J'ai récupéré le colis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL — Confirmation paiement
      ══════════════════════════════════════════ */}
      {showPaymentModal && commandeToConfirm && (
        <div className="modal-overlay" onClick={() => { setShowPaymentModal(false); setCommandeToConfirm(null); }}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Confirmer la réception de l'argent</h2>
              <button className="modal-close" onClick={() => { setShowPaymentModal(false); setCommandeToConfirm(null); }}>×</button>
            </div>
            <div className="modal-body">
              <p className="payment-info">
                Commande <strong>#{commandeToConfirm._id.slice(-6).toUpperCase()}</strong> marquée comme livrée.
              </p>
              {commandeToConfirm.typeCommande !== 'livraison_directe' && (
                <p className="payment-info" style={{ color: '#059669', fontWeight: '600' }}>
                  💰 Le destinataire au point B vous a réglé la course.
                </p>
              )}
              <div className="payment-details">
                <div className="payment-detail-item">
                  <span className="payment-label">Montant total:</span>
                  <span className="payment-value">{commandeToConfirm.montant} FCFA</span>
                </div>
                {commandeToConfirm.montantCoursier && (
                  <div className="payment-detail-item highlight">
                    <span className="payment-label">Votre gain (50%):</span>
                    <span className="payment-value revenue">{commandeToConfirm.montantCoursier} FCFA</span>
                  </div>
                )}
              </div>
              <p className="payment-question">
                {commandeToConfirm.typeCommande !== 'livraison_directe'
                  ? 'Avez-vous bien reçu l\'argent du destinataire ?'
                  : 'Avez-vous bien reçu le paiement ?'}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => { setShowPaymentModal(false); setCommandeToConfirm(null); }}>
                Annuler
              </button>
              <button className="btn-modal btn-confirm" onClick={handleConfirmerPaiement}>
                ✅ Oui, j'ai reçu l'argent
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default CoursierCommandes;
