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
import type { FuelType } from '../lib/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAddFuelMutation, useDeleteFuelMutation, useEditFuelMutation, useGetFuelListQuery } from '../services/fuelService';

interface FuelTypesManagerProps {
  onClose: () => void;
}

export function FuelTypesManager({ onClose }: FuelTypesManagerProps) {
  const { data: fuelTypesData } = useGetFuelListQuery()
  const [editFuel] = useEditFuelMutation()
  const [deleteFuel] = useDeleteFuelMutation()
  const [addFuel] = useAddFuelMutation()
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadFuelTypes();
  }, [fuelTypesData]);

  const loadFuelTypes = () => {
    if (!fuelTypesData) return

    setFuelTypes(fuelTypesData.data);
  };

  const handleAdd = async () => {
    try {
      const response = await addFuel(newName.trim())
      console.log(response)
      setNewName('')
      setIsAdding(false)
      loadFuelTypes()
    } catch (error) {
      console.log(error)
    }

    // if (!newName.trim()) return;

    // const newId = Math.max(...fuelTypes.map(f => f.id), 0) + 1;
    // const newFuelType: FuelType = {
    //   id: newId,
    //   name: newName.trim()
    // };

    // AppStore.saveFuelType(newFuelType);
    // setNewName('');
    // setIsAdding(false);
    // loadFuelTypes();
  };

  const handleEdit = async (id: string, name: string) => {
    try {
      const response = await editFuel({ id, name })

      console.log(response)
      setEditingId(null);
    } catch (error) {
      console.log(error)
    }

    // const stations = AppStore.getStations();
    // const usageCount = stations.filter(s => s.selectedFuelTypes.includes(id)).length;

    // if (usageCount > 0) {
    //   if (!confirm(`Данный тип топлива использывается на ${usageCount} станциях. Изменить название везде?`)) {
    //     setEditingId(null);
    //     return;
    //   }
    // }

    // const fuelType = fuelTypes.find(f => f.id === id);
    // if (fuelType) {
    //   fuelType.name = name;
    //   AppStore.saveFuelType(fuelType);
    //   setEditingId(null);
    //   loadFuelTypes();
    // }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteFuel(id)

      if (
        response.error &&
        'data' in response.error &&
        typeof (response.error.data as any) === 'object' &&
        'message' in (response.error.data as any) &&
        (response.error.data as any).message === 'Fuels has stations'
      ) {
        alert('Данное топливо используется на станциях');
      }

      console.log(response)
    } catch (error) {
      console.log(error)
    }

    // const success = AppStore.deleteFuelType(id);
    // if (!success) {
    //   alert('Невозможно удалить. Данный тип топлива используется на станциях.');
    //   return;
    // }
    // loadFuelTypes();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Управление Видами Топлива (Форма 4)</DialogTitle>
          <DialogDescription>
            Добавляйте, редактируйте или удаляйте виды топлива для вашей системы
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить Вид Топлива
          </Button>

          {isAdding && (
            <div className="flex gap-2 p-4 border rounded">
              <div className="flex-1">
                <Label>Название</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Введите название"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleAdd}>Добавить</Button>
                <Button variant="outline" onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}>
                  Отмена
                </Button>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">№</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-24">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelTypes.map((fuelType, index) => (
                <TableRow key={fuelType.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editingId === fuelType.id ? (
                      <Input
                        defaultValue={fuelType.name}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEdit(fuelType.id, e.currentTarget.value);
                          }
                        }}
                        onBlur={(e) => handleEdit(fuelType.id, e.currentTarget.value)}
                        autoFocus
                      />
                    ) : (
                      fuelType.name
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(fuelType.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(fuelType.id)}
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
      </DialogContent>
    </Dialog>
  );
}
