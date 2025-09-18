import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Bell, Plus, MessageSquare } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  type: string;
}

interface AnnouncementsSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function AnnouncementsSection({ user, getAccessToken }: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    type: 'general'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        toast.error('Σφάλμα φόρτωσης ανακοινώσεων');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Σφάλμα φόρτωσης ανακοινώσεων');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (response.ok) {
        toast.success('Η ανακοίνωση δημιουργήθηκε επιτυχώς');
        setDialogOpen(false);
        setNewAnnouncement({
          title: '',
          content: '',
          priority: 'normal',
          type: 'general'
        });
        fetchAnnouncements();
      } else {
        const errorData = await response.json();
        toast.error('Σφάλμα δημιουργίας ανακοίνωσης: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Σφάλμα δημιουργίας ανακοίνωσης');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'Υψηλή',
      normal: 'Κανονική',
      low: 'Χαμηλή'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση ανακοινώσεων...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Ανακοινώσεις</h2>
          <p className="text-gray-600">Επίσημες ανακοινώσεις και ενημερώσεις</p>
        </div>
        {(user.role === 'admin' || user.role === 'secretary') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Νέα Ανακοίνωση
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Δημιουργία Νέας Ανακοίνωσης</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-title">Τίτλος</Label>
                  <Input
                    id="announcement-title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Τίτλος ανακοίνωσης"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="announcement-content">Περιεχόμενο</Label>
                  <Textarea
                    id="announcement-content"
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    placeholder="Περιεχόμενο της ανακοίνωσης"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Προτεραιότητα</Label>
                    <select
                      id="priority"
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="low">Χαμηλή</option>
                      <option value="normal">Κανονική</option>
                      <option value="high">Υψηλή</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Κατηγορία</Label>
                    <select
                      id="type"
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="general">Γενική</option>
                      <option value="meeting">Συνεδρίαση</option>
                      <option value="event">Εκδήλωση</option>
                      <option value="urgent">Επείγουσα</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Ακύρωση
                  </Button>
                  <Button type="submit">Δημοσίευση</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Δεν υπάρχουν ανακοινώσεις</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      <Badge variant="outline">{announcement.type}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString('el-GR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}