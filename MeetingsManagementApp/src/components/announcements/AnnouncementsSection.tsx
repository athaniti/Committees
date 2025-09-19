import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Bell, Plus, MessageSquare, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import { User } from '../../utils/auth';

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  type: 'general' | 'meeting' | 'event' | 'urgent';
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface AnnouncementsSectionProps {
  user: User;
}

// Mock data για τις ανακοινώσεις
const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Προγραμματισμένη Συντήρηση Συστήματος",
    content: "Την Κυριακή 22/09/2025 από 02:00 έως 04:00 θα πραγματοποιηθεί προγραμματισμένη συντήρηση του συστήματος. Κατά τη διάρκεια αυτή δεν θα είναι δυνατή η πρόσβαση στην πλατφόρμα.",
    priority: "high",
    type: "urgent",
    createdBy: "Διαχειριστής Συστήματος",
    createdAt: "2025-09-19T10:30:00Z",
    isActive: true
  },
  {
    id: 2,
    title: "Συνεδρίαση Διοικητικού Συμβουλίου",
    content: "Η επόμενη τακτική συνεδρίαση του Διοικητικού Συμβουλίου θα πραγματοποιηθεί την Τετάρτη 25/09/2025 στις 14:00. Παρακαλούμε όλα τα μέλη να προετοιμάσουν τις εισηγήσεις τους.",
    priority: "normal",
    type: "meeting",
    createdBy: "Γραμματεία",
    createdAt: "2025-09-18T09:15:00Z",
    isActive: true
  },
  {
    id: 3,
    title: "Νέα Έκδοση Κανονισμού Λειτουργίας",
    content: "Παρακαλούμε όλα τα μέλη να λάβουν γνώση της νέας έκδοσης του Κανονισμού Λειτουργίας που είναι διαθέσιμη στη Βιβλιοθήκη Εγγράφων. Οι αλλαγές αφορούν κυρίως τη διαδικασία ψηφοφορίας.",
    priority: "normal",
    type: "general",
    createdBy: "Νομικό Τμήμα",
    createdAt: "2025-09-17T16:45:00Z",
    isActive: true
  },
  {
    id: 4,
    title: "Εκπαιδευτικό Σεμινάριο",
    content: "Στις 30/09/2025 θα πραγματοποιηθεί εκπαιδευτικό σεμινάριο για τη χρήση του νέου συστήματος διαχείρισης. Η συμμετοχή είναι προαιρετική αλλά συνιστάται ιδιαίτερα.",
    priority: "low",
    type: "event",
    createdBy: "Εκπαίδευση",
    createdAt: "2025-09-16T11:20:00Z",
    isActive: true
  }
];

export function AnnouncementsSection({ user }: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    type: 'general' as 'general' | 'meeting' | 'event' | 'urgent'
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Προσομοίωση δημιουργίας νέας ανακοίνωσης
      const newAnnouncementData: Announcement = {
        id: announcements.length + 1,
        ...newAnnouncement,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      setAnnouncements(prev => [newAnnouncementData, ...prev]);
      console.log('Η ανακοίνωση δημιουργήθηκε επιτυχώς');
      alert('Η ανακοίνωση δημιουργήθηκε επιτυχώς');
      setDialogOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'normal',
        type: 'general'
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Σφάλμα δημιουργίας ανακοίνωσης');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800 border-red-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'Υψηλή',
      normal: 'Κανονική',
      low: 'Χαμηλή'
    };
    return labels[priority] || priority;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: 'Γενική',
      meeting: 'Συνεδρίαση',
      event: 'Εκδήλωση',
      urgent: 'Επείγουσα'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <MessageSquare className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Φίλτρα για τις ανακοινώσεις
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesPriority = selectedPriority === 'all' || announcement.priority === selectedPriority;
    const matchesType = selectedType === 'all' || announcement.type === selectedType;
    return matchesPriority && matchesType;
  });

  // Στατιστικά
  const stats = {
    total: announcements.length,
    high: announcements.filter(a => a.priority === 'high').length,
    urgent: announcements.filter(a => a.type === 'urgent').length,
    recent: announcements.filter(a => {
      const created = new Date(a.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Ανακοινώσεις
          </h2>
          <p className="text-gray-600 mt-1">
            Επίσημες ανακοινώσεις και ενημερώσεις του οργανισμού
          </p>
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
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
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
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
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

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Συνολικές Ανακοινώσεις</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-sm text-gray-600">Υψηλής Προτεραιότητας</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
            <div className="text-sm text-gray-600">Επείγουσες</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
            <div className="text-sm text-gray-600">Τελευταία Εβδομάδα</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="priority-filter">Φίλτρο Προτεραιότητας</Label>
              <select
                id="priority-filter"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Όλες οι προτεραιότητες</option>
                <option value="high">Υψηλή</option>
                <option value="normal">Κανονική</option>
                <option value="low">Χαμηλή</option>
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="type-filter">Φίλτρο Κατηγορίας</Label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Όλες οι κατηγορίες</option>
                <option value="general">Γενική</option>
                <option value="meeting">Συνεδρίαση</option>
                <option value="event">Εκδήλωση</option>
                <option value="urgent">Επείγουσα</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Δεν βρέθηκαν ανακοινώσεις
              </h3>
              <p className="text-gray-600">
                Δεν υπάρχουν ανακοινώσεις που να ταιριάζουν με τα κριτήρια φιλτραρίσματος.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className={`hover:shadow-lg transition-shadow ${
              announcement.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
            }`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(announcement.type)}
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      <Badge variant="outline">{getTypeLabel(announcement.type)}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString('el-GR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <UserIcon className="h-3 w-3" />
                      {announcement.createdBy}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}