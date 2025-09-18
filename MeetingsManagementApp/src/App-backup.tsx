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
  Bell, Mic, Vote, Upload, Download 
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
  
  // Data states
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);

  useEffect(() => {
    checkAuth();
    testAPI();
  }, []);

  useEffect(() => {
    if (user) {
      loadAllData();
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

  const loadAllData = async () => {
    try {
      const [meetingsData, committeesData, filesData, announcementsData, tasksData, libraryData] = await Promise.all([
        meetingAPI.getAll(),
        committeeAPI.getAll(),
        fileAPI.getAll(),
        announcementAPI.getAll(),
        taskAPI.getAll(),
        libraryAPI.getAll()
      ]);
      
      setMeetings(meetingsData);
      setCommittees(committeesData);
      setFiles(filesData);
      setAnnouncements(announcementsData);
      setTasks(tasksData);
      setLibraryDocs(libraryData);
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
    setFiles([]);
    setAnnouncements([]);
    setTasks([]);
    setLibraryDocs([]);
    toast.success('Αποσύνδεση επιτυχής');
  };

  // Component for file upload
  const FileUploadComponent = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('general');
    const [description, setDescription] = useState('');

    const handleFileUpload = async () => {
      if (!selectedFile) return;
      
      try {
        await fileAPI.upload(selectedFile, { category, description });
        toast.success('Αρχείο ανέβηκε επιτυχώς!');
        setSelectedFile(null);
        setDescription('');
        loadAllData(); // Refresh files
      } catch (error) {
        toast.error('Σφάλμα ανεβάσματος αρχείου');
      }
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ανέβασμα Αρχείου
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Αρχείο</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="category">Κατηγορία</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="general">Γενικά</option>
                <option value="meeting">Συνεδρίαση</option>
                <option value="legal">Νομικά</option>
                <option value="financial">Οικονομικά</option>
              </select>
            </div>
            <div>
              <Label htmlFor="description">Περιγραφή</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Προαιρετική περιγραφή"
              />
            </div>
            <Button onClick={handleFileUpload} disabled={!selectedFile}>
              Ανέβασμα
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
                Ολοκληρωμένη Πλατφόρμα Διαχείρισης Συλλογικών Οργάνων
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
                    Σύστημα Διαχείρισης Συνεδριάσεων
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

            {/* Meetings Tab */}
            <TabsContent value="meetings">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Επιτροπές ({committees.length})
                    </CardTitle>
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
                          <Badge variant="outline" className="mt-2">
                            {meeting.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files">
              <FileUploadComponent />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Αρχεία ({files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="p-3 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-600">{file.description}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{file.category}</Badge>
                            <Badge variant="outline">{(file.file_size / 1024).toFixed(1)} KB</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(fileAPI.download(file.id), '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ημερολόγιο Εκδηλώσεων
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {meetings
                      .filter(m => m.scheduled_at)
                      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
                      .map((meeting) => (
                        <div key={meeting.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{meeting.title}</h3>
                              <p className="text-sm text-gray-600">{meeting.description}</p>
                              <p className="text-sm text-blue-600 mt-1">
                                {new Date(meeting.scheduled_at!).toLocaleString('el-GR')}
                              </p>
                            </div>
                            <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                              {meeting.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Βιβλιοθήκη Εγγράφων ({libraryDocs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {libraryDocs.map((doc) => (
                      <div key={doc.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{doc.content.substring(0, 200)}...</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{doc.category}</Badge>
                          {doc.tags && (
                            <Badge variant="outline">{doc.tags}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Ανακοινώσεις ({announcements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(announcement.created_at).toLocaleString('el-GR')}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={
                              announcement.priority === 'urgent' ? 'destructive' :
                              announcement.priority === 'high' ? 'default' : 'secondary'
                            }>
                              {announcement.priority}
                            </Badge>
                            <Badge variant="outline">{announcement.category}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transcription Tab */}
            <TabsContent value="transcription">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Απομαγνητοφώνηση
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <Mic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Ανεβάστε ηχητικό αρχείο για απομαγνητοφώνηση</p>
                      <Input type="file" accept="audio/*" className="mb-4" />
                      <Button>Έναρξη Απομαγνητοφώνησης</Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Υποστηριζόμενες μορφές: MP3, WAV, M4A, OGG</p>
                      <p>Μέγιστο μέγεθος αρχείου: 100MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voting Tab */}
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
                                toast.success('Ψήφος καταγράφηκε!');
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
                                toast.success('Ψήφος καταγράφηκε!');
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
                                toast.success('Ψήφος καταγράφηκε!');
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
          </Tabs>
        </main>
      </div>
    </>
  );
}