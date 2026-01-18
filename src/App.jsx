import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import LoginCode from './pages/LoginCode';
import DemoStart from './pages/DemoStart';
import Profile from './pages/Profile';
import Weather from './pages/Weather';
import Care from './pages/Care';
import TrainingDetail from './pages/TrainingDetail';
import Horses from './pages/Horses';
import HorseProfile from './pages/HorseProfile';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Billing from './pages/Billing';
import ClientsManagement from './pages/ClientsManagement';
import Onboarding from './pages/Onboarding';
import Breeding from './pages/Breeding';
import BreedingDetail from './pages/BreedingDetail';
import BreedingAdvice from './pages/BreedingAdvice';
import HalfLease from './pages/HalfLease';
import Messaging from './pages/Messaging';
import Stock from './pages/Stock';
import Nutrition from './pages/Nutrition';
import Competition from './pages/Competition';
import Settings from './pages/Settings';
import Register from './pages/Register';
import MediaGallery from './pages/MediaGallery';
import Budget from './pages/Budget';
import Support from './pages/Support';
import Payment from './pages/Payment';
import SwitchAccount from './pages/SwitchAccount';
import LandingPage from './pages/LandingPage';
import Assistant from './pages/Assistant';
import WeightTracking from './pages/WeightTracking';
import NutritionCalculator from './pages/NutritionCalculator';
import PWAPrompt from './components/PWAPrompt';
import UpdateNotification from './components/UpdateNotification';
import { useServiceWorker } from './hooks/useServiceWorker';
import { canAccess } from './utils/permissions';

// Simple Auth Guard
const ProtectedRoute = ({ redirectPath = '/login', children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
};

const FeatureGuard = ({ feature, children }) => {
  if (!canAccess(feature)) {
    return <Navigate to="/" replace />; // Redirect to dashboard if disabled
  }
  return children;
};

function AppContent() {
  const { currentUser } = useAuth();
  const { needRefresh, offlineReady, updateApp, dismissUpdate } = useServiceWorker();

  useEffect(() => {
    // Force Purge of Old Data (One-time - Run V3)
    const hasCleaned = localStorage.getItem('appHorse_cleaned_final_v3');
    if (!hasCleaned) {
      console.log("Purging all AppHorse data (V3 Aggressive)...");
      const keysToRemove = [
        'my_horses', 'my_horses_v2', 'my_horses_v3', 'my_horses_v4',
        'appHorse_breeding', 'appHorse_breeding_v2',
        'appHorse_careItems', 'appHorse_careItems_v2', 'appHorse_careItems_v3',
        'appHorse_leases', 'appHorse_leases_v2', 'appHorse_leases_v3',
        'appHorse_clients', 'appHorse_clients_v2',
        'appHorse_team', 'appHorse_team_v2',
        'appHorse_billing_v1', 'appHorse_billing_suppliers_v1',
        'appHorse_customEvents',
        'appHorse_budget',
        'appHorse_stock_v1'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('appHorse_cleaned_final_v3', 'true');
      // window.location.reload(); // Avoid reload loop if possible
    }
  }, []);

  return (
    <ThemeProvider>
      {/* Notification de mise à jour PWA */}
      <UpdateNotification
        needRefresh={needRefresh}
        offlineReady={offlineReady}
        onUpdate={updateApp}
        onDismiss={dismissUpdate}
      />

      <Routes>
        {/* Public Routes (Redirect to dashboard if already logged in) */}
        <Route path="/signup" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <SignUp />
        } />
        <Route path="/login" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/login-code" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <LoginCode />
        } />
        <Route path="/demo" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <DemoStart />
        } />



        {/* 
            ROOT ROUTE logic:
            If user is logged in -> Show MainLayout (which renders Outlet and Dashboard at index)
            If user is Guest -> Show LandingPage
        */}
        <Route path="/" element={
          currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="profile" element={<Profile />} />

          <Route path="horses" element={<Horses />} />
          <Route path="horses/:id" element={<HorseProfile />} />
          <Route path="horses/:id/care" element={<Care />} />
          <Route path="horses/:id/weight" element={<WeightTracking />} />
          <Route path="horses/:id/nutrition" element={<NutritionCalculator />} />
          <Route path="care" element={<Care />} />

          <Route path="training/:id" element={<TrainingDetail />} />
          <Route path="weather" element={<Weather />} />
          <Route path="calendar" element={<Calendar />} />

          <Route path="team" element={<FeatureGuard feature="team"><Team /></FeatureGuard>} />
          <Route path="budget" element={<FeatureGuard feature="budget"><Budget /></FeatureGuard>} />
          <Route path="billing" element={<FeatureGuard feature="billing"><Billing /></FeatureGuard>} />
          <Route path="contacts" element={<FeatureGuard feature="clients"><ClientsManagement /></FeatureGuard>} />
          <Route path="stock" element={<FeatureGuard feature="stock"><Stock /></FeatureGuard>} />
          <Route path="nutrition" element={<FeatureGuard feature="stock"><Nutrition /></FeatureGuard>} />
          <Route path="competition" element={<FeatureGuard feature="competition"><Competition /></FeatureGuard>} />

          <Route path="breeding" element={<FeatureGuard feature="breeding"><Breeding /></FeatureGuard>} />
          <Route path="breeding/advice" element={<FeatureGuard feature="breeding"><BreedingAdvice /></FeatureGuard>} />
          <Route path="breeding/:id" element={<FeatureGuard feature="breeding"><BreedingDetail /></FeatureGuard>} />

          <Route path="horse/:id" element={<FeatureGuard feature="my_horses"><HorseProfile /></FeatureGuard>} />
          <Route path="horse/:id/media" element={<FeatureGuard feature="media"><MediaGallery /></FeatureGuard>} />

          <Route path="leases" element={<FeatureGuard feature="leases"><HalfLease /></FeatureGuard>} />
          <Route path="messages" element={<FeatureGuard feature="messaging"><Messaging /></FeatureGuard>} />
          <Route path="register" element={<FeatureGuard feature="register"><Register /></FeatureGuard>} />
          <Route path="support" element={<FeatureGuard feature="support"><Support /></FeatureGuard>} />
          <Route path="settings" element={<Settings />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>

        {/* Protected Standalone Routes (Not part of MainLayout but require Auth) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/switch-account" element={<SwitchAccount />} />
        </Route>

        {/* Catch-all redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
