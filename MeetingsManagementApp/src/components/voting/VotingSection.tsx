import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Vote, Plus, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface VoteRecord {
  id: string;
  title: string;
  description: string;
  options: string[];
  status: string;
  createdBy: string;
  createdAt: string;
  votes: Record<string, { option: string; timestamp: string }>;
  endDate?: string;
}

interface VotingSectionProps {
  user: User;
  getAccessToken: () => Promise<string | undefined>;
}

export function VotingSection({ user, getAccessToken }: VotingSectionProps) {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newVote, setNewVote] = useState({
    title: '',
    description: '',
    options: ['Υπέρ', 'Κατά', 'Αποχή']
  });

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/votes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVotes(data);
      } else {
        toast.error('Σφάλμα φόρτωσης ψηφοφοριών');
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast.error('Σφάλμα φόρτωσης ψηφοφοριών');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/votes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVote)
      });

      if (response.ok) {
        toast.success('Η ψηφοφορία δημιουργήθηκε επιτυχώς');
        setDialogOpen(false);
        setNewVote({
          title: '',
          description: '',
          options: ['Υπέρ', 'Κατά', 'Αποχή']
        });
        fetchVotes();
      } else {
        const errorData = await response.json();
        toast.error('Σφάλμα δημιουργίας ψηφοφορίας: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating vote:', error);
      toast.error('Σφάλμα δημιουργίας ψηφοφορίας');
    }
  };

  const handleCastVote = async (voteId: string, option: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-07da4527/votes/${voteId}/cast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ option })
      });

      if (response.ok) {
        toast.success('Η ψήφος σας καταγράφηκε επιτυχώς');
        fetchVotes();
      } else {
        const errorData = await response.json();
        toast.error('Σφάλμα καταγραφής ψήφου: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Σφάλμα καταγραφής ψήφου');
    }
  };

  const getVoteResults = (vote: VoteRecord) => {
    const results: Record<string, number> = {};
    vote.options.forEach(option => {
      results[option] = 0;
    });

    Object.values(vote.votes).forEach(v => {
      if (results[v.option] !== undefined) {
        results[v.option]++;
      }
    });

    return results;
  };

  const hasUserVoted = (vote: VoteRecord) => {
    return vote.votes[user.id] !== undefined;
  };

  const getUserVote = (vote: VoteRecord) => {
    return vote.votes[user.id]?.option;
  };

  const getTotalVotes = (vote: VoteRecord) => {
    return Object.keys(vote.votes).length;
  };

  if (loading) {
    return <div className="text-center py-8">Φόρτωση ψηφοφοριών...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Ψηφοφορίες</h2>
          <p className="text-gray-600">Ηλεκτρονικές ψηφοφορίες και αποτελέσματα</p>
        </div>
        {(user.role === 'admin' || user.role === 'secretary') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Νέα Ψηφοφορία
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Δημιουργία Νέας Ψηφοφορίας</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateVote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vote-title">Τίτλος</Label>
                  <Input
                    id="vote-title"
                    value={newVote.title}
                    onChange={(e) => setNewVote({ ...newVote, title: e.target.value })}
                    placeholder="π.χ. Έγκριση προϋπολογισμού 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vote-description">Περιγραφή</Label>
                  <Textarea
                    id="vote-description"
                    value={newVote.description}
                    onChange={(e) => setNewVote({ ...newVote, description: e.target.value })}
                    placeholder="Περιγραφή του θέματος προς ψήφιση"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Επιλογές (μία ανά γραμμή)</Label>
                  <Textarea
                    value={newVote.options.join('\n')}
                    onChange={(e) => setNewVote({ ...newVote, options: e.target.value.split('\n').filter(opt => opt.trim()) })}
                    placeholder="Υπέρ&#10;Κατά&#10;Αποχή"
                    rows={3}
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

      <div className="grid gap-6">
        {votes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Δεν υπάρχουν ενεργές ψηφοφορίες</p>
            </CardContent>
          </Card>
        ) : (
          votes.map((vote) => {
            const results = getVoteResults(vote);
            const totalVotes = getTotalVotes(vote);
            const userVoted = hasUserVoted(vote);
            const userVoteOption = getUserVote(vote);

            return (
              <Card key={vote.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{vote.title}</CardTitle>
                      <div className="flex gap-2 mb-2">
                        <Badge variant={vote.status === 'active' ? 'default' : 'secondary'}>
                          {vote.status === 'active' ? 'Ενεργή' : 'Κλειστή'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {totalVotes} ψήφοι
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(vote.createdAt).toLocaleDateString('el-GR')}
                    </div>
                  </div>
                  {vote.description && (
                    <p className="text-gray-600">{vote.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Vote Options */}
                    <div className="space-y-2">
                      {vote.options.map((option) => {
                        const optionVotes = results[option] || 0;
                        const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                        const isUserChoice = userVoteOption === option;

                        return (
                          <div key={option} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{option}</span>
                                {isUserChoice && (
                                  <Badge variant="outline" className="text-xs">
                                    Η ψήφος σας
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">
                                {optionVotes} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isUserChoice ? 'bg-blue-600' : 'bg-gray-400'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            {/* Vote button */}
                            {vote.status === 'active' && !userVoted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleCastVote(vote.id, option)}
                              >
                                Ψηφίζω: {option}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Status message */}
                    {userVoted && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="h-5 w-5" />
                        <span>Έχετε ψηφίσει: <strong>{userVoteOption}</strong></span>
                      </div>
                    )}

                    {vote.status === 'closed' && (
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <XCircle className="h-5 w-5" />
                        <span>Η ψηφοφορία έχει κλείσει</span>
                      </div>
                    )}

                    {vote.status === 'active' && !userVoted && (
                      <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                        <Clock className="h-5 w-5" />
                        <span>Μπορείτε να ψηφίσετε επιλέγοντας μία από τις παραπάνω επιλογές</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}