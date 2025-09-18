import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BookOpen } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LibrarySectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function LibrarySection({ user, getAccessToken }: LibrarySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Βιβλιοθήκη</h2>
        <p className="text-gray-600">Συλλογή εγγράφων, κανονισμών και οδηγιών</p>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Η βιβλιοθήκη θα υλοποιηθεί σύντομα</p>
        </CardContent>
      </Card>
    </div>
  );
}