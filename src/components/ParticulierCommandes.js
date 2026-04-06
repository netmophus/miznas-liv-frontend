import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { particulierService } from '../services/api';
import PageLayout from './PageLayout';
import './ParticulierCommandes.css';

/* ── Configuration des statuts ── */
const STATUTS = [
  { value: '',           label: 'Toutes',     icon: '📋' },
  { value: 'en_attente',    label: 'En attente',  icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { value: 'acceptee',      label: 'Acceptée',    icon: '✅', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'en_cours',      label: 'En cours',    icon: '🚴', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { value: 'colis_recupere',label: 'En livraison',icon: '📦', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'livree',        label: 'Livrée',      icon: '✅', color: '#10b981', bg: '#f0fdf4', border: '#86efac' },
  { value: 'annulee',       label: 'Annulée',     icon: '❌', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
];

const TYPE_LABELS = {
  livraison_directe:    { icon: '📦', label: 'Livraison directe' },
  collecte_livraison:   { icon: '🔄', label: 'Collecte + livraison' },
  depuis_etablissement: { icon: '🏪', label: 'Depuis établissement' },
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatMontant = (montant) =>
  new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const ParticulierCommandes = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [commandes,     setCommandes]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [statutFilter,  setStatutFilter]  = useState('');
  const [successBanner, setSuccessBanner] = useState(location.state?.success || false);
  const [lastRefresh,   setLastRefresh]   = useState(new Date());

  const fetchCommandes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await particulierService.getCommandes(statutFilter);
      if (response.success) {
        setCommandes(response.data.commandes);
        setLastRefresh(new Date());
        setError('');
      } else {
        setError('Erreur lors du chargement des commandes');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [statutFilter]);

  useEffect(() => {
    fetchCommandes();
    const interval = setInterval(() => fetchCommandes(true), 10000);
    return () => clearInterval(interval);
  }, [fetchCommandes]);

  useEffect(() => {
    if (successBanner) {
      const t = setTimeout(() => setSuccessBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [successBanner]);

  /* ── Compteurs par statut ── */
  const counts = STATUTS.reduce((acc, s) => {
    acc[s.value] = s.value === ''
      ? commandes.length
      : commandes.filter(c => c.statut === s.value).length;
    return acc;
  }, {});

  /* ── Statut config helper ── */
  const getStatut = (val) => STATUTS.find(s => s.value === val) || STATUTS[0];

  /* ── Loading screen ── */
  if (loading && commandes.length === 0) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="pc-loading">
          <div className="pc-spinner" />
          <p>Chargement de vos commandes…</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="pc-bg">
        <div className="pc-wrapper">

          {/* ── Bannière succès ── */}
          {successBanner && (
            <div className="pc-banner pc-banner--success">
              <span>🎉</span>
              <span>Commande créée avec succès ! Elle apparaîtra ici dès validation.</span>
              <button className="pc-banner-close" onClick={() => setSuccessBanner(false)}>✕</button>
            </div>
          )}

          {/* ── Bannière erreur ── */}
          {error && (
            <div className="pc-banner pc-banner--error">
              <span>⚠️</span>
              <span>{error}</span>
              <button className="pc-banner-close" onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* ════════════════════════════════
              EN-TÊTE
              ════════════════════════════════ */}
          <div className="pc-header">
            <div className="pc-header-left">
              <h1>Mes commandes</h1>
              <p>
                {commandes.length === 0
                  ? 'Aucune commande pour le moment'
                  : `${commandes.length} commande${commandes.length > 1 ? 's' : ''} au total`}
                <span className="pc-refresh-hint">
                  · Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {loading && <span className="pc-dot-pulse" />}
                </span>
              </p>
            </div>
            <button
              className="pc-btn-new"
              onClick={() => navigate('/particulier/commandes/create')}
            >
              <span>+</span> Nouvelle commande
            </button>
          </div>

          {/* ════════════════════════════════
              FILTRES PAR STATUT (pills)
              ════════════════════════════════ */}
          <div className="pc-filters">
            {STATUTS.map((s) => {
              const isActive = statutFilter === s.value;
              return (
                <button
                  key={s.value}
                  className={`pc-filter-pill ${isActive ? 'pc-filter-pill--active' : ''}`}
                  style={isActive && s.color ? {
                    background: s.bg,
                    borderColor: s.border,
                    color: s.color,
                  } : {}}
                  onClick={() => setStatutFilter(s.value)}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                  {counts[s.value] > 0 && (
                    <span
                      className="pc-filter-count"
                      style={isActive && s.color ? { background: s.color, color: 'white' } : {}}
                    >
                      {counts[s.value]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ════════════════════════════════
              LISTE
              ════════════════════════════════ */}
          {commandes.length === 0 ? (
            <EmptyState onNew={() => navigate('/particulier/commandes/create')} filtered={!!statutFilter} />
          ) : (
            <div className="pc-list">
              {commandes.map((commande) => (
                <CommandeCard
                  key={commande._id}
                  commande={commande}
                  getStatut={getStatut}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
};

/* ══════════════════════════════════════════════════
   CARTE COMMANDE
   ══════════════════════════════════════════════════ */
const CommandeCard = ({ commande, getStatut }) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  const statutInfo  = getStatut(commande.statut);
  const typeInfo    = TYPE_LABELS[commande.typeCommande] || { icon: '📦', label: 'Standard' };
  const TRACKABLE   = ['acceptee', 'en_cours', 'colis_recupere'];
  const canTrack    = TRACKABLE.includes(commande.statut) && commande.coursier;
  const canEdit     = commande.statut === 'en_attente' && !commande.coursier;
  const isDelivered = commande.statut === 'livree';
  const isCancelled = commande.statut === 'annulee';

  return (
    <div
      className={`pc-card ${isCancelled ? 'pc-card--cancelled' : ''} ${open ? 'pc-card--open' : ''}`}
      style={{ '--accent': statutInfo.color || '#667eea' }}
    >
      {/* Barre d'accent colorée */}
      <div className="pc-card-accent" style={{ background: statutInfo.color || '#667eea' }} />

      {/* ── Top : ID + date + statut + chevron ── */}
      <div className="pc-card-top pc-card-top--clickable" onClick={() => setOpen(o => !o)}>
        <div className="pc-card-id">
          <span className="pc-card-id-label">Commande</span>
          <span className="pc-card-id-value">#{commande._id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="pc-card-meta">
          <span className="pc-card-date">{formatDate(commande.dateCreation)}</span>
          <span
            className="pc-statut-badge"
            style={{
              background: statutInfo.bg,
              color: statutInfo.color,
              border: `1.5px solid ${statutInfo.border || 'transparent'}`,
            }}
          >
            {statutInfo.icon} {statutInfo.label}
          </span>
          <span className={`pc-chevron ${open ? 'pc-chevron--open' : ''}`}>›</span>
        </div>
      </div>

      {/* ── Résumé itinéraire (toujours visible) ── */}
      <div className="pc-card-summary" onClick={() => setOpen(o => !o)}>
        <span className="pc-summary-a">A</span>
        <span className="pc-summary-addr">{commande.adresseDepart}</span>
        <span className="pc-summary-arrow">→</span>
        <span className="pc-summary-b">B</span>
        <span className="pc-summary-addr">{commande.adresseArrivee}</span>
      </div>

      {/* ── Corps dépliable ── */}
      <div
        ref={bodyRef}
        className="pc-card-body"
        style={{
          maxHeight: open ? (bodyRef.current?.scrollHeight + 'px' || '800px') : '0px',
        }}
      >
        {/* Type de commande */}
        <div className="pc-card-type">
          <span>{typeInfo.icon}</span>
          <span>{typeInfo.label}</span>
        </div>

        {/* Itinéraire */}
        <div className="pc-card-route">
          <div className="pc-route-point">
            <div className="pc-route-dot pc-route-dot--a">A</div>
            <div className="pc-route-info">
              <span className="pc-route-label">Départ</span>
              <span className="pc-route-addr">{commande.adresseDepart}</span>
            </div>
          </div>
          <div className="pc-route-line">
            <div className="pc-route-line-inner" />
          </div>
          <div className="pc-route-point">
            <div className="pc-route-dot pc-route-dot--b">B</div>
            <div className="pc-route-info">
              <span className="pc-route-label">Arrivée</span>
              <span className="pc-route-addr">{commande.adresseArrivee}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {commande.description && (
          <div className="pc-card-desc">
            <span>📝</span>
            <span>{commande.description}</span>
          </div>
        )}

        {/* Infos complémentaires */}
        <div className="pc-card-infos">
          <div className="pc-info-chip pc-info-chip--price">
            <span>💰</span>
            <span>{formatMontant(commande.montant)}</span>
          </div>

          {commande.modePaiement && (
            <div className="pc-info-chip">
              <span>{commande.modePaiement === 'cash' ? '💵' : commande.modePaiement === 'mobile_money' ? '📱' : '💳'}</span>
              <span>{commande.modePaiement === 'cash' ? 'Espèces' : commande.modePaiement === 'mobile_money' ? 'Mobile Money' : 'Carte'}</span>
            </div>
          )}

          {commande.coursier && (
            <div className="pc-info-chip pc-info-chip--coursier">
              <span>🏍️</span>
              <span>
                {[commande.coursier.nom, commande.coursier.prenom].filter(Boolean).join(' ') || commande.coursier.telephone}
              </span>
            </div>
          )}

          {isDelivered && commande.dateLivraison && (
            <div className="pc-info-chip pc-info-chip--delivered">
              <span>✅</span>
              <span>Livrée le {formatDate(commande.dateLivraison)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(canEdit || canTrack || commande.statut === 'en_attente') && (
          <div className="pc-card-actions">
            {canEdit && (
              <Link
                to={`/particulier/commandes/edit/${commande._id}`}
                className="pc-action-btn pc-action-btn--edit"
              >
                ✏️ Modifier
              </Link>
            )}
            {canTrack && (
              <Link
                to={`/tracking/${commande._id}`}
                className="pc-action-btn pc-action-btn--track"
              >
                🗺️ Suivre en temps réel →
              </Link>
            )}
            {commande.statut === 'en_attente' && (
              <span className="pc-action-info">
                ⏳ En attente d'affectation par l'administrateur
              </span>
            )}
          </div>
        )}
      </div>{/* /pc-card-body */}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   ÉTAT VIDE
   ══════════════════════════════════════════════════ */
const EmptyState = ({ onNew, filtered }) => (
  <div className="pc-empty">
    <div className="pc-empty-icon">
      {filtered ? '🔍' : '📭'}
    </div>
    <h3>{filtered ? 'Aucun résultat' : 'Aucune commande'}</h3>
    <p>
      {filtered
        ? 'Aucune commande ne correspond à ce filtre. Essayez un autre statut.'
        : 'Vous n\'avez pas encore de commande. Créez-en une maintenant !'}
    </p>
    {!filtered && (
      <button className="pc-empty-btn" onClick={onNew}>
        + Créer ma première commande
      </button>
    )}
  </div>
);

export default ParticulierCommandes;
