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
  Bell, CalendarDays, Menu, X, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { authAPI, type User } from './utils/auth';
import { 
  healthAPI, meetingAPI, committeeAPI, voteAPI
} from './utils/api-extended';
import type { Meeting, Committee } from './utils/api-extended';
import MeetingDetailView from './components/meetings/MeetingDetailView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // Debug: Log sidebar state changes
  useEffect(() => {
    console.log('Sidebar state changed:', sidebarOpen);
  }, [sidebarOpen]);
  
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

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

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

        {/* Main Content */}
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <div className={`w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:shadow-md`}>
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b md:justify-center">
                <h2 className="text-lg font-semibold text-gray-800 md:hidden">Μενού</h2>
                <div className="hidden md:flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-gray-800">Σύστημα Διαχείρισης</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('X button clicked!'); // Debug log
                    setSidebarOpen(false);
                  }}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label="Κλείσιμο μενού"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {[
                    { id: 'meetings', label: 'Συνεδριάσεις', icon: Calendar, description: 'Διαχείριση συνεδριάσεων' },
                    { id: 'files', label: 'Αρχεία', icon: FileText, description: 'Διαχείριση εγγράφων' },
                    { id: 'calendar', label: 'Ημερολόγιο', icon: CalendarDays, description: 'Προβολή ημερολογίου' },
                    { id: 'library', label: 'Βιβλιοθήκη', icon: BookOpen, description: 'Νομοθεσία & εγγραφα' },
                    { id: 'announcements', label: 'Ανακοινώσεις', icon: Bell, description: 'Σημαντικές ανακοινώσεις' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          // Close sidebar on mobile after selection
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 group ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isActive ? 'text-blue-800' : 'text-gray-900'}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* User Info at Bottom */}
              <div className="border-t p-4">
                {/* Debug Panel - Remove after testing */}
                <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                  <div>Sidebar State: {sidebarOpen ? 'Open' : 'Closed'}</div>
                  <div>Screen: {typeof window !== 'undefined' && window.innerWidth >= 768 ? 'Desktop (md+)' : 'Mobile (<md)'}</div>
                  <button 
                    onClick={() => {
                      console.log('Manual close clicked!');
                      setSidebarOpen(false);
                    }}
                    className="mt-1 px-2 py-1 bg-red-100 rounded text-xs md:hidden"
                  >
                    Force Close (Mobile Only)
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'admin' ? 'Διαχειριστής' : 
                       user.role === 'secretary' ? 'Γραμματέας' : 'Μέλος'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Αποσύνδεση
                </Button>
              </div>
            </div>
          </div>

          {/* Overlay for mobile - only when sidebar is open */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                setSidebarOpen(false);
              }}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between lg:px-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Hamburger menu clicked!'); // Debug log
                    setSidebarOpen(true);
                  }}
                  className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label="Άνοιγμα μενού"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {activeTab === 'meetings' && 'Συνεδριάσεις'}
                    {activeTab === 'files' && 'Αρχεία'}
                    {activeTab === 'calendar' && 'Ημερολόγιο'}
                    {activeTab === 'library' && 'Βιβλιοθήκη'}
                    {activeTab === 'announcements' && 'Ανακοινώσεις'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'meetings' && 'Διαχείριση και προβολή συνεδριάσεων'}
                    {activeTab === 'files' && 'Διαχείριση εγγράφων και αρχείων'}
                    {activeTab === 'calendar' && 'Προβολή ημερολογίου εκδηλώσεων'}
                    {activeTab === 'library' && 'Βιβλιοθήκη νομοθεσίας και εγγράφων'}
                    {activeTab === 'announcements' && 'Ανακοινώσεις και ειδοποιήσεις'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  FastAPI Backend v2.0.0
                </Badge>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 lg:p-6">
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

              {activeTab === 'calendar' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      Ημερολόγιο Εκδηλώσεων
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CalendarDays className="h-16 w-16 mx-auto text-gray-400 mb-4" />
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
              )}

              {activeTab === 'library' && (
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
              )}

              {activeTab === 'announcements' && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}