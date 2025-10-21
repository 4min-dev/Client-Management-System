import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { FuelTypesManager } from './components/FuelTypesManager';
import { PricingManager } from './components/PricingManager';
import { useUserAuthQuery } from './services/authService';

export default function App() {

  const { data: authData } = useUserAuthQuery()
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFuelTypes, setShowFuelTypes] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (in real app, check session/token)
    console.log(authData)
    const loggedIn = sessionStorage.getItem('accessToken');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={() => setIsAuthenticated(true)} />
    )
  }

  return (
    <>
      <Dashboard
        onManageFuelTypes={() => setShowFuelTypes(true)}
        onManagePricing={() => setShowPricing(true)}
      />

      {showFuelTypes && (
        <FuelTypesManager onClose={() => setShowFuelTypes(false)} />
      )}

      {showPricing && (
        <PricingManager onClose={() => setShowPricing(false)} />
      )}
    </>
  );
}
