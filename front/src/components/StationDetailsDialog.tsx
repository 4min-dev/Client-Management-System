import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Fuel, FuelOnList, Station } from '../lib/types';
import { useGetStationOptionsQuery, useInitializeStationKeyMutation, useUpdateStationSyncMutation } from '../services/stationService';
import { useGetFuelListQuery } from '../services/fuelService';
import { useInitializeStationKey } from '../hooks/useInitializeStationKey';

interface StationDetailsDialogProps {
  station: Station;
  onClose: () => void;
  onSave: () => void;
}

export function StationDetailsDialog({ station, onClose, onSave }: StationDetailsDialogProps) {
  const { isReady, stationKey, refetch } = useInitializeStationKey(station.id);
  const [updateStationSync] = useUpdateStationSyncMutation();
  const { data: fuelTypes } = useGetFuelListQuery();

  const { data: stationOptionsData, error } = useGetStationOptionsQuery(
    { stationId: station.id, cryptoKey: stationKey! },
    { skip: !isReady || !stationKey || !station.id }
  );

  useEffect(() => {
    if (error && 'status' in error && error.status === 406) {
      localStorage.removeItem('STATION_CRYPTO_KEY');
      localStorage.removeItem('STATION_KEY_EXPIRES');
      refetch();
    }
  }, [error, refetch]);

  // useEffect(() => {
  //   if ('status' in error! && error?.status === 406) {
  //     updateCryptoKey(STATION_ID).then(() => refetch());
  //   }
  // }, [error]);

  const [details, setDetails] = useState<{
    shiftChangeEvents: 0 | 1,
    calibrationChangeEvents: 0 | 1,
    seasonChangeEvents: 0 | 1,
    fixShiftCount: 0 | 1,
    receiptCoefficient: 0 | 1,
    seasonCount: 1 | 2 | 3 | 4,
    selectedFuelTypes: Fuel[]
  }>({
    shiftChangeEvents: 0,
    calibrationChangeEvents: 0,
    seasonChangeEvents: 0,
    fixShiftCount: 0,
    receiptCoefficient: 0,
    seasonCount: 1,
    selectedFuelTypes: []
  });

  useEffect(() => {
    if (!stationOptionsData) return;

    setDetails({
      shiftChangeEvents: stationOptionsData.shiftChangeEvents || 0,
      calibrationChangeEvents: stationOptionsData.calibrationChangeEvents || 0,
      seasonChangeEvents: stationOptionsData.seasonChangeEvents || 0,
      fixShiftCount: stationOptionsData.fixShiftCount || 0,
      receiptCoefficient: stationOptionsData.receiptCoefficient || 0,
      seasonCount: (stationOptionsData.seasonCount as 1 | 2 | 3 | 4) || 1,
      selectedFuelTypes: station.selectedFuelTypes || [],
    });
  }, [stationOptionsData, station]);

  const [showFuelSelection, setShowFuelSelection] = useState(false);

  const handleSave = async () => {
    if (!isReady || !stationKey) {
      alert('Ключ станции не готов. Подождите...');
      return;
    }

    try {
      await updateStationSync({
        stationId: station.id,
        cryptoKey: stationKey,
        payload: {
          fuels: details.selectedFuelTypes,
          options: {
            calibrationChangeEvents: details.calibrationChangeEvents,
            fixShiftCount: details.fixShiftCount,
            receiptCoefficient: details.receiptCoefficient,
            seasonChangeEvents: details.seasonChangeEvents,
            seasonCount: details.seasonCount,
            shiftChangeEvents: details.shiftChangeEvents,
          },
        },
      }).unwrap();

      alert('Настройки обновлены!');
      onSave();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Ошибка: ' + (err?.data?.message || err.message));
    }
  };

  const toggleFuelType = (fuel: FuelOnList) => {
    setDetails((prev: any) => {
      const isSelected = prev.selectedFuelTypes.some((f: Fuel) => f.fuelId === fuel.id);

      if (isSelected) {
        return {
          ...prev,
          selectedFuelTypes: prev.selectedFuelTypes.filter((f: Fuel) => f.fuelId !== fuel.id)
        };
      } else {
        return {
          ...prev,
          selectedFuelTypes: [
            ...prev.selectedFuelTypes,
            { fuelId: fuel.id, name: fuel.name }
          ]
        };
      }
    });
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
              onCheckedChange={(checked: boolean) =>
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
              onCheckedChange={(checked: boolean) =>
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
              onCheckedChange={(checked: boolean) =>
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
              onCheckedChange={(checked: boolean) =>
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
              onCheckedChange={(checked: boolean) =>
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

            {(showFuelSelection && fuelTypes) && (
              <div className="border rounded p-4 space-y-2">
                {fuelTypes.data.map(fuel => (
                  <div key={fuel.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`fuel-${fuel.id}`}
                      checked={details.selectedFuelTypes.some(fuelType => fuelType.fuelId === fuel.id)}
                      onCheckedChange={() => toggleFuelType(fuel)}
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
              onValueChange={(v: string) => setDetails({ ...details, seasonCount: parseInt(v) as 1 | 2 | 3 | 4 })}
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
            <Button
              onClick={handleSave}
              disabled={!isReady || !stationKey}
            >
              {isReady ? 'Сохранить' : 'Загрузка ключа...'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
