import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { Calendar, Users, FileText, Vote, Bell, Mic, Settings, Plus, Upload, LogOut } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { MeetingsSection } from './components/meetings/MeetingsSection';
import { FilesSection } from './components/files/FilesSection';
import { CalendarSection } from './components/calendar/CalendarSection';
import { LibrarySection } from './components/library/LibrarySection';
import { AnnouncementsSection } from './components/announcements/AnnouncementsSection';
import { TranscriptionSection } from './components/transcription/TranscriptionSection';
import { VotingSection } from './components/voting/VotingSection';
import { UserProfile } from './components/profile/UserProfile';
import { DebugInfo } from './components/debug/DebugInfo';
import { projectId, publicAnonKey } from './utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('meetings');

  useEffect(() => {
    // Test backend connectivity first
    testBackendConnection();
    checkSession();
    createDemoUsersIfNeeded();
  }, []);

  const createDemoUsersIfNeeded = async () => {
    try {
      // Check if demo users already exist in localStorage flag
      const demoUsersCreated = localStorage.getItem('demoUsersCreated');
      if (demoUsersCreated) {
        console.log('Demo users already created');
        return;
      }

      console.log('Creating demo users...');
      
      const demoAccounts = [
        { email: 'admin@demo.gr', password: 'admin123', name: 'Διαχειριστής Συστήματος', role: 'admin' },
        { email: 'member@demo.gr', password: 'member123', name: 'Μέλος Συμβουλίου', role: 'member' },
        { email: 'secretary@demo.gr', password: 'secretary123', name: 'Γραμματέας ΔΣ', role: 'secretary' }
      ];

      let successCount = 0;

      for (const account of demoAccounts) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: account.email,
            password: account.password,
            options: {
              data: {
                name: account.name,
                role: account.role
              }
            }
          });

          if (!error && data.user) {
            console.log(`✅ Demo user created: ${account.email}`);
            successCount++;
          } else {
            console.log(`⚠️  Demo user may already exist: ${account.email}`, error?.message);
          }
        } catch (userError) {
          console.log(`❌ Failed to create demo user ${account.email}:`, userError);
        }
      }

      if (successCount > 0) {
        console.log(`Created ${successCount} demo users`);
      }
      
      // Mark as completed
      localStorage.setItem('demoUsersCreated', 'true');
    } catch (error) {
      console.error('Demo users creation failed:', error);
    }
  };

  const testBackendConnection = async () => {
    try {
      console.log('Testing backend connection...');
      console.log('Project ID:', projectId);
      console.log('Supabase URL:', `https://${projectId}.supabase.co`);
      
      // First test the Supabase connection directly
      const { data: testData, error: testError } = await supabase.auth.getSession();
      console.log('Supabase client test:', { hasData: !!testData, error: testError?.message });
      
      // Then test the edge function
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/health`);
      console.log('Backend health check:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend is healthy:', data);
      } else {
        const errorText = await response.text();
        console.error('Backend health check failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Backend connection test failed:', error);
    }
  };

  const checkSession = async () => {
    try {
      console.log('Checking for existing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Session check result:', { session: session ? 'exists' : 'none', error });
      
      if (session?.access_token) {
        console.log('Found existing session, fetching profile...');
        await fetchUserProfile(session.access_token);
      } else {
        console.log('No existing session found');
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (accessToken: string) => {
    try {
      console.log('Fetching user profile with token:', accessToken?.substring(0, 20) + '...');
      
      // Try backend first
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/profile`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Profile response status:', response.status);

        if (response.ok) {
          const profileData = await response.json();
          console.log('Profile data received from backend:', profileData);
          
          setProfile(profileData);
          setUser({
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            role: profileData.role
          });
          return;
        }
      } catch (backendError) {
        console.log('Backend profile fetch failed, using frontend fallback:', backendError);
      }

      // Fallback to frontend-only profile creation
      console.log('Using frontend fallback for profile');
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        console.error('Frontend user fetch error:', error);
        toast.error('Σφάλμα φόρτωσης χρήστη');
        return;
      }

      // Create profile from user metadata
      const profileData = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'Unknown User',
        role: user.user_metadata?.role || 'member',
        createdAt: user.created_at || new Date().toISOString(),
        groups: []
      };

      console.log('Frontend profile created:', profileData);
      
      setProfile(profileData);
      setUser({
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Σφάλμα φόρτωσης προφίλ: ' + (error as Error).message);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log('Login response:', { data, error });
      
      if (error) {
        console.error('Supabase auth error:', error);
        toast.error('Σφάλμα σύνδεσης: ' + error.message);
        return false;
      }

      if (data.session?.access_token) {
        console.log('Session created, fetching profile...');
        await fetchUserProfile(data.session.access_token);
        toast.success('Επιτυχής σύνδεση!');
        return true;
      } else {
        console.error('No session or access token in response');
        toast.error('Δεν ήταν δυνατή η δημιουργία συνεδρίας');
        return false;
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Σφάλμα σύνδεσης: ' + (error as Error).message);
      return false;
    }
  };

  const handleRegister = async (email: string, password: string, name: string, role: string = 'member') => {
    try {
      // Try backend first, fallback to frontend-only
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/register`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, name, role })
        });

        if (response.ok) {
          toast.success('Επιτυχής εγγραφή! Μπορείτε να συνδεθείτε.');
          setAuthMode('login');
          return true;
        }
      } catch (backendError) {
        console.log('Backend registration failed, trying frontend signup:', backendError);
      }

      // Fallback to frontend-only registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (error) {
        console.error('Frontend signup error:', error);
        toast.error('Σφάλμα εγγραφής: ' + error.message);
        return false;
      }

      toast.success('Επιτυχής εγγραφή! Μπορείτε να συνδεθείτε.');
      setAuthMode('login');
      return true;
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Σφάλμα εγγραφής');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      toast.success('Αποσύνδεση επιτυχής');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Σφάλμα αποσύνδεσης');
    }
  };

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
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
                Πλατφόρμα διαχείρισης συλλογικών οργάνων και διαβούλευσης
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Σύνδεση</TabsTrigger>
                  <TabsTrigger value="register">Εγγραφή</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm onLogin={handleLogin} />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm onRegister={handleRegister} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <DebugInfo />
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
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7 mb-8">
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
              <FileText className="h-4 w-4" />
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
            <TabsTrigger value="voting" className="flex items-center gap-2 hidden lg:flex">
              <Vote className="h-4 w-4" />
              Ψηφοφορίες
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings">
            <MeetingsSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="files">
            <FilesSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="library">
            <LibrarySection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="transcription">
            <TranscriptionSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>

          <TabsContent value="voting">
            <VotingSection user={user} getAccessToken={getAccessToken} />
          </TabsContent>
        </Tabs>
      </main>
      </div>
    </>
  );
}