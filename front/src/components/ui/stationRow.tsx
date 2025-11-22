import { Phone, MessageSquare, Bell, Settings, Key, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from './table';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Button } from './button';
import { Station } from '../../lib/types';
import { useStationOptions } from '../../hooks/useStationOptions';

interface StationRowProps {
    station: Station;
    index: number;
    editMode: boolean;
    editedStations: Record<string, Partial<Station>>;
    onInputChange: (stationId: string, field: keyof Station, value: any) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onMessageClick: () => void;
    onEventsClick: () => void;
    onShowDetails: (station: Station) => void;
    onMacReset: (station: Station) => void;
    onDelete: (station: Station) => void;
    formatDate: (date: Date | null) => string;
}

export function StationRow({
    station,
    index,
    editMode,
    editedStations,
    onInputChange,
    onKeyDown,
    onMessageClick,
    onEventsClick,
    onShowDetails,
    onMacReset,
    onDelete,
    formatDate,
}: StationRowProps) {
    // ХУК ВЫЗЫВАЕТСЯ ТОЛЬКО ЗДЕСЬ — ПОРЯДОК ФИКСИРОВАН
    const { options, isFetching } = useStationOptions(station.id);

    const edited = editedStations[station.id] || {};

    if (isFetching) {
        return (
            <TableRow>
                <TableCell colSpan={15} className="text-center text-muted-foreground">
                    Загрузка настроек...
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow key={station.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{station.id}</TableCell>

            {/* Ответственный */}
            <TableCell>
                {editMode ? (
                    <Input
                        value={edited.responsibleName ?? station.contact.name ?? ''}
                        onChange={(e) => onInputChange(station.id, 'responsibleName', e.target.value)}
                        onKeyDown={onKeyDown}
                        className="h-7 text-xs"
                        placeholder="Имя"
                    />
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

            {/* Остальные поля — как было */}
            <TableCell>
                {editMode ? (
                    <Input
                        value={edited.country ?? station.country ?? ''}
                        onChange={(e) => onInputChange(station.id, 'country', e.target.value)}
                        onKeyDown={onKeyDown}
                        className="h-7 text-xs w-16"
                    />
                ) : (
                    station.country || '-'
                )}
            </TableCell>

            <TableCell>
                {editMode ? (
                    <Input
                        value={edited.city ?? station.city ?? ''}
                        onChange={(e) => onInputChange(station.id, 'city', e.target.value)}
                        onKeyDown={onKeyDown}
                        className="h-7 text-xs w-16"
                    />
                ) : (
                    station.city || '-'
                )}
            </TableCell>

            <TableCell>
                {editMode ? (
                    <Input
                        value={edited.address ?? station.address ?? ''}
                        onChange={(e) => onInputChange(station.id, 'address', e.target.value)}
                        onKeyDown={onKeyDown}
                        className="h-7 text-xs w-16"
                    />
                ) : (
                    station.address || '-'
                )}
            </TableCell>

            <TableCell className="text-right">
                {editMode ? (
                    <Input
                        type="number"
                        value={edited.procCount ?? station.procCount}
                        onChange={(e) => onInputChange(station.id, 'procCount', parseInt(e.target.value) || 0)}
                        onKeyDown={onKeyDown}
                        className="h-7 w-16 text-xs"
                    />
                ) : (
                    station.procCount
                )}
            </TableCell>

            <TableCell className="text-right">
                {editMode ? (
                    <Input
                        type="number"
                        value={edited.pistolCount ?? station.pistolCount}
                        onChange={(e) => onInputChange(station.id, 'pistolCount', parseInt(e.target.value) || 0)}
                        onKeyDown={onKeyDown}
                        className="h-7 w-16 text-xs"
                    />
                ) : (
                    station.pistolCount
                )}
            </TableCell>

            {/* Детали — используем options */}
            <TableCell className="text-xs">
                1-{options.shiftChangeEvents}/2-{options.calibrationChangeEvents}/
                3-{options.seasonChangeEvents}/4-{station.selectedFuelTypes.length}/
                5-{options.fixShiftCount}/6-{options.receiptCoefficient}/
                7-{options.seasonCount}
            </TableCell>

            {/* Валюта */}
            <TableCell>
                {editMode ? (
                    <Select
                        value={edited.currency || station.currency}
                        onValueChange={(v: any) => onInputChange(station.id, 'currency', v)}
                    >
                        <SelectTrigger className="h-7 text-xs">
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
                ) : (
                    station.currency || '-'
                )}
            </TableCell>

            <TableCell className="text-right">{station.discount.toFixed(2)}%</TableCell>
            <TableCell className="text-right">
                {station.prepayment ? station.prepayment.toFixed(2) : '-'}
            </TableCell>
            <TableCell className="text-sm">{formatDate(station.licenseDate)}</TableCell>
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
                        onClick={() => onShowDetails(station)}
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        title="Очистить MAC"
                        onClick={() => onMacReset(station)}
                    >
                        <Key className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        title="Удалить"
                        onClick={() => onDelete(station)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}