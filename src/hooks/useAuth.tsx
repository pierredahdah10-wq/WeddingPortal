import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'admin' | 'sales';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    is_active: boolean;
  } | null;
  isLoading: boolean;
  isApproved: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  const fetchUserData = async (userId: string, retryCount = 0) => {
    try {
      // Fetch profile first (with retry for new signups where trigger might not have run yet)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // If profile doesn't exist, wait a bit and retry (for new signups)
      if (!profileData && retryCount < 3) {
        console.log('Profile not found, retrying...', retryCount);
        setTimeout(() => {
          fetchUserData(userId, retryCount + 1);
        }, 500);
        return;
      }

      // If profile still doesn't exist after retries, user might have been deleted
      if (!profileData) {
        console.warn('User profile not found after retries, signing out...');
        await supabase.auth.signOut();
        setRole(null);
        setProfile(null);
        setIsApproved(false);
        toast.error('Your account profile was not found. Please contact support.');
        return;
      }

      // Check if user is approved - if not, sign them out immediately
      if (profileData.approval_status !== 'approved') {
        console.warn('User not approved, signing out...');
        await supabase.auth.signOut();
        setRole(null);
        setProfile(null);
        setIsApproved(false);
        if (profileData.approval_status === 'pending') {
          toast.error('Your account is pending admin approval. Please wait for approval.');
        } else if (profileData.approval_status === 'rejected') {
          toast.error('Your account has been rejected. You cannot access the system.');
        }
        return;
      }

      // User is approved, fetch role and set profile
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleData) {
        setRole(roleData.role as AppRole);
      } else {
        setRole(null);
      }

      setProfile({
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar,
        is_active: profileData.is_active,
      });

      setIsApproved(true);

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If there's an error fetching profile, it might mean user was deleted
      // Sign out to be safe
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('JWT') || errorMessage.includes('session')) {
        await supabase.auth.signOut();
        setRole(null);
        setProfile(null);
        setIsApproved(false);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setIsApproved(false); // Reset approval status while checking
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
          setIsApproved(false);
        }
        
        if (event === 'SIGNED_OUT') {
          setRole(null);
          setProfile(null);
          setIsApproved(false);
        }

        // If token is refreshed, check if user still exists
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          fetchUserData(session.user.id);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsApproved(false); // Reset while checking
        fetchUserData(session.user.id);
      } else {
        setIsApproved(false);
      }
      setIsLoading(false);
    });

    // Set up a periodic check to verify user still exists and is approved (every 30 seconds)
    const profileCheckInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        // Check if profile still exists and is approved
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, approval_status')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
        
        if (!profileData) {
          // Profile doesn't exist, user was deleted - sign out
          console.warn('User profile not found during periodic check, signing out...');
          await supabase.auth.signOut();
          setRole(null);
          setProfile(null);
          setIsApproved(false);
          toast.error('Your account profile was not found. Please contact support.');
        } else if (profileData.approval_status !== 'approved') {
          // User is no longer approved - sign out
          console.warn('User approval status changed, signing out...');
          await supabase.auth.signOut();
          setRole(null);
          setProfile(null);
          setIsApproved(false);
          if (profileData.approval_status === 'pending') {
            toast.error('Your account is pending admin approval.');
          } else if (profileData.approval_status === 'rejected') {
            toast.error('Your account has been rejected.');
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(profileCheckInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Check if this email was previously rejected
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingProfile?.approval_status === 'rejected') {
        toast.error('This email has been rejected. You cannot sign up with this email address.');
        return { error: new Error('Email rejected') };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in instead.');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      // If signup was successful, immediately sign out the user
      // since they need admin approval first
      if (data.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sign out immediately - user needs approval before accessing
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setIsApproved(false);
      }

      toast.success('Account created successfully. Your request is pending admin approval. You will be notified once approved.');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else {
          toast.error(error.message);
        }
        return { error };
      }

      // Check approval status after successful authentication
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('approval_status')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileData) {
          if (profileData.approval_status === 'pending') {
            await supabase.auth.signOut();
            toast.error('Your account is pending admin approval. Please wait for approval before logging in.');
            return { error: new Error('Account pending approval') };
          }
          
          if (profileData.approval_status === 'rejected') {
            await supabase.auth.signOut();
            toast.error('Your account has been rejected. You cannot access the system.');
            return { error: new Error('Account rejected') };
          }
        }
      }

      toast.success('Welcome back!');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase first - this will trigger onAuthStateChange
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
      }
      
      // The onAuthStateChange listener will handle clearing state
      // But we also clear it here to be safe
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setIsApproved(false);
    } catch (error) {
      console.error('Error in signOut:', error);
      // Ensure state is cleared even on error
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setIsApproved(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        isLoading,
        isApproved,
        signUp,
        signIn,
        signOut,
        isAdmin: role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
