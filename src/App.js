import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import OTPVerification from './components/OTPVerification';
import ForgotPassword from './components/ForgotPassword';
import ResetPasswordOTP from './components/ResetPasswordOTP';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminStats from './components/admin/AdminStats';
import AdminUsers from './components/admin/AdminUsers';
import AdminCommandes from './components/admin/AdminCommandes';
import AdminCoursiers from './components/admin/AdminCoursiers';
import AdminTypesLivraison from './components/admin/AdminTypesLivraison';
import AdminFonds from './components/admin/AdminFonds';
import CoursierCommandes from './components/CoursierCommandes';
import CoursierRevenus from './components/CoursierRevenus';
import TrackingMap from './components/TrackingMap';
import CreateCommande from './components/CreateCommande';
import EditCommande from './components/EditCommande';
import ParticulierCommandes from './components/ParticulierCommandes';
import Profile from './components/Profile';
import Parametres from './components/Parametres';
import CommandesRedirect from './components/CommandesRedirect';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-otp" element={<ResetPasswordOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/coursier/commandes"
              element={
                <PrivateRoute>
                  <CoursierCommandes />
                </PrivateRoute>
              }
            />
            <Route
              path="/coursier/tracking/:id"
              element={
                <PrivateRoute>
                  <TrackingMap />
                </PrivateRoute>
              }
            />
            <Route
              path="/coursier/revenus"
              element={
                <PrivateRoute>
                  <CoursierRevenus />
                </PrivateRoute>
              }
            />
            <Route
              path="/tracking/:id"
              element={
                <PrivateRoute>
                  <TrackingMap />
                </PrivateRoute>
              }
            />
            <Route
              path="/particulier/commandes"
              element={
                <PrivateRoute>
                  <ParticulierCommandes />
                </PrivateRoute>
              }
            />
            <Route
              path="/particulier/commandes/create"
              element={
                <PrivateRoute>
                  <CreateCommande />
                </PrivateRoute>
              }
            />
            <Route
              path="/particulier/commandes/edit/:id"
              element={
                <PrivateRoute>
                  <EditCommande />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <PrivateRoute>
                  <Parametres />
                </PrivateRoute>
              }
            />
            <Route
              path="/commandes"
              element={
                <PrivateRoute>
                  <CommandesRedirect />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            >
              <Route index element={<AdminStats />} />
              <Route path="stats" element={<AdminStats />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="commandes" element={<AdminCommandes />} />
              <Route path="coursiers" element={<AdminCoursiers />} />
              <Route path="types-livraison" element={<AdminTypesLivraison />} />
              <Route path="fonds" element={<AdminFonds />} />
            </Route>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

