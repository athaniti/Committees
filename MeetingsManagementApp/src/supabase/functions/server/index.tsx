import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// IMPORTANT: Logger must be first
app.use('*', logger(console.log));

// IMPORTANT: CORS must be second and very permissive for Edge Functions
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
  credentials: false
}));

// Root health check - NO AUTH
app.get("/", (c) => {
  console.log('Root endpoint hit');
  return c.json({ 
    status: "ok", 
    message: "Make Server is running",
    timestamp: new Date().toISOString(),
    endpoints: [
      '/make-server-07da4527/health',
      '/make-server-07da4527/debug/accounts',
      '/make-server-07da4527/register',
      '/make-server-07da4527/profile'
    ]
  });
});

// Health check endpoint - NO AUTH REQUIRED
app.get("/make-server-07da4527/health", (c) => {
  console.log('Health check requested');
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Server is running",
    version: "1.0.0"
  });
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

console.log('Supabase client initialized');

// Initialize storage buckets
async function initializeBuckets() {
  try {
    const buckets = [
      'make-07da4527-meetings',
      'make-07da4527-files',
      'make-07da4527-transcripts'
    ];
    
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    
    for (const bucketName of buckets) {
      const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, { public: false });
        console.log(`Created bucket: ${bucketName}`);
      }
    }
  } catch (error) {
    console.error('Failed to initialize buckets:', error);
  }
}

// Create demo accounts
async function createDemoAccounts() {
  console.log('Starting demo accounts creation...');
  
  const demoAccounts = [
    { email: 'admin@demo.gr', password: 'admin123', name: 'Διαχειριστής Συστήματος', role: 'admin' },
    { email: 'member@demo.gr', password: 'member123', name: 'Μέλος Συμβουλίου', role: 'member' },
    { email: 'secretary@demo.gr', password: 'secretary123', name: 'Γραμματέας ΔΣ', role: 'secretary' }
  ];

  for (const account of demoAccounts) {
    try {
      console.log(`Checking if account exists: ${account.email}`);
      
      // Check if user already exists in KV store
      const existingProfiles = await kv.getByPrefix(`user:`);
      const userExists = existingProfiles.some((profile: any) => profile?.email === account.email);
      
      if (!userExists) {
        console.log(`Creating demo account: ${account.email}`);
        
        const { data, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          user_metadata: { name: account.name, role: account.role },
          email_confirm: true
        });

        if (error) {
          console.error(`Supabase auth error for ${account.email}:`, error);
          continue;
        }

        if (data.user) {
          const userProfile = {
            id: data.user.id,
            email: data.user.email,
            name: account.name,
            role: account.role,
            createdAt: new Date().toISOString(),
            groups: []
          };
          
          await kv.set(`user:${data.user.id}`, userProfile);
          console.log(`✅ Demo account created successfully: ${account.email}`);
        }
      } else {
        console.log(`Demo account already exists: ${account.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create demo account ${account.email}:`, error);
    }
  }
  
  console.log('Demo accounts creation completed');
}

// Initialize on startup (but don't block)
setTimeout(() => {
  initializeBuckets().catch(console.error);
  createDemoAccounts().catch(console.error);
}, 1000);

