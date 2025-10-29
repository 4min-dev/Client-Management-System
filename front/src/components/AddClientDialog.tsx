import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AppStore } from '../lib/store';
import { ServerAPI } from '../lib/api';
import type { Currency, Station } from '../lib/types';
import { useAddStationMutation } from '../services/stationService';

interface AddClientDialogProps {
  onClose: () => void;
  onSave: () => void;
}

export function AddClientDialog({ onClose, onSave }: AddClientDialogProps) {
  const [addClient] = useAddStationMutation()
  const [formData, setFormData] = useState({
    firmName: '',
    ownerName: '',
    firmContacts: [''],
    responsibleName: '',
    responsibleDescription: '',
    responsibleContacts: [''],
    country: '',
    city: '',
    address: '',
    processorCount: 1,
    pistolCount: 1,
    currency: 'AMD' as Currency,
    discount: 50
  });

  const handleSave = async () => {
    try {
      if (!formData.firmName || !formData.ownerName || !formData.country || !formData.city || !formData.address) {
        alert('Заполните все обязательные поля');
        return;
      }

      if (formData.firmName === formData.ownerName) {
        alert('Имя фирмы и владельца не могут совпадать');
        return;
      }

      const rates = AppStore.getCurrencyRates();
      const currencyRate = rates.find(r => r.currency === formData.currency);
      if (!currencyRate) return;

      const price = currencyRate.pricePerPistol * (1 - formData.discount / 100);
      const monthlySum = formData.pistolCount * price;

      const now = new Date();
      const licenseDate = new Date(now);
      licenseDate.setMonth(licenseDate.getMonth() + 1);

      const station: Station = {
        id: AppStore.generateID(),
        firmName: formData.firmName,
        ownerName: formData.ownerName,
        responsibleName: formData.responsibleName || undefined,
        responsibleDescription: formData.responsibleDescription || undefined,
        responsibleContacts: formData.responsibleContacts.filter(c => c),
        firmContacts: formData.firmContacts.filter(c => c),
        country: formData.country,
        city: formData.city,
        address: formData.address,
        processorCount: formData.processorCount,
        pistolCount: formData.pistolCount,
        currency: formData.currency,
        discount: formData.discount,
        price,
        monthlySum,
        prepayment: 0,
        licenseDate,
        syncDate: now,

        shiftChangeEvents: 0,
        calibrationChangeEvents: 1,
        seasonChangeEvents: 1,
        fuelTypeCount: 5,
        fixShiftCount: 0,
        receiptCoefficient: 0,
        seasonCount: 1,
        selectedFuelTypes: [],
        stationsOnFuels: []
      };

      const response = await addClient({
        address: station.address,
        city: station.city,
        companyName: station.firmName,
        contactDescription: station.responsibleDescription || '',
        contactName: station.responsibleName || '',
        country: station.country,
        currencyType: station.currency,
        discount: station.discount,
        ownerCompanyDescription: '',
        ownerCompanyName: station.ownerName,
        ownerValue: formData.firmContacts[0],
        responsibleValue: formData.responsibleContacts[0],
        pistolCount: station.pistolCount,
        procCount: station.processorCount,
      });

      console.log(response)
      onSave();
    } catch (error) {
      console.log(error)
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить Нового Клиента (Форма 6)</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом клиенте и его АЗС
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={AppStore.generateID()} disabled />
            </div>
            <div className="space-y-2">
              <Label>Фирма *</Label>
              <Input
                value={formData.firmName}
                onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                placeholder="Название фирмы"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Имя (владельца) *</Label>
              <Input
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Имя владельца"
              />
            </div>
            <div className="space-y-2">
              <Label>Метод Связи Фирмы *</Label>
              <Input
                value={formData.firmContacts[0]}
                onChange={(e) => setFormData({
                  ...formData,
                  firmContacts: [e.target.value]
                })}
                placeholder="+374..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ответственный</Label>
              <Input
                value={formData.responsibleName}
                onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                placeholder="Имя ответственного"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание (ответственного)</Label>
              <Input
                value={formData.responsibleDescription}
                onChange={(e) => setFormData({ ...formData, responsibleDescription: e.target.value })}
                placeholder="Описание"
                disabled={!formData.responsibleName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Метод Связи Ответственного</Label>
            <Input
              value={formData.responsibleContacts[0]}
              onChange={(e) => setFormData({
                ...formData,
                responsibleContacts: [e.target.value]
              })}
              placeholder="+374..."
              disabled={!formData.responsibleName}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Страна *</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Страна"
              />
            </div>
            <div className="space-y-2">
              <Label>Город *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Город"
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Адрес"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Количество Процессоров *</Label>
              <Input
                type="number"
                min="1"
                value={formData.processorCount}
                onChange={(e) => setFormData({ ...formData, processorCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Количество Пистолетов *</Label>
              <Input
                type="number"
                min="1"
                value={formData.pistolCount}
                onChange={(e) => setFormData({ ...formData, pistolCount: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Валюта *</Label>
              <Select value={formData.currency} onValueChange={(v: Currency) => setFormData({ ...formData, currency: v as Currency })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMD">AMD</SelectItem>
                  <SelectItem value="RUB">RUB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GEL">GEL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Скидка (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Цена (авто)</Label>
              <Input
                value={(() => {
                  const rates = AppStore.getCurrencyRates();
                  const rate = rates.find(r => r.currency === formData.currency);
                  if (!rate) return '0.00';
                  const price = rate.pricePerPistol * (1 - formData.discount / 100);
                  return price.toFixed(2);
                })()}
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Сумма (ежемесячно, авто)</Label>
            <Input
              value={(() => {
                const rates = AppStore.getCurrencyRates();
                const rate = rates.find(r => r.currency === formData.currency);
                if (!rate) return '0.00';
                const price = rate.pricePerPistol * (1 - formData.discount / 100);
                const sum = formData.pistolCount * price;
                return new Intl.NumberFormat('ru-RU', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(sum);
              })()}
              disabled
            />
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
