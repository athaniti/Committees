import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Clock, MapPin, Users, Plus, FileText, Video, Vote } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  status: string;
  createdBy: string;
  createdAt: string;
  agenda?: string[];
}

interface MeetingsSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function MeetingsSection({ user, getAccessToken }: MeetingsSectionProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'council',
    agenda: ''
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        toast.error('Σφάλμα φόρτωσης συνεδριάσεων');
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Σφάλμα φόρτωσης συνεδριάσεων');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = await getAccessToken();
      if (!token) return;

      const meetingData = {
        ...newMeeting,
        agenda: newMeeting.agenda ? newMeeting.agenda.split('\n').filter(item => item.trim()) : []
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/meetings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetingData)
      });

      if (response.ok) {
        toast.success('Η συνεδρίαση δημιουργήθηκε επιτυχώς');
        setDialogOpen(false);
        setNewMeeting({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          type: 'council',
          agenda: ''
        });
        fetchMeetings();
      } else {
        const errorData = await response.json();
        toast.error('Σφάλμα δημιουργίας συνεδρίασης: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Σφάλμα δημιουργίας συνεδρίασης');
    }
  };

  const getMeetingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      council: 'Δημοτικό Συμβούλιο',
      committee: 'Επιτροπή',
      commission: 'Επιτροπή Διαβούλευσης',
      event: 'Εκδήλωση'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Προγραμματισμένη',
      ongoing: 'Σε εξέλιξη',
      completed: 'Ολοκληρωμένη',
      cancelled: 'Ακυρωμένη'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση συνεδριάσεων...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Συνεδριάσεις</h2>
          <p className="text-gray-600">Διαχείριση προγραμματισμένων συνεδριάσεων και εκδηλώσεων</p>
        </div>
        {(user.role === 'admin' || user.role === 'secretary') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Νέα Συνεδρίαση
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Δημιουργία Νέας Συνεδρίασης</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Τίτλος</Label>
                    <Input
                      id="title"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                      placeholder="π.χ. Τακτική Συνεδρίαση ΔΣ"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Τύπος</Label>
                    <Select value={newMeeting.type} onValueChange={(value) => setNewMeeting({ ...newMeeting, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="council">Δημοτικό Συμβούλιο</SelectItem>
                        <SelectItem value="committee">Επιτροπή</SelectItem>
                        <SelectItem value="commission">Επιτροπή Διαβούλευσης</SelectItem>
                        <SelectItem value="event">Εκδήλωση</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Περιγραφή</Label>
                  <Textarea
                    id="description"
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                    placeholder="Περιγραφή της συνεδρίασης"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Ημερομηνία</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Ώρα</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Τοποθεσία</Label>
                    <Input
                      id="location"
                      value={newMeeting.location}
                      onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                      placeholder="Αίθουσα συνεδριάσεων"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda">Ημερήσια Διάταξη (μία γραμμή ανά θέμα)</Label>
                  <Textarea
                    id="agenda"
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    placeholder="1. Έγκριση προηγούμενων πρακτικών&#10;2. Συζήτηση προϋπολογισμού&#10;3. Διάφορα θέματα"
                    rows={6}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Ακύρωση
                  </Button>
                  <Button type="submit">Δημιουργία</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {meetings.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Δεν υπάρχουν προγραμματισμένες συνεδριάσεις</p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{meeting.title}</CardTitle>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{getMeetingTypeLabel(meeting.type)}</Badge>
                      <Badge className={getStatusColor(meeting.status)}>
                        {getStatusLabel(meeting.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {meeting.description && (
                  <CardDescription className="text-sm">{meeting.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(meeting.date).toLocaleDateString('el-GR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {meeting.time}
                  </div>
                  
                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </div>
                  )}

                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ημερήσια Διάταξη
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {meeting.agenda.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 font-medium">{index + 1}.</span>
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                        {meeting.agenda.length > 3 && (
                          <li className="text-gray-400 italic">
                            +{meeting.agenda.length - 3} περισσότερα θέματα
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Αρχεία
                  </Button>
                  {meeting.status === 'ongoing' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Video className="h-4 w-4 mr-1" />
                      Σύνδεση
                    </Button>
                  )}
                  {meeting.status === 'scheduled' && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Vote className="h-4 w-4 mr-1" />
                      Ψηφοφορία
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}