// FastAPI backend communication utilities

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

  getAll: () => apiRequest('/committees/'),
};

// Meeting-related API calls
export const meetingAPI = {
  create: (meetingData: { 
    title: string; 
    description?: string; 
    scheduled_at?: string; 
    committee_id: number;
  }) =>
    apiRequest('/meetings/', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    }),

  getAll: () => apiRequest('/meetings/'),
};

// Vote-related API calls
export const voteAPI = {
  create: (voteData: { meeting_id: number; opt: string }) =>
    apiRequest('/votes/', {
      method: 'POST',
      body: JSON.stringify(voteData),
    }),

  getAll: () => apiRequest('/votes/'),
};

// File-related API calls
export const fileAPI = {
  create: (fileData: { meeting_id: number; filename: string; url: string }) =>
    apiRequest('/files/', {
      method: 'POST',
      body: JSON.stringify(fileData),
    }),

  getAll: () => apiRequest<File[]>('/files/'),

  getById: (id: number) => apiRequest<File>(`/files/${id}`),

  delete: (id: number) => 
    apiRequest(`/files/${id}`, {
      method: 'DELETE',
    }),

  // Upload file function (would need backend endpoint for file upload)
  upload: async (file: Blob, metadata: {
    filename: string;
    meeting_id?: number;
    description?: string;
    category?: string;
  }): Promise<File> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', metadata.filename);
    if (metadata.meeting_id) {
      formData.append('meeting_id', metadata.meeting_id.toString());
    }
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.category) {
      formData.append('category', metadata.category);
    }

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  },

  // Download file (returns blob)
  download: async (id: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/files/${id}/download`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download Error: ${response.status} - ${errorText}`);
    }

    return response.blob();
  },
};

// Task-related API calls
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

// Comment-related API calls
export const commentAPI = {
  create: (commentData: { meeting_id: number; message: string }) =>
    apiRequest('/comments/', {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),

  getAll: () => apiRequest('/comments/'),
};

// Announcement-related API calls
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

// Types for API responses
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Committee {
  id: number;
  name: string;
  description?: string;
}

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
  order: number;
  title: string;
  description?: string;
  category?: string;
  presenter?: string;
  estimated_duration?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'deferred';
  introduction_file?: string;
  decision_file?: string;
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
  user_name: string;
  comment: string;
  created_at: string;
}

export interface Vote {
  id: number;
  meeting_id: number;
  user_id: number;
  opt: string;
  created_at: string;
}

export interface File {
  id: number;
  meeting_id?: number;
  filename: string;
  originalName?: string;
  url: string;
  uploaded_by: number;
  uploaded_at: string;
  size?: number;
  type?: string;
  description?: string;
  category?: 'meetings' | 'documents' | 'reports' | 'general' | 'images' | 'videos';
  tags?: string[];
  downloadCount?: number;
  isPublic?: boolean;
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