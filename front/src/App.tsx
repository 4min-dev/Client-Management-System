import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { FuelTypesManager } from './components/FuelTypesManager';
import { PricingManager } from './components/PricingManager';
import { useWhoamiQuery } from './services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { newUser } from './slices/userSlice';
import { getServerMacAddress } from './utils/network';
import { User } from './lib/types';

export default function App() {

  const { data: authData, refetch: refetchUserAuth } = useWhoamiQuery()
  const [showFuelTypes, setShowFuelTypes] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    console.log(authData)
    if (authData?.data) {
      dispatch(newUser({ user: authData.data as User }))
    }
  }, [authData])

  useEffect(() => {
    getServerMacAddress()
  }, [])

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
