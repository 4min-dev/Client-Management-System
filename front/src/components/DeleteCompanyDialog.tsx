import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface DeleteCompanyDialogProps {
    companyId: string;
    isPermanent: boolean;
    onClose: () => void;
    onSave: (password: string, twoFACode?: string) => void;
}

export function DeleteCompanyDialog({ isPermanent, onClose, onSave }: DeleteCompanyDialogProps) {
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        onSave(password);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isPermanent ? 'Подтверждение удаления предоплаты' : 'Подтверждение удаления компании'}
                    </DialogTitle>
                    <DialogDescription>
                        Введите пароль для подтверждения {isPermanent ? 'удаления предоплаты' : 'удаления компании'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button onClick={handleSubmit} disabled={!password}>
                        Подтвердить
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}