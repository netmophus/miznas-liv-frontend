import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import './AdminFonds.css';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0) + ' FCFA';

const fmtDate = (d) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

function initials(nom = '', prenom = '') {
  return ((nom[0] || '') + (prenom[0] || '')).toUpperCase() || '?';
}

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════ */
const AdminFonds = () => {
  const [tab, setTab] = useState('soldes'); // 'soldes' | 'historique'

  /* ── Soldes en attente ── */
  const [soldes,         setSoldes]         = useState([]);
  const [loadingSoldes,  setLoadingSoldes]  = useState(true);
  const [expandedSolde,  setExpandedSolde]  = useState(null); // coursierId

  /* ── Historique ── */
  const [historique,     setHistorique]     = useState([]);
  const [loadingHisto,   setLoadingHisto]   = useState(false);
  const [pagination,     setPagination]     = useState({ page: 1, total: 0, pages: 0 });

  /* ── Modal remise ── */
  const [showModal,      setShowModal]      = useState(false);
  const [soldeToRemise,  setSoldeToRemise]  = useState(null);
  const [notes,          setNotes]          = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  /* ── Notification ── */
  const [notif, setNotif] = useState(null);
  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 5000);
  };

  /* ── Fetch soldes ── */
  const fetchSoldes = useCallback(async () => {
    setLoadingSoldes(true);
    try {
      const res = await adminService.getFondsSoldes();
      if (res.success) setSoldes(res.data.soldes);
    } catch {
      showNotif('error', 'Impossible de charger les soldes');
    } finally {
      setLoadingSoldes(false);
    }
  }, []);

  /* ── Fetch historique ── */
  const fetchHistorique = useCallback(async (page = 1) => {
    setLoadingHisto(true);
    try {
      const res = await adminService.getFondsHistorique(page);
      if (res.success) {
        setHistorique(res.data.remises);
        setPagination(res.data.pagination);
      }
    } catch {
      showNotif('error', 'Impossible de charger l\'historique');
    } finally {
      setLoadingHisto(false);
    }
  }, []);

  useEffect(() => { fetchSoldes(); }, [fetchSoldes]);
  useEffect(() => {
    if (tab === 'historique') fetchHistorique(1);
  }, [tab, fetchHistorique]);

  /* ── Ouvrir modal remise ── */
  const openRemise = (solde) => {
    setSoldeToRemise(solde);
    setNotes('');
    setShowModal(true);
  };

  /* ── Confirmer remise ── */
  const handleRemise = async () => {
    if (!soldeToRemise) return;
    setSubmitting(true);
    try {
      const res = await adminService.enregistrerRemise(soldeToRemise.coursier._id, notes);
      if (res.success) {
        showNotif('success', `Remise de ${fmt(soldeToRemise.montantTotalCollecte)} enregistrée pour ${soldeToRemise.coursier.nom} ${soldeToRemise.coursier.prenom}`);
        setShowModal(false);
        setSoldeToRemise(null);
        fetchSoldes();
        if (tab === 'historique') fetchHistorique(1);
      }
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Totaux ── */
  const totalEnCaisse   = soldes.reduce((s, x) => s + x.montantTotalCollecte, 0);
  const totalCommission = soldes.reduce((s, x) => s + x.montantCommission, 0);
  const totalAgence     = soldes.reduce((s, x) => s + x.montantAgence, 0);
  const nbCoursiers     = soldes.length;

  return (
    <div className="af-page">

      {/* ── Notification ── */}
      {notif && (
        <div className={`af-notif af-notif--${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notif.msg}</span>
          <button onClick={() => setNotif(null)}>✕</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="af-topbar">
        <div>
          <h1 className="af-title">Gestion des fonds</h1>
          <p className="af-subtitle">Réconciliation de caisse des livreurs</p>
        </div>
        <button className="af-refresh-btn" onClick={fetchSoldes} disabled={loadingSoldes}>
          🔄 Actualiser
        </button>
      </div>

      {/* ── KPI globaux ── */}
      {!loadingSoldes && soldes.length > 0 && (
        <div className="af-kpi-row">
          <div className="af-kpi af-kpi--indigo">
            <div className="af-kpi-icon">👤</div>
            <div>
              <div className="af-kpi-value">{nbCoursiers}</div>
              <div className="af-kpi-label">Livreur{nbCoursiers > 1 ? 's' : ''} avec fonds en attente</div>
            </div>
          </div>
          <div className="af-kpi af-kpi--amber">
            <div className="af-kpi-icon">💼</div>
            <div>
              <div className="af-kpi-value">{fmt(totalEnCaisse)}</div>
              <div className="af-kpi-label">Total en circulation</div>
            </div>
          </div>
          <div className="af-kpi af-kpi--green">
            <div className="af-kpi-icon">🏢</div>
            <div>
              <div className="af-kpi-value">{fmt(totalAgence)}</div>
              <div className="af-kpi-label">À récupérer (agence)</div>
            </div>
          </div>
          <div className="af-kpi af-kpi--purple">
            <div className="af-kpi-icon">💵</div>
            <div>
              <div className="af-kpi-value">{fmt(totalCommission)}</div>
              <div className="af-kpi-label">Commissions à rétrocéder</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="af-tabs">
        <button
          className={`af-tab ${tab === 'soldes' ? 'af-tab--active' : ''}`}
          onClick={() => setTab('soldes')}
        >
          💼 Fonds en attente
          {soldes.length > 0 && <span className="af-tab-badge">{soldes.length}</span>}
        </button>
        <button
          className={`af-tab ${tab === 'historique' ? 'af-tab--active' : ''}`}
          onClick={() => setTab('historique')}
        >
          📋 Historique des remises
        </button>
      </div>

      {/* ══════════════════════════════════════
          TAB SOLDES EN ATTENTE
      ══════════════════════════════════════ */}
      {tab === 'soldes' && (
        <>
          {loadingSoldes ? (
            <div className="af-loading"><div className="af-spinner" /><p>Chargement…</p></div>
          ) : soldes.length === 0 ? (
            <div className="af-empty">
              <div className="af-empty-icon">✅</div>
              <h3>Tout est régularisé</h3>
              <p>Aucun livreur n'a de fonds en attente de remise.</p>
            </div>
          ) : (
            <div className="af-soldes-list">
              {soldes.map((s) => {
                const cId      = s.coursier._id;
                const expanded = expandedSolde === cId;
                return (
                  <div key={cId} className="af-solde-card">
                    {/* En-tête livreur */}
                    <div className="af-solde-header">
                      <div className="af-solde-avatar">
                        {initials(s.coursier.nom, s.coursier.prenom)}
                      </div>
                      <div className="af-solde-info">
                        <div className="af-solde-name">
                          {s.coursier.nom} {s.coursier.prenom}
                        </div>
                        <div className="af-solde-phone">{s.coursier.telephone}</div>
                      </div>
                      <div className="af-solde-nb">
                        <span>{s.nombreCommandes} livraison{s.nombreCommandes > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Répartition montants */}
                    <div className="af-solde-amounts">
                      <div className="af-amount-box af-amount-box--total">
                        <span className="af-amount-label">Total collecté</span>
                        <span className="af-amount-val">{fmt(s.montantTotalCollecte)}</span>
                      </div>
                      <div className="af-amount-sep">=</div>
                      <div className="af-amount-box af-amount-box--agence">
                        <span className="af-amount-label">🏢 Part agence</span>
                        <span className="af-amount-val">{fmt(s.montantAgence)}</span>
                      </div>
                      <div className="af-amount-sep">+</div>
                      <div className="af-amount-box af-amount-box--commission">
                        <span className="af-amount-label">💵 Commission livreur</span>
                        <span className="af-amount-val">{fmt(s.montantCommission)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="af-solde-actions">
                      <button
                        className="af-btn-toggle"
                        onClick={() => setExpandedSolde(expanded ? null : cId)}
                      >
                        {expanded ? '▲ Masquer les livraisons' : `▼ Voir les ${s.nombreCommandes} livraison${s.nombreCommandes > 1 ? 's' : ''}`}
                      </button>
                      <button className="af-btn-remise" onClick={() => openRemise(s)}>
                        ✅ Enregistrer la remise
                      </button>
                    </div>

                    {/* Détail des livraisons */}
                    {expanded && (
                      <div className="af-commandes-list">
                        {s.commandes.map((c) => (
                          <div key={c._id} className="af-commande-row">
                            <div className="af-commande-id">#{c._id.slice(-6).toUpperCase()}</div>
                            <div className="af-commande-route">
                              <span className="af-commande-dot-a">A</span>
                              <span className="af-commande-addr">{c.adresseDepart}</span>
                              <span className="af-commande-arrow">→</span>
                              <span className="af-commande-dot-b">B</span>
                              <span className="af-commande-addr">{c.adresseArrivee}</span>
                            </div>
                            <div className="af-commande-amounts">
                              <span className="af-commande-total">{fmt(c.montant)}</span>
                              <span className="af-commande-comm">Commission: {fmt(c.montantCoursier)}</span>
                            </div>
                            <div className="af-commande-date">{fmtDate(c.dateLivraison)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          TAB HISTORIQUE
      ══════════════════════════════════════ */}
      {tab === 'historique' && (
        <>
          {loadingHisto ? (
            <div className="af-loading"><div className="af-spinner" /><p>Chargement…</p></div>
          ) : historique.length === 0 ? (
            <div className="af-empty">
              <div className="af-empty-icon">📋</div>
              <h3>Aucune remise enregistrée</h3>
              <p>L'historique apparaîtra ici après la première remise de fonds.</p>
            </div>
          ) : (
            <div className="af-histo-list">
              {historique.map((r) => (
                <div key={r._id} className="af-histo-card">
                  <div className="af-histo-header">
                    <div className="af-histo-date-col">
                      <div className="af-histo-date">{fmtDate(r.dateRemise)}</div>
                      <div className="af-histo-admin">
                        Validé par {r.adminResponsable?.nom} {r.adminResponsable?.prenom}
                      </div>
                    </div>
                    <div className="af-histo-coursier">
                      <div className="af-histo-avatar">
                        {initials(r.coursier?.nom, r.coursier?.prenom)}
                      </div>
                      <div>
                        <div className="af-histo-name">{r.coursier?.nom} {r.coursier?.prenom}</div>
                        <div className="af-histo-phone">{r.coursier?.telephone}</div>
                      </div>
                    </div>
                    <div className="af-histo-amounts">
                      <div className="af-histo-line">
                        <span>Total remis</span>
                        <strong>{fmt(r.montantTotalCollecte)}</strong>
                      </div>
                      <div className="af-histo-line af-histo-line--agence">
                        <span>🏢 Agence</span>
                        <strong>{fmt(r.montantAgence)}</strong>
                      </div>
                      <div className="af-histo-line af-histo-line--comm">
                        <span>💵 Commission payée</span>
                        <strong>{fmt(r.montantCommission)}</strong>
                      </div>
                    </div>
                    <div className="af-histo-nb">
                      {r.nombreCommandes} livraison{r.nombreCommandes > 1 ? 's' : ''}
                    </div>
                  </div>
                  {r.notes && (
                    <div className="af-histo-notes">💬 {r.notes}</div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="af-pagination">
                  <button
                    className="af-page-btn"
                    onClick={() => fetchHistorique(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >← Précédent</button>
                  <span className="af-page-info">
                    Page {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    className="af-page-btn"
                    onClick={() => fetchHistorique(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >Suivant →</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          MODAL — Confirmer la remise
      ══════════════════════════════════════ */}
      {showModal && soldeToRemise && (
        <div className="af-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="af-modal" onClick={e => e.stopPropagation()}>
            <div className="af-modal-head">
              <div className="af-modal-icon">💰</div>
              <div>
                <h2 className="af-modal-title">Enregistrer la remise de fonds</h2>
                <p className="af-modal-sub">
                  {soldeToRemise.coursier.nom} {soldeToRemise.coursier.prenom} —{' '}
                  {soldeToRemise.nombreCommandes} livraison{soldeToRemise.nombreCommandes > 1 ? 's' : ''}
                </p>
              </div>
              <button className="af-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="af-modal-body">
              {/* Recap montants */}
              <div className="af-modal-amounts">
                <div className="af-modal-amount-row af-modal-amount-row--total">
                  <span>💼 Montant total remis par le livreur</span>
                  <strong>{fmt(soldeToRemise.montantTotalCollecte)}</strong>
                </div>
                <div className="af-modal-amount-row af-modal-amount-row--agence">
                  <span>🏢 Part conservée par l'agence</span>
                  <strong>{fmt(soldeToRemise.montantAgence)}</strong>
                </div>
                <div className="af-modal-amount-row af-modal-amount-row--commission">
                  <span>💵 Commission restituée au livreur</span>
                  <strong>{fmt(soldeToRemise.montantCommission)}</strong>
                </div>
              </div>

              {/* Notes */}
              <div className="af-modal-field">
                <label className="af-modal-label">Notes (optionnel)</label>
                <textarea
                  className="af-modal-textarea"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex : Remise effectuée en espèces, livreur présent à 14h30…"
                  rows={3}
                />
              </div>

              <p className="af-modal-confirm-text">
                En confirmant, cette opération sera horodatée et ne pourra pas être annulée.
                Les {soldeToRemise.nombreCommandes} commande{soldeToRemise.nombreCommandes > 1 ? 's' : ''} seront marquées comme régularisées.
              </p>
            </div>

            <div className="af-modal-footer">
              <button className="af-modal-cancel" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button
                className="af-modal-confirm"
                onClick={handleRemise}
                disabled={submitting}
              >
                {submitting ? <span className="af-btn-spinner" /> : null}
                {submitting ? 'Enregistrement…' : '✅ Confirmer la remise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFonds;
