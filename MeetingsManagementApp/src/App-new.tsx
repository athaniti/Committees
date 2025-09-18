import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Calendar, Users, FileText, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { authAPI, type User } from './utils/auth';
import { healthAPI, meetingAPI, committeeAPI } from './utils/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [meetings, setMeetings] = useState([]);
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    checkAuth();
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const health = await healthAPI.check();
      console.log('API Health:', health);
    } catch (error) {
      console.error('API Health check failed:', error);
    }
  };

  const checkAuth = () => {
    const authData = authAPI.getCurrentUser();
    if (authData) {
      setUser(authData.user);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await authAPI.login(loginForm.email, loginForm.password);
      if (result) {
        setUser(result.user);
        toast.success('Επιτυχής σύνδεση!');
        loadData();
      } else {
        toast.error('Λάθος στοιχεία σύνδεσης');
      }
    } catch (error) {
      toast.error('Σφάλμα σύνδεσης');
    }
  };

  const loadData = async () => {
    try {
      const [meetingsData, committeesData] = await Promise.all([
        meetingAPI.getAll(),
        committeeAPI.getAll()
      ]);
      setMeetings(meetingsData);
      setCommittees(committeesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Σφάλμα φόρτωσης δεδομένων');
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    setMeetings([]);
    setCommittees([]);
    toast.success('Αποσύνδεση επιτυχής');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                Σύστημα Διαχείρισης Συνεδριάσεων
              </CardTitle>
              <CardDescription>
                Πλατφόρμα διαχείρισης συλλογικών οργάνων (FastAPI Backend)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="admin@demo.gr"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Κωδικός</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="admin123"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Σύνδεση
                </Button>
              </form>
              <div className="mt-4 text-sm text-gray-600">
                <p>Demo Accounts:</p>
                <p>admin@demo.gr / admin123</p>
                <p>member@demo.gr / member123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Σύστημα Διαχείρισης Συνεδριάσεων (FastAPI)
                  </h1>
                  <p className="text-sm text-gray-500">Δημοτικό Συμβούλιο & Επιτροπές</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'admin' ? 'Διαχειριστής' : 
                       user.role === 'secretary' ? 'Γραμματέας' : 'Μέλος'}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Committees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Επιτροπές ({committees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {committees.length === 0 ? (
                  <p className="text-gray-500">Φόρτωση επιτροπών...</p>
                ) : (
                  <div className="space-y-2">
                    {committees.map((committee: any) => (
                      <div key={committee.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{committee.name}</p>
                        <p className="text-sm text-gray-600">{committee.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Συνεδριάσεις ({meetings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.length === 0 ? (
                  <p className="text-gray-500">Φόρτωση συνεδριάσεων...</p>
                ) : (
                  <div className="space-y-2">
                    {meetings.map((meeting: any) => (
                      <div key={meeting.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-gray-600">{meeting.description}</p>
                        {meeting.scheduled_at && (
                          <p className="text-xs text-blue-600">
                            {new Date(meeting.scheduled_at).toLocaleString('el-GR')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* API Test Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                FastAPI Backend Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={loadData} variant="outline">
                  Ανανέωση Δεδομένων
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const newCommittee = await committeeAPI.create({
                        name: "Test Committee",
                        description: "Created from React"
                      });
                      toast.success("Νέα επιτροπή δημιουργήθηκε!");
                      loadData();
                    } catch (error) {
                      toast.error("Σφάλμα δημιουργίας επιτροπής");
                    }
                  }}
                  variant="outline"
                >
                  Δημιουργία Επιτροπής
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const newMeeting = await meetingAPI.create({
                        title: "Test Meeting",
                        description: "Created from React",
                        committee_id: 1,
                        scheduled_at: new Date().toISOString()
                      });
                      toast.success("Νέα συνεδρίαση δημιουργήθηκε!");
                      loadData();
                    } catch (error) {
                      toast.error("Σφάλμα δημιουργίας συνεδρίασης");
                    }
                  }}
                  variant="outline"
                >
                  Δημιουργία Συνεδρίασης
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}