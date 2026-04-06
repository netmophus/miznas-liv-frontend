import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { coursierService } from '../services/api';
import ParticulierDashboard from './ParticulierDashboard';
import EntrepriseDashboard from './EntrepriseDashboard';
import CoursierDashboard from './CoursierDashboard';
import AdminDashboard from './admin/AdminDashboard';
import AdminRoute from './AdminRoute';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [isCoursier, setIsCoursier] = useState(false);
  const [checkingCoursier, setCheckingCoursier] = useState(true);

  useEffect(() => {
    const checkCoursier = async () => {
      if (user?.role === 'particulier') {
        try {
          const response = await coursierService.getProfile();
          if (response.success && response.data.coursier?.estActif) {
            setIsCoursier(true);
          }
        } catch (err) {
          // L'utilisateur n'est pas coursier ou n'est pas actif
          setIsCoursier(false);
        }
      }
      setCheckingCoursier(false);
    };

    if (user && !loading) {
      checkCoursier();
    } else if (!loading) {
      setCheckingCoursier(false);
    }
  }, [user, loading]);

  if (loading || checkingCoursier) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rediriger vers le bon dashboard selon le rôle
  switch (user.role) {
    case 'admin':
      // Rediriger vers le dashboard admin avec les routes enfants
      return <Navigate to="/admin/stats" replace />;
    case 'coursier':
      // Utilisateur avec rôle coursier directement
      return <CoursierDashboard />;
    case 'entreprise':
      return <EntrepriseDashboard />;
    case 'particulier':
      // Si c'est un particulier qui est aussi coursier actif, afficher le dashboard coursier
      if (isCoursier) {
        return <CoursierDashboard />;
      }
      return <ParticulierDashboard />;
    default:
      return <ParticulierDashboard />;
  }
};

export default Dashboard;

