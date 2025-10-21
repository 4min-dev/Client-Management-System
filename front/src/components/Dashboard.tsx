import { useState, useEffect } from 'react';
import { AppStore } from '../lib/store';
import { EventGenerator } from '../lib/eventGenerator';
import type { Firm } from '../lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Phone,
  MessageSquare,
  Bell,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  Plus
} from 'lucide-react';
import { FirmActions } from './FirmActions';
import { EditClientDialog } from './EditClientDialog';
import { AddClientDialog } from './AddClientDialog';
import { EventsDialog } from './EventsDialog';
import { ContactsDialog } from './ContactsDialog';

interface DashboardProps {
  onManageFuelTypes: () => void;
  onManagePricing: () => void;
}

export function Dashboard({ onManageFuelTypes, onManagePricing }: DashboardProps) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('firmName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showContacts, setShowContacts] = useState<Firm | null>(null);

  useEffect(() => {
    loadFirms();
  }, []);

  const loadFirms = () => {
    const loadedFirms = AppStore.getFirms();
    setFirms(loadedFirms);
    
    // Generate events for all stations
    loadedFirms.forEach(firm => {
      firm.stations.forEach(station => {
        const events = EventGenerator.generateEventsForStation(station);
        events.forEach(event => AppStore.saveEvent(event));
      });
    });
  };

  const filteredFirms = firms.filter(firm => {
    const search = searchTerm.toLowerCase();
    return (
      firm.firmName.toLowerCase().includes(search) ||
      firm.ownerName.toLowerCase().includes(search) ||
      firm.stations.some(s => s.country.toLowerCase().includes(search) || s.city.toLowerCase().includes(search))
    );
  });

  const sortedFirms = [...filteredFirms].sort((a, b) => {
    let aVal: any = a[sortField as keyof Firm];
    let bVal: any = b[sortField as keyof Firm];
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const totalSum = firms.reduce((sum, firm) => sum + firm.totalSum, 0);
  const totalProcessors = firms.reduce((sum, firm) => sum + firm.totalProcessors, 0);
  const totalPistols = firms.reduce((sum, firm) => sum + firm.totalPistols, 0);

  const getStatusIcon = (status: 'active' | 'mixed' | 'inactive') => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'mixed':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getUnreadEventsCount = (firmName: string) => {
    const events = AppStore.getEvents();
    return events.filter(e => e.firmName === firmName && !e.read).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl">Система Управления Клиентской Базой АЗС</h1>
            <div className="flex gap-2">
              <Button onClick={onManageFuelTypes} variant="outline">
                Виды Топлива
              </Button>
              <Button onClick={onManagePricing} variant="outline">
                Цены
              </Button>
              <Button onClick={() => setShowAddClient(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить Клиента
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Input
            placeholder="Поиск по фирме, владельцу, стране, городу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Статус</TableHead>
                  <TableHead className="w-12">№</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort('firmName')} className="flex items-center gap-1">
                      Фирма
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </TableHead>
                  <TableHead>Имя (владельца)</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead className="text-right">
                    <div>Сумма</div>
                    <div className="text-xs text-muted-foreground">{formatNumber(totalSum)} AMD</div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div>Процессоры</div>
                    <div className="text-xs text-muted-foreground">{totalProcessors}</div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div>Пистолеты</div>
                    <div className="text-xs text-muted-foreground">{totalPistols}</div>
                  </TableHead>
                  <TableHead className="text-right">Скидка</TableHead>
                  <TableHead className="w-32">Оплата</TableHead>
                  <TableHead className="text-right">Предоплата</TableHead>
                  <TableHead>Дата Синхр.</TableHead>
                  <TableHead className="w-20">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFirms.map((firm, index) => {
                  const hasMultipleResponsibles = firm.stations.some(s => s.responsibleName) && 
                    new Set(firm.stations.map(s => s.responsibleName)).size > 1;
                  const hasMultipleCountries = new Set(firm.stations.map(s => s.country)).size > 1;
                  const hasMultipleCities = new Set(firm.stations.map(s => s.city)).size > 1;
                  const unreadCount = getUnreadEventsCount(firm.firmName);

                  return (
                    <TableRow key={firm.firmName}>
                      <TableCell>{getStatusIcon(firm.status)}</TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{firm.firmName}</TableCell>
                      <TableCell>{firm.ownerName}</TableCell>
                      <TableCell>
                        {hasMultipleResponsibles ? (
                          <button 
                            onClick={() => setShowContacts(firm)}
                            className="text-blue-600 hover:underline"
                          >
                            ...
                          </button>
                        ) : (
                          firm.stations[0]?.responsibleName || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {hasMultipleCountries ? '...' : firm.stations[0]?.country}
                      </TableCell>
                      <TableCell>
                        {hasMultipleCities ? '...' : firm.stations[0]?.city}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(firm.totalSum)}</TableCell>
                      <TableCell className="text-right">{firm.totalProcessors}</TableCell>
                      <TableCell className="text-right">{firm.totalPistols}</TableCell>
                      <TableCell className="text-right">{firm.avgDiscount.toFixed(2)}%</TableCell>
                      <TableCell>
                        <FirmActions firm={firm} onUpdate={loadFirms} />
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(firm.prepayment)}</TableCell>
                      <TableCell>{formatDate(firm.oldestSyncDate)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="relative">
                              <MoreVertical className="w-4 h-4" />
                              {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {unreadCount}
                                </span>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {/* Phone logic */}}>
                              <Phone className="w-4 h-4 mr-2" />
                              Звонок
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* Message logic */}}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Сообщение
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEvents(true)}>
                              <Bell className="w-4 h-4 mr-2" />
                              События {unreadCount > 0 && `(${unreadCount})`}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedFirm(firm);
                              setShowEditClient(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* Sync logic */}}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Синхронизация Оплаты
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {/* Delete logic */}} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {showAddClient && (
        <AddClientDialog
          onClose={() => setShowAddClient(false)}
          onSave={() => {
            loadFirms();
            setShowAddClient(false);
          }}
        />
      )}

      {showEditClient && selectedFirm && (
        <EditClientDialog
          firm={selectedFirm}
          onClose={() => {
            setShowEditClient(false);
            setSelectedFirm(null);
          }}
          onSave={() => {
            loadFirms();
            setShowEditClient(false);
            setSelectedFirm(null);
          }}
        />
      )}

      {showEvents && (
        <EventsDialog
          onClose={() => setShowEvents(false)}
        />
      )}

      {showContacts && (
        <ContactsDialog
          firm={showContacts}
          onClose={() => setShowContacts(null)}
        />
      )}
    </div>
  );
}
