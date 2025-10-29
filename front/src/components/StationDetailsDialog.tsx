import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Fuel, FuelOnList, Station } from '../lib/types';
import { useGetStationOptionsQuery, useUpdateStationSyncMutation } from '../services/stationService';
import { updateCryptoKey } from '../utils/crypto';
import { useGetFuelListQuery } from '../services/fuelService';

interface StationDetailsDialogProps {
  station: Station;
  onClose: () => void;
  onSave: () => void;
}

const CRYPTO_KEY = import.meta.env.VITE_CRYPTO_KEY
const STATION_ID = import.meta.env.VITE_STATION_ID
const MAC_ADDRESS = import.meta.env.VITE_MAC_ADDRESS

export function StationDetailsDialog({ station, onClose, onSave }: StationDetailsDialogProps) {
  const [updateStationSync] = useUpdateStationSyncMutation()
  const { data: fuelTypes } = useGetFuelListQuery()

  const { data: stationOptionsData, error, isLoading, refetch } = useGetStationOptionsQuery(
    { stationId: STATION_ID, cryptoKey: CRYPTO_KEY },
    { skip: !CRYPTO_KEY }
  );

  useEffect(() => {
    if (stationOptionsData && stationOptionsData?.metadata?.needUpdate?.key) {
      console.log('Ключ устарел — обновляем...');
      updateCryptoKey(STATION_ID, MAC_ADDRESS)
        .then(() => {
          console.log('Ключ обновлён — перезагружаем опции');
          refetch();
        })
        .catch(console.error);
    }
  }, [stationOptionsData]);

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
    console.log(station)
    if (!stationOptionsData || !station.selectedFuelTypes) return

    setDetails({
      shiftChangeEvents: stationOptionsData?.shiftChangeEvents,
      calibrationChangeEvents: stationOptionsData?.calibrationChangeEvents,
      seasonChangeEvents: stationOptionsData?.seasonChangeEvents,
      fixShiftCount: stationOptionsData?.fixShiftCount,
      receiptCoefficient: stationOptionsData?.receiptCoefficient,
      seasonCount: stationOptionsData?.seasonCount,
      selectedFuelTypes: station.selectedFuelTypes
    })
  }, [stationOptionsData])

  useEffect(() => {
    console.log(details)
  }, [details])

  const [showFuelSelection, setShowFuelSelection] = useState(false);

  const handleSave = async () => {
    try {
      const res = await updateStationSync({
        stationId: STATION_ID,
        cryptoKey: CRYPTO_KEY,
        payload: {
          fuels: details.selectedFuelTypes,
          options: {
            calibrationChangeEvents: details.calibrationChangeEvents,
            fixShiftCount: details.fixShiftCount,
            receiptCoefficient: details.receiptCoefficient,
            seasonChangeEvents: details.seasonChangeEvents,
            seasonCount: details.seasonCount,
            shiftChangeEvents: details.shiftChangeEvents
          },
        },
      }).unwrap();

      console.log(res)
      alert('Настройки обновлены!');
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
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
