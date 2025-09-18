import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { 
  Calendar, Users, FileText, LogOut, BookOpen, 
  Bell, Mic, Vote 
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { authAPI, type User } from './utils/auth';
import { 
  healthAPI, meetingAPI, committeeAPI, voteAPI
} from './utils/api';
import type { Meeting, Committee } from './utils/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetings');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  // Data states (only for implemented features)
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    checkAuth();
    testAPI();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await authAPI.login(loginForm.email, loginForm.password);
      if (result) {
        setUser(result.user);
        toast.success('Επιτυχής σύνδεση!');
      } else {
        toast.error('Λάθος στοιχεία σύνδεσης');
      }
    } catch (error) {
      toast.error('Σφάλμα σύνδεσης');
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Συνεδριάσεις
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Αρχεία
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ημερολόγιο
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Βιβλιοθήκη
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Ανακοινώσεις
              </TabsTrigger>
              <TabsTrigger value="transcription" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Απομαγνητοφώνηση
              </TabsTrigger>
              <TabsTrigger value="voting" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Ψηφοφορίες
              </TabsTrigger>
            </TabsList>

            {/* Meetings Tab - IMPLEMENTED */}
            <TabsContent value="meetings">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Επιτροπές ({committees.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const newCommittee = await committeeAPI.create({
                              name: "Νέα Επιτροπή",
                              description: "Δημιουργήθηκε από το interface"
                            });
                            toast.success("Νέα επιτροπή δημιουργήθηκε!");
                            loadData();
                          } catch (error) {
                            toast.error("Σφάλμα δημιουργίας επιτροπής");
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Δημιουργία Επιτροπής
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {committees.map((committee) => (
                        <div key={committee.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{committee.name}</p>
                          <p className="text-sm text-gray-600">{committee.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Συνεδριάσεις ({meetings.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const newMeeting = await meetingAPI.create({
                              title: "Νέα Συνεδρίαση",
                              description: "Δημιουργήθηκε από το interface",
                              committee_id: committees[0]?.id || 1,
                              scheduled_at: new Date().toISOString()
                            });
                            toast.success("Νέα συνεδρίαση δημιουργήθηκε!");
                            loadData();
                          } catch (error) {
                            toast.error("Σφάλμα δημιουργίας συνεδρίασης");
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={committees.length === 0}
                      >
                        Δημιουργία Συνεδρίασης
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {meetings.map((meeting) => (
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
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Voting Tab - IMPLEMENTED */}
            <TabsContent value="voting">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Σύστημα Ψηφοφοριών
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={async () => {
                              try {
                                await voteAPI.create({ meeting_id: meeting.id, opt: 'for' });
                                toast.success('Ψήφος "Υπέρ" καταγράφηκε!');
                              } catch (error) {
                                toast.error('Σφάλμα καταγραφής ψήφου');
                              }
                            }}
                          >
                            Υπέρ
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={async () => {
                              try {
                                await voteAPI.create({ meeting_id: meeting.id, opt: 'against' });
                                toast.success('Ψήφος "Κατά" καταγράφηκε!');
                              } catch (error) {
                                toast.error('Σφάλμα καταγραφής ψήφου');
                              }
                            }}
                          >
                            Κατά
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                await voteAPI.create({ meeting_id: meeting.id, opt: 'abstain' });
                                toast.success('Ψήφος "Αποχή" καταγράφηκε!');
                              } catch (error) {
                                toast.error('Σφάλμα καταγραφής ψήφου');
                              }
                            }}
                          >
                            Αποχή
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Placeholder Tabs for Not Yet Implemented Features */}
            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Διαχείριση Αρχείων
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Σύστημα Αρχείων
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Η λειτουργία διαχείρισης αρχείων θα είναι διαθέσιμη σύντομα.
                    </p>
                    <Badge variant="secondary">Σε Ανάπτυξη</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ημερολόγιο Εκδηλώσεων
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ημερολόγιο
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Το οπτικό ημερολόγιο με drag-drop scheduling θα είναι διαθέσιμο σύντομα.
                    </p>
                    <Badge variant="secondary">Σε Ανάπτυξη</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="library">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Βιβλιοθήκη Εγγράφων
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Βιβλιοθήκη
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Το σύστημα οργάνωσης νομοθεσίας και εγγράφων θα είναι διαθέσιμο σύντομα.
                    </p>
                    <Badge variant="secondary">Σε Ανάπτυξη</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Ανακοινώσεις
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Bell className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ανακοινώσεις
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Το σύστημα ανακοινώσεων με προτεραιότητες θα είναι διαθέσιμο σύντομα.
                    </p>
                    <Badge variant="secondary">Σε Ανάπτυξη</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcription">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Απομαγνητοφώνηση
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Mic className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Απομαγνητοφώνηση
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Η μετατροπή ηχητικών αρχείων σε κείμενο θα είναι διαθέσιμη σύντομα.
                    </p>
                    <Badge variant="secondary">Σε Ανάπτυξη</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}