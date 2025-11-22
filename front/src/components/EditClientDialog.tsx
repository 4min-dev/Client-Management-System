'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
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
import type { Currency, Firm, Station } from '../lib/types';
import {
  Phone,
  MessageSquare,
  Bell,
  Settings,
  Key,
  Trash2
} from 'lucide-react';
import { StationDetailsDialog } from './StationDetailsDialog';
import { useDeleteStationMutation, useGetStationOptionsQuery, useResetStationMacMutation, useUpdateStationMutation } from '../services/stationService';
import { StationRow } from './ui/stationRow';

interface EditClientDialogProps {
  firm: Firm;
  onClose: () => void;
  onSave: () => void;
  onMessageClick: () => void;
  onEventsClick: () => void;
}

export function EditClientDialog({
  firm,
  onClose,
  onSave,
  onMessageClick,
  onEventsClick
}: EditClientDialogProps) {
  const [resetMac] = useResetStationMacMutation()
  const [deleteStation] = useDeleteStationMutation();
  const [changeStation] = useUpdateStationMutation();
  const [editMode, setEditMode] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editedStations, setEditedStations] = useState<Record<string, Partial<Station>>>({});

  const formatDate = (date: Date) => {
    if (!date) return '-'

    return new Date(date).toLocaleDateString('ru-RU');
  };

  const totalProcessors = firm.stations.reduce((sum, s) => sum + s.procCount, 0);
  const totalPistols = firm.stations.reduce((sum, s) => sum + s.pistolCount, 0);

  const handleInputChange = (stationId: string, field: keyof Station, value: any) => {
    setEditedStations(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        [field]: value,
      },
    }));
  };

  const saveAllChanges = async () => {
    if (Object.keys(editedStations).length === 0) {
      onClose();
      return;
    }

    try {
      for (const [stationId, changes] of Object.entries(editedStations)) {
        await changeStation({ stationId, ...changes }).unwrap();
      }
      setEditedStations({});
      onSave();
      onClose();
      alert('Изменения успешно сохранены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveAllChanges();
    }
  };

  const handleDelete = async (station: Station) => {
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) return;

    const password = prompt('Введите пароль:');
    if (!password || password.trim() === '') {
      alert('Пароль обязателен!');
      return;
    }

    try {
      await deleteStation({ stationId: station.id, password }).unwrap();
      onSave();
      alert('Станция успешно удалена');
    } catch (error: any) {
      console.error('Ошибка удаления:', error);
      alert(error?.data?.message || 'Ошибка при удалении станции');
    }
  };

  const handleMacRequest = async (station: Station) => {
    if (!station.macAddress || !confirm('Сбросить MAC-адрес станции?')) return alert('MAC-адрес отсутствует');

    const newMac = prompt('Новый MAC (пусто = авто)', '')?.trim();

    try {
      const result = await resetMac({
        stationId: station.id,
        newMacAddress: newMac || undefined,
      }).unwrap();

      console.log('Result mac reset:', result)

      localStorage.setItem(`STATION_CRYPTO_KEY_${station.id}`, result.key);
      localStorage.setItem(`STATION_KEY_EXPIRES_${station.id}`, result.expiredAt);

      alert(
        `MAC сброшен!\nНовый ключ: ${result.key}\nДействует до: ${new Date(result.expiredAt).toLocaleString()}`
      );

      onSave();
    } catch (error: any) {
      alert(error?.data || 'Ошибка сброса MAC');
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onClose} className="mt-5">
        <DialogContent className="sm:!max-w-fit max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <div className="space-y-1">
                <div>Фирма: {firm.firmName}</div>
                <div className="text-sm">Владелец: {firm.ownerName}</div>
                <div className="text-sm text-muted-foreground">
                  Контакты: {firm.stations[0]?.firmContacts.join(', ')}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Управление информацией клиента и его станциями
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="editMode"
                checked={editMode}
                onCheckedChange={(checked: boolean) => {
                  setEditMode(checked as boolean);
                  if (!checked) setEditedStations({});
                }}
              />
              <Label htmlFor="editMode" className="cursor-pointer">
                Режим редактирования
              </Label>
            </div>
          </div>

          <div className="sm:!max-w-fit max-sm:overflow-x-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead className="text-right">
                    <div>Процессоры</div>
                    <div className="text-xs">{totalProcessors}</div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div>Пистолеты</div>
                    <div className="text-xs">{totalPistols}</div>
                  </TableHead>
                  <TableHead>Детали</TableHead>
                  <TableHead>Валюта</TableHead>
                  <TableHead className="text-right">Скидка</TableHead>
                  <TableHead className="text-right">Предоплата</TableHead>
                  <TableHead>Лицензия</TableHead>
                  <TableHead>Синхр.</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firm.stations.map((station, index) => (
                  <StationRow
                    key={station.id}
                    station={station}
                    index={index}
                    editMode={editMode}
                    editedStations={editedStations}
                    onInputChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onMessageClick={onMessageClick}
                    onEventsClick={onEventsClick}
                    onShowDetails={(s) => {
                      setSelectedStation(s);
                      setShowDetails(true);
                    }}
                    onMacReset={handleMacRequest}
                    onDelete={handleDelete}
                    formatDate={formatDate}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditedStations({});
                setEditMode(false);
                onClose();
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={saveAllChanges}
              disabled={Object.keys(editedStations).length === 0 && editMode}
            >
              Сохранить и закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showDetails && selectedStation && (
        <StationDetailsDialog
          station={selectedStation}
          onClose={() => {
            setShowDetails(false);
            setSelectedStation(null);
          }}
          onSave={() => {
            onSave();
            setShowDetails(false);
            setSelectedStation(null);
          }}
        />
      )}
    </>
  );
}