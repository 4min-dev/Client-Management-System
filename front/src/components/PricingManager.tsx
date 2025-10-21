import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { AppStore } from '../lib/store';
import { ServerAPI } from '../lib/api';
import type { CurrencyRate, Currency } from '../lib/types';

interface PricingManagerProps {
  onClose: () => void;
}

export function PricingManager({ onClose }: PricingManagerProps) {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = () => {
    setRates(AppStore.getCurrencyRates());
  };

  const handleSave = (rate: CurrencyRate) => {
    AppStore.saveCurrencyRate(rate);
    
    // Update all stations with this currency
    const stations = AppStore.getStations();
    const affectedStations = stations.filter(s => s.currency === rate.currency);
    
    if (affectedStations.length > 0) {
      if (!confirm(`Изменить цены для ${affectedStations.length} станций с валютой ${rate.currency}?`)) {
        return;
      }

      affectedStations.forEach(station => {
        station.price = rate.pricePerPistol * (1 - station.discount / 100);
        station.monthlySum = station.pistolCount * station.price;
        AppStore.saveStation(station);
        
        // Send updated data to server
        ServerAPI.sendStationData(station.id, {
          shiftChangeEvents: station.shiftChangeEvents,
          calibrationChangeEvents: station.calibrationChangeEvents,
          seasonChangeEvents: station.seasonChangeEvents,
          fixshiftChangeCount: station.fixShiftCount,
          receiptCoefficient: station.receiptCoefficient,
          seasonCount: station.seasonCount,
          processorCount: station.processorCount,
          gunCount: station.pistolCount,
          stationTotalSum: station.monthlySum,
          currency: station.currency
        });
      });
    }

    setEditingCurrency(null);
    loadRates();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Управление Ценами (Форма 5)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Цена за 1 пистолет и курс валют для конвертации в AMD
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">№</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead className="text-right">Цена за 1 пистолет</TableHead>
                <TableHead className="text-right">Курс к AMD</TableHead>
                <TableHead className="text-right">Цена в AMD</TableHead>
                <TableHead className="w-24">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate, index) => {
                const isEditing = editingCurrency === rate.currency;
                const priceInAMD = rate.pricePerPistol * rate.rate;

                return (
                  <TableRow key={rate.currency}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{rate.currency}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={rate.pricePerPistol}
                          className="text-right"
                          id={`price-${rate.currency}`}
                        />
                      ) : (
                        formatNumber(rate.pricePerPistol)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          defaultValue={rate.rate}
                          className="text-right"
                          id={`rate-${rate.currency}`}
                        />
                      ) : (
                        formatNumber(rate.rate)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(priceInAMD)}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              const priceInput = document.getElementById(`price-${rate.currency}`) as HTMLInputElement;
                              const rateInput = document.getElementById(`rate-${rate.currency}`) as HTMLInputElement;
                              
                              handleSave({
                                currency: rate.currency,
                                pricePerPistol: parseFloat(priceInput.value) || rate.pricePerPistol,
                                rate: parseFloat(rateInput.value) || rate.rate
                              });
                            }}
                          >
                            Сохранить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCurrency(null)}
                          >
                            Отмена
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCurrency(rate.currency)}
                        >
                          Изменить
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>* При изменении цены или курса, автоматически обновляются цены для всех станций с данной валютой</p>
            <p>* Данные отправляются на сервер для синхронизации с desktop программой</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
