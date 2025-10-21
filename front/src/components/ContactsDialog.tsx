import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import type { Firm } from '../lib/types';
import { Phone } from 'lucide-react';

interface ContactsDialogProps {
  firm: Firm;
  onClose: () => void;
}

export function ContactsDialog({ firm, onClose }: ContactsDialogProps) {
  const handleCall = (number: string) => {
    console.log('Calling:', number);
    alert(`Звонок на номер: ${number}`);
  };

  // Get unique responsibles
  const responsibles = firm.stations
    .filter(s => s.responsibleName)
    .map(s => ({
      name: s.responsibleName!,
      description: s.responsibleDescription || '',
      contacts: s.responsibleContacts || []
    }))
    .filter((r, index, self) => 
      index === self.findIndex(t => t.name === r.name && t.description === r.description)
    );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Контакты Ответственных - {firm.firmName}</DialogTitle>
          <DialogDescription>
            Контактная информация ответственных лиц по всем станциям
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">№</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Телефонные Номера</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Нет ответственных
                  </TableCell>
                </TableRow>
              ) : (
                responsibles.map((responsible, index) => (
                  <TableRow key={`${responsible.name}-${responsible.description}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{responsible.name}</TableCell>
                    <TableCell>{responsible.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {responsible.contacts.map((contact, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-sm">{contact}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCall(contact)}
                            >
                              <Phone className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
