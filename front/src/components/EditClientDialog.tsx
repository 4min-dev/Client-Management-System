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
import type { Firm, Station } from '../lib/types';
import {
  Phone,
  MessageSquare,
  Bell,
  Settings,
  Key,
  Trash2
} from 'lucide-react';
import { StationDetailsDialog } from './StationDetailsDialog';
import { useDeleteStationMutation, useUpdateStationMutation } from '../services/stationService';

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
  const [deleteStation] = useDeleteStationMutation();
  const [changeStation] = useUpdateStationMutation();
  const [editMode, setEditMode] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editedStations, setEditedStations] = useState<Record<string, Partial<Station>>>({});

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const totalProcessors = firm.stations.reduce((sum, s) => sum + s.procCount, 0);
  const totalPistols = firm.stations.reduce((sum, s) => sum + s.pistolCount, 0);

  // Локальное изменение
  const handleInputChange = (stationId: string, field: keyof Station, value: any) => {
    setEditedStations(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        [field]: value,
      },
    }));
  };

  // Сохранение всех изменений
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

  // Enter в любом инпуте
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
    if (station.macAddress && !confirm('Очистить MAC адрес и запросить новый?')) return;
    const mac = await ServerAPI.requestMacAddress(station.id);
    station.macAddress = mac;
    AppStore.saveStation(station);
    onSave();
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">№</TableHead>
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
                {firm.stations.map((station, index) => {
                  console.log(station)
                  const edited = editedStations[station.id] || {};
                  return (
                    <TableRow key={station.id}>
                      <TableCell>{index + 1}</TableCell>

                      <TableCell>
                        {editMode ? (
                          <>
                            <Input
                              value={edited.responsibleName ?? station.contact.name ?? ''}
                              onChange={(e) => handleInputChange(station.id, 'responsibleName', e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="h-7 text-xs"
                              placeholder="Имя"
                            />
                          </>
                        ) : (
                          <>
                            <div>{station.contact.name || '-'}</div>
                            {station.responsibleDescription && (
                              <div className="text-xs text-muted-foreground">
                                {station.responsibleDescription}
                              </div>
                            )}
                          </>
                        )}
                      </TableCell>

                      {/* Страна */}
                      <TableCell>
                        {editMode ? (
                          <Input
                            value={edited.country ?? station.country ?? ''}
                            onChange={(e) => handleInputChange(station.id, 'country', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-xs w-16"
                            placeholder="Страна"
                          />
                        ) : (
                          station.country || '-'
                        )}
                      </TableCell>

                      {/* Город */}
                      <TableCell>
                        {editMode ? (
                          <Input
                            value={edited.city ?? station.city ?? ''}
                            onChange={(e) => handleInputChange(station.id, 'city', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-xs w-16"
                            placeholder="Город"
                          />
                        ) : (
                          station.city || '-'
                        )}
                      </TableCell>

                      {/* Адрес */}
                      <TableCell>
                        {editMode ? (
                          <Input
                            value={edited.address ?? station.address ?? ''}
                            onChange={(e) => handleInputChange(station.id, 'address', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-xs w-16"
                            placeholder="Адрес"
                          />
                        ) : (
                          station.address || '-'
                        )}
                      </TableCell>

                      {/* Процессоры */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={edited.procCount ?? station.procCount}
                            onChange={(e) => handleInputChange(station.id, 'procCount', parseInt(e.target.value) || 0)}
                            onKeyDown={handleKeyDown}
                            className="h-7 w-16 text-xs"
                          />
                        ) : (
                          station.procCount
                        )}
                      </TableCell>

                      {/* Пистолеты */}
                      <TableCell className="text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={edited.pistolCount ?? station.pistolCount}
                            onChange={(e) => handleInputChange(station.id, 'pistolCount', parseInt(e.target.value) || 0)}
                            onKeyDown={handleKeyDown}
                            className="h-7 w-16 text-xs"
                          />
                        ) : (
                          station.pistolCount
                        )}
                      </TableCell>

                      {/* Детали */}
                      <TableCell className="text-xs">
                        1-{station.shiftChangeEvents}/2-{station.calibrationChangeEvents}/
                        3-{station.seasonChangeEvents}/4-{station.fuelTypeCount}/
                        5-{station.fixShiftCount}/6-{station.receiptCoefficient}/
                        7-{station.seasonCount}
                      </TableCell>

                      {/* Валюта */}
                      <TableCell>
                        {editMode ? (
                          <Input
                            value={edited.currency ?? station.currency ?? ''}
                            onChange={(e) => handleInputChange(station.id, 'currency', e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-7 text-xs"
                            placeholder="USD"
                          />
                        ) : (
                          station.currency || '-'
                        )}
                      </TableCell>

                      {/* Скидка */}
                      <TableCell className="text-right">
                        {station.discount.toFixed(2)}%
                      </TableCell>

                      {/* Предоплата */}
                      <TableCell className="text-right">
                        {station.prepayment ? station.prepayment.toFixed(2) : '-'}
                      </TableCell>

                      {/* Лицензия */}
                      <TableCell className="text-sm">{formatDate(station.licenseDate)}</TableCell>

                      {/* Синхронизация */}
                      <TableCell className="text-sm">{formatDate(station.syncDate)}</TableCell>

                      {/* Действия */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <a href={`tel:${station.responsibleContact}`}>
                            <Button size="sm" variant="ghost" title="Звонок">
                              <Phone className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button size="sm" variant="ghost" title="Сообщение" onClick={onMessageClick}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="События" onClick={onEventsClick}>
                            <Bell className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Компоненты"
                            onClick={() => {
                              setSelectedStation(station);
                              setShowDetails(true);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="MAC адрес"
                            onClick={() => handleMacRequest(station)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Удалить"
                            onClick={() => handleDelete(station)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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