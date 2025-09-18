import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Calendar } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface CalendarSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function CalendarSection({ user, getAccessToken }: CalendarSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ημερολόγιο</h2>
        <p className="text-gray-600">Προγραμματισμένες συνεδριάσεις και εκδηλώσεις</p>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Το ημερολόγιο θα υλοποιηθεί σύντομα</p>
        </CardContent>
      </Card>
    </div>
  );
}