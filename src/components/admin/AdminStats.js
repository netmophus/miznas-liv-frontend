import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import './AdminStats.css';

/* ── Config KPI cards ── */
const KPI_CONFIG = [
  {
    key: 'utilisateurs',
    icon: '👥',
    label: 'Utilisateurs',
    getValue: (s) => s.utilisateurs.total,
    color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    shadow: 'rgba(99,102,241,.38)',
    sub: (s) => [
      { icon: '✅', text: `${s.utilisateurs.verifies} vérifiés` },
      { icon: '⏳', text: `${s.utilisateurs.nonVerifies} en attente` },
    ],
  },
  {
    key: 'commandes',
    icon: '📦',
    label: 'Commandes',
    getValue: (s) => s.commandes.total,
    color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    shadow: 'rgba(59,130,246,.38)',
    sub: (s) => [
      { icon: '📅', text: `${s.commandes.recentes} ces 7 derniers jours` },
    ],
  },
  {
    key: 'revenu',
    icon: '💰',
    label: 'Revenu total',
    getValue: (s) =>
      new Intl.NumberFormat('fr-FR').format(s.commandes.revenuTotal) + ' FCFA',
    color: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    shadow: 'rgba(16,185,129,.38)',
    sub: () => [{ icon: '💳', text: 'Commandes payées uniquement' }],
    large: true,
  },
  {
    key: 'coursiers',
    icon: '🏍️',
    label: 'Coursiers actifs',
    getValue: (s) => s.coursiers.total,
    color: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    shadow: 'rgba(245,158,11,.38)',
    sub: () => [{ icon: '🟢', text: 'Actifs sur la plateforme' }],
  },
];

/* ── Config rôles ── */
const ROLE_CONFIG = {
  particulier: { label: 'Particuliers', icon: '👤', color: '#6366f1', bg: '#eef2ff' },
  entreprise:  { label: 'Entreprises',  icon: '🏢', color: '#f59e0b', bg: '#fffbeb' },
  coursier:    { label: 'Coursiers',    icon: '🏍️', color: '#10b981', bg: '#f0fdf4' },
  admin:       { label: 'Admins',       icon: '👑', color: '#ef4444', bg: '#fef2f2' },
};

/* ── Config statuts commandes ── */
const COMMANDE_STATUT_CONFIG = {
  en_attente: { label: 'En attente', icon: '⏳', color: '#f59e0b', bg: '#fffbeb' },
  acceptee:   { label: 'Acceptée',   icon: '✅', color: '#3b82f6', bg: '#eff6ff' },
  en_cours:   { label: 'En cours',   icon: '🚴', color: '#8b5cf6', bg: '#f5f3ff' },
  livree:     { label: 'Livrée',     icon: '📦', color: '#10b981', bg: '#f0fdf4' },
  annulee:    { label: 'Annulée',    icon: '❌', color: '#ef4444', bg: '#fef2f2' },
};

/* ── Config statuts coursiers ── */
const COURSIER_STATUT_CONFIG = {
  disponible:    { label: 'Disponible',    icon: '🟢', color: '#10b981', bg: '#f0fdf4' },
  en_livraison:  { label: 'En livraison',  icon: '🚴', color: '#3b82f6', bg: '#eff6ff' },
  indisponible:  { label: 'Indisponible',  icon: '🔴', color: '#ef4444', bg: '#fef2f2' },
};

const fallbackConfig = (key) => ({
  label: key.replace(/_/g, ' '),
  icon: '•',
  color: '#94a3b8',
  bg: '#f8fafc',
});

