import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import type { CurrencyRate, Currency } from '../lib/types';
import {
  useChangePistolRatesMutation,
  useGetCurrencyListQuery,
  useGetExchangeRatesQuery,
  useGetPistolRatesQuery,
} from '../services/currencyService';

interface PricingManagerProps {
  onClose: () => void;
}

export function PricingManager({ onClose }: PricingManagerProps) {
  const { data: currencyData } = useGetCurrencyListQuery();
  const { data: exchangeRatesData } = useGetExchangeRatesQuery();
  const { data: pistolRatesData } = useGetPistolRatesQuery();
  const [changePistolRates] = useChangePistolRatesMutation();

  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    loadRates();
  }, [currencyData, exchangeRatesData, pistolRatesData]);

  const loadRates = () => {
    if (!currencyData?.data || !exchangeRatesData?.data || !pistolRatesData?.data) return;

    const currencyList = currencyData.data;
    const exchangeRates = exchangeRatesData.data;
    const pistolRates = pistolRatesData.data;

    const mergedRates: CurrencyRate[] = currencyList.map((currency: any) => {
      const pistolRate = pistolRates.find((p: any) => p.currencyType === currency)?.rate ?? 0;

      let rateToAMD = 1;
      if (currency === 'AMD') {
        rateToAMD = 1;
      } else {
        const found = exchangeRates.find((r: any) => r.fromCurrencyType === currency);
        rateToAMD = found ? found.rate : 1;
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
      const pistolItem = pistolRatesData?.data?.find(
        (p: any) => p.currencyType === rate.currency
      );

      if (!pistolItem?.id) {
        throw new Error('Не найден ID для pistolRates');
      }

      const pistolRatesDto = {
        rates: [
          {
            id: pistolItem.id,
            rate: rate.pricePerPistol,
          },
        ],
      };

      await changePistolRates(pistolRatesDto).unwrap();

      setEditingCurrency(null);
      loadRates();
    } catch (error) {
      console.error('Ошибка при сохранении цены:', error);
      alert('Ошибка при обновлении цены. Проверьте соединение.');
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl overflow-y-auto p-4 sm:p-6 !max-h-150">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Управление Ценами (Форма 5)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Цена за 1 пистолет. Курсы валют обновляются автоматически.
          </p>

          <div className="hidden lg:block">
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
                            className="w-24 text-right"
                            id={`price-${rate.currency}`}
                          />
                        ) : (
                          formatNumber(rate.pricePerPistol)
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatNumber(rate.rate)}
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
                                const priceInput = document.getElementById(
                                  `price-${rate.currency}`
                                ) as HTMLInputElement;

                                handleSave({
                                  currency: rate.currency,
                                  pricePerPistol:
                                    parseFloat(priceInput.value) || rate.pricePerPistol,
                                  rate: rate.rate,
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
          </div>

          <div className="lg:hidden space-y-4">
            {rates.map((rate, index) => {
              const isEditing = editingCurrency === rate.currency;
              const priceInAMD = rate.pricePerPistol * rate.rate;

              return (
                <div
                  key={rate.currency}
                  className="bg-white rounded-lg border p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-lg font-bold">{rate.currency}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Цена/пистолет:</span>
                      <div className="font-medium">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={rate.pricePerPistol}
                            className="w-full mt-1"
                            id={`price-mobile-${rate.currency}`}
                          />
                        ) : (
                          formatNumber(rate.pricePerPistol)
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-500">Курс к AMD:</span>
                      <div className="font-medium">{formatNumber(rate.rate)}</div>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-gray-500">Итого в AMD:</span>
                      <div className="font-semibold text-lg">{formatNumber(priceInAMD)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const input = document.getElementById(
                              `price-mobile-${rate.currency}`
                            ) as HTMLInputElement;
                            const value = parseFloat(input.value) || rate.pricePerPistol;

                            handleSave({
                              currency: rate.currency,
                              pricePerPistol: value,
                              rate: rate.rate,
                            });
                          }}
                        >
                          Сохранить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingCurrency(null)}
                        >
                          Отмена
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setEditingCurrency(rate.currency)}
                      >
                        Изменить
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>* Курсы валют обновляются автоматически каждые 30 минут</p>
            <p>* Изменение цены за пистолет обновляет все станции с этой валютой</p>
            <p>* Данные синхронизируются с desktop-программой</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}