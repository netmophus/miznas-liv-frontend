import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CommandesRedirect = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Cette redirection se fait automatiquement via Navigate
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger vers la bonne page selon le rôle
  switch (user.role) {
    case 'coursier':
      return <Navigate to="/coursier/commandes" replace />;
    case 'particulier':
    case 'entreprise':
      return <Navigate to="/particulier/commandes" replace />;
    case 'admin':
      return <Navigate to="/admin/commandes" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default CommandesRedirect;


