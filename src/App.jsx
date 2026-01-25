import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PWAProvider } from './context/PWAContext';
import MainLayout from './layouts/MainLayout';

// Pages - Main
import Dashboard from './pages/Dashboard';
import DemoStart from './pages/DemoStart';
import LandingPage from './pages/LandingPage';
import Weather from './pages/Weather';
import TrainingDetail from './pages/TrainingDetail';
import Calendar from './pages/Calendar';
import HalfLease from './pages/HalfLease';
import Messaging from './pages/Messaging';
import Competition from './pages/Competition';
import Support from './pages/Support';
import Payment from './pages/Payment';
import Assistant from './pages/Assistant';
import AITrainingCoach from './pages/AITrainingCoach';

// Pages - Auth
import { SignUp, Login, LoginCode, Onboarding, Register } from './pages/auth';

// Pages - Horse
import {
  Horses,
  HorseProfile,
  WeightTracking,
  Nutrition,
  NutritionCalculator,
  Care,
  Breeding,
  BreedingDetail,
  BreedingAdvice,
  MediaGallery
} from './pages/horse';

// Pages - Management
import { Team, Billing, ClientsManagement, Stock, Budget } from './pages/management';

// Pages - Profile
import { Settings, Profile, SwitchAccount } from './pages/profile';

// Components
import { PWAPrompt, UpdateNotification } from './components/pwa';
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

      <PWAPrompt />

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
          <Route path="health" element={<Care />} />

          <Route path="training/:id" element={<TrainingDetail />} />
          <Route path="weather" element={<Weather />} />
          <Route path="planning" element={<Calendar />} />

          <Route path="team" element={<FeatureGuard feature="team"><Team /></FeatureGuard>} />
          <Route path="budget" element={<FeatureGuard feature="budget"><Budget /></FeatureGuard>} />
          <Route path="billing" element={<FeatureGuard feature="billing"><Billing /></FeatureGuard>} />
          <Route path="clients" element={<FeatureGuard feature="clients"><ClientsManagement /></FeatureGuard>} />
          <Route path="stocks" element={<FeatureGuard feature="stock"><Stock /></FeatureGuard>} />
          <Route path="rations" element={<FeatureGuard feature="stock"><Nutrition /></FeatureGuard>} />
          <Route path="competition" element={<FeatureGuard feature="competition"><Competition /></FeatureGuard>} />

          <Route path="breeding" element={<FeatureGuard feature="breeding"><Breeding /></FeatureGuard>} />
          <Route path="breeding/advice" element={<FeatureGuard feature="breeding"><BreedingAdvice /></FeatureGuard>} />
          <Route path="breeding/:id" element={<FeatureGuard feature="breeding"><BreedingDetail /></FeatureGuard>} />

          <Route path="horse/:id" element={<FeatureGuard feature="my_horses"><HorseProfile /></FeatureGuard>} />
          <Route path="horse/:id/media" element={<FeatureGuard feature="media"><MediaGallery /></FeatureGuard>} />

          <Route path="sharing" element={<FeatureGuard feature="leases"><HalfLease /></FeatureGuard>} />
          <Route path="messages" element={<FeatureGuard feature="messaging"><Messaging /></FeatureGuard>} />
          <Route path="legal-register" element={<FeatureGuard feature="register"><Register /></FeatureGuard>} />
          <Route path="support" element={<FeatureGuard feature="support"><Support /></FeatureGuard>} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-coach" element={<AITrainingCoach />} />
          <Route path="ai-assistant" element={<Assistant />} />
        </Route>

        {/* Protected Standalone Routes (Not part of MainLayout but require Auth) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/accounts" element={<SwitchAccount />} />
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
      <PWAProvider>
        <AppContent />
      </PWAProvider>
    </AuthProvider>
  );
}
