import { useState, useEffect } from 'react';
import type { Firm, Station } from '../lib/types';
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
import { useGetCompaniesQuery, useSendMessageMutation, useDeleteCompanyMutation, useDeleteCompanyPermanentMutation } from '../services/companyService';
import { MessageDialog } from './MessageDialog';
import { DeleteCompanyDialog } from './DeleteCompanyDialog';
import { useLazyGetEventsQuery } from '../services/eventService';

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
  const [showEvents, setShowEvents] = useState<{ status: boolean, company: Firm | null, isEventsRefetch: number }>({ status: false, company: null, isEventsRefetch: 0 });
  const [showContacts, setShowContacts] = useState<Firm | null>(null);
  const [showSendMessage, setShowSendMessage] = useState<{ status: boolean, companyId: string }>({
    status: false,
    companyId: '',
  });
  const [showDeletePassword, setShowDeletePassword] = useState<{ status: boolean, companyId: string, isPermanent: boolean }>({
    status: false,
    companyId: '',
    isPermanent: false,
  });
  const [triggerGetEvents] = useLazyGetEventsQuery();
  const [stationEvents, setStationEvents] = useState<Record<string, any[]>>({});
  const [sendMessage] = useSendMessageMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [deleteCompanyPermanent] = useDeleteCompanyPermanentMutation();
  const { data: companiesData, refetch: refetchCompanies } = useGetCompaniesQuery();

  const handleDeleteCompany = async (companyId: string, password: string, isPermanent: boolean) => {
    try {
      const selectedCompany = firms.find(firm => firm.id === companyId)

      if (!selectedCompany) return

      if (selectedCompany.stations.length > 0) {
        setSelectedFirm(selectedCompany)
        setShowEditClient(true)
        setShowDeletePassword({ companyId: '', isPermanent: false, status: false })
        return
      }

      if (isPermanent) {
        await deleteCompanyPermanent({ id: companyId, password }).unwrap();
      } else {
        await deleteCompany({ id: companyId, password }).unwrap();
      }

      setShowDeletePassword({ status: false, companyId: '', isPermanent: false });
      loadFirms()
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert('Ошибка при удалении компании. Проверьте пароль или код 2FA.');
    }
  };

  function mapCompanyToFirm(company: any) {
    const stations = company.stations || [];

    const totalProcessors = stations.reduce((sum: number, s: any) => sum + (s.procCount || 0), 0);
    const totalPistols = stations.reduce((sum: number, s: any) => sum + (s.pistolCount || 0), 0);
    const avgDiscount =
      stations.length > 0
        ? stations.reduce((sum: number, s: any) => sum + (s.discount || 0), 0) / stations.length
        : 0;

    const oldestSyncDate = stations.reduce((min: Date, s: any) => {
      if (!s.synchronize) return null

      const date = new Date(s.synchronize);
      return date < min ? date : min;
    }, new Date());

    const statuses = stations.map((s: any) => s.status?.toLowerCase());
    let status: 'active' | 'mixed' | 'inactive' = 'inactive';
    if (statuses.every((s: string) => s === 'active')) status = 'active';
    else if (statuses.some((s: string) => s === 'active')) status = 'mixed';
    console.log(company)
    return {
      id: company.id,
      firmName: company.name,
      ownerName: company.ownerContact.name || '—',
      totalSum: 0,
      totalProcessors,
      totalPistols,
      avgDiscount,
      prepayment: 0,
      oldestSyncDate,
      status,
      isDeleted: company.isDeleted,
      ownerPhone: company.ownerContact.value,
      stations: stations.map((s: any) => ({
        id: s.id,
        address: s.address,
        city: s.city,
        country: s.country,
        procCount: s.procCount,
        pistolCount: s.pistolCount,
        status: s.status,
        discount: s.discount,
        synchronize: s.synchronize,
        responsibleName: company.responsibleContact ? company.responsibleContact.name : '',
        responsibleContact: company.responsibleContact ? company.responsibleContact.value : '',
        firmContacts: new Array((company.ownerContact.value), (company.responsibleContact ? company.responsibleContact.value : '')),
        selectedFuelTypes: s.stationsOnFuels,
        contact: s.contact,
        macAddress: s.macAddress,
        currency: s.currencyType,
        licenseDate: s.licenseDate,
        syncDate: s.synchronize,
      }))
    };
  }

  useEffect(() => {
    loadFirms()
  }, [companiesData])

  const loadFirms = () => {
    if (companiesData?.data) {
      console.log(companiesData)
      console.log(companiesData)
      const mapped = companiesData.data.map(mapCompanyToFirm);
      setFirms(mapped);
    }
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

  useEffect(() => {
    console.log(sortedFirms)
  }, [sortedFirms])

  const totalSum = firms.reduce((sum, firm) => sum + firm.totalSum, 0);
  const totalProcessors = firms.reduce((sum, firm) => sum + firm.totalProcessors, 0);
  const totalPistols = firms.reduce((sum, firm) => sum + firm.totalPistols, 0);

  const getStatusIcon = (firmStations: Station[], isDeleted: boolean) => {
    console.log(firmStations)
    if (isDeleted) return <XCircle className="w-5 h-5 text-red-600" />;

    const hasActive = firmStations.some((s) => s.status?.toLowerCase() === 'active');
    const hasInactive = firmStations.some((s) => s.status?.toLowerCase() === 'inactive');

    if (hasActive && hasInactive) {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }

    if (hasActive) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    return <XCircle className="w-5 h-5 text-red-600" />;
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

  useEffect(() => {
    async function fetchEventsForStations() {
      if (!firms.length) return;

      const allEvents: Record<string, any[]> = {};

      for (const firm of firms) {
        for (const station of firm.stations) {
          try {
            const result = await triggerGetEvents({ stationId: station.id }).unwrap();
            allEvents[station.id] = result.data || [];
          } catch (err) {
            console.error(`Ошибка при загрузке событий для станции ${station.id}:`, err);
            allEvents[station.id] = [];
          }
        }
      }

      setStationEvents(allEvents);
    }

    fetchEventsForStations();
  }, [firms, showEvents.isEventsRefetch]);

  const getUnreadEventsCount = (firm: Firm) => {
    let unread = 0;

    for (const station of firm.stations) {
      const events = stationEvents[station.id] || [];
      unread += events.filter(e => !e.viewed).length;
    }

    return unread;
  };

  async function handleSendMessage(companyId: string, message: string) {
    try {
      const response = await sendMessage({ companyId, text: message })
      console.log(response)
      if (response.data?.isSuccess) {
        setShowSendMessage({ status: false, companyId: '' })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl">Система Управления Клиентской Базой АЗС</h1>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onManageFuelTypes} size="sm" variant="outline">
                Топливо
              </Button>
              <Button onClick={onManagePricing} size="sm" variant="outline">
                Цены
              </Button>
              <Button onClick={() => setShowAddClient(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <Input
            placeholder="Поиск по фирме, владельцу, стране, городу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
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
                  const unreadCount = getUnreadEventsCount(firm);

                  return (
                    <TableRow key={firm.id}>
                      <TableCell>{getStatusIcon(firm.stations, firm.isDeleted)}</TableCell>
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
                      <TableCell className='text-center'>{firm.oldestSyncDate ? formatDate(firm.oldestSyncDate) : '-'}</TableCell>
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
                            <a href={`tel:${firm.ownerPhone}`}>
                              <DropdownMenuItem>
                                <Phone className="w-4 h-4 mr-2" />
                                Звонок
                              </DropdownMenuItem>
                            </a>
                            <DropdownMenuItem onClick={() => {
                              setShowSendMessage({ status: true, companyId: firm.id })
                            }}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Сообщение
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowEvents(prev => ({ ...prev, status: true, company: firm }))}>
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
                            <DropdownMenuItem onClick={() => {/* Sync logic */ }}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Синхронизация
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setShowDeletePassword({ status: true, companyId: firm.id, isPermanent: firm.isDeleted });
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {firm.isDeleted ? 'Удалить навсегда' : 'Удалить'}
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

        <div className="lg:hidden space-y-4">
          {sortedFirms.map((firm, index) => {
            const unreadCount = getUnreadEventsCount(firm);
            const primaryStation = firm.stations[0];

            return (
              <div key={firm.id} className="bg-white rounded-lg shadow p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(firm.stations, firm.isDeleted)}
                    <span className="font-medium text-sm">#{index + 1}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-lg">{firm.firmName}</h3>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Владелец:</span> {firm.ownerName}
                </p>

                {firm.stations.length > 1 ? (
                  <p className="text-sm text-blue-600 cursor-pointer" onClick={() => setShowContacts(firm)}>
                    {firm.stations.length} станций...
                  </p>
                ) : (
                  <div className="text-sm space-y-1 mt-1">
                    <p><span className="font-medium">Адрес:</span> {primaryStation?.city}, {primaryStation?.country}</p>
                    <p><span className="font-medium">Ответственный:</span> {primaryStation?.responsibleName || '-'}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Процессоры:</span>
                    <span className="ml-1 font-medium">{firm.totalProcessors}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Пистолеты:</span>
                    <span className="ml-1 font-medium">{firm.totalPistols}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Скидка:</span>
                    <span className="ml-1 font-medium">{firm.avgDiscount.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Предоплата:</span>
                    <span className="ml-1 font-medium">{formatNumber(firm.prepayment)}</span>
                  </div>
                </div>

                {firm.oldestSyncDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Синхр: {formatDate(firm.oldestSyncDate)}
                  </p>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <FirmActions firm={firm} onUpdate={loadFirms} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <a href={`tel:${firm.ownerPhone}`}>
                        <DropdownMenuItem>
                          <Phone className="w-4 h-4 mr-2" />
                          Звонок
                        </DropdownMenuItem>
                      </a>
                      <DropdownMenuItem onClick={() => setShowSendMessage({ status: true, companyId: firm.id })}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Сообщение
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowEvents(prev => ({ ...prev, status: true, company: firm }))}>
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
                      <DropdownMenuItem onClick={() => {/* Sync */ }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Синхронизация
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setShowDeletePassword({ status: true, companyId: firm.id, isPermanent: firm.isDeleted });
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {firm.isDeleted ? 'Удалить навсегда' : 'Удалить'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showDeletePassword.status && (
        <DeleteCompanyDialog
          companyId={showDeletePassword.companyId}
          isPermanent={showDeletePassword.isPermanent}
          onClose={() => setShowDeletePassword({ status: false, companyId: '', isPermanent: false })}
          onSave={(password: string) => {
            handleDeleteCompany(showDeletePassword.companyId, password, showDeletePassword.isPermanent)
          }}
        />
      )}

      {showAddClient && (
        <AddClientDialog
          onClose={() => setShowAddClient(false)}
          onSave={async () => {
            await refetchCompanies()
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
          onSave={async () => {
            await refetchCompanies()
            setShowEditClient(false);
            setSelectedFirm(null);
          }}
          onMessageClick={() => {
            setShowEditClient(false)
            setShowSendMessage({ status: true, companyId: selectedFirm.id })
          }}
          onEventsClick={() => {
            setShowEditClient(false)
            setShowEvents(prev => ({ ...prev, status: true, company: selectedFirm }))
          }}
        />
      )}

      {showEvents.status && (
        <EventsDialog
          handleCheckAsRead={() => setShowEvents(prev => ({ ...prev, isEventsRefetch: prev.isEventsRefetch + 1 }))}
          company={showEvents.company}
          onClose={() => setShowEvents(prev => ({ ...prev, status: false }))}
        />
      )}

      {showContacts && (
        <ContactsDialog
          firm={showContacts}
          onClose={() => setShowContacts(null)}
        />
      )}

      {showSendMessage.status && (
        <MessageDialog
          onSave={(message: string) => handleSendMessage(showSendMessage.companyId, message)}
          onClose={() => setShowSendMessage(prev => ({ ...prev, status: false }))}
        />
      )}
    </div>
  );
}