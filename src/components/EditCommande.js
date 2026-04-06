import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { particulierService, authService } from '../services/api';
import PageLayout from './PageLayout';
import './CreateCommande.css';

const EditCommande = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    adresseDepart: '',
    adresseArrivee: '',
    coordonneesDepart: null,
    coordonneesArrivee: null,
    description: '',
    typeCommande: 'livraison_directe',
    contactPointA: {
      nom: '',
      telephone: '',
      instructions: '',
    },
    nomDestinataire: '',
    telephoneDestinataire: '',
    typeLivraison: '',
    montant: '',
    modePaiement: 'cash',
  });
  const [typesLivraison, setTypesLivraison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState({ depart: false, arrivee: false });

  // Charger les types de livraison et la commande
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les types de livraison
        const typesResponse = await authService.getTypesLivraison();
        if (typesResponse.success) {
          setTypesLivraison(typesResponse.data.typesLivraison);
        }

        // Charger la commande
        const commandesResponse = await particulierService.getCommandes();
        if (commandesResponse.success) {
          const commande = commandesResponse.data.commandes.find(c => c._id === id);
          if (!commande) {
            setError('Commande non trouvée');
            return;
          }

          // Vérifier que la commande peut être modifiée
          if (commande.coursier) {
            setError('Cette commande ne peut plus être modifiée car elle est déjà affectée à un coursier');
            return;
          }

          if (commande.statut !== 'en_attente') {
            setError('Cette commande ne peut plus être modifiée');
            return;
          }

          // Remplir le formulaire avec les données de la commande
          // Extraire l'ID du typeLivraison (peut être un objet populé ou un ID)
          let typeLivraisonId = '';
          if (commande.typeLivraison) {
            if (typeof commande.typeLivraison === 'object' && commande.typeLivraison._id) {
              typeLivraisonId = commande.typeLivraison._id.toString();
            } else if (typeof commande.typeLivraison === 'string') {
              typeLivraisonId = commande.typeLivraison;
            } else if (commande.typeLivraison.toString) {
              typeLivraisonId = commande.typeLivraison.toString();
            }
          }

          console.log('Commande chargée:', commande);
          console.log('TypeLivraison extrait:', typeLivraisonId);

          if (!typeLivraisonId) {
            setError('Erreur: Type de livraison introuvable pour cette commande');
            return;
          }

          setFormData({
            adresseDepart: commande.adresseDepart || '',
            adresseArrivee: commande.adresseArrivee || '',
            coordonneesDepart: commande.coordonneesDepart || null,
            coordonneesArrivee: commande.coordonneesArrivee || null,
            description: commande.description || '',
            nomDestinataire: commande.nomDestinataire || '',
            telephoneDestinataire: commande.telephoneDestinataire || '',
            typeLivraison: typeLivraisonId,
            montant: commande.montant?.toString() || '',
            modePaiement: commande.modePaiement || 'cash',
          });
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
        setLoadingTypes(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si le type de livraison change, mettre à jour le montant automatiquement
    if (name === 'typeLivraison') {
      const selectedType = typesLivraison.find(t => t._id === value);
      setFormData({
        ...formData,
        [name]: value,
        montant: selectedType ? selectedType.montant.toString() : formData.montant,
      });
    } else if (name.startsWith('contactPointA.')) {
      // Gérer les champs contactPointA
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contactPointA: {
          ...formData.contactPointA,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Obtenir la position GPS actuelle
  const getCurrentLocation = (type) => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGettingLocation({ ...gettingLocation, [type]: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (type === 'depart') {
          setFormData({
            ...formData,
            coordonneesDepart: { latitude, longitude },
          });
        } else {
          setFormData({
            ...formData,
            coordonneesArrivee: { latitude, longitude },
          });
        }
        setGettingLocation({ ...gettingLocation, [type]: false });
        alert(`Position GPS ${type === 'depart' ? 'de départ' : "d'arrivée"} enregistrée !`);
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
        setGettingLocation({ ...gettingLocation, [type]: false });
        alert('Impossible d\'obtenir votre position. Veuillez autoriser l\'accès à la géolocalisation.');
      }
    );
  };

  // Géocoder une adresse
  const geocodeAddress = async (address, type) => {
    if (!address || address.trim() === '') {
      alert('Veuillez entrer une adresse');
      return;
    }

    setGettingLocation({ ...gettingLocation, [type]: true });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'LivraisonApp/1.0',
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const coordinates = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        };

        if (type === 'depart') {
          setFormData({
            ...formData,
            coordonneesDepart: coordinates,
          });
        } else {
          setFormData({
            ...formData,
            coordonneesArrivee: coordinates,
          });
        }

        setGettingLocation({ ...gettingLocation, [type]: false });
        alert(`Coordonnées GPS ${type === 'depart' ? 'de départ' : "d'arrivée"} trouvées !`);
      } else {
        setGettingLocation({ ...gettingLocation, [type]: false });
        alert('Adresse introuvable. Veuillez utiliser le bouton GPS pour obtenir votre position actuelle.');
      }
    } catch (err) {
      console.error('Erreur géocodage:', err);
      setGettingLocation({ ...gettingLocation, [type]: false });
      alert('Erreur lors de la recherche de l\'adresse. Utilisez le bouton GPS pour obtenir votre position.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Vérifier que typeLivraison est valide
      if (!formData.typeLivraison || formData.typeLivraison.trim() === '') {
        setError('Veuillez sélectionner un type de livraison');
        setSaving(false);
        return;
      }

      // Vérifier que typeLivraison est valide
      if (!formData.typeLivraison || formData.typeLivraison.trim() === '') {
        setError('Veuillez sélectionner un type de livraison');
        setSaving(false);
        return;
      }

      // Préparer les données - envoyer tous les champs même s'ils n'ont pas changé
      const dataToSend = {
        adresseDepart: formData.adresseDepart,
        adresseArrivee: formData.adresseArrivee,
        description: formData.description || '',
        typeCommande: formData.typeCommande,
        nomDestinataire: formData.nomDestinataire,
        telephoneDestinataire: formData.telephoneDestinataire,
        typeLivraison: formData.typeLivraison,
        montant: parseFloat(formData.montant),
        modePaiement: formData.modePaiement,
      };

      // Ajouter contactPointA seulement si nécessaire
      if (formData.typeCommande === 'collecte_livraison' || formData.typeCommande === 'depuis_etablissement') {
        dataToSend.contactPointA = formData.contactPointA;
      }

      // Ajouter les coordonnées seulement si elles existent
      if (formData.coordonneesDepart) {
        dataToSend.coordonneesDepart = formData.coordonneesDepart;
      }
      if (formData.coordonneesArrivee) {
        dataToSend.coordonneesArrivee = formData.coordonneesArrivee;
      }

      console.log('Données envoyées:', dataToSend);

      const response = await particulierService.updateCommande(id, dataToSend);
      if (response.success) {
        alert('Commande modifiée avec succès !');
        navigate('/particulier/commandes');
      } else {
        const errorMsg = response.message || response.errors?.[0]?.msg || 'Erreur lors de la modification';
        setError(errorMsg);
        alert(`Erreur: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      console.error('Réponse erreur:', err.response?.data);
      
      // Afficher les détails de l'erreur
      let errorMessage = 'Erreur lors de la modification de la commande';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          // Afficher toutes les erreurs de validation
          const errorsList = errorData.errors.map(e => e.msg || e.message).join(', ');
          errorMessage = errorsList || errorData.message || errorMessage;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      setError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout showNavbar={true} showFooter={true}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNavbar={true} showFooter={true}>
      <div className="create-commande-container edit-commande-container">
        <div className="form-container">
          <div className="form-header">
            <h1>✏️ Modifier la commande</h1>
            <p className="form-subtitle">Modifiez les informations de votre commande</p>
          </div>

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="typeCommande">
                📋 Type de commande <span className="required">*</span>
              </label>
              <select
                id="typeCommande"
                name="typeCommande"
                value={formData.typeCommande}
                onChange={handleChange}
                required
              >
                <option value="livraison_directe">
                  📦 Livraison directe (J'ai le colis, je veux le livrer)
                </option>
                <option value="collecte_livraison">
                  🔄 Collecte + Livraison (Aller récupérer puis livrer)
                </option>
                <option value="depuis_etablissement">
                  🏪 Depuis établissement (Restaurant/Commerce)
                </option>
              </select>
              <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                {formData.typeCommande === 'livraison_directe' && 
                  'Vous avez le colis et voulez le livrer directement'}
                {formData.typeCommande === 'collecte_livraison' && 
                  'Le coursier doit d\'abord récupérer le colis au point A puis le livrer au point B'}
                {formData.typeCommande === 'depuis_etablissement' && 
                  'Le coursier récupère la commande dans un restaurant/commerce puis la livre'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="adresseDepart">
                📍 Adresse de départ <span className="required">*</span>
              </label>
              <div className="address-input-group">
                <input
                  type="text"
                  id="adresseDepart"
                  name="adresseDepart"
                  value={formData.adresseDepart}
                  onChange={handleChange}
                  placeholder="Ex: Rue 123, Niamey"
                  required
                />
                <button
                  type="button"
                  onClick={() => geocodeAddress(formData.adresseDepart, 'depart')}
                  className="btn-geocode"
                  disabled={gettingLocation.depart}
                >
                  {gettingLocation.depart ? '⏳' : '🔍'}
                </button>
                <button
                  type="button"
                  onClick={() => getCurrentLocation('depart')}
                  className="btn-gps"
                  disabled={gettingLocation.depart}
                >
                  {gettingLocation.depart ? '⏳' : '📍'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adresseArrivee">
                🎯 Adresse d'arrivée <span className="required">*</span>
              </label>
              <div className="address-input-group">
                <input
                  type="text"
                  id="adresseArrivee"
                  name="adresseArrivee"
                  value={formData.adresseArrivee}
                  onChange={handleChange}
                  placeholder="Ex: Avenue 456, Niamey"
                  required
                />
                <button
                  type="button"
                  onClick={() => geocodeAddress(formData.adresseArrivee, 'arrivee')}
                  className="btn-geocode"
                  disabled={gettingLocation.arrivee}
                >
                  {gettingLocation.arrivee ? '⏳' : '🔍'}
                </button>
                <button
                  type="button"
                  onClick={() => getCurrentLocation('arrivee')}
                  className="btn-gps"
                  disabled={gettingLocation.arrivee}
                >
                  {gettingLocation.arrivee ? '⏳' : '📍'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">📝 Description (optionnel)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez ce qui doit être livré..."
                rows="4"
              />
            </div>

            {/* Champs contactPointA - affichés seulement pour collecte_livraison et depuis_etablissement */}
            {(formData.typeCommande === 'collecte_livraison' || formData.typeCommande === 'depuis_etablissement') && (
              <div className="form-section">
                <h3 style={{ marginBottom: '15px', color: '#1f2937', fontSize: '1.1rem' }}>
                  📞 Contact au point A (pour récupération)
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPointA.nom">
                      👤 Nom du contact au point A <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactPointA.nom"
                      name="contactPointA.nom"
                      value={formData.contactPointA.nom}
                      onChange={handleChange}
                      placeholder="Nom de la personne à contacter"
                      required={formData.typeCommande !== 'livraison_directe'}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactPointA.telephone">
                      📞 Téléphone du contact au point A <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      id="contactPointA.telephone"
                      name="contactPointA.telephone"
                      value={formData.contactPointA.telephone}
                      onChange={handleChange}
                      placeholder="+227 XX XX XX XX"
                      required={formData.typeCommande !== 'livraison_directe'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="contactPointA.instructions">
                    📝 Instructions pour le coursier au point A
                  </label>
                  <input
                    type="text"
                    id="contactPointA.instructions"
                    name="contactPointA.instructions"
                    value={formData.contactPointA.instructions}
                    onChange={handleChange}
                    placeholder="Ex: Demander à M. X, Aller au comptoir, etc."
                  />
                </div>
              </div>
            )}

            <div className="form-section">
              <h3 style={{ marginBottom: '15px', color: '#1f2937', fontSize: '1.1rem' }}>
                📦 Contact au point B (destinataire)
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nomDestinataire">
                    👤 Nom du destinataire <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="nomDestinataire"
                    name="nomDestinataire"
                    value={formData.nomDestinataire}
                    onChange={handleChange}
                    placeholder="Nom de la personne à contacter"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telephoneDestinataire">
                    📞 Téléphone du destinataire <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telephoneDestinataire"
                    name="telephoneDestinataire"
                    value={formData.telephoneDestinataire}
                    onChange={handleChange}
                    placeholder="+227 XX XX XX XX"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="typeLivraison">🚚 Type de livraison <span className="required">*</span></label>
                {loadingTypes ? (
                  <p>Chargement des types de livraison...</p>
                ) : typesLivraison.length === 0 ? (
                  <p className="error-text">Aucun type de livraison disponible</p>
                ) : (
                  <select
                    id="typeLivraison"
                    name="typeLivraison"
                    value={formData.typeLivraison}
                    onChange={handleChange}
                    required
                  >
                    {typesLivraison.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.nom} - {type.montant} FCFA {type.description ? `(${type.description})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="montant">
                  💰 Montant (FCFA) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="montant"
                  name="montant"
                  value={formData.montant}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  readOnly={formData.typeLivraison ? true : false}
                  style={formData.typeLivraison ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                />
                {formData.typeLivraison && (
                  <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    Le montant est défini par le type de livraison sélectionné
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modePaiement">💳 Mode de paiement</label>
              <select
                id="modePaiement"
                name="modePaiement"
                value={formData.modePaiement}
                onChange={handleChange}
              >
                <option value="cash">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte bancaire</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/particulier/commandes')}
                className="btn-cancel"
                disabled={saving}
              >
                Annuler
              </button>
              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? 'Modification...' : 'Modifier la commande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default EditCommande;

