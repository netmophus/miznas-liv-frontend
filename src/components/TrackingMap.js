import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursierService, particulierService } from '../services/api';
import PageLayout from './PageLayout';
import './TrackingMap.css';

const STEP_ORDER = ['en_attente', 'acceptee', 'en_cours', 'colis_recupere', 'livree'];

const STATUT_CONFIG = {
  en_attente:    { color: '#f59e0b', bg: '#fffbeb', label: 'En attente',  icon: '⏳' },
  acceptee:      { color: '#3b82f6', bg: '#eff6ff', label: 'Acceptée',    icon: '✅' },
  en_cours:      { color: '#6366f1', bg: '#eef2ff', label: 'En route',    icon: '🚴' },
  colis_recupere:{ color: '#f97316', bg: '#fff7ed', label: 'Colis pris',  icon: '📦' },
  livree:        { color: '#10b981', bg: '#ecfdf5', label: 'Livrée',      icon: '🎉' },
  annulee:       { color: '#ef4444', bg: '#fef2f2', label: 'Annulée',     icon: '❌' },
};

const TYPE_LABELS = {
  livraison_directe:    'Livraison directe',
  collecte_livraison:   'Collecte + Livraison',
  depuis_etablissement: 'Depuis établissement',
};

const VEHICULE_ICONS = { moto: '🏍️', velo: '🚲', voiture: '🚗', pied: '🚶' };

function initials(nom = '', prenom = '') {
  return ((nom[0] || '') + (prenom[0] || '')).toUpperCase() || '?';
}

const TrackingMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [refreshing, setRefreshing]     = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [historyOpen, setHistoryOpen]   = useState(false);

  const mapRef          = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);
  const intervalRef     = useRef(null);
  const scriptLoadedRef = useRef(false);
  const linkLoadedRef   = useRef(false);

  const fetchTrackingData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      let response;
      try { response = await particulierService.getTracking(id); }
      catch { response = await coursierService.getTracking(id); }
      if (response.success) {
        setTrackingData(response.data);
        setError('');
        setLastUpdated(new Date());
      } else {
        if (!silent) setError('Impossible de charger les données de suivi');
      }
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrackingData(false);
    intervalRef.current = setInterval(() => fetchTrackingData(true), 3000);
    return () => {
      clearInterval(intervalRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [id, fetchTrackingData]);

  useEffect(() => {
    if (trackingData && mapRef.current && !mapInstanceRef.current) initializeMap();
    else if (trackingData && mapInstanceRef.current) updateMap();
  }, [trackingData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeMap = () => {
    if (!trackingData || !mapRef.current || mapInstanceRef.current) return;
    if (window.L && window.L.map) { createMap(); return; }

    if (!linkLoadedRef.current) {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      linkLoadedRef.current = true;
    }

    if (!scriptLoadedRef.current) {
      const existing = document.querySelector('script[src*="leaflet.js"]');
      if (existing) {
        scriptLoadedRef.current = true;
        if (window.L?.map) createMap();
        else existing.onload = () => createMap();
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => { scriptLoadedRef.current = true; createMap(); };
        document.head.appendChild(script);
      }
    } else if (window.L?.map) {
      createMap();
    }
  };

  const createMap = () => {
    if (!trackingData || !mapRef.current || mapInstanceRef.current) return;
    if (mapRef.current._leaflet_id) return;

    const defaultLat = trackingData.commande?.coordonneesDepart?.latitude || 13.5137;
    const defaultLng = trackingData.commande?.coordonneesDepart?.longitude || 2.1098;
    const isMobile   = window.innerWidth <= 768;

    try {
      const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], isMobile ? 12 : 13);
      mapInstanceRef.current = map;
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      updateMap();
    } catch (err) {
      console.error('Erreur création carte:', err);
    }
  };

  const updateMap = () => {
    if (!mapInstanceRef.current || !trackingData) return;
    const map      = mapInstanceRef.current;
    const commande = trackingData.commande;

    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) map.removeLayer(layer);
    });

    let coursierLat, coursierLng;
    if (trackingData.localisationCoursier?.latitude && trackingData.localisationCoursier?.longitude) {
      coursierLat = trackingData.localisationCoursier.latitude;
      coursierLng = trackingData.localisationCoursier.longitude;
    } else if (commande.historiqueLocalisation?.length > 0) {
      const last = commande.historiqueLocalisation.at(-1);
      if (last.latitude && last.longitude) { coursierLat = last.latitude; coursierLng = last.longitude; }
    }

    if (commande.coordonneesDepart) {
      const isCollecte = commande.typeCommande === 'collecte_livraison';
      const isEtab     = commande.typeCommande === 'depuis_etablissement';
      let title   = isCollecte ? '📍 Point A (Récupération)' : isEtab ? '📍 Restaurant/Établissement' : '📍 Départ';
      let content = title + '<br>' + commande.adresseDepart;
      if ((isCollecte || isEtab) && commande.contactPointA) {
        content += '<br>📞 ' + commande.contactPointA.nom;
        if (commande.contactPointA.telephone) content += '<br>📱 ' + commande.contactPointA.telephone;
        if (commande.contactPointA.instructions) content += '<br>💡 ' + commande.contactPointA.instructions;
      } else if (commande.client?.telephone) {
        content += '<br>📞 ' + commande.client.telephone;
      }
      window.L.marker(
        [commande.coordonneesDepart.latitude, commande.coordonneesDepart.longitude],
        { icon: window.L.icon({
          iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
        }) }
      ).addTo(map).bindPopup(content);
    }

    if (commande.coordonneesArrivee) {
      const isCollecte = commande.typeCommande === 'collecte_livraison';
      const isEtab     = commande.typeCommande === 'depuis_etablissement';
      let title   = isCollecte ? '🎯 Point B (Livraison)' : isEtab ? '🎯 Destination' : '🎯 Arrivée';
      let content = title + '<br>' + commande.adresseArrivee;
      if (commande.telephoneDestinataire)
        content += '<br>📞 ' + commande.nomDestinataire + '<br>📱 ' + commande.telephoneDestinataire;
      if (isCollecte || isEtab) content += '<br><br>💰 Le coursier sera payé ici';
      window.L.marker(
        [commande.coordonneesArrivee.latitude, commande.coordonneesArrivee.longitude],
        { icon: window.L.icon({
          iconUrl:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
        }) }
      ).addTo(map).bindPopup(content);
    }

    if (coursierLat && coursierLng) {
      const icon = window.L.divIcon({
        className: 'tm-coursier-marker',
        html: '<div class="tm-coursier-pulse"></div><div class="tm-coursier-icon">🚴</div>',
        iconSize: [50, 50], iconAnchor: [25, 25],
      });
      if (markerRef.current) map.removeLayer(markerRef.current);
      markerRef.current = window.L.marker([coursierLat, coursierLng], { icon, zIndexOffset: 1000 })
        .addTo(map).bindPopup('🚴 Coursier — position en temps réel');

      const isMobile = window.innerWidth <= 768;
      const padding  = isMobile ? [20, 20] : [60, 60];
      if (commande.coordonneesDepart && commande.coordonneesArrivee) {
        map.fitBounds([
          [commande.coordonneesDepart.latitude,  commande.coordonneesDepart.longitude],
          [commande.coordonneesArrivee.latitude, commande.coordonneesArrivee.longitude],
          [coursierLat, coursierLng],
        ], { padding });
      } else {
        map.setView([coursierLat, coursierLng], isMobile ? 14 : 15, { animate: true, duration: 0.5 });
      }

      if (commande.historiqueLocalisation?.length > 1) {
        const path = [
          ...commande.historiqueLocalisation.map(p => [p.latitude, p.longitude]),
          [coursierLat, coursierLng],
        ];
        window.L.polyline(path, { color: '#6366f1', weight: 5, opacity: 0.8, smoothFactor: 1 }).addTo(map);
      }
    } else if (commande.coursier) {
      const lat = commande.coordonneesDepart?.latitude || 13.5137;
      const lng = commande.coordonneesDepart?.longitude || 2.1098;
      map.setView([lat, lng], 13);
    } else {
      map.setView([13.5137, 2.1098], 13);
    }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <PageLayout showNavbar showFooter>
        <div className="tm-loading">
          <div className="tm-loading-map">
            <div className="tm-loading-pin">📍</div>
            <div className="tm-loading-rings"><div /><div /><div /></div>
          </div>
          <p className="tm-loading-text">Chargement du suivi...</p>
        </div>
      </PageLayout>
    );
  }

  /* ─── Error ─── */
  if (error || !trackingData) {
    return (
      <PageLayout showNavbar showFooter>
        <div className="tm-error">
          <div className="tm-error-icon">🗺️</div>
          <h2>Suivi introuvable</h2>
          <p>{error || 'Données de suivi non disponibles'}</p>
          <button onClick={() => navigate(-1)} className="tm-btn-back-error">← Retour</button>
        </div>
      </PageLayout>
    );
  }

  const { commande, localisationCoursier } = trackingData;
  const cfg        = STATUT_CONFIG[commande.statut] || STATUT_CONFIG.en_attente;
  const activeStep = STEP_ORDER.indexOf(commande.statut);
  const isCollecte = commande.typeCommande === 'collecte_livraison';
  const isEtab     = commande.typeCommande === 'depuis_etablissement';
  const hasPos     = localisationCoursier?.latitude && localisationCoursier?.longitude;

  const departLabel  = isCollecte ? 'Point A — Récupération' : isEtab ? 'Restaurant / Établissement' : 'Départ (Client)';
  const arriveeLabel = isCollecte ? 'Point B — Livraison' : isEtab ? 'Destination' : 'Arrivée (Destinataire)';

  return (
    <PageLayout showNavbar showFooter>
      <div className="tm-page">

        {/* ── Header ── */}
        <div className="tm-header">
          <button className="tm-back" onClick={() => navigate(-1)}>← Retour</button>
          <div className="tm-header-center">
            <h1 className="tm-title">Suivi en temps réel</h1>
            <span className="tm-order-id">#{id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="tm-header-right">
            <span
              className="tm-status-badge"
              style={{ '--sc': cfg.color, '--sb': cfg.bg }}
            >
              {cfg.icon} {cfg.label}
            </span>
            <span className={`tm-refresh-dot ${refreshing ? 'tm-refresh-dot--spin' : ''}`}>
              {refreshing ? '⟳' : '●'}
            </span>
          </div>
        </div>

        {/* ── Stepper ── */}
        {commande.statut !== 'annulee' && (
          <div className="tm-stepper">
            {STEP_ORDER.map((key, i) => {
              const done   = i < activeStep;
              const active = i === activeStep;
              const s      = STATUT_CONFIG[key];
              return (
                <React.Fragment key={key}>
                  <div className={`tm-step${active ? ' tm-step--active' : ''}${done ? ' tm-step--done' : ''}`}>
                    <div
                      className="tm-step-bubble"
                      style={active ? { '--sc': s.color } : {}}
                    >
                      {done ? '✓' : s.icon}
                    </div>
                    <span className="tm-step-label">{s.label}</span>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`tm-step-line${i < activeStep ? ' tm-step-line--done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div className="tm-body">

          {/* Map area */}
          <div className="tm-map-area">
            <div className="tm-map-status-bar">
              <span>
                {hasPos
                  ? '🟢 Position du coursier en temps réel'
                  : commande.statut === 'colis_recupere'
                  ? '📦 Colis récupéré — livreur en route vers vous'
                  : commande.statut === 'en_cours'
                  ? '📡 Coursier en route — en attente de position GPS...'
                  : commande.statut === 'acceptee'
                  ? '✅ Commande acceptée — démarrage imminent'
                  : '⏳ En attente d\'un coursier'}
              </span>
              {lastUpdated && (
                <span className="tm-last-updated">
                  · Mis à jour à {lastUpdated.toLocaleTimeString('fr-FR')}
                </span>
              )}
            </div>
            <div ref={mapRef} className="tm-map" />
          </div>

          {/* Info panel */}
          <div className="tm-panel">

            {/* Type badge */}
            <div className="tm-panel-top">
              <span className="tm-type-badge">
                {TYPE_LABELS[commande.typeCommande] || commande.typeCommande}
              </span>
            </div>

            {/* Alerte colis en route vers destinataire */}
            {commande.statut === 'colis_recupere' && (
              <div className="tm-alert-delivery">
                <span className="tm-alert-icon">📦</span>
                <div>
                  <div className="tm-alert-title">Colis en route vers vous !</div>
                  <div className="tm-alert-sub">Le livreur a récupéré votre colis et se dirige vers le point de livraison.</div>
                </div>
              </div>
            )}

            {/* Route A → B */}
            <div className="tm-panel-section">
              <div className="tm-section-title">Itinéraire</div>
              <div className="tm-route">
                <div className="tm-route-point">
                  <div className="tm-route-dot tm-route-dot--a">A</div>
                  <div className="tm-route-info">
                    <div className="tm-route-label">{departLabel}</div>
                    <div className="tm-route-addr">{commande.adresseDepart}</div>
                    {(isCollecte || isEtab) && commande.contactPointA ? (
                      <div className="tm-route-contact">
                        <span>📞 {commande.contactPointA.nom}</span>
                        {commande.contactPointA.telephone && (
                          <span>📱 {commande.contactPointA.telephone}</span>
                        )}
                        {commande.contactPointA.instructions && (
                          <span className="tm-route-instructions">💡 {commande.contactPointA.instructions}</span>
                        )}
                      </div>
                    ) : commande.client?.telephone && (
                      <div className="tm-route-contact">
                        <span>📞 {commande.client.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tm-route-connector">
                  <div className="tm-route-line-v" />
                </div>

                <div className="tm-route-point">
                  <div className="tm-route-dot tm-route-dot--b">B</div>
                  <div className="tm-route-info">
                    <div className="tm-route-label">{arriveeLabel}</div>
                    <div className="tm-route-addr">{commande.adresseArrivee}</div>
                    {commande.telephoneDestinataire && (
                      <div className="tm-route-contact">
                        <span>📞 {commande.nomDestinataire}</span>
                        <span>📱 {commande.telephoneDestinataire}</span>
                      </div>
                    )}
                    {(isCollecte || isEtab) && (
                      <div className="tm-payment-here">💰 Paiement au coursier ici</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coursier */}
            {commande.coursier && (
              <div className="tm-panel-section">
                <div className="tm-section-title">Coursier assigné</div>
                <div className="tm-coursier-card">
                  <div className="tm-coursier-avatar">
                    {initials(commande.coursier.nom, commande.coursier.prenom)}
                  </div>
                  <div className="tm-coursier-info">
                    <div className="tm-coursier-name">
                      {commande.coursier.nom} {commande.coursier.prenom}
                    </div>
                    {commande.coursier.telephone && (
                      <div className="tm-coursier-sub">📱 {commande.coursier.telephone}</div>
                    )}
                    {commande.coursier.vehiculeType && (
                      <div className="tm-coursier-sub">
                        {VEHICULE_ICONS[commande.coursier.vehiculeType] || '🚗'} {commande.coursier.vehiculeType}
                      </div>
                    )}
                  </div>
                  {hasPos && <div className="tm-live-badge">LIVE</div>}
                </div>
                {hasPos && (
                  <div className="tm-pos-info">
                    <span>📍 {localisationCoursier.latitude.toFixed(5)}, {localisationCoursier.longitude.toFixed(5)}</span>
                    {localisationCoursier.derniereMiseAJour && (
                      <span>· {new Date(localisationCoursier.derniereMiseAJour).toLocaleTimeString('fr-FR')}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Client */}
            {commande.client && (
              <div className="tm-panel-section">
                <div className="tm-section-title">Client</div>
                <div className="tm-person-row">
                  <div className="tm-person-avatar tm-person-avatar--amber">
                    {initials(commande.client.nom, commande.client.prenom)}
                  </div>
                  <div>
                    <div className="tm-person-name">
                      {commande.client.nom} {commande.client.prenom}
                    </div>
                    {commande.client.telephone && (
                      <div className="tm-person-phone">📞 {commande.client.telephone}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="tm-panel-section">
              <div className="tm-section-title">Paiement</div>
              <div className="tm-payment-row">
                <span className="tm-payment-amount">
                  {Number(commande.montant || 0).toLocaleString('fr-FR')} FCFA
                </span>
                <span className={`tm-pay-badge ${commande.estPaye ? 'tm-pay-badge--paid' : ''}`}>
                  {commande.estPaye ? '✓ Payé' : '⏳ En attente'}
                </span>
              </div>
            </div>

            {/* History (collapsible) */}
            {commande.historiqueLocalisation?.length > 0 && (
              <div className="tm-panel-section tm-history-section">
                <button
                  className="tm-history-toggle"
                  onClick={() => setHistoryOpen(o => !o)}
                >
                  <span>📊 Historique ({commande.historiqueLocalisation.length} points)</span>
                  <span className={`tm-chevron ${historyOpen ? 'tm-chevron--open' : ''}`}>▾</span>
                </button>
                {historyOpen && (
                  <div className="tm-history-list">
                    {commande.historiqueLocalisation.slice(-10).reverse().map((pos, i) => (
                      <div key={i} className="tm-history-item">
                        <span className="tm-history-time">
                          {new Date(pos.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                        <span className="tm-history-coords">
                          {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>{/* /tm-panel */}
        </div>{/* /tm-body */}
      </div>{/* /tm-page */}
    </PageLayout>
  );
};

export default TrackingMap;