/* ── Barre de progression ── */
const ProgressBar = ({ count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="as-bar-track">
      <div
        className="as-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
};

/* ── Carte de détail (breakdown) ── */
const BreakdownCard = ({ title, icon, entries, total, configMap }) => (
  <div className="as-breakdown-card">
    <div className="as-breakdown-head">
      <span className="as-breakdown-icon">{icon}</span>
      <h3 className="as-breakdown-title">{title}</h3>
      <span className="as-breakdown-total">{total} total</span>
    </div>
    <div className="as-breakdown-list">
      {entries.length === 0 ? (
        <p className="as-breakdown-empty">Aucune donnée</p>
      ) : (
        entries.map(([key, count]) => {
          const cfg = configMap[key] || fallbackConfig(key);
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="as-breakdown-row">
              <div className="as-breakdown-row-top">
                <span className="as-breakdown-row-label">
                  <span
                    className="as-breakdown-dot"
                    style={{ background: cfg.color }}
                  />
                  {cfg.icon} {cfg.label}
                </span>
                <span className="as-breakdown-row-right">
                  <span
                    className="as-breakdown-count"
                    style={{ color: cfg.color }}
                  >
                    {count}
                  </span>
                  <span className="as-breakdown-pct">{pct}%</span>
                </span>
              </div>
              <ProgressBar count={count} total={total} color={cfg.color} />
            </div>
          );
        })
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
   ══════════════════════════════════════════════════ */
const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await adminService.getStats();
      if (response.success) {
        setStats(response.data);
        setLastRefresh(new Date());
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError('Impossible de charger les statistiques');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="as-loading">
        <div className="as-spinner" />
        <p>Chargement des statistiques…</p>
      </div>
    );
  }

  /* ── Erreur ── */
  if (error && !stats) {
    return (
      <div className="as-error-state">
        <div className="as-error-icon">📡</div>
        <h3>Connexion impossible</h3>
        <p>{error}</p>
        <button className="as-retry-btn" onClick={() => fetchStats()}>
          🔄 Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const commandeEntries = Object.entries(stats.commandes.parStatut).sort(
    (a, b) => b[1] - a[1]
  );
  const roleEntries = Object.entries(stats.utilisateurs.parRole).sort(
    (a, b) => b[1] - a[1]
  );
  const coursierEntries = Object.entries(stats.coursiers.parStatut).sort(
    (a, b) => b[1] - a[1]
  );
  const coursierTotal = coursierEntries.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="as-page">

      {/* ── En-tête ── */}
      <div className="as-topbar">
        <div className="as-topbar-left">
          <h1 className="as-page-title">Statistiques</h1>
          {lastRefresh && (
            <span className="as-last-refresh">
              Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {refreshing && <span className="as-dot-pulse" />}
            </span>
          )}
        </div>
        <button
          className="as-refresh-btn"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          title="Rafraîchir"
        >
          <span className={refreshing ? 'as-spin' : ''}>🔄</span>
          Actualiser
        </button>
      </div>

      {/* ── Bannière erreur silencieuse ── */}
      {error && stats && (
        <div className="as-error-banner">
          ⚠️ {error} —{' '}
          <button onClick={() => fetchStats(true)}>réessayer</button>
        </div>
      )}

      {/* ════════════════
          KPI CARDS
          ════════════════ */}
      <div className="as-kpi-grid">
        {KPI_CONFIG.map((kpi) => {
          const value = kpi.getValue(stats);
          const subs = kpi.sub(stats);
          return (
            <div
              key={kpi.key}
              className="as-kpi-card"
              style={{ '--kpi-color': kpi.color, '--kpi-shadow': kpi.shadow }}
            >
              <div className="as-kpi-bg-circle" />
              <div className="as-kpi-bg-circle2" />
              <div className="as-kpi-top">
                <div className="as-kpi-icon-wrap">
                  <span className="as-kpi-icon">{kpi.icon}</span>
                </div>
                <span className="as-kpi-label">{kpi.label}</span>
              </div>
              <div className={`as-kpi-value ${kpi.large ? 'as-kpi-value--lg' : ''}`}>
                {value}
              </div>
              <div className="as-kpi-subs">
                {subs.map((s, i) => (
                  <span key={i} className="as-kpi-sub">
                    {s.icon} {s.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════
          BREAKDOWNS
          ════════════════ */}
      <div className="as-breakdown-grid">

        <BreakdownCard
          title="Commandes par statut"
          icon="📦"
          entries={commandeEntries}
          total={stats.commandes.total}
          configMap={COMMANDE_STATUT_CONFIG}
        />

        <BreakdownCard
          title="Utilisateurs par rôle"
          icon="👥"
          entries={roleEntries}
          total={stats.utilisateurs.total}
          configMap={ROLE_CONFIG}
        />

        <BreakdownCard
          title="Coursiers par statut"
          icon="🏍️"
          entries={coursierEntries}
          total={coursierTotal}
          configMap={COURSIER_STATUT_CONFIG}
        />

      </div>

      {/* ════════════════
          BANDE ACTIVITÉ
          ════════════════ */}
      <div className="as-activity-band">
        <div className="as-activity-item">
          <span className="as-activity-dot as-activity-dot--blue" />
          <span className="as-activity-num">{stats.commandes.recentes}</span>
          <span className="as-activity-lbl">commandes cette semaine</span>
        </div>
        <div className="as-activity-sep" />
        <div className="as-activity-item">
          <span className="as-activity-dot as-activity-dot--green" />
          <span className="as-activity-num">{stats.utilisateurs.verifies}</span>
          <span className="as-activity-lbl">comptes vérifiés</span>
        </div>
        <div className="as-activity-sep" />
        <div className="as-activity-item">
          <span className="as-activity-dot as-activity-dot--purple" />
          <span className="as-activity-num">
            {stats.utilisateurs.total > 0
              ? Math.round((stats.utilisateurs.verifies / stats.utilisateurs.total) * 100)
              : 0}%
          </span>
          <span className="as-activity-lbl">taux de vérification</span>
        </div>
        <div className="as-activity-sep" />
        <div className="as-activity-item">
          <span className="as-activity-dot as-activity-dot--amber" />
          <span className="as-activity-num">
            {stats.commandes.total > 0
              ? Math.round(((stats.commandes.parStatut?.livree || 0) / stats.commandes.total) * 100)
              : 0}%
          </span>
          <span className="as-activity-lbl">taux de livraison</span>
        </div>
      </div>

    </div>
  );
};

export default AdminStats;
