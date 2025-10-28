import { useState } from 'react';
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
  Edit,
  Trash2,
  Lock,
  Unlock,
  Key
} from 'lucide-react';
import { StationDetailsDialog } from './StationDetailsDialog';

interface EditClientDialogProps {
  firm: Firm;
  onClose: () => void;
  onSave: () => void;
  onMessageClick: () => void;
  onEventsClick: () => void
}

export function EditClientDialog({ firm, onClose, onSave, onMessageClick, onEventsClick }: EditClientDialogProps) {
  const [editMode, setEditMode] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const handlePayment = async (station: Station, amount: string) => {
    const paymentAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;

    const now = new Date();
    let remainingAmount = paymentAmount;

    while (remainingAmount >= station.monthlySum) {
      const currentLicense = new Date(station.licenseDate);
      if (currentLicense < now) {
        currentLicense.setTime(now.getTime());
      }
      currentLicense.setMonth(currentLicense.getMonth() + 1);
      station.licenseDate = currentLicense;
      remainingAmount -= station.monthlySum;
    }

    station.prepayment += remainingAmount;
    AppStore.saveStation(station);

    await ServerAPI.sendLicenseDate(station.id, station.licenseDate);
    onSave();
  };

  const handleDelete = async (station: Station) => {
    if (!confirm('Вы уверены, что хотите удалить эту станцию?')) return;

    // Password prompt (simplified for demo)
    const password = prompt('Введите пароль для подтверждения:');
    if (password !== 'admin') {
      alert('Неправильный пароль');
      return;
    }

    // Keep only current month, rest goes to prepayment
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();
    const dailyRate = station.monthlySum / daysInMonth;
    station.prepayment += dailyRate * daysRemaining;

    AppStore.deleteStation(station.id);
    onSave();
  };

  const handleBlockToggle = async (station: Station, blocked: boolean) => {
    await ServerAPI.setStationBlock(station.id, blocked);
    alert(blocked ? 'Станция заблокирована' : 'Станция разблокирована');
  };

  const handleMacRequest = async (station: Station) => {
    if (station.macAddress) {
      if (!confirm('Очистить MAC адрес и запросить новый?')) return;
    }
    const mac = await ServerAPI.requestMacAddress(station.id);
    station.macAddress = mac;
    AppStore.saveStation(station);
    onSave();
  };

  const handleKeyGeneration = async (station: Station, type: 'desktop' | 'processor' | 'protection') => {
    if (!confirm(`Сгенерировать новый ключ ${type}?`)) return;

    let key: string;
    switch (type) {
      case 'desktop':
        key = await ServerAPI.generateDesktopKey(station.id);
        station.desktopKey = key;
        break;
      case 'processor':
        key = await ServerAPI.generateProcessorKey(station.id);
        station.processorKey = key;
        break;
      case 'protection':
        key = await ServerAPI.generateProtectionKey(station.id);
        station.protectionKey = key;
        break;
    }

    AppStore.saveStation(station);
    onSave();
  };

  const totalProcessors = firm.stations.reduce((sum, s) => sum + s.processorCount, 0);
  const totalPistols = firm.stations.reduce((sum, s) => sum + s.pistolCount, 0);
  const totalSum = firm.stations.reduce((sum, s) => sum + s.monthlySum, 0);

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
                onCheckedChange={(checked: boolean) => setEditMode(checked as boolean)}
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
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">
                    <div>Сумма</div>
                    <div className="text-xs">{formatNumber(totalSum)}</div>
                  </TableHead>
                  <TableHead className="w-24">Оплата</TableHead>
                  <TableHead className="text-right">Предоплата</TableHead>
                  <TableHead>Лицензия</TableHead>
                  <TableHead>Синхр.</TableHead>
                  <TableHead className="w-32">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firm.stations.map((station, index) => (
                  <TableRow key={station.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>{station.responsibleName || '-'}</div>
                      {station.responsibleDescription && (
                        <div className="text-xs text-muted-foreground">{station.responsibleDescription}</div>
                      )}
                    </TableCell>
                    <TableCell>{station.country}</TableCell>
                    <TableCell>{station.city}</TableCell>
                    <TableCell className="text-sm">{station.address}</TableCell>
                    <TableCell className="text-right">{station.processorCount}</TableCell>
                    <TableCell className="text-right">{station.pistolCount}</TableCell>
                    <TableCell className="text-xs">
                      1-{station.shiftChangeEvents}/2-{station.calibrationChangeEvents}/
                      3-{station.seasonChangeEvents}/4-{station.fuelTypeCount}/
                      5-{station.fixShiftCount}/6-{station.receiptCoefficient}/
                      7-{station.seasonCount}
                    </TableCell>
                    <TableCell>{station.currency}</TableCell>
                    <TableCell className="text-right">{station.discount.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{formatNumber(station.price)}</TableCell>
                    <TableCell className="text-right">{formatNumber(station.monthlySum)}</TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Сумма"
                        className="w-20 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handlePayment(station, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(station.prepayment)}</TableCell>
                    <TableCell className="text-sm">{formatDate(station.licenseDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(station.syncDate)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Закрыть</Button>
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
