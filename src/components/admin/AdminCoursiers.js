import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services/api';
import './AdminCoursiers.css';

/* ── Config statuts ── */
const STATUT_CONFIG = {
  disponible:   { label: 'Disponible',   icon: '🟢', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
  en_livraison: { label: 'En livraison', icon: '🚴', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
  hors_service: { label: 'Hors service', icon: '⛔', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
};

const VEHICULE_ICONS = { moto: '🏍️', velo: '🚲', voiture: '🚗', pied: '🚶' };

const EMPTY_FORM = {
  telephone: '', nom: '', prenom: '', email: '', password: '',
  vehiculeType: 'moto', numeroPlaque: '', marque: '', modele: '',
  statut: 'disponible', estActif: true,
};

/* ── Helpers ── */
const initials = (c) => {
  const n = [c.user?.nom, c.user?.prenom].filter(Boolean).join(' ');
  return n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
};

const starRating = (note) => {
  if (!note || note === 0) return null;
  const full = Math.round(note);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const AdminCoursiers = () => {
  const [coursiers, setCoursiers]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [notif, setNotif]                   = useState(null);       // { type, msg }
  const [search, setSearch]                 = useState('');
  const [filterStatut, setFilterStatut]     = useState('');
  const [showModal, setShowModal]           = useState(false);
  const [editingCoursier, setEditingCoursier] = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);       // coursier à supprimer
  const [formData, setFormData]             = useState(EMPTY_FORM);

  /* ── Notification ── */
  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4500);
  };

  /* ── Fetch ── */
  const fetchCoursiers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getCoursiers();
      if (res.success) setCoursiers(res.data.coursiers);
      else showNotif('error', 'Erreur lors du chargement des coursiers');
    } catch {
      showNotif('error', 'Impossible de charger les coursiers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoursiers(); }, [fetchCoursiers]);

  /* ── Filtres ── */
  const filtered = useMemo(() => {
    let list = coursiers;
    if (filterStatut) list = list.filter(c => c.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        [c.user?.nom, c.user?.prenom, c.user?.telephone, c.user?.email,
         c.vehicule?.marque, c.vehicule?.numeroPlaque]
          .filter(Boolean).some(v => v.toLowerCase().includes(q))
      );
    }
    return list;
  }, [coursiers, search, filterStatut]);

  /* ── Stats rapides ── */
  const counts = useMemo(() => ({
    total:       coursiers.length,
    disponible:  coursiers.filter(c => c.statut === 'disponible').length,
    en_livraison:coursiers.filter(c => c.statut === 'en_livraison').length,
    hors_service:coursiers.filter(c => c.statut === 'hors_service').length,
    inactif:     coursiers.filter(c => !c.estActif).length,
  }), [coursiers]);

  /* ── Ouvrir modal ── */
  const openCreate = () => {
    setEditingCoursier(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditingCoursier(c);
    setFormData({
      telephone:    c.user?.telephone  || '',
      nom:          c.user?.nom        || '',
      prenom:       c.user?.prenom     || '',
      email:        c.user?.email      || '',
      password:     '',
      vehiculeType: c.vehicule?.type   || 'moto',
      numeroPlaque: c.vehicule?.numeroPlaque || '',
      marque:       c.vehicule?.marque || '',
      modele:       c.vehicule?.modele || '',
      statut:       c.statut,
      estActif:     c.estActif,
    });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingCoursier(null); };

  /* ── Helper : extraire le meilleur message d'erreur backend ── */
  const extractError = (err) => {
    const data = err.response?.data;
    if (!data) return 'Erreur lors de la sauvegarde';
    // Tableau de validations express-validator
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map(e => e.msg).join(' · ');
    }
    return data.message || 'Erreur lors de la sauvegarde';
  };

  /* ── Soumettre formulaire ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation côté client avant envoi
    if (!editingCoursier) {
      if (!formData.telephone.trim()) { showNotif('error', 'Le numéro de téléphone est requis'); return; }
      if (!formData.nom.trim())       { showNotif('error', 'Le nom est requis'); return; }
      if (formData.password && formData.password.length < 6) {
        showNotif('error', 'Le mot de passe doit contenir au moins 6 caractères'); return;
      }
    }

    setSaving(true);
    try {
      if (editingCoursier) {
        const res = await adminService.updateCoursier(editingCoursier._id, {
          vehiculeType: formData.vehiculeType,
          numeroPlaque: formData.numeroPlaque,
          marque:       formData.marque,
          modele:       formData.modele,
          statut:       formData.statut,
          estActif:     formData.estActif,
        });
        if (res.success) { closeModal(); showNotif('success', 'Coursier mis à jour !'); fetchCoursiers(); }
        else showNotif('error', res.message || 'Erreur de mise à jour');
      } else {
        // Normaliser le téléphone : ajouter + si absent
        const tel = formData.telephone.trim();
        const normalizedTel = tel.startsWith('+') ? tel : `+${tel}`;
        const res = await adminService.createCoursier({
          telephone:    normalizedTel,
          nom:          formData.nom,
          prenom:       formData.prenom,
          email:        formData.email,
          password:     formData.password || undefined,
          vehiculeType: formData.vehiculeType,
          numeroPlaque: formData.numeroPlaque,
          marque:       formData.marque,
          modele:       formData.modele,
        });
        if (res.success) { closeModal(); showNotif('success', 'Coursier créé avec succès !'); fetchCoursiers(); }
        else showNotif('error', res.message || 'Erreur de création');
      }
    } catch (err) {
      showNotif('error', extractError(err));
    } finally {
      setSaving(false);
    }
  };

  /* ── Supprimer ── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await adminService.deleteCoursier(confirmDelete._id);
      if (res.success) { showNotif('success', 'Coursier supprimé.'); fetchCoursiers(); }
      else showNotif('error', 'Erreur lors de la suppression');
    } catch {
      showNotif('error', 'Erreur lors de la suppression');
    } finally {
      setConfirmDelete(null);
    }
  };

  const set = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="ac-loading">
        <div className="ac-spinner" />
        <p>Chargement des coursiers…</p>
      </div>
    );
  }

  return (
    <div className="ac-page">

      {/* ── Notification ── */}
      {notif && (
        <div className={`ac-notif ac-notif--${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notif.msg}</span>
          <button onClick={() => setNotif(null)}>✕</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="ac-topbar">
        <div className="ac-topbar-left">
          <h1 className="ac-page-title">Coursiers</h1>
          <span className="ac-count-badge">{coursiers.length} au total</span>
        </div>
        <button className="ac-btn-create" onClick={openCreate}>
          <span>+</span> Nouveau coursier
        </button>
      </div>

      {/* ── KPI pills ── */}
      <div className="ac-kpi-row">
        {[
          { label: 'Total',        val: counts.total,        color: '#6366f1', bg: '#eef2ff' },
          { label: 'Disponibles',  val: counts.disponible,   color: '#10b981', bg: '#f0fdf4' },
          { label: 'En livraison', val: counts.en_livraison, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Hors service', val: counts.hors_service, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Inactifs',     val: counts.inactif,      color: '#94a3b8', bg: '#f8fafc' },
        ].map((k) => (
          <div key={k.label} className="ac-kpi-pill" style={{ background: k.bg, color: k.color }}>
            <span className="ac-kpi-pill-val">{k.val}</span>
            <span className="ac-kpi-pill-lbl">{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── Barre recherche + filtre ── */}
      <div className="ac-toolbar">
        <div className="ac-search-wrap">
          <span className="ac-search-icon">🔍</span>
          <input
            className="ac-search"
            type="text"
            placeholder="Rechercher par nom, téléphone, plaque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ac-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="ac-filter-pills">
          {[{ value: '', label: 'Tous' }, ...Object.entries(STATUT_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))].map((f) => (
            <button
              key={f.value}
              className={`ac-filter-pill ${filterStatut === f.value ? 'ac-filter-pill--active' : ''}`}
              onClick={() => setFilterStatut(f.value)}
            >
              {f.value && STATUT_CONFIG[f.value]?.icon + ' '}{f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille ── */}
      {filtered.length === 0 ? (
        <div className="ac-empty">
          <div className="ac-empty-icon">{search || filterStatut ? '🔍' : '🏍️'}</div>
          <h3>{search || filterStatut ? 'Aucun résultat' : 'Aucun coursier'}</h3>
          <p>
            {search || filterStatut
              ? 'Aucun coursier ne correspond à votre recherche.'
              : 'Commencez par créer un premier coursier.'}
          </p>
          {!search && !filterStatut && (
            <button className="ac-empty-btn" onClick={openCreate}>+ Créer un coursier</button>
          )}
        </div>
      ) : (
        <div className="ac-grid">
          {filtered.map((c) => {
            const sc  = STATUT_CONFIG[c.statut] || STATUT_CONFIG.hors_service;
            const ini = initials(c);
            const stars = starRating(c.note);
            return (
              <div key={c._id} className={`ac-card ${!c.estActif ? 'ac-card--inactive' : ''}`}>
                {/* Accent top */}
                <div className="ac-card-accent" style={{ background: sc.color }} />

                {/* Header */}
                <div className="ac-card-head">
                  <div className="ac-avatar">{ini}</div>
                  <div className="ac-card-identity">
                    <h3 className="ac-card-name">
                      {[c.user?.nom, c.user?.prenom].filter(Boolean).join(' ') || '—'}
                    </h3>
                    <span className="ac-card-phone">{c.user?.telephone || '—'}</span>
                    {c.user?.email && <span className="ac-card-email">{c.user.email}</span>}
                  </div>
                  <span
                    className="ac-statut-badge"
                    style={{ background: sc.bg, color: sc.color, border: `1.5px solid ${sc.border}` }}
                  >
                    {sc.icon} {sc.label}
                  </span>
                </div>

                {/* Chips infos */}
                <div className="ac-card-chips">
                  <span className="ac-chip ac-chip--vehicle">
                    {VEHICULE_ICONS[c.vehicule?.type] || '🚗'} {c.vehicule?.type || 'N/A'}
                    {c.vehicule?.marque ? ` · ${c.vehicule.marque}` : ''}
                    {c.vehicule?.modele ? ` ${c.vehicule.modele}` : ''}
                  </span>
                  {c.vehicule?.numeroPlaque && (
                    <span className="ac-chip ac-chip--plate">🪪 {c.vehicule.numeroPlaque}</span>
                  )}
                  <span className="ac-chip ac-chip--deliveries">📦 {c.nombreLivraisons} livraisons</span>
                  {stars && (
                    <span className="ac-chip ac-chip--rating">
                      <span className="ac-stars">{stars}</span> {c.note?.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Inactif */}
                {!c.estActif && (
                  <div className="ac-inactive-banner">⛔ Compte désactivé</div>
                )}

                {/* Actions */}
                <div className="ac-card-actions">
                  <button className="ac-btn-edit" onClick={() => openEdit(c)}>✏️ Modifier</button>
                  <button className="ac-btn-delete" onClick={() => setConfirmDelete(c)}>🗑️ Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════
          MODAL CRÉATION / ÉDITION
          ════════════════════════════ */}
      {showModal && (
        <div className="ac-modal-overlay" onClick={closeModal}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header modal */}
            <div className="ac-modal-head">
              <div className="ac-modal-head-icon">{editingCoursier ? '✏️' : '🏍️'}</div>
              <div>
                <h2 className="ac-modal-title">
                  {editingCoursier ? 'Modifier le coursier' : 'Nouveau coursier'}
                </h2>
                <p className="ac-modal-sub">
                  {editingCoursier
                    ? `Modification de ${[editingCoursier.user?.nom, editingCoursier.user?.prenom].filter(Boolean).join(' ')}`
                    : 'Renseignez les informations du nouveau coursier'}
                </p>
              </div>
              <button className="ac-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="ac-form">

              {/* Section identité (création uniquement) */}
              {!editingCoursier && (
                <div className="ac-form-section">
                  <div className="ac-form-section-title">
                    <span>👤</span> Identité
                  </div>
                  <div className="ac-form-row">
                    <div className="ac-field">
                      <label>Nom <span className="ac-required">*</span></label>
                      <input type="text" value={formData.nom} onChange={set('nom')} placeholder="Ex : Moussa" required />
                    </div>
                    <div className="ac-field">
                      <label>Prénom</label>
                      <input type="text" value={formData.prenom} onChange={set('prenom')} placeholder="Ex : Issoufou" />
                    </div>
                  </div>
                  <div className="ac-field">
                    <label>Téléphone <span className="ac-required">*</span></label>
                    <input type="tel" value={formData.telephone} onChange={set('telephone')} placeholder="+22796648383" required />
                  </div>
                  <div className="ac-field">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={set('email')} placeholder="coursier@livraison.ne" />
                  </div>
                  <div className="ac-field">
                    <label>Mot de passe</label>
                    <input type="password" value={formData.password} onChange={set('password')} placeholder="Laisser vide → connexion par OTP" />
                    <span className="ac-field-hint">Si vide, le coursier se connectera uniquement par OTP.</span>
                  </div>
                </div>
              )}

              {/* Section véhicule */}
              <div className="ac-form-section">
                <div className="ac-form-section-title">
                  <span>🏍️</span> Véhicule
                </div>
                <div className="ac-field">
                  <label>Type de véhicule <span className="ac-required">*</span></label>
                  <div className="ac-vehicle-cards">
                    {Object.entries(VEHICULE_ICONS).map(([v, icon]) => (
                      <button
                        key={v}
                        type="button"
                        className={`ac-vehicle-card ${formData.vehiculeType === v ? 'ac-vehicle-card--active' : ''}`}
                        onClick={() => setFormData(p => ({ ...p, vehiculeType: v }))}
                      >
                        <span className="ac-vehicle-icon">{icon}</span>
                        <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ac-form-row">
                  <div className="ac-field">
                    <label>Marque</label>
                    <input type="text" value={formData.marque} onChange={set('marque')} placeholder="Ex : Yamaha" />
                  </div>
                  <div className="ac-field">
                    <label>Modèle</label>
                    <input type="text" value={formData.modele} onChange={set('modele')} placeholder="Ex : MT-07" />
                  </div>
                </div>
                <div className="ac-field">
                  <label>Numéro de plaque</label>
                  <input type="text" value={formData.numeroPlaque} onChange={set('numeroPlaque')} placeholder="Ex : NE-1234-AB" />
                </div>
              </div>

              {/* Section statut (édition uniquement) */}
              {editingCoursier && (
                <div className="ac-form-section">
                  <div className="ac-form-section-title">
                    <span>⚙️</span> Paramètres
                  </div>
                  <div className="ac-field">
                    <label>Statut</label>
                    <div className="ac-statut-cards">
                      {Object.entries(STATUT_CONFIG).map(([v, sc]) => (
                        <button
                          key={v}
                          type="button"
                          className={`ac-statut-card ${formData.statut === v ? 'ac-statut-card--active' : ''}`}
                          style={formData.statut === v ? { background: sc.bg, borderColor: sc.color, color: sc.color } : {}}
                          onClick={() => setFormData(p => ({ ...p, statut: v }))}
                        >
                          {sc.icon} {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="ac-toggle-label">
                    <div className={`ac-toggle ${formData.estActif ? 'ac-toggle--on' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, estActif: !p.estActif }))}>
                      <div className="ac-toggle-thumb" />
                    </div>
                    <span>Compte {formData.estActif ? 'actif' : 'désactivé'}</span>
                  </label>
                </div>
              )}

              {/* Actions formulaire */}
              <div className="ac-form-actions">
                <button type="button" className="ac-form-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="ac-form-save" disabled={saving}>
                  {saving ? <span className="ac-btn-spinner" /> : null}
                  {editingCoursier ? 'Enregistrer' : 'Créer le coursier'}
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
        <div className="ac-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="ac-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ac-confirm-icon">🗑️</div>
            <h3>Supprimer ce coursier ?</h3>
            <p>
              <strong>{[confirmDelete.user?.nom, confirmDelete.user?.prenom].filter(Boolean).join(' ') || confirmDelete.user?.telephone}</strong>
              {' '}sera définitivement retiré de la plateforme.
            </p>
            <div className="ac-confirm-actions">
              <button className="ac-confirm-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="ac-confirm-delete" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCoursiers;
