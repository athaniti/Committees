import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Mic } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface TranscriptionSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function TranscriptionSection({ user, getAccessToken }: TranscriptionSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Απομαγνητοφώνηση</h2>
        <p className="text-gray-600">Αυτόματη μετατροπή ηχητικών αρχείων σε κείμενο</p>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Η υπηρεσία απομαγνητοφώνησης θα υλοποιηθεί σύντομα</p>
        </CardContent>
      </Card>
    </div>
  );
}