import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface AddClientDialogProps {
    onClose: () => void;
    onSave: (message: string) => void;
}

export function MessageDialog({ onClose, onSave }: AddClientDialogProps) {
    const [message, setMessage] = useState<string>('')

    const handleSave = async () => {
        if (!message) {
            alert('Сообщение не может быть пустым')
            return
        }

        await onSave(message);
        setMessage('')
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Отправить сообщение</DialogTitle>
                    <DialogDescription>
                        Напишите сообщение в форме ниже и нажмите Отправить
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 w-full">
                    <div className="flex-col">
                        <div className="space-y-2 w-full">
                            <Label>Сообщение *</Label>
                            <Textarea
                                className='w-full'
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Текст сообщения"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button onClick={handleSave}>
                            Отправить
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
