import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { particulierService, authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLayout from './PageLayout';
import './CreateCommande.css';

const TYPE_OPTIONS = [
  {
    value: 'livraison_directe',
    numero: 'Option 1',
    titre: 'Livraison directe',
    description: 'Je remets un colis au livreur pour qu\'il le dépose à destination.',
    icone: '📦',
    color: '#667eea',
    labelDepart: 'Votre adresse — point de remise du colis',
    labelArrivee: 'Adresse de destination',
    placeholderDepart: 'Votre adresse actuelle',
    placeholderArrivee: 'Adresse complète du destinataire',
  },
  {
    value: 'collecte_livraison',
    numero: 'Option 2',
    titre: 'Collecte + livraison',
    description: 'Le livreur va chercher un colis ou document à un point donné, puis le livre.',
    icone: '🔄',
    color: '#f59e0b',
    labelDepart: 'Point A — Adresse de récupération du colis',
    labelArrivee: 'Point B — Adresse de livraison',
    placeholderDepart: 'Où le livreur doit récupérer le colis',
    placeholderArrivee: 'Adresse complète du destinataire',
  },
  {
    value: 'depuis_etablissement',
    numero: 'Option 3',
    titre: 'Commande depuis un établissement',
    description: 'Le livreur récupère une commande dans un restaurant ou commerce puis la livre.',
    icone: '🏪',
    color: '#10b981',
    labelDepart: 'Adresse du restaurant / commerce',
    labelArrivee: 'Adresse de livraison',
    placeholderDepart: 'Nom et adresse du restaurant ou commerce',
    placeholderArrivee: 'Adresse complète du destinataire',
  },
];

const PAYMENT_OPTIONS = [
  { value: 'cash',         label: 'Espèces',        icone: '💵' },
  { value: 'mobile_money', label: 'Mobile Money',   icone: '📱' },
  { value: 'carte',        label: 'Carte bancaire', icone: '💳' },
];

const CreateCommande = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    adresseDepart: '',
    adresseArrivee: '',
    coordonneesDepart: null,
    coordonneesArrivee: null,
    description: '',
    typeCommande: 'livraison_directe',
    contactPointA: { nom: '', telephone: '', instructions: '' },
    nomDestinataire: '',
    telephoneDestinataire: '',
    instructionsDestinataire: '',
    typeLivraison: '',
    montant: '',
    modePaiement: 'cash',
  });

  const [typesLivraison, setTypesLivraison]     = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [loadingTypes, setLoadingTypes]         = useState(true);
  const [error, setError]                       = useState('');
  const [notification, setNotification]         = useState({ type: '', message: '' });
  const [gettingLocation, setGettingLocation]   = useState({ depart: false, arrivee: false });
  const locationRequestedRef                    = useRef(false);

  const currentType = TYPE_OPTIONS.find(o => o.value === formData.typeCommande);
  const hasContactPointA =
    formData.typeCommande === 'collecte_livraison' ||
    formData.typeCommande === 'depuis_etablissement';

  /* ── Notification inline (remplace alert) ── */
  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 4000);
  };

  /* ── Charger les types de livraison ── */
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await authService.getTypesLivraison();
        if (response.success && response.data.typesLivraison.length > 0) {
          setTypesLivraison(response.data.typesLivraison);
          const first = response.data.typesLivraison[0];
          setFormData(prev => ({ ...prev, typeLivraison: first._id, montant: first.montant.toString() }));
        }
      } catch (err) {
        console.error('Erreur chargement types livraison:', err);
        setError('Erreur lors du chargement des formules de livraison');
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  /* ── Géolocalisation auto (livraison directe) ── */
  useEffect(() => {
    if (
      formData.typeCommande === 'livraison_directe' &&
      !formData.coordonneesDepart &&
      !locationRequestedRef.current &&
      navigator.geolocation
    ) {
      locationRequestedRef.current = true;
      const timer = setTimeout(() => {
        setGettingLocation(prev => ({ ...prev, depart: true }));
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            setFormData(prev => ({ ...prev, coordonneesDepart: { latitude, longitude } }));
            setGettingLocation(prev => ({ ...prev, depart: false }));
          },
          (err) => {
            console.error('Erreur géolocalisation auto:', err);
            setGettingLocation(prev => ({ ...prev, depart: false }));
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.typeCommande, formData.coordonneesDepart]);

  /* ── handleChange ── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'typeCommande' && value === 'livraison_directe' && !formData.coordonneesDepart) {
      setTimeout(() => getCurrentLocation('depart', true), 100);
    }

    if (name === 'typeLivraison') {
      const selected = typesLivraison.find(t => t._id === value);
      setFormData({ ...formData, [name]: value, montant: selected ? selected.montant.toString() : '' });
    } else if (name.startsWith('contactPointA.')) {
      const field = name.split('.')[1];
      setFormData({ ...formData, contactPointA: { ...formData.contactPointA, [field]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  /* ── GPS ── */
  const getCurrentLocation = (type, silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) showNotif('error', 'La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    setGettingLocation(prev => ({ ...prev, [type]: true }));
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        if (type === 'depart') {
          setFormData(prev => ({ ...prev, coordonneesDepart: { latitude, longitude } }));
        } else {
          setFormData(prev => ({
            ...prev,
            adresseArrivee: prev.adresseArrivee || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            coordonneesArrivee: { latitude, longitude },
          }));
        }
        setGettingLocation(prev => ({ ...prev, [type]: false }));
        if (!silent) showNotif('success', `Position GPS ${type === 'depart' ? 'de départ' : "d'arrivée"} enregistrée !`);
      },
      (err) => {
        console.error('Erreur géolocalisation:', err);
        setGettingLocation(prev => ({ ...prev, [type]: false }));
        if (!silent) showNotif('error', 'Impossible d\'obtenir votre position. Autorisez la géolocalisation dans votre navigateur.');
      }
    );
  };

  /* ── Géocodage adresse ── */
  const geocodeAddress = async (address, type) => {
    if (!address || address.trim() === '') {
      showNotif('error', 'Saisissez d\'abord une adresse avant de la localiser');
      return;
    }
    setGettingLocation(prev => ({ ...prev, [type]: true }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'LivraisonApp/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
        if (type === 'depart') {
          setFormData(prev => ({ ...prev, coordonneesDepart: coords }));
        } else {
          setFormData(prev => ({ ...prev, coordonneesArrivee: coords }));
        }
        setGettingLocation(prev => ({ ...prev, [type]: false }));
        showNotif('success', `Adresse ${type === 'depart' ? 'de départ' : "d'arrivée"} localisée avec succès !`);
      } else {
        setGettingLocation(prev => ({ ...prev, [type]: false }));
        showNotif('error', 'Adresse introuvable. Précisez l\'adresse ou utilisez le bouton GPS.');
      }
    } catch (err) {
      console.error('Erreur géocodage:', err);
      setGettingLocation(prev => ({ ...prev, [type]: false }));
      showNotif('error', 'Erreur lors de la recherche. Utilisez le bouton GPS à la place.');
    }
  };

  /* ── Soumission ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dataToSend = { ...formData, montant: parseFloat(formData.montant) };
      const response = await particulierService.createCommande(dataToSend);
      if (response.success) {
        navigate('/particulier/commandes', { state: { success: true } });
      } else {
        setError(response.message || 'Erreur lors de la création de la commande');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Erreur lors de la création de la commande'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="cc-bg">
        <div className="cc-wrapper">

          {/* ── En-tête de page ── */}
          <div className="cc-page-header">
            <button className="cc-back-btn" type="button" onClick={() => navigate(-1)}>
              ← Retour
            </button>
            <div className="cc-page-title">
              <h1>Nouvelle livraison</h1>
              <p>{currentType?.description}</p>
            </div>
          </div>

          {/* ── Notification inline ── */}
          {notification.message && (
            <div className={`cc-notif cc-notif--${notification.type}`}>
              <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{notification.message}</span>
            </div>
          )}

          {/* ── Erreur formulaire ── */}
          {error && (
            <div className="cc-error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="cc-form">

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 1 — Type de commande
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-section">
              <div className="cc-section-head">
                <span className="cc-step-badge">1</span>
                <div>
                  <h2 className="cc-section-title">Type de commande</h2>
                  <p className="cc-section-sub">Choisissez comment fonctionne votre livraison</p>
                </div>
              </div>

              <div className="cc-type-grid">
                {TYPE_OPTIONS.map((option) => {
                  const isSelected = formData.typeCommande === option.value;
                  return (
                    <div
                      key={option.value}
                      className={`cc-type-card ${isSelected ? 'cc-type-card--active' : ''}`}
                      style={isSelected ? {
                        borderColor: option.color,
                        backgroundColor: option.color + '10',
                      } : {}}
                      onClick={() => handleChange({ target: { name: 'typeCommande', value: option.value } })}
                    >
                      {/* Icône */}
                      <div
                        className="cc-type-icon-wrap"
                        style={{ backgroundColor: option.color + '18' }}
                      >
                        <span className="cc-type-icon">{option.icone}</span>
                      </div>

                      {/* Texte */}
                      <div className="cc-type-body">
                        <span className="cc-type-num" style={{ color: option.color }}>
                          {option.numero}
                        </span>
                        <strong className="cc-type-titre">{option.titre}</strong>
                        <p className="cc-type-desc">{option.description}</p>
                      </div>

                      {/* Indicateur sélectionné */}
                      <div
                        className={`cc-type-radio ${isSelected ? 'cc-type-radio--on' : ''}`}
                        style={isSelected ? { backgroundColor: option.color, borderColor: option.color } : {}}
                      >
                        {isSelected && <span>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 2 — Itinéraire
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-section">
              <div className="cc-section-head">
                <span className="cc-step-badge">2</span>
                <div>
                  <h2 className="cc-section-title">Itinéraire</h2>
                  <p className="cc-section-sub">
                    {formData.typeCommande === 'collecte_livraison'
                      ? 'Point A (récupération du colis) → Point B (livraison)'
                      : formData.typeCommande === 'depuis_etablissement'
                      ? 'Établissement → Adresse du destinataire'
                      : 'Votre position → Adresse de destination'}
                  </p>
                </div>
              </div>

              <div className="cc-route">

                {/* ─ Point de départ ─ */}
                <div className="cc-route-row">
                  <div className="cc-route-col-left">
                    <div className="cc-route-dot cc-route-dot--a">
                      {formData.typeCommande === 'livraison_directe' ? '📍' : 'A'}
                    </div>
                    <div className="cc-route-vline" />
                  </div>
                  <div className="cc-route-col-right">
                    <label className="cc-label">
                      {currentType?.labelDepart} <span className="cc-required">*</span>
                    </label>
                    <div className="cc-addr-row">
                      <input
                        type="text"
                        className="cc-input"
                        name="adresseDepart"
                        value={formData.adresseDepart}
                        onChange={handleChange}
                        placeholder={currentType?.placeholderDepart}
                        required
                      />
                      <button
                        type="button"
                        className={`cc-icon-btn cc-icon-btn--gps ${gettingLocation.depart ? 'cc-icon-btn--loading' : ''}`}
                        onClick={() => getCurrentLocation('depart')}
                        disabled={gettingLocation.depart}
                        title="Utiliser ma position GPS actuelle"
                      >
                        {gettingLocation.depart ? <span className="cc-spinner" /> : '📍'}
                      </button>
                      <button
                        type="button"
                        className="cc-icon-btn cc-icon-btn--search"
                        onClick={() => geocodeAddress(formData.adresseDepart, 'depart')}
                        disabled={gettingLocation.depart || !formData.adresseDepart}
                        title="Localiser cette adresse"
                      >
                        {gettingLocation.depart ? <span className="cc-spinner" /> : '🔍'}
                      </button>
                    </div>
                    {formData.coordonneesDepart && (
                      <span className="cc-gps-badge cc-gps-badge--ok">✅ Position GPS confirmée</span>
                    )}
                    {!formData.coordonneesDepart && (
                      <span className="cc-gps-badge cc-gps-badge--warn">📍 GPS non confirmé — cliquez sur 📍 ou 🔍</span>
                    )}
                    {formData.typeCommande === 'livraison_directe' && user?.telephone && (
                      <span className="cc-phone-hint">📞 Votre numéro : {user.telephone}</span>
                    )}
                  </div>
                </div>

                {/* ─ Point d'arrivée ─ */}
                <div className="cc-route-row cc-route-row--last">
                  <div className="cc-route-col-left">
                    <div className="cc-route-dot cc-route-dot--b">
                      {formData.typeCommande === 'livraison_directe' ? '🎯' : 'B'}
                    </div>
                  </div>
                  <div className="cc-route-col-right">
                    <label className="cc-label">
                      {currentType?.labelArrivee} <span className="cc-required">*</span>
                    </label>
                    <div className="cc-addr-row">
                      <input
                        type="text"
                        className="cc-input"
                        name="adresseArrivee"
                        value={formData.adresseArrivee}
                        onChange={handleChange}
                        placeholder={currentType?.placeholderArrivee}
                        required
                      />
                      <button
                        type="button"
                        className={`cc-icon-btn cc-icon-btn--gps ${gettingLocation.arrivee ? 'cc-icon-btn--loading' : ''}`}
                        onClick={() => getCurrentLocation('arrivee')}
                        disabled={gettingLocation.arrivee}
                        title="Utiliser ma position GPS actuelle"
                      >
                        {gettingLocation.arrivee ? <span className="cc-spinner" /> : '📍'}
                      </button>
                      <button
                        type="button"
                        className="cc-icon-btn cc-icon-btn--search"
                        onClick={() => geocodeAddress(formData.adresseArrivee, 'arrivee')}
                        disabled={gettingLocation.arrivee || !formData.adresseArrivee}
                        title="Localiser cette adresse"
                      >
                        {gettingLocation.arrivee ? <span className="cc-spinner" /> : '🔍'}
                      </button>
                    </div>
                    {formData.coordonneesArrivee && (
                      <span className="cc-gps-badge cc-gps-badge--ok">✅ Position GPS confirmée</span>
                    )}
                    {!formData.coordonneesArrivee && (
                      <span className="cc-gps-badge cc-gps-badge--warn">📍 GPS non confirmé — cliquez sur 📍 ou 🔍</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 3 — Contacts
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-section">
              <div className="cc-section-head">
                <span className="cc-step-badge">3</span>
                <div>
                  <h2 className="cc-section-title">Contacts</h2>
                  <p className="cc-section-sub">
                    {hasContactPointA
                      ? 'Contact au point de récupération et destinataire final'
                      : 'Informations sur le destinataire'}
                  </p>
                </div>
              </div>

              {/* Contact Point A */}
              {hasContactPointA && (
                <div className="cc-contact-card cc-contact-card--a">
                  <div className="cc-contact-header">
                    <div className="cc-contact-badge cc-contact-badge--a">A</div>
                    <div>
                      <strong>
                        {formData.typeCommande === 'depuis_etablissement'
                          ? 'Contact au restaurant / établissement'
                          : 'Contact au point de récupération'}
                      </strong>
                      <p>
                        {formData.typeCommande === 'depuis_etablissement'
                          ? 'Le livreur appellera ce contact en arrivant pour récupérer la commande.'
                          : 'Le livreur appellera ce contact en arrivant pour récupérer le colis.'}
                      </p>
                    </div>
                  </div>
                  <div className="cc-form-row">
                    <div className="cc-field">
                      <label className="cc-label">
                        Nom du contact <span className="cc-required">*</span>
                      </label>
                      <input
                        type="text"
                        className="cc-input"
                        name="contactPointA.nom"
                        value={formData.contactPointA.nom}
                        onChange={handleChange}
                        placeholder={
                          formData.typeCommande === 'depuis_etablissement'
                            ? 'Nom du responsable ou gérant'
                            : 'Nom de la personne au point A'
                        }
                        required
                      />
                    </div>
                    <div className="cc-field">
                      <label className="cc-label">
                        Téléphone <span className="cc-required">*</span>
                      </label>
                      <input
                        type="tel"
                        className="cc-input"
                        name="contactPointA.telephone"
                        value={formData.contactPointA.telephone}
                        onChange={handleChange}
                        placeholder="+227 XX XX XX XX"
                        required
                      />
                    </div>
                  </div>
                  <div className="cc-field">
                    <label className="cc-label">Instructions pour le livreur</label>
                    <input
                      type="text"
                      className="cc-input"
                      name="contactPointA.instructions"
                      value={formData.contactPointA.instructions}
                      onChange={handleChange}
                      placeholder={
                        formData.typeCommande === 'depuis_etablissement'
                          ? 'Ex : Commande au nom de Jean, Aller au comptoir…'
                          : 'Ex : Sonner au 2ᵉ étage, Demander à M. Moussa…'
                      }
                    />
                  </div>
                </div>
              )}

              {/* Destinataire */}
              <div className={`cc-contact-card cc-contact-card--b ${hasContactPointA ? 'cc-mt' : ''}`}>
                <div className="cc-contact-header">
                  <div className="cc-contact-badge cc-contact-badge--b">B</div>
                  <div>
                    <strong>Destinataire — point de livraison</strong>
                    <p>
                      {formData.typeCommande === 'livraison_directe'
                        ? 'La personne qui recevra le colis à destination.'
                        : 'Le destinataire reçoit le colis et règle la course au livreur.'}
                    </p>
                  </div>
                </div>

                {/* Bandeau paiement au destinataire */}
                {formData.typeCommande !== 'livraison_directe' && (
                  <div className="cc-dest-payment-note">
                    <span className="cc-dest-payment-icon">💰</span>
                    <span>
                      Le livreur sera réglé directement par le destinataire à la livraison.
                      Assurez-vous qu'il dispose du montant exact.
                    </span>
                  </div>
                )}

                <div className="cc-form-row">
                  <div className="cc-field">
                    <label className="cc-label">
                      Nom du destinataire <span className="cc-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="cc-input"
                      name="nomDestinataire"
                      value={formData.nomDestinataire}
                      onChange={handleChange}
                      placeholder="Nom complet"
                      required
                    />
                  </div>
                  <div className="cc-field">
                    <label className="cc-label">
                      Téléphone <span className="cc-required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="cc-input"
                      name="telephoneDestinataire"
                      value={formData.telephoneDestinataire}
                      onChange={handleChange}
                      placeholder="+227 XX XX XX XX"
                      required
                    />
                  </div>
                </div>

                <div className="cc-field">
                  <label className="cc-label">Instructions pour le livreur</label>
                  <input
                    type="text"
                    className="cc-input"
                    name="instructionsDestinataire"
                    value={formData.instructionsDestinataire}
                    onChange={handleChange}
                    placeholder="Ex : Appeler avant d'arriver, Sonner au portail bleu, Remettre en main propre…"
                  />
                </div>
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 4 — Description
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-section">
              <div className="cc-section-head">
                <span className="cc-step-badge">4</span>
                <div>
                  <h2 className="cc-section-title">
                    Description
                    {formData.typeCommande === 'depuis_etablissement'
                      ? <span className="cc-required"> *</span>
                      : <span className="cc-optional"> — optionnel</span>}
                  </h2>
                  <p className="cc-section-sub">
                    {formData.typeCommande === 'depuis_etablissement'
                      ? 'Détaillez la commande que le livreur doit récupérer'
                      : 'Décrivez le contenu du colis ou toute instruction utile'}
                  </p>
                </div>
              </div>
              <textarea
                className="cc-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={
                  formData.typeCommande === 'depuis_etablissement'
                    ? 'Ex : 2 pizzas Margherita, 1 Coca, menu n°3… Précisez bien ce qui doit être récupéré.'
                    : formData.typeCommande === 'collecte_livraison'
                    ? 'Ex : Enveloppe avec documents importants, fragile, à remettre en main propre…'
                    : 'Ex : Colis de vêtements, dimensions 30×20×10 cm, fragile…'
                }
                rows="4"
                required={formData.typeCommande === 'depuis_etablissement'}
              />
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                SECTION 5 — Livraison & Paiement
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-section">
              <div className="cc-section-head">
                <span className="cc-step-badge">5</span>
                <div>
                  <h2 className="cc-section-title">Livraison & Paiement</h2>
                  <p className="cc-section-sub">Choisissez la formule et le mode de règlement</p>
                </div>
              </div>

              {/* Formule de livraison */}
              <label className="cc-label cc-label--block">
                Formule de livraison <span className="cc-required">*</span>
              </label>

              {loadingTypes ? (
                <div className="cc-loading-row">
                  <span className="cc-spinner cc-spinner--dark" />
                  <span>Chargement des formules…</span>
                </div>
              ) : typesLivraison.length === 0 ? (
                <p className="cc-error-text">Aucune formule disponible pour le moment</p>
              ) : (
                <div className="cc-livraison-grid">
                  {typesLivraison.map((type) => {
                    const isSelected = formData.typeLivraison === type._id;
                    return (
                      <div
                        key={type._id}
                        className={`cc-livraison-card ${isSelected ? 'cc-livraison-card--active' : ''}`}
                        onClick={() => handleChange({ target: { name: 'typeLivraison', value: type._id } })}
                      >
                        <div className="cc-livraison-icon">🚚</div>
                        <div className="cc-livraison-name">{type.nom}</div>
                        <div className="cc-livraison-price">
                          {Number(type.montant).toLocaleString()}
                          <span> FCFA</span>
                        </div>
                        {type.description && (
                          <div className="cc-livraison-desc">{type.description}</div>
                        )}
                        {isSelected && <div className="cc-livraison-check">✓</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode de paiement */}
              <label className="cc-label cc-label--block cc-label--mt">
                Mode de paiement
              </label>
              <div className="cc-payment-grid">
                {PAYMENT_OPTIONS.map((opt) => {
                  const isSelected = formData.modePaiement === opt.value;
                  return (
                    <div
                      key={opt.value}
                      className={`cc-payment-card ${isSelected ? 'cc-payment-card--active' : ''}`}
                      onClick={() => handleChange({ target: { name: 'modePaiement', value: opt.value } })}
                    >
                      <span className="cc-payment-icon">{opt.icone}</span>
                      <span className="cc-payment-label">{opt.label}</span>
                      {isSelected && <span className="cc-payment-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                ACTIONS
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="cc-actions">
              <button
                type="button"
                className="cc-btn-cancel"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="cc-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="cc-spinner cc-spinner--white" />
                    Envoi en cours…
                  </>
                ) : (
                  '✈️ Envoyer la demande'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateCommande;
