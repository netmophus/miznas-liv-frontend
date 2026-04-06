import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { coursierService } from '../services/api';

/**
 * Composant pour tracker automatiquement la position du coursier
 * et l'envoyer au serveur quand il a une commande en cours
 */
const CoursierLocationTracker = ({ commandeId }) => {
  const { user } = useAuth();
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!commandeId || !user || user.role !== 'coursier') {
      return;
    }

    // Vérifier si la géolocalisation est disponible
    if (!navigator.geolocation) {
      console.warn('La géolocalisation n\'est pas disponible dans ce navigateur');
      return;
    }

    // Fonction pour envoyer la position
    const sendLocation = async (latitude, longitude) => {
      try {
        await coursierService.updateLocalisation(latitude, longitude, commandeId);
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la localisation:', error);
      }
    };

    // Surveiller la position en temps réel
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocation(latitude, longitude);
      },
      (error) => {
        console.error('Erreur géolocalisation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Toujours obtenir une position fraîche
      }
    );

    // Nettoyer à la déconnexion
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [commandeId, user]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default CoursierLocationTracker;

