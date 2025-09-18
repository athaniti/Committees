// Simple authentication for FastAPI demo
// This replaces Supabase auth with a simple local storage solution

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Demo users for testing
const DEMO_USERS = [
  { id: 1, email: 'admin@demo.gr', password: 'admin123', name: 'Διαχειριστής Συστήματος', role: 'admin' },
  { id: 2, email: 'member@demo.gr', password: 'member123', name: 'Μέλος Συμβουλίου', role: 'member' },
  { id: 3, email: 'secretary@demo.gr', password: 'secretary123', name: 'Γραμματέας ΔΣ', role: 'secretary' }
];

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string } | null> => {
    // Simple demo authentication
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const authData = {
        user,
        token: 'demo-token-' + user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      localStorage.setItem('auth', JSON.stringify(authData));
      return { user, token: authData.token };
    }
    return null;
  },

  register: async (email: string, password: string, name: string, role: string = 'member'): Promise<boolean> => {
    // For demo, just return success
    console.log('Demo registration:', { email, name, role });
    return true;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('auth');
  },

  getCurrentUser: (): { user: User; token: string } | null => {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.expiresAt > Date.now()) {
        return { user: parsed.user, token: parsed.token };
      } else {
        localStorage.removeItem('auth');
      }
    }
    return null;
  }
};

export type { User };