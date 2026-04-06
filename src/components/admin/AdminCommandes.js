import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import './AdminCommandes.css';

/* ── Config statuts ── */
const STATUTS = [
  { value: '',               label: 'Toutes',          icon: '📋' },
  { value: 'en_attente',     label: 'En attente',      icon: '⏳', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { value: 'acceptee',       label: 'Acceptée',        icon: '✅', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  { value: 'en_cours',       label: 'En route',        icon: '🚴', color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
  { value: 'colis_recupere', label: 'Colis récupéré',  icon: '📦', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'livree',         label: 'Livrée',          icon: '🏁', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
  { value: 'annulee',        label: 'Annulée',         icon: '❌', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
];

/* Étapes de progression d'une livraison active */
const LIVE_STEPS = [
  { statut: 'acceptee',       icon: '✅', label: 'Acceptée' },
  { statut: 'en_cours',       icon: '🚴', label: 'En route' },
  { statut: 'colis_recupere', icon: '📦', label: 'Récupéré' },
  { statut: 'livree',         icon: '🏁', label: 'Livrée' },
];

const ACTIVE_STATUTS = ['acceptee', 'en_cours', 'colis_recupere'];

const TYPE_LABELS = {
  livraison_directe:    { icon: '📦', label: 'Livraison directe' },
  collecte_livraison:   { icon: '🔄', label: 'Collecte + livraison' },
  depuis_etablissement: { icon: '🏪', label: 'Depuis établissement' },
};

const VEHICULE_ICONS = { moto: '🏍️', velo: '🚲', voiture: '🚗', pied: '🚶' };

const getStatut = (val) => STATUTS.find(s => s.value === val) || STATUTS[0];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatMontant = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const AdminCommandes = () => {
  const [commandes,        setCommandes]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [notif,            setNotif]            = useState(null);
  const [pagination,       setPagination]       = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statutFilter,     setStatutFilter]     = useState('');
  const [search,           setSearch]           = useState('');
  /* ── Cartes dépliables ── */
  const [openCards, setOpenCards] = useState({});
  const toggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  /* Modal affectation */
  const [showAffectModal,  setShowAffectModal]  = useState(false);
  const [commandeToAffect, setCommandeToAffect] = useState(null);
  const [coursiers,        setCoursiers]        = useState([]);
  const [loadingCoursiers, setLoadingCoursiers] = useState(false);
  const [selectedCoursier, setSelectedCoursier] = useState(null);
  const [affecting,        setAffecting]        = useState(false);

  /* ── Notification ── */
  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4500);
  };

  /* ── Fetch commandes ── */
  const fetchCommandes = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await adminService.getCommandes(pagination.page, pagination.limit, statutFilter);
      if (res.success) {
        setCommandes(res.data.commandes);
        setPagination(res.data.pagination);
      } else {
        showNotif('error', 'Erreur lors du chargement des commandes');
      }
    } catch {
      showNotif('error', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, statutFilter]);

  useEffect(() => { fetchCommandes(); }, [fetchCommandes]);

  /* ── Auto-refresh toutes les 10 s pour les livraisons actives ── */
  useEffect(() => {
    const interval = setInterval(() => fetchCommandes(true), 10000);
    return () => clearInterval(interval);
  }, [fetchCommandes]);

  /* ── Stats locales ── */
  const counts = useMemo(() =>
    STATUTS.reduce((acc, s) => {
      acc[s.value] = s.value === ''
        ? pagination.total
        : commandes.filter(c => c.statut === s.value).length;
      return acc;
    }, {}),
  [commandes, pagination.total]);

  /* ── Livraisons actives (toutes pages confondues via filtre local) ── */
  const activeDeliveries = useMemo(() =>
    commandes.filter(c => ACTIVE_STATUTS.includes(c.statut)),
  [commandes]);

  /* ── Recherche locale ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return commandes;
    const q = search.toLowerCase();
    return commandes.filter(c =>
      c._id.slice(-6).toLowerCase().includes(q) ||
      (c.client?.telephone || '').toLowerCase().includes(q) ||
      [c.client?.nom, c.client?.prenom].filter(Boolean).join(' ').toLowerCase().includes(q) ||
      (c.adresseDepart  || '').toLowerCase().includes(q) ||
      (c.adresseArrivee || '').toLowerCase().includes(q)
    );
  }, [commandes, search]);

  /* ── Changer statut filter ── */
  const changeStatut = (val) => {
    setStatutFilter(val);
    setPagination(p => ({ ...p, page: 1 }));
  };

  /* ── Fetch coursiers disponibles ── */
  const fetchCoursiersDisponibles = async () => {
    setLoadingCoursiers(true);
    try {
      const res = await adminService.getCoursiers('disponible');
      if (res.success) {
        setCoursiers(res.data.coursiers.filter(c => c.estActif && c.statut === 'disponible'));
      }
    } catch {
      showNotif('error', 'Impossible de charger les coursiers disponibles');
    } finally {
      setLoadingCoursiers(false);
    }
  };

  /* ── Ouvrir modal affectation ── */
  const openAffectModal = (commande) => {
    setCommandeToAffect(commande);
    setSelectedCoursier(null);
    fetchCoursiersDisponibles();
    setShowAffectModal(true);
  };
  const closeAffectModal = () => {
    setShowAffectModal(false);
    setCommandeToAffect(null);
    setSelectedCoursier(null);
  };

  /* ── Affecter ── */
  const handleAffecter = async () => {
    if (!selectedCoursier) { showNotif('error', 'Veuillez sélectionner un coursier'); return; }
    setAffecting(true);
    try {
      const res = await adminService.affecterCommande(commandeToAffect._id, selectedCoursier.user._id);
      if (res.success) {
        showNotif('success', 'Commande affectée avec succès !');
        closeAffectModal();
        fetchCommandes(true);
      } else {
        showNotif('error', res.message || 'Erreur lors de l\'affectation');
      }
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Erreur lors de l\'affectation');
    } finally {
      setAffecting(false);
    }
  };

  /* ── Loading initial ── */
  if (loading && commandes.length === 0) {
    return (
      <div className="acm-loading">
        <div className="acm-spinner" />
        <p>Chargement des commandes…</p>
      </div>
    );
  }

  return (
    <div className="acm-page">

      {/* ── Notification ── */}
      {notif && (
        <div className={`acm-notif acm-notif--${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notif.msg}</span>
          <button onClick={() => setNotif(null)}>✕</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="acm-topbar">
        <div className="acm-topbar-left">
          <h1 className="acm-page-title">Commandes</h1>
          <span className="acm-total-badge">{pagination.total} au total</span>
          {refreshing && <span className="acm-dot-pulse" />}
        </div>
        <button className="acm-refresh-btn" onClick={() => fetchCommandes(true)} disabled={refreshing}>
          <span className={refreshing ? 'acm-spin' : ''}>🔄</span> Actualiser
        </button>
      </div>

      {/* ════════════════════════════════════════════
          OPÉRATIONS EN DIRECT
          ════════════════════════════════════════════ */}
      {activeDeliveries.length > 0 && (
        <div className="acm-live-panel">
          <div className="acm-live-header">
            <span className="acm-live-dot" />
            <span className="acm-live-title">
              {activeDeliveries.length} livraison{activeDeliveries.length > 1 ? 's' : ''} en cours
            </span>
            {refreshing && <span className="acm-dot-pulse" style={{ marginLeft: 8 }} />}
          </div>

          <div className="acm-live-rows">
            {activeDeliveries.map((c) => {
              const sc        = getStatut(c.statut);
              const stepIdx   = LIVE_STEPS.findIndex(s => s.statut === c.statut);
              const coursierNom = [c.coursier?.nom, c.coursier?.prenom].filter(Boolean).join(' ') || '—';
              const initials  = (c.coursier?.nom?.[0] || '') + (c.coursier?.prenom?.[0] || '');
              return (
                <div key={c._id} className="acm-live-row">
                  {/* Coursier */}
                  <div className="acm-live-coursier">
                    <div className="acm-live-avatar">
                      {initials.toUpperCase() || '?'}
                    </div>
                    <div className="acm-live-coursier-info">
                      <span className="acm-live-coursier-name">{coursierNom}</span>
                      {c.coursier?.telephone && (
                        <span className="acm-live-coursier-phone">{c.coursier.telephone}</span>
                      )}
                    </div>
                  </div>

                  {/* Route compacte */}
                  <div className="acm-live-route">
                    <span className="acm-live-route-a" title={c.adresseDepart}>
                      <span className="acm-live-dot-a">A</span> {c.adresseDepart}
                    </span>
                    <span className="acm-live-arrow">→</span>
                    <span className="acm-live-route-b" title={c.adresseArrivee}>
                      <span className="acm-live-dot-b">B</span> {c.adresseArrivee}
                    </span>
                  </div>

                  {/* Mini stepper */}
                  <div className="acm-live-stepper">
                    {LIVE_STEPS.map((step, i) => (
                      <React.Fragment key={step.statut}>
                        <div
                          className={`acm-live-step ${i === stepIdx ? 'acm-live-step--active' : ''} ${i < stepIdx ? 'acm-live-step--done' : ''}`}
                          title={step.label}
                        >
                          {i < stepIdx ? '✓' : step.icon}
                        </div>
                        {i < LIVE_STEPS.length - 1 && (
                          <div className={`acm-live-step-line ${i < stepIdx ? 'acm-live-step-line--done' : ''}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Statut badge + lien */}
                  <div className="acm-live-actions">
                    <span
                      className="acm-live-badge"
                      style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border || 'transparent'}` }}
                    >
                      {sc.icon} {sc.label}
                    </span>
                    <Link to={`/tracking/${c._id}`} className="acm-live-track-btn">
                      🗺️ Suivre
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Filtres pills ── */}
      <div className="acm-filters">
        {STATUTS.map((s) => {
          const active = statutFilter === s.value;
          return (
            <button
              key={s.value}
              className={`acm-filter-pill ${active ? 'acm-filter-pill--active' : ''}`}
              style={active && s.color ? { background: s.bg, borderColor: s.border, color: s.color } : {}}
              onClick={() => changeStatut(s.value)}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {counts[s.value] > 0 && (
                <span
                  className="acm-filter-count"
                  style={active && s.color ? { background: s.color, color: 'white' } : {}}
                >
                  {counts[s.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Recherche ── */}
      <div className="acm-search-wrap">
        <span className="acm-search-icon">🔍</span>
        <input
          className="acm-search"
          type="text"
          placeholder="Rechercher par ID, client, adresse…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button className="acm-search-clear" onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div className="acm-empty">
          <div className="acm-empty-icon">{search || statutFilter ? '🔍' : '📭'}</div>
          <h3>{search || statutFilter ? 'Aucun résultat' : 'Aucune commande'}</h3>
          <p>
            {search || statutFilter
              ? 'Essayez d\'autres critères de recherche.'
              : 'Aucune commande n\'a encore été créée.'}
          </p>
        </div>
      ) : (
        <div className="acm-list">
          {filtered.map((commande) => {
            const sc       = getStatut(commande.statut);
            const typeInfo   = TYPE_LABELS[commande.typeCommande] || { icon: '📦', label: 'Standard' };
            const canTrack   = ACTIVE_STATUTS.includes(commande.statut) && commande.coursier;
            const canAffect  = commande.statut === 'en_attente' && !commande.coursier;
            const isActive   = ACTIVE_STATUTS.includes(commande.statut);
            const activeStep = LIVE_STEPS.findIndex(s => s.statut === commande.statut);
            const isOpen     = !!openCards[commande._id];
            return (
              <div key={commande._id} className={`acm-card ${commande.statut === 'annulee' ? 'acm-card--cancelled' : ''} ${isOpen ? 'acm-card--open' : ''}`}>
                {/* Accent gauche */}
                <div className="acm-card-accent" style={{ background: sc.color || '#e5e7eb' }} />

                {/* Top row — cliquable */}
                <div className="acm-card-top acm-card-top--clickable" onClick={() => toggleCard(commande._id)}>
                  <div className="acm-card-id">
                    <span className="acm-card-id-label">Commande</span>
                    <span className="acm-card-id-value">#{commande._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="acm-card-meta">
                    <span className="acm-card-date">{formatDate(commande.dateCreation)}</span>
                    <span
                      className="acm-statut-badge"
                      style={{ background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border || 'transparent'}` }}
                    >
                      {sc.icon} {sc.label}
                    </span>
                    <span className={`acm-chevron ${isOpen ? 'acm-chevron--open' : ''}`}>›</span>
                  </div>
                </div>

                {/* Résumé adresses — toujours visible */}
                <div className="acm-card-summary" onClick={() => toggleCard(commande._id)}>
                  <span className="acm-summary-dot acm-summary-dot--a">A</span>
                  <span className="acm-summary-addr">{commande.adresseDepart || '—'}</span>
                  <span className="acm-summary-arrow">→</span>
                  <span className="acm-summary-dot acm-summary-dot--b">B</span>
                  <span className="acm-summary-addr">{commande.adresseArrivee || '—'}</span>
                </div>

                {/* Corps dépliable */}
                <div className={`acm-card-body ${isOpen ? 'acm-card-body--open' : ''}`}>

                  {/* Type */}
                  <div className="acm-card-type">
                    <span>{typeInfo.icon}</span>
                    <span>{typeInfo.label}</span>
                  </div>

                  {/* Route */}
                  <div className="acm-card-route">
                    <div className="acm-route-point">
                      <div className="acm-route-dot acm-route-dot--a">A</div>
                      <div className="acm-route-info">
                        <span className="acm-route-label">Départ</span>
                        <span className="acm-route-addr">{commande.adresseDepart || '—'}</span>
                      </div>
                    </div>
                    <div className="acm-route-line"><div className="acm-route-line-inner" /></div>
                    <div className="acm-route-point">
                      <div className="acm-route-dot acm-route-dot--b">B</div>
                      <div className="acm-route-info">
                        <span className="acm-route-label">Arrivée</span>
                        <span className="acm-route-addr">{commande.adresseArrivee || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stepper de progression — livraisons actives */}
                  {isActive && (
                    <div className="acm-stepper">
                      {LIVE_STEPS.map((step, i) => {
                        const done   = i < activeStep;
                        const active = i === activeStep;
                        return (
                          <React.Fragment key={step.statut}>
                            <div className={`acm-step ${active ? 'acm-step--active' : ''} ${done ? 'acm-step--done' : ''}`}>
                              <div className="acm-step-bubble">{done ? '✓' : step.icon}</div>
                              <span className="acm-step-label">{step.label}</span>
                            </div>
                            {i < LIVE_STEPS.length - 1 && (
                              <div className={`acm-step-line ${done ? 'acm-step-line--done' : active ? 'acm-step-line--active' : ''}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Chips infos */}
                  <div className="acm-card-chips">
                    <span className="acm-chip acm-chip--client">
                      👤 {[commande.client?.nom, commande.client?.prenom].filter(Boolean).join(' ') || commande.client?.telephone || '—'}
                    </span>
                    <span className="acm-chip acm-chip--price">
                      💰 {formatMontant(commande.montant)}
                      {commande.estPaye && <span className="acm-paid-dot" title="Payé">✓</span>}
                    </span>
                    {commande.coursier ? (
                      <span className="acm-chip acm-chip--coursier">
                        🏍️ {[commande.coursier.nom, commande.coursier.prenom].filter(Boolean).join(' ') || commande.coursier.telephone}
                      </span>
                    ) : (
                      <span className="acm-chip acm-chip--no-coursier">⏳ Non assigné</span>
                    )}
                    {commande.statut === 'livree' && commande.dateLivraison && (
                      <span className="acm-chip acm-chip--delivered">
                        ✅ Livré le {formatDate(commande.dateLivraison)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {(canAffect || canTrack) && (
                    <div className="acm-card-actions">
                      {canAffect && (
                        <button className="acm-btn-affect" onClick={() => openAffectModal(commande)}>
                          👤 Affecter un coursier
                        </button>
                      )}
                      {canTrack && (
                        <Link to={`/tracking/${commande._id}`} className="acm-btn-track">
                          🗺️ Suivre en temps réel →
                        </Link>
                      )}
                    </div>
                  )}
                </div>{/* /acm-card-body */}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="acm-pagination">
          <button
            className="acm-page-btn"
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
          >
            ← Précédent
          </button>
          <div className="acm-page-nums">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === pagination.pages || Math.abs(n - pagination.page) <= 1)
              .reduce((acc, n, i, arr) => {
                if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                acc.push(n);
                return acc;
              }, [])
              .map((item, i) =>
                item === '…'
                  ? <span key={`sep-${i}`} className="acm-page-sep">…</span>
                  : <button
                      key={item}
                      className={`acm-page-num ${pagination.page === item ? 'acm-page-num--active' : ''}`}
                      onClick={() => setPagination(p => ({ ...p, page: item }))}
                    >{item}</button>
              )}
          </div>
          <button
            className="acm-page-btn"
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >
            Suivant →
          </button>
        </div>
      )}

      {/* ════════════════════════════
          MODAL AFFECTATION
          ════════════════════════════ */}
      {showAffectModal && commandeToAffect && (
        <div className="acm-modal-overlay" onClick={closeAffectModal}>
          <div className="acm-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="acm-modal-head">
              <div className="acm-modal-head-icon">👤</div>
              <div className="acm-modal-head-text">
                <h2 className="acm-modal-title">Affecter un coursier</h2>
                <p className="acm-modal-sub">
                  Commande #{commandeToAffect._id.slice(-6).toUpperCase()} ·{' '}
                  {formatMontant(commandeToAffect.montant)}
                </p>
              </div>
              <button className="acm-modal-close" onClick={closeAffectModal}>✕</button>
            </div>

            {/* Résumé commande */}
            <div className="acm-modal-commande-summary">
              <div className="acm-route-point">
                <div className="acm-route-dot acm-route-dot--a">A</div>
                <div className="acm-route-info">
                  <span className="acm-route-label">Départ</span>
                  <span className="acm-route-addr">{commandeToAffect.adresseDepart}</span>
                </div>
              </div>
              <div className="acm-route-line"><div className="acm-route-line-inner" /></div>
              <div className="acm-route-point">
                <div className="acm-route-dot acm-route-dot--b">B</div>
                <div className="acm-route-info">
                  <span className="acm-route-label">Arrivée</span>
                  <span className="acm-route-addr">{commandeToAffect.adresseArrivee}</span>
                </div>
              </div>
            </div>

            {/* Sélection coursier */}
            <div className="acm-modal-body">
              <p className="acm-coursiers-label">
                Coursiers disponibles
                {!loadingCoursiers && <span className="acm-coursiers-count">{coursiers.length}</span>}
              </p>

              {loadingCoursiers ? (
                <div className="acm-coursiers-loading">
                  <div className="acm-spinner acm-spinner--sm" />
                  <span>Chargement des coursiers…</span>
                </div>
              ) : coursiers.length === 0 ? (
                <div className="acm-no-coursiers">
                  <span>⚠️</span>
                  <span>Aucun coursier disponible en ce moment.</span>
                </div>
              ) : (
                <div className="acm-coursiers-grid">
                  {coursiers.map((c) => {
                    const selected = selectedCoursier?._id === c._id;
                    const initials = [c.user?.nom, c.user?.prenom].filter(Boolean)
                      .map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                    return (
                      <div
                        key={c._id}
                        className={`acm-coursier-card ${selected ? 'acm-coursier-card--selected' : ''}`}
                        onClick={() => setSelectedCoursier(selected ? null : c)}
                      >
                        <div className="acm-coursier-avatar">{initials}</div>
                        <div className="acm-coursier-info">
                          <span className="acm-coursier-name">
                            {[c.user?.nom, c.user?.prenom].filter(Boolean).join(' ') || '—'}
                          </span>
                          <span className="acm-coursier-phone">{c.user?.telephone}</span>
                          {c.vehicule?.type && (
                            <span className="acm-coursier-vehicle">
                              {VEHICULE_ICONS[c.vehicule.type] || '🚗'} {c.vehicule.type}
                              {c.vehicule.marque ? ` · ${c.vehicule.marque}` : ''}
                            </span>
                          )}
                        </div>
                        {selected && <span className="acm-coursier-check">✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions modal */}
            <div className="acm-modal-actions">
              <button className="acm-modal-cancel" onClick={closeAffectModal}>Annuler</button>
              <button
                className="acm-modal-confirm"
                onClick={handleAffecter}
                disabled={!selectedCoursier || affecting || coursiers.length === 0}
              >
                {affecting ? <span className="acm-btn-spinner" /> : null}
                {affecting ? 'Affectation…' : 'Confirmer l\'affectation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommandes;
