import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Κωδικός Πρόσβασης</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !email || !password}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Σύνδεση...
          </>
        ) : (
          'Σύνδεση'
        )}
      </Button>
      
      <div className="text-center text-sm text-gray-600 space-y-2">
        <p className="font-medium">Δοκιμαστικοί λογαριασμοί:</p>
        <div className="bg-blue-50 p-3 rounded-lg space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-mono">admin@demo.gr</span>
            <span className="font-mono">admin123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono">member@demo.gr</span>
            <span className="font-mono">member123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono">secretary@demo.gr</span>
            <span className="font-mono">secretary123</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Αν δεν λειτουργεί το login, ελέγξτε το Debug Information παρακάτω
        </p>
      </div>
    </form>
  );
}