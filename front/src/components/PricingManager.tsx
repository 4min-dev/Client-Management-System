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
import { useChangeExchangeRatesMutation, useChangePistolRatesMutation, useGetCurrencyListQuery, useGetExchangeRatesQuery, useGetPistolRatesQuery } from '../services/currencyService';

interface PricingManagerProps {
  onClose: () => void;
}

export function PricingManager({ onClose }: PricingManagerProps) {
  const { data: currencyData } = useGetCurrencyListQuery()
  const { data: exchangeRatesData } = useGetExchangeRatesQuery()
  const { data: pistolRatesData } = useGetPistolRatesQuery()
  const [changePistolRates] = useChangePistolRatesMutation()
  const [changeExchangeRates] = useChangeExchangeRatesMutation()
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    loadRates();
  }, [currencyData,
    exchangeRatesData,
    pistolRatesData]);

  const loadRates = () => {
    if (!currencyData?.data || !exchangeRatesData?.data || !pistolRatesData?.data) return;

    const currencyList = currencyData.data;
    const exchangeRates = exchangeRatesData.data;
    const pistolRates = pistolRatesData.data;

    // Собираем итоговый массив
    const mergedRates: CurrencyRate[] = currencyList.map((currency: any) => {
      // Находим цену за 1 пистолет
      const pistolRate = pistolRates.find((p: any) => p.currencyType === currency)?.rate ?? 0;

      // Находим курс к AMD
      let rateToAMD = 1;
      if (currency === 'AMD') {
        rateToAMD = 1;
      } else {
        const found = exchangeRates.find((r: any) => r.toCurrencyType === currency);
        // курс записан от AMD к X, значит надо взять обратный 1 / rate
        rateToAMD = found ? 1 / found.rate : 1;
      }

      return {
        currency,
        pricePerPistol: pistolRate,
        rate: rateToAMD,
      };
    });

    setRates(mergedRates);
  };

  const handleSave = async (rate: CurrencyRate) => {
    try {
      // 1️⃣ Найдём id для pistolRates (цены)
      const pistolItem = pistolRatesData?.data?.find(
        (p: any) => p.currencyType === rate.currency
      );

      // 2️⃣ Найдём id для exchangeRates (курса)
      const exchangeItem = exchangeRatesData?.data?.find(
        (e: any) => e.toCurrencyType === rate.currency
      );

      // 3️⃣ Подготовим DTO в нужном формате
      const pistolRatesDto = {
        rates: [
          {
            id: pistolItem?.id,
            rate: rate.pricePerPistol,
          },
        ],
      };

      const exchangeRatesDto = {
        rates: [
          {
            id: exchangeItem?.id,
            rate: 1 / rate.rate, // т.к. backend хранит прямой курс AMD→X
          },
        ],
      };

      // 4️⃣ Отправим запросы
      await changePistolRates(pistolRatesDto).unwrap();

      if (rate.currency !== 'AMD' && exchangeItem?.id) {
        await changeExchangeRates(exchangeRatesDto).unwrap();
      }

      // 5️⃣ Обновим UI
      setEditingCurrency(null);
      loadRates();
    } catch (error) {
      console.error('Ошибка при сохранении курса:', error);
      alert('Ошибка при обновлении данных. Проверьте соединение или формат запроса.');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
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