// Debug endpoint to check demo accounts - NO AUTH REQUIRED
app.get("/make-server-07da4527/debug/accounts", async (c) => {
  try {
    console.log('Debug accounts check requested');
    const profiles = await kv.getByPrefix(`user:`);
    
    const accountSummary = profiles.map((profile: any) => ({
      email: profile?.email,
      name: profile?.name,
      role: profile?.role,
      id: profile?.id?.substring(0, 8) + '...'
    }));

    return c.json({
      status: "ok",
      totalAccounts: profiles.length,
      accounts: accountSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug accounts check error:', error);
    return c.json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Force recreate demo accounts - NO AUTH REQUIRED (for debugging)
app.post("/make-server-07da4527/debug/recreate-accounts", async (c) => {
  try {
    console.log('Force recreating demo accounts...');
    
    // Clear existing accounts from KV store
    const existingProfiles = await kv.getByPrefix(`user:`);
    for (const profile of existingProfiles) {
      if (profile?.email?.includes('@demo.gr')) {
        await kv.del(`user:${profile.id}`);
        console.log(`Cleared profile for: ${profile.email}`);
      }
    }
    
    // Recreate demo accounts
    await createDemoAccounts();
    
    return c.json({
      status: "success",
      message: "Demo accounts recreated",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Force recreate accounts error:', error);
    return c.json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Auth middleware
async function requireAuth(c: any, next: any) {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('Auth middleware - Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('Auth middleware - No Authorization header');
      return c.json({ error: 'No authorization header provided' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    if (!accessToken) {
      console.log('Auth middleware - No token in Authorization header');
      return c.json({ error: 'No authorization token provided' }, 401);
    }

    console.log('Auth middleware - Validating token:', accessToken.substring(0, 20) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    console.log('Auth middleware - Token validation result:', { 
      hasUser: !!user, 
      userId: user?.id?.substring(0, 8),
      error: error?.message 
    });
    
    if (error) {
      console.log('Auth middleware - Supabase auth error:', error);
      return c.json({ error: 'Invalid authorization token: ' + error.message }, 401);
    }
    
    if (!user?.id) {
      console.log('Auth middleware - No user ID in token');
      return c.json({ error: 'Invalid authorization token: no user' }, 401);
    }
    
    c.set('userId', user.id);
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware - Unexpected error:', error);
    return c.json({ error: 'Authentication failed: ' + error.message }, 500);
  }
}

// User registration - NO AUTH REQUIRED
app.post("/make-server-07da4527/register", async (c) => {
  try {
    const { email, password, name, role = 'member' } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    });

    if (error) {
      console.log('Registration error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      createdAt: new Date().toISOString(),
      groups: []
    });

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Get user profile - AUTH REQUIRED
app.get("/make-server-07da4527/profile", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const user = c.get('user');
    
    console.log('Profile endpoint - User ID:', userId?.substring(0, 8));
    console.log('Profile endpoint - User email:', user?.email);
    
    const profile = await kv.get(`user:${userId}`);
    
    console.log('Profile endpoint - Profile found:', !!profile);
    
    if (!profile) {
      console.log('Profile endpoint - Creating profile from Supabase user data');
      
      const newProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'member',
        createdAt: new Date().toISOString(),
        groups: []
      };
      
      await kv.set(`user:${userId}`, newProfile);
      console.log('Profile endpoint - Created new profile:', newProfile);
      return c.json(newProfile);
    }
    
    console.log('Profile endpoint - Returning existing profile');
    return c.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile: ' + error.message }, 500);
  }
});

// All other authenticated endpoints...
app.post("/make-server-07da4527/meetings", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const meetingData = await c.req.json();
    
    const meeting = {
      id: crypto.randomUUID(),
      ...meetingData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      status: 'scheduled'
    };
    
    await kv.set(`meeting:${meeting.id}`, meeting);
    
    const meetingsIndex = await kv.get('meetings:index') || [];
    meetingsIndex.push(meeting.id);
    await kv.set('meetings:index', meetingsIndex);
    
    return c.json(meeting);
  } catch (error) {
    console.log('Meeting creation error:', error);
    return c.json({ error: 'Failed to create meeting' }, 500);
  }
});

app.get("/make-server-07da4527/meetings", requireAuth, async (c) => {
  try {
    const meetingsIndex = await kv.get('meetings:index') || [];
    const meetings = [];
    
    for (const meetingId of meetingsIndex) {
      const meeting = await kv.get(`meeting:${meetingId}`);
      if (meeting) {
        meetings.push(meeting);
      }
    }
    
    return c.json(meetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    console.log('Meetings fetch error:', error);
    return c.json({ error: 'Failed to fetch meetings' }, 500);
  }
});

// Add minimal versions of other endpoints to prevent 404s
app.post("/make-server-07da4527/votes", requireAuth, async (c) => {
  return c.json({ error: "Votes endpoint under development" }, 501);
});

app.get("/make-server-07da4527/votes", requireAuth, async (c) => {
  return c.json([]);
});

app.post("/make-server-07da4527/announcements", requireAuth, async (c) => {
  return c.json({ error: "Announcements endpoint under development" }, 501);
});

app.get("/make-server-07da4527/announcements", requireAuth, async (c) => {
  return c.json([]);
});

app.post("/make-server-07da4527/upload", requireAuth, async (c) => {
  return c.json({ error: "File upload endpoint under development" }, 501);
});

app.get("/make-server-07da4527/files", requireAuth, async (c) => {
  return c.json([]);
});

// Catch-all for debugging
app.all("*", (c) => {
  console.log(`Unhandled request: ${c.req.method} ${c.req.url}`);
  return c.json({
    error: "Endpoint not found",
    method: c.req.method,
    path: c.req.url,
    timestamp: new Date().toISOString()
  }, 404);
});

console.log('Starting Hono server...');
Deno.serve(app.fetch);