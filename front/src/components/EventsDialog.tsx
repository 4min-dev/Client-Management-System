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
import type { Event } from '../lib/types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface EventsDialogProps {
  firmName?: string;
  onClose: () => void;
}

export function EventsDialog({ firmName, onClose }: EventsDialogProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let allEvents = AppStore.getEvents();
    if (firmName) {
      allEvents = allEvents.filter(e => e.firmName === firmName);
    }
    setEvents(allEvents);
  }, [firmName]);

  const filteredEvents = events.filter(event => {
    const search = searchTerm.toLowerCase();
    return (
      event.firmName.toLowerCase().includes(search) ||
      event.eventName.toLowerCase().includes(search) ||
      event.country.toLowerCase().includes(search) ||
      event.city.toLowerCase().includes(search)
    );
  });

  const handleMarkAsRead = (id: string) => {
    AppStore.markEventAsRead(id);
    const allEvents = AppStore.getEvents();
    setEvents(firmName ? allEvents.filter(e => e.firmName === firmName) : allEvents);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'license':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'sync':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'block':
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            События {firmName ? `- ${firmName}` : '(все)'}
          </DialogTitle>
          <DialogDescription>
            Просмотр и управление событиями и уведомлениями
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Поиск событий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="overflow-x-auto">
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
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      Нет событий
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event, index) => (
                    <TableRow 
                      key={event.id}
                      className={event.read ? 'opacity-50' : 'bg-blue-50'}
                      onClick={() => !event.read && handleMarkAsRead(event.id)}
                    >
                      <TableCell>{getEventIcon(event.eventType)}</TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell>{event.firmName}</TableCell>
                      <TableCell>{event.ownerName}</TableCell>
                      <TableCell>{event.responsible || '-'}</TableCell>
                      <TableCell>{event.country}</TableCell>
                      <TableCell>{event.city}</TableCell>
                      <TableCell className="text-sm">{event.address}</TableCell>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
