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
  Bell, CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { authAPI, type User } from './utils/auth';
import { 
  healthAPI, meetingAPI, committeeAPI, voteAPI
} from './utils/api-extended';
import type { Meeting, Committee } from './utils/api-extended';
import MeetingDetailView from './components/meetings/MeetingDetailView';
import { LibrarySection } from './components/library/LibrarySection';
import { AnnouncementsSection } from './components/announcements/AnnouncementsSection';
import { CalendarSection } from './components/calendar/CalendarSection';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetings');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
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
      
      setMeetings(meetingsData as Meeting[]);
      setCommittees(committeesData as Committee[]);
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
        {/* Header with Navigation */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-50">
          {/* Top Bar */}
          <div className="px-4 py-3 lg:px-6">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Σύστημα Διαχείρισης Συνεδριάσεων
                  </h1>
                  <p className="text-sm text-gray-600">
                    Πλατφόρμα διαχείρισης συλλογικών οργάνων
                  </p>
                </div>
              </div>

              {/* User Info and Actions */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs hidden sm:flex">
                  FastAPI Backend v2.0.0
                </Badge>
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'admin' ? 'Διαχειριστής' : 
                       user.role === 'secretary' ? 'Γραμματέας' : 'Μέλος'}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Αποσύνδεση</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="border-t bg-gray-50">
            <nav className="px-4 lg:px-6">
              <div className="flex space-x-1 overflow-x-auto">
                {[
                  { id: 'meetings', label: 'Συνεδριάσεις', icon: Calendar },
                  { id: 'files', label: 'Αρχεία', icon: FileText },
                  { id: 'calendar', label: 'Ημερολόγιο', icon: CalendarDays },
                  { id: 'library', label: 'Βιβλιοθήκη', icon: BookOpen },
                  { id: 'announcements', label: 'Ανακοινώσεις', icon: Bell }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                        isActive 
                          ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
              {/* Meetings Content - IMPLEMENTED */}
              {activeTab === 'meetings' && (
                selectedMeeting ? (
                  <MeetingDetailView
                    meeting={selectedMeeting}
                    onBack={() => setSelectedMeeting(null)}
                    onUpdateMeeting={(updatedMeeting) => {
                      setMeetings(prev => prev.map(m => 
                        m.id === updatedMeeting.id ? updatedMeeting : m
                      ));
                      setSelectedMeeting(updatedMeeting);
                    }}
                  />
                ) : (
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
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">{meeting.title}</p>
                                  <p className="text-sm text-gray-600">{meeting.description}</p>
                                  {meeting.scheduled_at && (
                                    <p className="text-xs text-blue-600">
                                      {new Date(meeting.scheduled_at).toLocaleString('el-GR')}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedMeeting(meeting)}
                                  className="ml-2"
                                >
                                  Προβολή
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              )}

              {/* Placeholder Content for Not Yet Implemented Features */}
              {activeTab === 'files' && (
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
              )}

          {/* Calendar Content - IMPLEMENTED */}
          {activeTab === 'calendar' && (
            <CalendarSection user={user} />
          )}              {activeTab === 'library' && (
                <LibrarySection user={user} getAccessToken={() => Promise.resolve(undefined)} />
              )}

              {activeTab === 'announcements' && (
                <AnnouncementsSection user={user} />
              )}
        </main>
      </div>
    </>
  );
}