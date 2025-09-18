// Extended FastAPI backend communication utilities

const API_BASE_URL = 'http://localhost:8000';

// Generic API request helper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Extended Types
export interface Meeting {
  id: number;
  committee_id: number;
  title: string;
  description?: string;
  scheduled_at?: string;
  location?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: number;
  created_at: string;
  agenda_items?: AgendaItem[];
}

export interface AgendaItem {
  id: number;
  meeting_id: number;
  order_index: number;
  title: string;
  description?: string;
  category?: string;
  presenter?: string;
  estimated_duration?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'deferred';
  introduction_file?: string;
  decision_file?: string;
  created_at: string;
  updated_at: string;
  vote_result?: VoteResult;
  comments?: AgendaComment[];
}

export interface VoteResult {
  id: number;
  agenda_item_id: number;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_votes: number;
  result: 'approved' | 'rejected' | 'no_quorum';
  voted_at: string;
}

export interface AgendaComment {
  id: number;
  agenda_item_id: number;
  user_id: number;
  user_name?: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Committee {
  id: number;
  name: string;
  description?: string;
}

export interface Vote {
  id: number;
  meeting_id: number;
  user_id: number;
  opt: string;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface File {
  id: number;
  meeting_id: number;
  filename: string;
  url: string;
  uploaded_by: number;
  uploaded_at: string;
}

export interface Task {
  id: number;
  meeting_id: number;
  assigned_to: number;
  description: string;
  status: string;
  created_at: string;
}

export interface Comment {
  id: number;
  meeting_id: number;
  user_id: number;
  message: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  meeting_id: number;
  created_by: number;
  message: string;
  created_at: string;
}

// User-related API calls
export const userAPI = {
  create: (userData: { email: string; password: string; name: string }) =>
    apiRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getAll: () => apiRequest('/users/'),
};

// Committee-related API calls
export const committeeAPI = {
  create: (committeeData: { name: string; description?: string }) =>
    apiRequest('/committees/', {
      method: 'POST',
      body: JSON.stringify(committeeData),
    }),

  getAll: () => apiRequest<Committee[]>('/committees/'),
};

// Enhanced Meeting-related API calls
export const meetingAPI = {
  create: (meetingData: { 
    title: string; 
    description?: string; 
    scheduled_at?: string; 
    committee_id: number;
    location?: string;
    status?: string;
  }) =>
    apiRequest<Meeting>('/meetings/', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    }),

  getAll: () => apiRequest<Meeting[]>('/meetings/'),
  
  getById: (id: number) => apiRequest<Meeting>(`/meetings/${id}`),
};

// Agenda Items API calls
export const agendaItemAPI = {
  create: (itemData: {
    meeting_id: number;
    order_index: number;
    title: string;
    description?: string;
    category?: string;
    presenter?: string;
    estimated_duration?: number;
    status?: string;
    introduction_file?: string;
    decision_file?: string;
  }) =>
    apiRequest<AgendaItem>('/agenda-items/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),

  getByMeetingId: (meetingId: number) => 
    apiRequest<AgendaItem[]>(`/meetings/${meetingId}/agenda-items/`),
};

// Vote Results API calls
export const voteResultAPI = {
  create: (voteData: {
    agenda_item_id: number;
    votes_for: number;
    votes_against: number;
    votes_abstain: number;
    total_votes: number;
    result: string;
  }) =>
    apiRequest<VoteResult>('/vote-results/', {
      method: 'POST',
      body: JSON.stringify(voteData),
    }),

  getByAgendaItemId: (agendaItemId: number) => 
    apiRequest<VoteResult | null>(`/agenda-items/${agendaItemId}/vote-result/`),
};

// Agenda Comments API calls
export const agendaCommentAPI = {
  create: (commentData: {
    agenda_item_id: number;
    user_id: number;
    comment: string;
  }) =>
    apiRequest<AgendaComment>('/agenda-comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),

  getByAgendaItemId: (agendaItemId: number) => 
    apiRequest<AgendaComment[]>(`/agenda-items/${agendaItemId}/comments/`),
};

// Legacy Vote-related API calls (for backward compatibility)
export const voteAPI = {
  create: (voteData: { meeting_id: number; opt: string }) =>
    apiRequest('/votes/', {
      method: 'POST',
      body: JSON.stringify(voteData),
    }),

  getAll: () => apiRequest('/votes/'),
};

// File-related API calls (placeholder for future implementation)
export const fileAPI = {
  create: (fileData: { meeting_id: number; filename: string; url: string }) =>
    apiRequest('/files/', {
      method: 'POST',
      body: JSON.stringify(fileData),
    }),

  getAll: () => apiRequest('/files/'),
};

// Task-related API calls (placeholder for future implementation)
export const taskAPI = {
  create: (taskData: { 
    meeting_id: number; 
    assigned_to: number; 
    description: string; 
    status?: string;
  }) =>
    apiRequest('/tasks/', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  getAll: () => apiRequest('/tasks/'),
};

// Comment-related API calls (placeholder for future implementation)
export const commentAPI = {
  create: (commentData: { meeting_id: number; message: string }) =>
    apiRequest('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),

  getAll: () => apiRequest('/comments/'),
};

// Announcement-related API calls (placeholder for future implementation)
export const announcementAPI = {
  create: (announcementData: { meeting_id: number; message: string }) =>
    apiRequest('/announcements/', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    }),

  getAll: () => apiRequest('/announcements/'),
};

// Health check for backend
export const healthAPI = {
  check: () => apiRequest('/'),
};