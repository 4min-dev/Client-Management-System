import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AppStore } from '../lib/store';
import { ServerAPI } from '../lib/api';
import type { Station } from '../lib/types';

interface StationDetailsDialogProps {
  station: Station;
  onClose: () => void;
  onSave: () => void;
}

export function StationDetailsDialog({ station, onClose, onSave }: StationDetailsDialogProps) {
  const [details, setDetails] = useState({
    shiftChangeEvents: station.shiftChangeEvents,
    calibrationChangeEvents: station.calibrationChangeEvents,
    seasonChangeEvents: station.seasonChangeEvents,
    fixShiftCount: station.fixShiftCount,
    receiptCoefficient: station.receiptCoefficient,
    seasonCount: station.seasonCount,
    selectedFuelTypes: station.selectedFuelTypes
  });

  const fuelTypes = AppStore.getFuelTypes();
  const [showFuelSelection, setShowFuelSelection] = useState(false);

  const handleSave = async () => {
    station.shiftChangeEvents = details.shiftChangeEvents;
    station.calibrationChangeEvents = details.calibrationChangeEvents;
    station.seasonChangeEvents = details.seasonChangeEvents;
    station.fixShiftCount = details.fixShiftCount;
    station.receiptCoefficient = details.receiptCoefficient;
    station.seasonCount = details.seasonCount;
    station.selectedFuelTypes = details.selectedFuelTypes;
    station.fuelTypeCount = details.selectedFuelTypes.length;

    // Adjust discount based on coefficient and seasons
    let discountAdjustment = 0;
    if (details.receiptCoefficient === 1) {
      discountAdjustment -= 15; // -15% if coefficient is on
    }
    discountAdjustment -= (details.seasonCount - 1) * 10; // -10% per extra season

    // Recalculate price and sum
    const rates = AppStore.getCurrencyRates();
    const rate = rates.find(r => r.currency === station.currency);
    if (rate) {
      const adjustedDiscount = Math.max(0, station.discount + discountAdjustment);
      station.price = rate.pricePerPistol * (1 - adjustedDiscount / 100);
      station.monthlySum = station.pistolCount * station.price;
    }

    AppStore.saveStation(station);

    // Send updated data to server
    await ServerAPI.sendStationData(station.id, {
      shiftChangeEvents: details.shiftChangeEvents,
      calibrationChangeEvents: details.calibrationChangeEvents,
      seasonChangeEvents: details.seasonChangeEvents,
      fixshiftChangeCount: details.fixShiftCount,
      receiptCoefficient: details.receiptCoefficient,
      seasonCount: details.seasonCount,
      processorCount: station.processorCount,
      gunCount: station.pistolCount,
      stationTotalSum: station.monthlySum,
      currency: station.currency
    });

    onSave();
  };

  const toggleFuelType = (id: number) => {
    const current = [...details.selectedFuelTypes];
    const index = current.indexOf(id);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setDetails({ ...details, selectedFuelTypes: current });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Детали Станции (Форма 8)</DialogTitle>
          <DialogDescription>
            Настройки событий, синхронизации и технических параметров станции
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="shiftChangeEvents"
              checked={details.shiftChangeEvents === 1}
              onCheckedChange={(checked) => 
                setDetails({ ...details, shiftChangeEvents: checked ? 1 : 0 })
              }
            />
            <Label htmlFor="shiftChangeEvents" className="cursor-pointer">
              События изменения количество смен
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="calibrationChangeEvents"
              checked={details.calibrationChangeEvents === 1}
              onCheckedChange={(checked) => 
                setDetails({ ...details, calibrationChangeEvents: checked ? 1 : 0 })
              }
            />
            <Label htmlFor="calibrationChangeEvents" className="cursor-pointer">
              События изменение юстировки
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="seasonChangeEvents"
              checked={details.seasonChangeEvents === 1}
              onCheckedChange={(checked) => 
                setDetails({ ...details, seasonChangeEvents: checked ? 1 : 0 })
              }
            />
            <Label htmlFor="seasonChangeEvents" className="cursor-pointer">
              События изменение сезона
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="fixShiftCount"
              checked={details.fixShiftCount === 1}
              onCheckedChange={(checked) => 
                setDetails({ ...details, fixShiftCount: checked ? 1 : 0 })
              }
            />
            <Label htmlFor="fixShiftCount" className="cursor-pointer">
              Фиксация Количество смен
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="receiptCoefficient"
              checked={details.receiptCoefficient === 1}
              onCheckedChange={(checked) => 
                setDetails({ ...details, receiptCoefficient: checked ? 1 : 0 })
              }
            />
            <Label htmlFor="receiptCoefficient" className="cursor-pointer">
              Коэффициент для чеков (-15% скидки)
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Типы топлив ({details.selectedFuelTypes.length} выбрано)</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFuelSelection(!showFuelSelection)}
            >
              {showFuelSelection ? 'Скрыть' : 'Выбрать'} типы топлива
            </Button>
            
            {showFuelSelection && (
              <div className="border rounded p-4 space-y-2">
                {fuelTypes.map(fuel => (
                  <div key={fuel.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`fuel-${fuel.id}`}
                      checked={details.selectedFuelTypes.includes(fuel.id)}
                      onCheckedChange={() => toggleFuelType(fuel.id)}
                    />
                    <Label htmlFor={`fuel-${fuel.id}`} className="cursor-pointer">
                      {fuel.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Количество Сезонов (-10% за каждый дополнительный)</Label>
            <Select 
              value={details.seasonCount.toString()} 
              onValueChange={(v) => setDetails({ ...details, seasonCount: parseInt(v) as 1 | 2 | 3 | 4 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 сезон</SelectItem>
                <SelectItem value="2">2 сезона</SelectItem>
                <SelectItem value="3">3 сезона</SelectItem>
                <SelectItem value="4">4 сезона</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
