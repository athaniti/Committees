import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { 
  Calendar, Clock, MapPin, Users, FileText, MessageSquare,
  ThumbsUp, ThumbsDown, Minus, Download, Upload, ArrowLeft,
  CheckCircle, Circle, Timer, XCircle, Vote as VoteIcon, Mic,
  Play, Pause, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import type { Meeting, AgendaItem, VoteResult, AgendaComment } from '../../utils/api-extended';
import { agendaItemAPI, voteResultAPI, agendaCommentAPI } from '../../utils/api-extended';

interface MeetingDetailViewProps {
  meeting: Meeting;
  onBack: () => void;
  onUpdateMeeting?: (meeting: Meeting) => void;
}

export default function MeetingDetailView({ 
  meeting, 
  onBack, 
  onUpdateMeeting 
}: MeetingDetailViewProps) {
  const [activeAgendaItem, setActiveAgendaItem] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentingItemId, setCommentingItemId] = useState<number | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Load real agenda items from API
  useEffect(() => {
    const loadAgendaItems = async () => {
      try {
        setLoading(true);
        const items = await agendaItemAPI.getByMeetingId(meeting.id);
        
        // Load vote results and comments for each item
        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            try {
              const [voteResult, comments] = await Promise.all([
                voteResultAPI.getByAgendaItemId(item.id).catch(() => null),
                agendaCommentAPI.getByAgendaItemId(item.id).catch(() => [])
              ]);
              
              return {
                ...item,
                vote_result: voteResult || undefined,
                comments: comments || []
              } as AgendaItem;
            } catch (error) {
              console.error(`Error loading details for agenda item ${item.id}:`, error);
              return {
                ...item,
                vote_result: undefined,
                comments: []
              } as AgendaItem;
            }
          })
        );
        
        setAgendaItems(itemsWithDetails);
      } catch (error) {
        console.error('Error loading agenda items:', error);
        toast.error('Σφάλμα φόρτωσης θεμάτων ατζέντας');
        // Fallback to mock data
        setAgendaItems(getMockAgendaItems());
      } finally {
        setLoading(false);
      }
    };

    loadAgendaItems();
  }, [meeting.id]);

  // Mock data για fallback
  const getMockAgendaItems = (): AgendaItem[] => [
    {
      id: 1,
      meeting_id: meeting.id,
      order_index: 1,
      title: "Έγκριση Προϋπολογισμού 2025",
      description: "Συζήτηση και έγκριση του προϋπολογισμού για το επόμενο έτος",
      category: "Οικονομικά",
      presenter: "Αντιδήμαρχος Οικονομικών",
      estimated_duration: 45,
      status: "completed",
      introduction_file: "eisigisi_proypologismos_2025.pdf",
      decision_file: "apofasi_proypologismos_2025.pdf",
      created_at: "2025-09-18T10:00:00Z",
      updated_at: "2025-09-18T15:30:00Z",
      vote_result: {
        id: 1,
        agenda_item_id: 1,
        votes_for: 12,
        votes_against: 3,
        votes_abstain: 2,
        total_votes: 17,
        result: "approved",
        voted_at: "2025-09-18T15:30:00Z"
      },
      comments: [
        {
          id: 1,
          agenda_item_id: 1,
          user_id: 1,
          user_name: "Μαρία Παπαδοπούλου",
          comment: "Θα πρέπει να εξετάσουμε προσεκτικότερα τον κονδύλιο για τις παιδικές χαρές.",
          created_at: "2025-09-18T15:45:00Z",
          updated_at: "2025-09-18T15:45:00Z"
        }
      ]
    },
    {
      id: 2,
      meeting_id: meeting.id,
      order_index: 2,
      title: "Αδειοδότηση Νέου Καταστήματος",
      description: "Εξέταση αίτησης για άδεια λειτουργίας καταστήματος εστίασης",
      category: "Αδειοδοτήσεις",
      presenter: "Προϊστάμενος Τμήματος",
      estimated_duration: 20,
      status: "in_progress",
      introduction_file: "aitisi_adeias_estiasis.pdf",
      created_at: "2025-09-18T10:00:00Z",
      updated_at: "2025-09-18T14:00:00Z",
      comments: []
    },
    {
      id: 3,
      meeting_id: meeting.id,
      order_index: 3,
      title: "Κυκλοφοριακές Ρυθμίσεις Κέντρου",
      description: "Προτάσεις για βελτίωση της κυκλοφορίας στο ιστορικό κέντρο",
      category: "Κυκλοφορία",
      presenter: "Τμήμα Κυκλοφορίας",
      estimated_duration: 30,
      status: "pending",
      introduction_file: "meleti_kykloforias.pdf",
      created_at: "2025-09-18T10:00:00Z",
      updated_at: "2025-09-18T10:00:00Z",
      comments: []
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Timer className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'deferred':
        return <XCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρώθηκε';
      case 'in_progress':
        return 'Σε Εξέλιξη';
      case 'pending':
        return 'Εκκρεμεί';
      case 'deferred':
        return 'Αναβλήθηκε';
      default:
        return 'Άγνωστη';
    }
  };

  const getVoteResultBadge = (result: string) => {
    switch (result) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Εγκρίθηκε</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Απορρίφθηκε</Badge>;
      case 'no_quorum':
        return <Badge variant="secondary">Χωρίς Απαρτία</Badge>;
      default:
        return <Badge variant="outline">Δεν Ψηφίστηκε</Badge>;
    }
  };

  const handleAddComment = async (agendaItemId: number) => {
    if (!newComment.trim()) return;

    try {
      const newCommentData = await agendaCommentAPI.create({
        agenda_item_id: agendaItemId,
        user_id: 1, // TODO: Get from current user context
        comment: newComment.trim()
      });

      // Update the local state with the new comment
      setAgendaItems(prevItems => 
        prevItems.map(item => 
          item.id === agendaItemId 
            ? { 
                ...item, 
                comments: [...(item.comments || []), {
                  ...newCommentData,
                  user_name: 'Τρέχον Χρήστης' // TODO: Get from user context
                }]
              }
            : item
        )
      );

      toast.success('Το σχόλιο προστέθηκε επιτυχώς');
      setNewComment('');
      setCommentingItemId(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Σφάλμα προσθήκης σχολίου');
    }
  };

  const handleFileDownload = (filename: string) => {
    // Εδώ θα γίνει download του αρχείου
    toast.info(`Λήψη αρχείου: ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Επιστροφή
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
          <p className="text-gray-600">{meeting.description}</p>
        </div>
      </div>

      {/* Βασικές Πληροφορίες Συνεδρίασης */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Στοιχεία Συνεδρίασης
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Ημερομηνία:</span>
                <span>
                  {meeting.scheduled_at 
                    ? new Date(meeting.scheduled_at).toLocaleDateString('el-GR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Δεν έχει οριστεί'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Ώρα:</span>
                <span>
                  {meeting.scheduled_at 
                    ? new Date(meeting.scheduled_at).toLocaleTimeString('el-GR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Δεν έχει οριστεί'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Τόπος:</span>
                <span>{meeting.location || 'Αίθουσα Δημοτικού Συμβουλίου'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Κατάσταση:</span>
                <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                  {meeting.status === 'completed' ? 'Ολοκληρώθηκε' : 
                   meeting.status === 'in_progress' ? 'Σε Εξέλιξη' : 
                   meeting.status === 'scheduled' ? 'Προγραμματισμένη' : 'Ακυρώθηκε'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Θέματα Ατζέντας:</span>
                <span>{agendaItems.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ατζέντα με Θέματα */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ατζέντα Συνεδρίασης
          </CardTitle>
          <CardDescription>
            Αναλυτική παρουσίαση των θεμάτων προς συζήτηση
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Φόρτωση θεμάτων ατζέντας...</p>
              </div>
            ) : agendaItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Δεν υπάρχουν θέματα ατζέντας</p>
              </div>
            ) : (
              agendaItems.map((item, index) => (
              <Card key={item.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                          {item.order_index}
                        </span>
                        {getStatusIcon(item.status || 'pending')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>📋 {item.category}</span>
                          <span>👤 {item.presenter}</span>
                          <span>⏱️ {item.estimated_duration} λεπτά</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getStatusText(item.status || 'pending')}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Αρχεία */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Εισήγηση
                      </h4>
                      {item.introduction_file ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFileDownload(item.introduction_file!)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {item.introduction_file}
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-500">Δεν υπάρχει αρχείο εισήγησης</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Απόφαση
                      </h4>
                      {item.decision_file ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleFileDownload(item.decision_file!)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {item.decision_file}
                        </Button>
                      ) : (
                        <p className="text-sm text-gray-500">Δεν υπάρχει αρχείο απόφασης</p>
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Αποτελέσματα Ψηφοφορίας */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <VoteIcon className="h-4 w-4" />
                      Αποτελέσματα Ψηφοφορίας
                    </h4>
                    {item.vote_result ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          {getVoteResultBadge(item.vote_result.result)}
                          <span className="text-sm text-gray-600">
                            Ψηφίστηκε στις {new Date(item.vote_result.voted_at).toLocaleString('el-GR')}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800">Υπέρ</span>
                            </div>
                            <div className="text-2xl font-bold text-green-800">
                              {item.vote_result.votes_for}
                            </div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ThumbsDown className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800">Κατά</span>
                            </div>
                            <div className="text-2xl font-bold text-red-800">
                              {item.vote_result.votes_against}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Minus className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-800">Αποχή</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                              {item.vote_result.votes_abstain}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Σύνολο</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-800">
                              {item.vote_result.total_votes}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Δεν έχει πραγματοποιηθεί ψηφοφορία</p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Σχόλια */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Σχόλια ({item.comments?.length || 0})
                    </h4>
                    
                    {/* Υπάρχοντα Σχόλια */}
                    <div className="space-y-3 mb-4">
                      {item.comments?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.user_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleString('el-GR')}
                            </span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>

                    {/* Προσθήκη Νέου Σχολίου */}
                    {commentingItemId === item.id ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Προσθέστε το σχόλιό σας..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAddComment(item.id)}
                          >
                            Προσθήκη Σχολίου
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setCommentingItemId(null);
                              setNewComment('');
                            }}
                          >
                            Ακύρωση
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCommentingItemId(item.id)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Προσθήκη Σχολίου
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Απομαγνητοφώνηση Συνεδρίασης */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Απομαγνητοφώνηση & Πρακτικά
          </CardTitle>
          <CardDescription>
            Μετατροπή ηχητικού σε κείμενο και επεξεργασία πρακτικών
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Ηχητικό Αρχείο */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ηχητικό Αρχείο Συνεδρίασης
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">audio_meeting_{meeting.id}_{new Date(meeting.scheduled_at || '').toISOString().split('T')[0]}.mp3</span>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Αναπαραγωγή
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Λήψη
                    </Button>
                  </div>
                </div>
                
                {/* Upload νέου αρχείου */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Mic className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Σύρετε ή επιλέξτε ηχητικό αρχείο για ανέβασμα
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Επιλογή Αρχείου
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Αυτόματη Απομαγνητοφώνηση */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Αυτόματη Απομαγνητοφώνηση
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => {
                      setIsTranscribing(!isTranscribing);
                      if (!isTranscribing) {
                        // Simulate transcription process
                        setTimeout(() => {
                          setTranscriptionText(`
Πρακτικά Συνεδρίασης Δημοτικού Συμβουλίου
Ημερομηνία: ${new Date(meeting.scheduled_at || '').toLocaleDateString('el-GR')}
Τόπος: ${meeting.location || 'Αίθουσα Δημοτικού Συμβουλίου'}

ΠΡΟΕΔΡΟΣ: Κηρύσσω την έναρξη της συνεδρίασης. Το πρώτο θέμα στην ημερήσια διάταξή μας αφορά...

ΜΕΛΟΣ Α: Θα ήθελα να εκφράσω την ανησυχία μου σχετικά με...

ΠΡΟΕΔΡΟΣ: Σας ευχαριστώ. Ο λόγος στον επόμενο ομιλητή...

[Η απομαγνητοφώνηση συνεχίζεται...]
                          `);
                          setIsTranscribing(false);
                        }, 3000);
                      }
                    }}
                    variant={isTranscribing ? "destructive" : "default"}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Επεξεργασία... (μπορεί να διαρκέσει λίγα λεπτά)
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1" />
                        Έναρξη Απομαγνητοφώνησης
                      </>
                    )}
                  </Button>
                  {isTranscribing && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Ανάλυση ηχητικού αρχείου...
                    </div>
                  )}
                </div>
                
                {transcriptionText && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <p className="text-sm text-blue-800 mb-2 font-medium">
                      ✓ Απομαγνητοφώνηση ολοκληρώθηκε επιτυχώς
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Επεξεργασία Πρακτικών */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Κείμενο Πρακτικών
              </h4>
              <div className="space-y-3">
                <Textarea
                  value={transcriptionText}
                  onChange={(e) => setTranscriptionText(e.target.value)}
                  placeholder="Το κείμενο των πρακτικών θα εμφανιστεί εδώ μετά την απομαγνητοφώνηση..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    disabled={!transcriptionText.trim()}
                    onClick={() => {
                      toast.success('Τα πρακτικά αποθηκεύτηκαν επιτυχώς');
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Αποθήκευση Πρακτικών
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!transcriptionText.trim()}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Εξαγωγή PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!transcriptionText.trim()}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Εξαγωγή Word
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}