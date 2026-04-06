import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
  // Inscrire un nouveau client
  register: async (telephone, nom, prenom, email) => {
    const response = await api.post('/auth/register', { telephone, nom, prenom, email });
    return response.data;
  },

  // Envoyer un code OTP (connexion utilisateur existant)
  sendOTP: async (telephone) => {
    const response = await api.post('/auth/send-otp', { telephone });
    return response.data;
  },

  // Vérifier le code OTP
  verifyOTP: async (telephone, otp) => {
    const response = await api.post('/auth/verify-otp', { telephone, otp });
    return response.data;
  },

  // Récupérer les informations de l'utilisateur connecté
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Mot de passe oublié - Envoyer OTP
  forgotPassword: async (telephone) => {
    const response = await api.post('/auth/forgot-password', { telephone });
    return response.data;
  },

  // Vérifier l'OTP de réinitialisation
  verifyResetOTP: async (telephone, otp) => {
    const response = await api.post('/auth/verify-reset-otp', { telephone, otp });
    return response.data;
  },

  // Réinitialiser le mot de passe
  resetPassword: async (telephone, otp, password) => {
    const response = await api.post('/auth/reset-password', { telephone, otp, password });
    return response.data;
  },

  // Récupérer les types de livraison actifs (route publique)
  getTypesLivraison: async () => {
    const response = await api.get('/auth/types-livraison');
    return response.data;
  },
};

// Service admin
export const adminService = {
  // Statistiques
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Utilisateurs
  getUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Commandes
  getCommandes: async (page = 1, limit = 10, statut = '') => {
    const params = new URLSearchParams({ page, limit });
    if (statut) params.append('statut', statut);
    const response = await api.get(`/admin/commandes?${params}`);
    return response.data;
  },

  // Coursiers
  getCoursiers: async (statut) => {
    const params = statut ? { statut } : {};
    const response = await api.get('/admin/coursiers', { params });
    return response.data;
  },

  // Affecter une commande à un coursier
  affecterCommande: async (commandeId, coursierId) => {
    const response = await api.post(`/admin/commandes/${commandeId}/affecter`, {
      coursierId,
    });
    return response.data;
  },

  createCoursier: async (data) => {
    const response = await api.post('/admin/coursiers', data);
    return response.data;
  },

  updateCoursier: async (id, data) => {
    const response = await api.put(`/admin/coursiers/${id}`, data);
    return response.data;
  },

  deleteCoursier: async (id) => {
    const response = await api.delete(`/admin/coursiers/${id}`);
    return response.data;
  },

  // Récupérer les utilisateurs pour la sélection
  getUsersForSelection: async () => {
    const response = await api.get('/admin/users?limit=1000');
    return response.data;
  },

  // Créer une entreprise
  createEntreprise: async (data) => {
    const response = await api.post('/admin/entreprises', data);
    return response.data;
  },

  // ── Gestion des fonds ──
  getFondsSoldes: async () => {
    const response = await api.get('/admin/fonds/soldes');
    return response.data;
  },

  getFondsHistorique: async (page = 1, limit = 20) => {
    const response = await api.get(`/admin/fonds/historique?page=${page}&limit=${limit}`);
    return response.data;
  },

  enregistrerRemise: async (coursierId, notes = '') => {
    const response = await api.post('/admin/fonds/remise', { coursierId, notes });
    return response.data;
  },

  // Types de livraison
  getTypesLivraison: async () => {
    const response = await api.get('/admin/types-livraison');
    return response.data;
  },

  getTypeLivraison: async (id) => {
    const response = await api.get(`/admin/types-livraison/${id}`);
    return response.data;
  },

  createTypeLivraison: async (data) => {
    const response = await api.post('/admin/types-livraison', data);
    return response.data;
  },

  updateTypeLivraison: async (id, data) => {
    const response = await api.put(`/admin/types-livraison/${id}`, data);
    return response.data;
  },

  deleteTypeLivraison: async (id) => {
    const response = await api.delete(`/admin/types-livraison/${id}`);
    return response.data;
  },
};

// Service coursier
export const coursierService = {
  // Récupérer le profil coursier
  getProfile: async () => {
    const response = await api.get('/coursier/profile');
    return response.data;
  },

  // Mettre à jour le profil coursier
  updateProfile: async (data) => {
    const response = await api.put('/coursier/profile', data);
    return response.data;
  },

  // Récupérer les commandes assignées
  getCommandes: async (statut) => {
    const params = statut ? { statut } : {};
    const response = await api.get('/coursier/commandes', { params });
    return response.data;
  },

  // Récupérer les commandes disponibles
  getCommandesDisponibles: async () => {
    const response = await api.get('/coursier/commandes/disponibles');
    return response.data;
  },

  // Accepter une commande
  accepterCommande: async (commandeId) => {
    const response = await api.post(`/coursier/commandes/${commandeId}/accepter`);
    return response.data;
  },

  // Démarrer une livraison
  demarrerLivraison: async (commandeId) => {
    const response = await api.post(`/coursier/commandes/${commandeId}/demarrer`);
    return response.data;
  },

  // Livrer une commande
  livrerCommande: async (commandeId) => {
    const response = await api.post(`/coursier/commandes/${commandeId}/livrer`);
    return response.data;
  },

  // Confirmer la réception de l'argent de livraison
  confirmerPaiement: async (commandeId) => {
    const response = await api.post(`/coursier/commandes/${commandeId}/confirmer-paiement`);
    return response.data;
  },

  // Confirmer la récupération du colis
  recupererColis: async (commandeId) => {
    const response = await api.post(`/coursier/commandes/${commandeId}/recuperer-colis`);
    return response.data;
  },

  // Mettre à jour la localisation
  updateLocalisation: async (latitude, longitude, commandeId) => {
    const response = await api.post('/coursier/localisation', {
      latitude,
      longitude,
      commandeId,
    });
    return response.data;
  },

  // Récupérer le suivi d'une commande
  getTracking: async (commandeId) => {
    const response = await api.get(`/coursier/commandes/${commandeId}/tracking`);
    return response.data;
  },

  // Solde en caisse (argent collecté non encore remis à l'agence)
  getSolde: async () => {
    const response = await api.get('/coursier/solde');
    return response.data;
  },
};

// Service particulier
export const particulierService = {
  // Créer une commande
  createCommande: async (data) => {
    const response = await api.post('/particulier/commandes', data);
    return response.data;
  },

  // Récupérer les commandes du client
  getCommandes: async (statut) => {
    const params = statut ? { statut } : {};
    const response = await api.get('/particulier/commandes', { params });
    return response.data;
  },

  // Récupérer le suivi d'une commande (accessible par tous les rôles autorisés)
  getTracking: async (commandeId) => {
    const response = await api.get(`/particulier/commandes/${commandeId}/tracking`);
    return response.data;
  },

  // Modifier une commande
  updateCommande: async (commandeId, data) => {
    const response = await api.put(`/particulier/commandes/${commandeId}`, data);
    return response.data;
  },
};

export default api;

