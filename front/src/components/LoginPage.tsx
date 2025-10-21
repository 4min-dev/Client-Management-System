import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, User, Shield } from 'lucide-react';
import { useGenerate2faQuery, useLoginMutation } from '../services/authService';

type LoginPageProps = {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [handleLogin] = useLoginMutation()
  const { data: generated2fa } = useGenerate2faQuery(undefined, {
    skip: !showTwoFactor,
  })

  const handleFirstStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock authentication
    setTimeout(async () => {
      if (username === 'admin' && password === 'admin') {
        setShowTwoFactor(true);
        setLoading(false);
      } else {
        try {
          const response = await handleLogin({ login: username, password })

          if (response.error) {
            setError('Неправильный логин или пароль')
            return
          }

          const access = response.data.data.accessToken
          sessionStorage.setItem('accessToken', access)

          setShowTwoFactor(true)
        } catch (error) {
          setError('Неправильный логин или пароль');
          setLoading(false);
          // In real app: send notification to admin
          console.log('Failed login attempt notification sent');
        } finally {
          setLoading(false);
        }
      }
    }, 500);
  };

  const handleSecondStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Mock 2FA verification
    setTimeout(() => {
      if (twoFactorCode === '123456') {
        onLogin();
      } else {
        setError('Неправильный код аутентификации');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Система Управления АЗС</CardTitle>
          <CardDescription className="text-center">
            {showTwoFactor ? 'Введите код двухфакторной аутентификации' : 'Войдите в систему'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showTwoFactor ? (
            <form onSubmit={handleFirstStep} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Введите логин"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Проверка...' : 'Войти'}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">
                Для демо используйте: admin / admin<br />
                Код 2FA: 123456
              </p>
            </form>
          ) : (
            <form onSubmit={handleSecondStep} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Код аутентификации</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="Введите 6-значный код"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                  setError('');
                }}
              >
                Назад
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
