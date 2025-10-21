import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ServerAPI } from '../lib/api';
import { AppStore } from '../lib/store';
import type { Firm } from '../lib/types';
import { Check } from 'lucide-react';

interface FirmActionsProps {
  firm: Firm;
  onUpdate: () => void;
}

export function FirmActions({ firm, onUpdate }: FirmActionsProps) {
  const [payment, setPayment] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !payment || processing) return;
    
    setProcessing(true);
    const amount = parseFloat(payment.replace(/,/g, ''));
    
    if (isNaN(amount) || amount <= 0) {
      alert('Неправильная сумма');
      setProcessing(false);
      return;
    }

    try {
      // Sort stations by license date (earliest first), then by monthly sum (highest first)
      const sortedStations = [...firm.stations].sort((a, b) => {
        const dateA = new Date(a.licenseDate).getTime();
        const dateB = new Date(b.licenseDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return b.monthlySum - a.monthlySum;
      });

      let remainingAmount = amount;
      const now = new Date();

      for (const station of sortedStations) {
        while (remainingAmount >= station.monthlySum) {
          // Add one month
          const currentLicense = new Date(station.licenseDate);
          if (currentLicense < now) {
            currentLicense.setTime(now.getTime());
          }
          currentLicense.setMonth(currentLicense.getMonth() + 1);
          station.licenseDate = currentLicense;
          
          remainingAmount -= station.monthlySum;
          
          // Send license date to server
          await ServerAPI.sendLicenseDate(station.id, currentLicense);
        }
        
        AppStore.saveStation(station);
      }

      // Remaining amount goes to prepayment
      if (remainingAmount > 0) {
        sortedStations.forEach(station => {
          station.prepayment += remainingAmount / sortedStations.length;
          AppStore.saveStation(station);
        });
      }

      setPayment('');
      onUpdate();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при обработке платежа');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        placeholder="Сумма"
        value={payment}
        onChange={(e) => setPayment(e.target.value)}
        onKeyDown={handlePayment}
        className="w-24 h-8 text-sm"
        disabled={processing}
      />
      {processing && <Check className="w-4 h-4 text-green-600 animate-pulse" />}
    </div>
  );
}
