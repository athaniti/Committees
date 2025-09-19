import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin,
  Users,
  Eye
} from 'lucide-react';
import { User } from '../../utils/auth';

// Custom styles for calendar grid
const calendarStyles = `
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    width: 100%;
  }
  
  .calendar-day {
    min-height: 120px;
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
  
  @media (max-width: 768px) {
    .calendar-day {
      min-height: 80px;
    }
  }
`;

interface CalendarSectionProps {
  user: User;
  getAccessToken?: () => Promise<string | undefined>;
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'meeting' | 'event' | 'deadline' | 'other';
  location?: string;
  participants?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high';
}

// Mock data για εκδηλώσεις
const mockEvents: CalendarEvent[] = [
  {
    id: 1,
    title: "Συνεδρίαση Διοικητικού Συμβουλίου",
    description: "Τακτική μηνιαία συνεδρίαση για αναθεώρηση του προϋπολογισμού",
    date: "2025-09-25",
    time: "14:00",
    type: "meeting",
    location: "Αίθουσα Συνεδριάσεων Α",
    participants: 12,
    status: "scheduled",
    priority: "high"
  },
  {
    id: 2,
    title: "Παρουσίαση Ετήσιας Έκθεσης",
    description: "Παρουσίαση των αποτελεσμάτων της χρονιάς στα μέλη",
    date: "2025-09-27",
    time: "10:30",
    type: "event",
    location: "Κεντρική Αίθουσα",
    participants: 45,
    status: "scheduled",
    priority: "normal"
  },
  {
    id: 3,
    title: "Προθεσμία Υποβολής Προτάσεων",
    description: "Τελική ημερομηνία για υποβολή νέων προτάσεων",
    date: "2025-09-30",
    time: "17:00",
    type: "deadline",
    status: "scheduled",
    priority: "high"
  },
  {
    id: 4,
    title: "Επιτροπή Ελέγχου",
    description: "Συνεδρίαση της επιτροπής ελέγχου για τον τριμηνιαίο απολογισμό",
    date: "2025-10-02",
    time: "09:00",
    type: "meeting",
    location: "Αίθουσα Β",
    participants: 8,
    status: "scheduled",
    priority: "normal"
  },
  {
    id: 5,
    title: "Εκπαιδευτικό Σεμινάριο",
    description: "Σεμινάριο για τη χρήση του νέου συστήματος διαχείρισης",
    date: "2025-10-05",
    time: "15:00",
    type: "event",
    location: "Εκπαιδευτικό Κέντρο",
    participants: 25,
    status: "scheduled",
    priority: "low"
  }
];

const monthNames = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

const dayNames = ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'];

export function CalendarSection({ user, getAccessToken }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Υπολογισμός ημερών του μήνα
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Εύρεση εκδηλώσεων για συγκεκριμένη ημερομηνία
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockEvents.filter(event => event.date === dateStr);
  };

  // Χρώματα για τους τύπους εκδηλώσεων
  const getEventTypeColor = (type: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      event: 'bg-green-100 text-green-800 border-green-200',
      deadline: 'bg-red-100 text-red-800 border-red-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      meeting: 'Συνεδρίαση',
      event: 'Εκδήλωση',
      deadline: 'Προθεσμία',
      other: 'Άλλο'
    };
    return labels[type as keyof typeof labels] || 'Άλλο';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-l-4 border-l-red-500',
      normal: 'border-l-4 border-l-blue-500',
      low: 'border-l-4 border-l-gray-400'
    };
    return colors[priority as keyof typeof colors] || '';
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Φίλτρα εκδηλώσεων για list view
  const upcomingEvents = mockEvents
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: calendarStyles }} />
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Ημερολόγιο Εκδηλώσεων
          </h2>
          <p className="text-gray-600 mt-1">
            Προγραμματισμένες συνεδριάσεις, εκδηλώσεις και προθεσμίες
          </p>
        </div>
        {(user.role === 'admin' || user.role === 'secretary') && (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Νέα Εκδήλωση
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mockEvents.filter(e => e.type === 'meeting').length}
            </div>
            <div className="text-sm text-gray-600">Συνεδριάσεις</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockEvents.filter(e => e.type === 'event').length}
            </div>
            <div className="text-sm text-gray-600">Εκδηλώσεις</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {mockEvents.filter(e => e.type === 'deadline').length}
            </div>
            <div className="text-sm text-gray-600">Προθεσμίες</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {upcomingEvents.length}
            </div>
            <div className="text-sm text-gray-600">Επερχόμενες</div>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Μηνιαία Προβολή
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Λίστα Εκδηλώσεων
              </Button>
            </div>
            
            {viewMode === 'month' && (
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold min-w-[200px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      {viewMode === 'month' ? (
        /* Monthly Calendar View */
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            {/* Day Headers */}
            <div className="calendar-grid mb-2 min-w-[600px]">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2 border-b border-gray-200">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="calendar-grid min-w-[600px]">
              {calendarDays.map((date, index) => {
                const events = getEventsForDate(date);
                const isCurrentMonthDay = isCurrentMonth(date);
                const isTodayDay = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`calendar-day p-2 hover:bg-gray-50 transition-colors ${
                      isCurrentMonthDay ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    } ${isTodayDay ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                    } ${isTodayDay ? 'text-blue-600 font-bold' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1 overflow-hidden">
                      {events.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.type)}`}
                          onClick={() => setSelectedEvent(event)}
                          title={`${event.title} - ${event.time}`}
                        >
                          <div className="truncate font-medium">{event.title}</div>
                          <div className="truncate text-gray-600">{event.time}</div>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500 text-center font-medium">
                          +{events.length - 2} περισσότερες
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Επερχόμενες Εκδηλώσεις</h3>
          {upcomingEvents.map(event => (
            <Card key={event.id} className={`hover:shadow-lg transition-shadow ${getPriorityColor(event.priority)}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{event.title}</h4>
                      <Badge className={getEventTypeColor(event.type)}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString('el-GR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      {event.participants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.participants} συμμετέχοντες
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Προβολή
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className={getEventTypeColor(selectedEvent.type)}>
                  {getEventTypeLabel(selectedEvent.type)}
                </Badge>
                <Badge variant="outline">{selectedEvent.status}</Badge>
              </div>
              
              <p className="text-gray-700">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Ημερομηνία:</span>
                    <span>{new Date(selectedEvent.date).toLocaleDateString('el-GR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Ώρα:</span>
                    <span>{selectedEvent.time}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Τοποθεσία:</span>
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.participants && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Συμμετέχοντες:</span>
                      <span>{selectedEvent.participants}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Κλείσιμο
                </Button>
                {(user.role === 'admin' || user.role === 'secretary') && (
                  <Button>
                    Επεξεργασία
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}