// Complete API functions for the Meetings Management System

const API_BASE_URL = 'http://localhost:8000';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  return handleResponse(response);
};

// =============================================================================
// HEALTH & BASIC ENDPOINTS
// =============================================================================

export const healthAPI = {
  check: () => apiRequest('/health'),
  root: () => apiRequest('/'),
};

// =============================================================================
// COMMITTEE ENDPOINTS
// =============================================================================

export const committeeAPI = {
  getAll: () => apiRequest('/committees/'),
  
  getById: (id: number) => apiRequest(`/committees/${id}`),
  
  create: (data: { name: string; description?: string }) =>
    apiRequest('/committees/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// MEETING ENDPOINTS
// =============================================================================

export const meetingAPI = {
  getAll: (committeeId?: number) => {
    const params = committeeId ? `?committee_id=${committeeId}` : '';
    return apiRequest(`/meetings/${params}`);
  },
  
  getById: (id: number) => apiRequest(`/meetings/${id}`),
  
  create: (data: {
    title: string;
    description?: string;
    scheduled_at?: string;
    committee_id: number;
    agenda?: string;
    status?: string;
  }) =>
    apiRequest('/meetings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// FILE MANAGEMENT ENDPOINTS
// =============================================================================

export const fileAPI = {
  getAll: (filters?: {
    category?: string;
    committee_id?: number;
    meeting_id?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.committee_id) params.append('committee_id', filters.committee_id.toString());
    if (filters?.meeting_id) params.append('meeting_id', filters.meeting_id.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/files/${queryString}`);
  },
  
  upload: async (file: File, metadata: {
    category: string;
    committee_id?: number;
    meeting_id?: number;
    description?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', metadata.category);
    if (metadata.committee_id) formData.append('committee_id', metadata.committee_id.toString());
    if (metadata.meeting_id) formData.append('meeting_id', metadata.meeting_id.toString());
    if (metadata.description) formData.append('description', metadata.description);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },
  
  download: (fileId: number) => `${API_BASE_URL}/files/${fileId}/download`,
};

// =============================================================================
// VOTING ENDPOINTS
// =============================================================================

export const voteAPI = {
  create: (data: { meeting_id: number; opt: string }) =>
    apiRequest('/votes/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getByMeeting: (meetingId: number) =>
    apiRequest(`/votes/meeting/${meetingId}`),
};

// =============================================================================
// ANNOUNCEMENT ENDPOINTS
// =============================================================================

export const announcementAPI = {
  getAll: (activeOnly = true) => {
    const params = activeOnly ? '?active_only=true' : '?active_only=false';
    return apiRequest(`/announcements/${params}`);
  },
  
  create: (data: {
    title: string;
    content: string;
    priority?: string;
    category?: string;
    expires_at?: string;
  }) =>
    apiRequest('/announcements/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// TASK ENDPOINTS
// =============================================================================

export const taskAPI = {
  getAll: (filters?: { assigned_to?: number; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/tasks/${queryString}`);
  },
  
  create: (data: {
    title: string;
    description?: string;
    assigned_to?: number;
    meeting_id?: number;
    due_date?: string;
    priority?: string;
  }) =>
    apiRequest('/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// LIBRARY ENDPOINTS
// =============================================================================

export const libraryAPI = {
  getAll: (filters?: {
    category?: string;
    search?: string;
    public_only?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.public_only !== undefined) params.append('public_only', filters.public_only.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/library/${queryString}`);
  },
  
  create: (data: {
    title: string;
    category: string;
    content: string;
    tags?: string;
    is_public?: boolean;
  }) =>
    apiRequest('/library/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// TRANSCRIPTION ENDPOINTS
// =============================================================================

export const transcriptionAPI = {
  uploadAudio: async (file: File, meetingId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (meetingId) formData.append('meeting_id', meetingId.toString());

    const response = await fetch(`${API_BASE_URL}/transcription/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },
  
  getStatus: (transcriptionId: string) =>
    apiRequest(`/transcription/${transcriptionId}`),
};

// =============================================================================
// CALENDAR ENDPOINTS
// =============================================================================

export const calendarAPI = {
  getEvents: (filters?: { start_date?: string; end_date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/calendar/events${queryString}`);
  },
};

// =============================================================================
// USER ENDPOINTS
// =============================================================================

export const userAPI = {
  getAll: () => apiRequest('/users/'),
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Committee {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Meeting {
  id: number;
  committee_id: number;
  title: string;
  description?: string;
  scheduled_at?: string;
  agenda?: string;
  status?: string;
  created_by: number;
  created_at: string;
}

export interface FileItem {
  id: number;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  committee_id?: number;
  meeting_id?: number;
  description?: string;
  uploaded_by: number;
  created_at: string;
}

export interface Vote {
  id: number;
  meeting_id: number;
  user_id: number;
  opt: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  category: string;
  expires_at?: string;
  created_by: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to?: number;
  meeting_id?: number;
  due_date?: string;
  priority: string;
  status: string;
  created_by: number;
  created_at: string;
}

export interface LibraryDocument {
  id: number;
  title: string;
  category: string;
  content: string;
  tags?: string;
  is_public: boolean;
  created_by: number;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start?: string;
  committee: string;
  status?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}