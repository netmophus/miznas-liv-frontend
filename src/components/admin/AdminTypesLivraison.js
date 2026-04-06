import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services/api';
import './AdminTypesLivraison.css';

/* ── Icônes prédéfinies pour les types ── */
const PRESET_ICONS = ['🚚', '📦', '⚡', '🏍️', '🚲', '🚗', '🏪', '🔄', '📬', '🎁', '🛵', '🚀'];

const EMPTY_FORM = { nom: '', description: '', montant: '', icone: '🚚', estActif: true };

const formatMontant = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const AdminTypesLivraison = () => {
  const [types, setTypes]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [notif, setNotif]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterActif, setFilterActif]   = useState('');   // '' | 'actif' | 'inactif'
  const [showModal, setShowModal]       = useState(false);
  const [editingType, setEditingType]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData]         = useState(EMPTY_FORM);

  /* ── Notification ── */
  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4500);
  };

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getTypesLivraison();
      if (res.success) setTypes(res.data.typesLivraison);
      else showNotif('error', 'Erreur lors du chargement');
    } catch {
      showNotif('error', 'Impossible de charger les types de livraison');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Filtres ── */
  const filtered = useMemo(() => {
    let list = types;
    if (filterActif === 'actif')   list = list.filter(t => t.estActif);
    if (filterActif === 'inactif') list = list.filter(t => !t.estActif);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.nom.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [types, search, filterActif]);

  /* ── Stats rapides ── */
  const stats = useMemo(() => ({
    total:    types.length,
    actifs:   types.filter(t => t.estActif).length,
    inactifs: types.filter(t => !t.estActif).length,
    revenu:   types.filter(t => t.estActif).reduce((s, t) => s + (t.montant || 0), 0),
  }), [types]);

  /* ── Ouvrir / fermer modal ── */
  const openCreate = () => {
    setEditingType(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (t) => {
    setEditingType(t);
    setFormData({
      nom:         t.nom,
      description: t.description || '',
      montant:     t.montant.toString(),
      icone:       t.icone || '🚚',
      estActif:    t.estActif,
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingType(null); };

  /* ── Soumettre ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingType) {
        await adminService.updateTypeLivraison(editingType._id, formData);
        showNotif('success', 'Type de livraison mis à jour !');
      } else {
        await adminService.createTypeLivraison(formData);
        showNotif('success', 'Type de livraison créé !');
      }
      closeModal();
      fetchData();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Erreur lors de l\'opération');
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer ── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await adminService.deleteTypeLivraison(confirmDelete._id);
      showNotif('success', `"${confirmDelete.nom}" supprimé.`);
      fetchData();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setConfirmDelete(null);
    }
  };

  const setField = (field) => (e) =>
    setFormData(p => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="atl-loading">
        <div className="atl-spinner" />
        <p>Chargement des types de livraison…</p>
      </div>
    );
  }

  return (
    <div className="atl-page">

      {/* ── Notification ── */}
      {notif && (
        <div className={`atl-notif atl-notif--${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notif.msg}</span>
          <button onClick={() => setNotif(null)}>✕</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="atl-topbar">
        <div className="atl-topbar-left">
          <h1 className="atl-page-title">Types de livraison</h1>
          <span className="atl-count-badge">{types.length} au total</span>
        </div>
        <button className="atl-btn-create" onClick={openCreate}>
          <span>+</span> Nouveau type
        </button>
      </div>

      {/* ── KPI pills ── */}
      <div className="atl-kpi-row">
        <div className="atl-kpi-card atl-kpi-card--indigo">
          <div className="atl-kpi-bg-circle" /><div className="atl-kpi-bg-circle2" />
          <div className="atl-kpi-icon">🚚</div>
          <div className="atl-kpi-val">{stats.total}</div>
          <div className="atl-kpi-lbl">Types créés</div>
        </div>
        <div className="atl-kpi-card atl-kpi-card--green">
          <div className="atl-kpi-bg-circle" /><div className="atl-kpi-bg-circle2" />
          <div className="atl-kpi-icon">✅</div>
          <div className="atl-kpi-val">{stats.actifs}</div>
          <div className="atl-kpi-lbl">Actifs</div>
        </div>
        <div className="atl-kpi-card atl-kpi-card--red">
          <div className="atl-kpi-bg-circle" /><div className="atl-kpi-bg-circle2" />
          <div className="atl-kpi-icon">⛔</div>
          <div className="atl-kpi-val">{stats.inactifs}</div>
          <div className="atl-kpi-lbl">Inactifs</div>
        </div>
        <div className="atl-kpi-card atl-kpi-card--amber">
          <div className="atl-kpi-bg-circle" /><div className="atl-kpi-bg-circle2" />
          <div className="atl-kpi-icon">💰</div>
          <div className="atl-kpi-val atl-kpi-val--sm">{formatMontant(stats.revenu)}</div>
          <div className="atl-kpi-lbl">Revenus actifs</div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="atl-toolbar">
        <div className="atl-search-wrap">
          <span className="atl-search-icon">🔍</span>
          <input
            className="atl-search"
            type="text"
            placeholder="Rechercher par nom ou description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="atl-search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <div className="atl-filter-pills">
          {[
            { v: '',        label: 'Tous' },
            { v: 'actif',   label: '✅ Actifs' },
            { v: 'inactif', label: '⛔ Inactifs' },
          ].map((f) => (
            <button
              key={f.v}
              className={`atl-filter-pill ${filterActif === f.v ? 'atl-filter-pill--active' : ''}`}
              onClick={() => setFilterActif(f.v)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div className="atl-empty">
          <div className="atl-empty-icon">{search || filterActif ? '🔍' : '🚚'}</div>
          <h3>{search || filterActif ? 'Aucun résultat' : 'Aucun type de livraison'}</h3>
          <p>
            {search || filterActif
              ? 'Essayez une autre recherche ou réinitialisez les filtres.'
              : 'Créez votre premier type de livraison pour démarrer.'}
          </p>
          {!search && !filterActif && (
            <button className="atl-empty-btn" onClick={openCreate}>+ Créer un type</button>
          )}
        </div>
      ) : (
        <div className="atl-list">
          {filtered.map((type) => (
            <div key={type._id} className={`atl-card ${!type.estActif ? 'atl-card--inactive' : ''}`}>
              {/* Accent gauche */}
              <div className="atl-card-accent" style={{ background: type.estActif ? '#10b981' : '#e5e7eb' }} />

              {/* Icône */}
              <div className={`atl-card-icon ${type.estActif ? 'atl-card-icon--active' : 'atl-card-icon--off'}`}>
                {type.icone || '🚚'}
              </div>

              {/* Contenu */}
              <div className="atl-card-body">
                <div className="atl-card-top">
                  <h3 className="atl-card-name">{type.nom}</h3>
                  <span className={`atl-status-badge ${type.estActif ? 'atl-status-badge--on' : 'atl-status-badge--off'}`}>
                    {type.estActif ? '✅ Actif' : '⛔ Inactif'}
                  </span>
                </div>
                {type.description && (
                  <p className="atl-card-desc">{type.description}</p>
                )}
                <div className="atl-card-chips">
                  <span className="atl-chip atl-chip--price">
                    💰 {formatMontant(type.montant)}
                  </span>
                  <span className="atl-chip atl-chip--date">
                    📅 Créé le {formatDate(type.dateCreation)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="atl-card-actions">
                <button className="atl-btn-edit" onClick={() => openEdit(type)}>✏️ Modifier</button>
                <button className="atl-btn-delete" onClick={() => setConfirmDelete(type)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════
          MODAL CRÉATION / ÉDITION
          ════════════════════════════ */}
      {showModal && (
        <div className="atl-modal-overlay" onClick={closeModal}>
          <div className="atl-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="atl-modal-head">
              <div className="atl-modal-head-icon">{editingType ? '✏️' : '🚚'}</div>
              <div className="atl-modal-head-text">
                <h2 className="atl-modal-title">
                  {editingType ? 'Modifier le type' : 'Nouveau type de livraison'}
                </h2>
                <p className="atl-modal-sub">
                  {editingType ? `Modification de « ${editingType.nom} »` : 'Configurez votre nouveau type de livraison'}
                </p>
              </div>
              <button className="atl-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="atl-form">

              {/* Icône */}
              <div className="atl-form-section">
                <div className="atl-form-section-title"><span>🎨</span> Icône</div>
                <div className="atl-icon-grid">
                  {PRESET_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      className={`atl-icon-btn ${formData.icone === ico ? 'atl-icon-btn--active' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, icone: ico }))}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              {/* Infos */}
              <div className="atl-form-section">
                <div className="atl-form-section-title"><span>📋</span> Informations</div>
                <div className="atl-field">
                  <label>Nom <span className="atl-required">*</span></label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={setField('nom')}
                    placeholder="Ex : Livraison express, Standard, Programmée…"
                    required
                  />
                </div>
                <div className="atl-field">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={setField('description')}
                    placeholder="Décrivez ce type de livraison…"
                    rows={3}
                  />
                </div>
              </div>

              {/* Tarif */}
              <div className="atl-form-section">
                <div className="atl-form-section-title"><span>💰</span> Tarification</div>
                <div className="atl-field">
                  <label>Montant (FCFA) <span className="atl-required">*</span></label>
                  <div className="atl-amount-wrap">
                    <input
                      type="number"
                      value={formData.montant}
                      onChange={setField('montant')}
                      placeholder="0"
                      required
                      min="0"
                      step="1"
                    />
                    <span className="atl-amount-unit">FCFA</span>
                  </div>
                  {formData.montant && (
                    <span className="atl-amount-preview">
                      → {formatMontant(Number(formData.montant))}
                    </span>
                  )}
                </div>
              </div>

              {/* Statut */}
              <div className="atl-form-section">
                <div className="atl-form-section-title"><span>⚙️</span> Visibilité</div>
                <label className="atl-toggle-label">
                  <div
                    className={`atl-toggle ${formData.estActif ? 'atl-toggle--on' : ''}`}
                    onClick={() => setFormData(p => ({ ...p, estActif: !p.estActif }))}
                  >
                    <div className="atl-toggle-thumb" />
                  </div>
                  <span>
                    {formData.estActif
                      ? 'Actif — visible pour les clients'
                      : 'Inactif — masqué pour les clients'}
                  </span>
                </label>
              </div>

              {/* Aperçu rapide */}
              <div className="atl-preview">
                <span className="atl-preview-label">Aperçu</span>
                <div className="atl-preview-card">
                  <span className="atl-preview-icon">{formData.icone}</span>
                  <div className="atl-preview-info">
                    <span className="atl-preview-nom">{formData.nom || 'Nom du type'}</span>
                    {formData.montant && (
                      <span className="atl-preview-prix">{formatMontant(Number(formData.montant))}</span>
                    )}
                  </div>
                  <span className={`atl-status-badge ${formData.estActif ? 'atl-status-badge--on' : 'atl-status-badge--off'}`}>
                    {formData.estActif ? '✅ Actif' : '⛔ Inactif'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="atl-form-actions">
                <button type="button" className="atl-form-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="atl-form-save" disabled={saving}>
                  {saving && <span className="atl-btn-spinner" />}
                  {editingType ? 'Enregistrer' : 'Créer le type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════
          MODAL CONFIRMATION SUPPRESSION
          ════════════════════════════ */}
      {confirmDelete && (
        <div className="atl-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="atl-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="atl-confirm-icon">🗑️</div>
            <h3>Supprimer ce type ?</h3>
            <p>
              <strong>« {confirmDelete.nom} »</strong> sera définitivement supprimé.
              Les commandes existantes ne seront pas affectées.
            </p>
            <div className="atl-confirm-actions">
              <button className="atl-confirm-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="atl-confirm-delete" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTypesLivraison;
