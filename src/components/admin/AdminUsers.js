import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services/api';
import './AdminUsers.css';

/* ── Config rôles ── */
const ROLE_CONFIG = {
  particulier: { label: 'Particulier', icon: '👤', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  entreprise:  { label: 'Entreprise',  icon: '🏢', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  coursier:    { label: 'Coursier',    icon: '🏍️', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
  admin:       { label: 'Admin',       icon: '👑', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
};

const ROLES_FILTER = [
  { value: '', label: 'Tous' },
  { value: 'particulier', label: '👤 Particuliers' },
  { value: 'entreprise',  label: '🏢 Entreprises' },
  { value: 'coursier',    label: '🏍️ Coursiers' },
  { value: 'admin',       label: '👑 Admins' },
];

const EMPTY_ENTREPRISE = { telephone: '', nom: '', prenom: '', email: '', password: '' };

const initials = (u) => {
  const parts = [u.nom, u.prenom].filter(Boolean);
  if (parts.length) return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  return (u.telephone || '?')[0].toUpperCase();
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const AdminUsers = () => {
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [notif,          setNotif]          = useState(null);
  const [pagination,     setPagination]     = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [search,         setSearch]         = useState('');
  const [roleFilter,     setRoleFilter]     = useState('');
  /* Modals */
  const [editingUser,    setEditingUser]    = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [showEntreprise, setShowEntreprise] = useState(false);
  const [entrepriseForm, setEntrepriseForm] = useState(EMPTY_ENTREPRISE);

  /* ── Notification ── */
  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif(null), 4500);
  };

  /* ── Fetch ── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getUsers(pagination.page, pagination.limit, search, roleFilter);
      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else showNotif('error', 'Erreur lors du chargement des utilisateurs');
    } catch { showNotif('error', 'Impossible de charger les utilisateurs'); }
    finally { setLoading(false); }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Stats locales ── */
  const counts = useMemo(() => ({
    total:      pagination.total,
    particulier:users.filter(u => u.role === 'particulier').length,
    entreprise: users.filter(u => u.role === 'entreprise').length,
    coursier:   users.filter(u => u.role === 'coursier').length,
    admin:      users.filter(u => u.role === 'admin').length,
    verifies:   users.filter(u => u.isVerified).length,
  }), [users, pagination.total]);

  /* ── Handlers search/filtre ── */
  const handleSearch = (v) => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); };
  const handleRole   = (v) => { setRoleFilter(v); setPagination(p => ({ ...p, page: 1 })); };

  /* ── Edit user ── */
  const openEdit = (u) => setEditingUser({ ...u });
  const closeEdit = () => setEditingUser(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminService.updateUser(editingUser.id, {
        nom: editingUser.nom, prenom: editingUser.prenom,
        email: editingUser.email, role: editingUser.role,
        isVerified: editingUser.isVerified,
      });
      if (res.success) { closeEdit(); showNotif('success', 'Utilisateur mis à jour !'); fetchUsers(); }
      else showNotif('error', 'Erreur lors de la mise à jour');
    } catch { showNotif('error', 'Erreur lors de la mise à jour'); }
    finally { setSaving(false); }
  };

  /* ── Delete user ── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await adminService.deleteUser(confirmDelete.id);
      if (res.success) { showNotif('success', 'Utilisateur supprimé.'); fetchUsers(); }
      else showNotif('error', 'Erreur lors de la suppression');
    } catch { showNotif('error', 'Erreur lors de la suppression'); }
    finally { setConfirmDelete(null); }
  };

  /* ── Create entreprise ── */
  const openEntreprise = () => { setEntrepriseForm(EMPTY_ENTREPRISE); setShowEntreprise(true); };
  const closeEntreprise = () => setShowEntreprise(false);

  const handleSubmitEntreprise = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.createEntreprise(entrepriseForm);
      if (res.success) {
        closeEntreprise(); showNotif('success', 'Entreprise créée avec succès !'); fetchUsers();
      } else showNotif('error', res.message || 'Erreur lors de la création');
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const setEf = (field) => (e) => setEntrepriseForm(p => ({ ...p, [field]: e.target.value }));

  /* ── Loading ── */
  if (loading && users.length === 0) {
    return (
      <div className="au-loading">
        <div className="au-spinner" />
        <p>Chargement des utilisateurs…</p>
      </div>
    );
  }

  return (
    <div className="au-page">

      {/* ── Notification ── */}
      {notif && (
        <div className={`au-notif au-notif--${notif.type}`}>
          <span>{notif.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{notif.msg}</span>
          <button onClick={() => setNotif(null)}>✕</button>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="au-topbar">
        <div className="au-topbar-left">
          <h1 className="au-page-title">Utilisateurs</h1>
          <span className="au-total-badge">{pagination.total} au total</span>
        </div>
        <button className="au-btn-entreprise" onClick={openEntreprise}>
          <span>🏢</span> Créer une entreprise
        </button>
      </div>

      {/* ── KPI pills ── */}
      <div className="au-kpi-row">
        {[
          { label: 'Particuliers', val: counts.particulier, ...ROLE_CONFIG.particulier },
          { label: 'Entreprises',  val: counts.entreprise,  ...ROLE_CONFIG.entreprise  },
          { label: 'Coursiers',    val: counts.coursier,    ...ROLE_CONFIG.coursier    },
          { label: 'Admins',       val: counts.admin,       ...ROLE_CONFIG.admin       },
          { label: 'Vérifiés',     val: counts.verifies,    icon: '✅', color: '#10b981', bg: '#f0fdf4', border: '#6ee7b7' },
        ].map((k) => (
          <div key={k.label} className="au-kpi-pill" style={{ background: k.bg, color: k.color, border: `1.5px solid ${k.border}` }}>
            <span className="au-kpi-pill-icon">{k.icon}</span>
            <span className="au-kpi-pill-val">{k.val}</span>
            <span className="au-kpi-pill-lbl">{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="au-toolbar">
        <div className="au-search-wrap">
          <span className="au-search-icon">🔍</span>
          <input
            className="au-search"
            type="text"
            placeholder="Rechercher par nom, téléphone, email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && <button className="au-search-clear" onClick={() => handleSearch('')}>✕</button>}
        </div>
        <div className="au-role-pills">
          {ROLES_FILTER.map((f) => (
            <button
              key={f.value}
              className={`au-role-pill ${roleFilter === f.value ? 'au-role-pill--active' : ''}`}
              onClick={() => handleRole(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille ── */}
      {users.length === 0 ? (
        <div className="au-empty">
          <div className="au-empty-icon">{search || roleFilter ? '🔍' : '👥'}</div>
          <h3>{search || roleFilter ? 'Aucun résultat' : 'Aucun utilisateur'}</h3>
          <p>{search || roleFilter ? 'Essayez d\'autres critères.' : 'Aucun utilisateur enregistré.'}</p>
        </div>
      ) : (
        <div className="au-grid">
          {users.map((user) => {
            const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.particulier;
            const ini = initials(user);
            return (
              <div key={user.id} className="au-card">
                {/* Accent */}
                <div className="au-card-accent" style={{ background: rc.color }} />

                {/* Header */}
                <div className="au-card-head">
                  <div className="au-avatar" style={{ background: `linear-gradient(135deg, ${rc.color}, ${rc.color}cc)` }}>
                    {ini}
                  </div>
                  <div className="au-card-identity">
                    <h3 className="au-card-name">
                      {[user.nom, user.prenom].filter(Boolean).join(' ') || '—'}
                    </h3>
                    <span className="au-card-phone">{user.telephone}</span>
                    {user.email && <span className="au-card-email">{user.email}</span>}
                  </div>
                </div>

                {/* Badges */}
                <div className="au-card-badges">
                  <span className="au-role-badge" style={{ background: rc.bg, color: rc.color, border: `1.5px solid ${rc.border}` }}>
                    {rc.icon} {rc.label}
                  </span>
                  <span className={`au-verify-badge ${user.isVerified ? 'au-verify-badge--on' : 'au-verify-badge--off'}`}>
                    {user.isVerified ? '✅ Vérifié' : '⏳ Non vérifié'}
                  </span>
                </div>

                {/* Date */}
                {user.dateCreation && (
                  <span className="au-card-date">📅 Inscrit le {formatDate(user.dateCreation)}</span>
                )}

                {/* Actions */}
                <div className="au-card-actions">
                  <button className="au-btn-edit" onClick={() => openEdit(user)}>✏️ Modifier</button>
                  {user.role !== 'admin' && (
                    <button className="au-btn-delete" onClick={() => setConfirmDelete(user)}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="au-pagination">
          <button
            className="au-page-btn"
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
          >← Précédent</button>
          <div className="au-page-nums">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === pagination.pages || Math.abs(n - pagination.page) <= 1)
              .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push('…'); acc.push(n); return acc; }, [])
              .map((item, i) =>
                item === '…'
                  ? <span key={`s${i}`} className="au-page-sep">…</span>
                  : <button key={item} className={`au-page-num ${pagination.page === item ? 'au-page-num--active' : ''}`}
                      onClick={() => setPagination(p => ({ ...p, page: item }))}>{item}</button>
              )}
          </div>
          <button
            className="au-page-btn"
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >Suivant →</button>
        </div>
      )}

      {/* ════════════════════════════
          MODAL ÉDITION UTILISATEUR
          ════════════════════════════ */}
      {editingUser && (
        <div className="au-modal-overlay" onClick={closeEdit}>
          <div className="au-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-modal-head">
              <div className="au-modal-head-icon" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[editingUser.role]?.color || '#6366f1'}, ${ROLE_CONFIG[editingUser.role]?.color || '#6366f1'}aa)` }}>
                {initials(editingUser)}
              </div>
              <div className="au-modal-head-text">
                <h2 className="au-modal-title">Modifier l'utilisateur</h2>
                <p className="au-modal-sub">{editingUser.telephone}</p>
              </div>
              <button className="au-modal-close" onClick={closeEdit}>✕</button>
            </div>

            <div className="au-form">
              {/* Identité */}
              <div className="au-form-section">
                <div className="au-form-section-title"><span>👤</span> Identité</div>
                <div className="au-form-row">
                  <div className="au-field">
                    <label>Nom</label>
                    <input type="text" value={editingUser.nom || ''} onChange={(e) => setEditingUser(u => ({ ...u, nom: e.target.value }))} placeholder="Nom" />
                  </div>
                  <div className="au-field">
                    <label>Prénom</label>
                    <input type="text" value={editingUser.prenom || ''} onChange={(e) => setEditingUser(u => ({ ...u, prenom: e.target.value }))} placeholder="Prénom" />
                  </div>
                </div>
                <div className="au-field">
                  <label>Email</label>
                  <input type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser(u => ({ ...u, email: e.target.value }))} placeholder="email@exemple.ne" />
                </div>
              </div>

              {/* Rôle */}
              <div className="au-form-section">
                <div className="au-form-section-title"><span>🎭</span> Rôle</div>
                {editingUser.role === 'admin' ? (
                  <div className="au-admin-lock">
                    <span>👑</span>
                    <span>Le rôle <strong>Administrateur</strong> ne peut pas être modifié.</span>
                  </div>
                ) : (
                  <div className="au-role-cards">
                    {Object.entries(ROLE_CONFIG).filter(([k]) => k !== 'admin').map(([v, rc]) => (
                      <button
                        key={v}
                        type="button"
                        className={`au-role-card ${editingUser.role === v ? 'au-role-card--active' : ''}`}
                        style={editingUser.role === v ? { background: rc.bg, borderColor: rc.color, color: rc.color } : {}}
                        onClick={() => setEditingUser(u => ({ ...u, role: v }))}
                      >
                        <span>{rc.icon}</span>
                        <span>{rc.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vérification */}
              <div className="au-form-section">
                <div className="au-form-section-title"><span>✅</span> Vérification</div>
                <label className="au-toggle-label">
                  <div
                    className={`au-toggle ${editingUser.isVerified ? 'au-toggle--on' : ''}`}
                    onClick={() => setEditingUser(u => ({ ...u, isVerified: !u.isVerified }))}
                  >
                    <div className="au-toggle-thumb" />
                  </div>
                  <span>Compte {editingUser.isVerified ? 'vérifié' : 'non vérifié'}</span>
                </label>
              </div>

              {/* Actions */}
              <div className="au-form-actions">
                <button type="button" className="au-form-cancel" onClick={closeEdit}>Annuler</button>
                <button type="button" className="au-form-save" onClick={handleSave} disabled={saving}>
                  {saving && <span className="au-btn-spinner" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════
          MODAL CRÉER ENTREPRISE
          ════════════════════════════ */}
      {showEntreprise && (
        <div className="au-modal-overlay" onClick={closeEntreprise}>
          <div className="au-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-modal-head">
              <div className="au-modal-head-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>🏢</div>
              <div className="au-modal-head-text">
                <h2 className="au-modal-title">Nouvelle entreprise</h2>
                <p className="au-modal-sub">Créer un compte client entreprise</p>
              </div>
              <button className="au-modal-close" onClick={closeEntreprise}>✕</button>
            </div>

            <form onSubmit={handleSubmitEntreprise} className="au-form">
              <div className="au-form-section">
                <div className="au-form-section-title"><span>🏢</span> Informations</div>
                <div className="au-field">
                  <label>Nom de l'entreprise <span className="au-required">*</span></label>
                  <input type="text" value={entrepriseForm.nom} onChange={setEf('nom')} placeholder="Ex : SONIDEP, ONG Sahel…" required />
                </div>
                <div className="au-form-row">
                  <div className="au-field">
                    <label>Téléphone <span className="au-required">*</span></label>
                    <input type="tel" value={entrepriseForm.telephone} onChange={setEf('telephone')} placeholder="+22796648383" required />
                  </div>
                  <div className="au-field">
                    <label>Contact / Prénom</label>
                    <input type="text" value={entrepriseForm.prenom} onChange={setEf('prenom')} placeholder="Prénom du contact" />
                  </div>
                </div>
                <div className="au-field">
                  <label>Email</label>
                  <input type="email" value={entrepriseForm.email} onChange={setEf('email')} placeholder="contact@entreprise.ne" />
                </div>
                <div className="au-field">
                  <label>Mot de passe</label>
                  <input type="password" value={entrepriseForm.password} onChange={setEf('password')} placeholder="Laisser vide → connexion par OTP" />
                  <span className="au-field-hint">Si vide, l'entreprise se connectera par OTP uniquement.</span>
                </div>
              </div>
              <div className="au-form-actions">
                <button type="button" className="au-form-cancel" onClick={closeEntreprise}>Annuler</button>
                <button type="submit" className="au-form-save au-form-save--amber" disabled={saving}>
                  {saving && <span className="au-btn-spinner" />}
                  Créer l'entreprise
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
        <div className="au-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="au-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-confirm-icon">🗑️</div>
            <h3>Supprimer cet utilisateur ?</h3>
            <p>
              <strong>{[confirmDelete.nom, confirmDelete.prenom].filter(Boolean).join(' ') || confirmDelete.telephone}</strong>
              {' '}sera définitivement supprimé ainsi que toutes ses données.
            </p>
            <div className="au-confirm-actions">
              <button className="au-confirm-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="au-confirm-delete" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
