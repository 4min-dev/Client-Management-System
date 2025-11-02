import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { AppStore } from '../lib/store';
import type { Event, Firm } from '../lib/types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useGetEventsQuery, useMakeAsReadMutation } from '../services/eventService';

interface EventsDialogProps {
  handleCheckAsRead: () => void;
  company: Firm | null;
  firmName?: string;
  onClose: () => void;
}

export function EventsDialog({ handleCheckAsRead, company, firmName, onClose }: EventsDialogProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [handleMarkAsRead] = useMakeAsReadMutation()

  const stationQueries = company?.stations?.map(station =>
    useGetEventsQuery({
      stationId: station.id
    }, {
      skip: !station.id
    })
  ) || [];

  useEffect(() => {
    if (stationQueries.length > 0) {
      const allEvents: Event[] = [];

      stationQueries.forEach(query => {
        if (query?.data) {
          const mappedEvents = query.data.data.map((event: any) => ({
            id: event.id,
            firmName: event.station?.company?.name || firmName || '',
            eventName: event.message || '',
            eventType: event.type,
            ownerName: event.station?.company?.ownerContact?.name || '',
            responsible: event.station?.responsibleName || '',
            country: event.station?.country || '',
            city: event.station?.city || '',
            address: event.station?.address || '',
            date: new Date(event.createdAt),
            read: event.viewed || false,
          }));
          allEvents.push(...mappedEvents);
        }
      });

      const sortedEvents = allEvents.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(sortedEvents);
    } else {
      setEvents([]);
    }
  }, [stationQueries, firmName, handleMarkAsRead]);

  const filteredEvents = events.filter(event => {
    const search = searchTerm.toLowerCase();
    return (
      event.firmName.toLowerCase().includes(search) ||
      event.eventName.toLowerCase().includes(search) ||
      event.country.toLowerCase().includes(search) ||
      event.city.toLowerCase().includes(search)
    );
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'license':
      case 'LICENSE_EXPIRE_SOON_3DAYS':
      case 'LICENSE_EXPIRE_SOON_1DAY':
      case 'LICENSE_EXPIRED':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'sync':
      case 'SYNC_MISSING_1DAY':
      case 'SYNC_MISSING_2DAYS':
      case 'SYNC_MISSING_3DAYS':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'block':
      case 'LICENSE_BLOCK_PARTIAL':
      case 'LICENSE_BLOCK_FULL':
        return <XCircle className="w-5 h-5 text-red-700" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU');
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            События {firmName ? `- ${firmName}` : '(все)'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Просмотр и управление событиями и уведомлениями
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 overflow-auto">
          <Input
            placeholder="Поиск событий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Тип</TableHead>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>Название События</TableHead>
                  <TableHead>Фирма</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-12">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      Нет событий
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event, index) => (
                    <TableRow
                      key={event.id}
                      className={`${event.read ? 'opacity-50' : 'bg-blue-50'} hover:bg-gray-50 transition-colors cursor-pointer`}
                      onClick={async () => {
                        if (event.read) return;
                        await handleMarkAsRead(event.id);
                        handleCheckAsRead();
                      }}
                    >
                      <TableCell>{getEventIcon(event.eventType)}</TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{event.eventName}</TableCell>
                      <TableCell>{event.firmName}</TableCell>
                      <TableCell>{event.ownerName}</TableCell>
                      <TableCell>{event.responsible || '-'}</TableCell>
                      <TableCell>{event.country}</TableCell>
                      <TableCell>{event.city}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{event.address}</TableCell>
                      <TableCell className="text-sm">{formatDate(event.date)}</TableCell>
                      <TableCell>
                        {event.read ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="lg:hidden space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Нет событий
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  onClick={async () => {
                    if (event.read) return;
                    await handleMarkAsRead(event.id);
                    handleCheckAsRead();
                  }}
                  className={`
                  p-4 rounded-lg border transition-all
                  ${event.read ? 'bg-gray-50 opacity-70 border-gray-200' : 'bg-blue-50 border-blue-200'}
                  cursor-pointer active:scale-95
                `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.eventType)}
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    </div>
                    {!event.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>

                  <h4 className="font-semibold text-base">{event.eventName}</h4>

                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">{event.firmName}</span>
                    {event.ownerName && ` — ${event.ownerName}`}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {event.city}, {event.country}
                    {event.address && ` — ${event.address}`}
                  </p>

                  {event.responsible && (
                    <p className="text-xs text-gray-500">
                      Ответственный: {event.responsible}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(event.date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}