import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { FuelTypesManager } from './components/FuelTypesManager';
import { PricingManager } from './components/PricingManager';
import { useUserAuthQuery } from './services/authService';

export default function App() {

  const { data: authData, refetch: refetchUserAuth } = useUserAuthQuery()
  const [showFuelTypes, setShowFuelTypes] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  if ((!authData?.data?.id) && (!authData?.isSuccess)) {
    return (
      <LoginPage onLogin={() => refetchUserAuth()} />
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
