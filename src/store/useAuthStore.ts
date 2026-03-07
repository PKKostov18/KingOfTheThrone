import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/database.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initialized: boolean;
  loading: boolean;

  // Initialize — called from root layout
  initialize: () => Promise<void>;

  // Load profile from public.profiles
  fetchProfile: () => Promise<void>;

  // Update profile (username, avatar)
  updateProfile: (updates: { username?: string; avatar_url?: string }) => Promise<void>;

  // Upload a photo from gallery and set as avatar
  uploadAvatar: (imageUri: string) => Promise<void>;

  // Sign in with email/password
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;

  // Sign up with email/password + username
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;

  // Sign out
  signOut: () => Promise<void>;

  // Session setter (used by the auth listener)
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    try {
      // Race getSession against a timeout so the app never hangs when offline
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      const session = sessionResult
        ? (sessionResult as { data: { session: Session | null } }).data.session
        : null;

      set({
        session,
        user: session?.user ?? null,
        initialized: true,
      });

      // If there's a logged-in user, load their profile (non-blocking)
      if (session?.user) {
        get().fetchProfile().catch(() => {});
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });

        if (session?.user) {
          get().fetchProfile().catch(() => {});
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Auth init error:', error);
      set({ initialized: true });
    }
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Fetch profile error:', error.message);
      return;
    }

    set({ profile: data as Profile });
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return;

    set({ loading: true });

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Update profile error:', error.message);
      set({ loading: false });
      throw new Error(error.message);
    }

    // Reload profile after update
    await get().fetchProfile();
    set({ loading: false });
  },

  uploadAvatar: async (imageUri: string) => {
    const user = get().user;
    if (!user) throw new Error('Not logged in');

    set({ loading: true });

    try {
      // Determine file extension from URI
      const uriParts = imageUri.split('.');
      const fileExt = (uriParts.pop()?.toLowerCase() ?? 'jpg').split('?')[0];
      const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Read the file as ArrayBuffer (works reliably in React Native)
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Supabase Storage (avatars bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uint8Array, {
          upsert: true,
          contentType: mimeType,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Append cache-buster so the image refreshes
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Save the URL to the profile
      await get().updateProfile({ avatar_url: publicUrl });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.message ?? 'Failed to upload avatar');
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    set({ loading: false });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },

  signUp: async (email, password, username) => {
    set({ loading: true });

    // 1. Check if username is taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      set({ loading: false });
      return { error: 'This username is already taken!' };
    }

    // 2. Register via Supabase Auth
    //    full_name is passed as metadata -> the handle_new_user() trigger saves it as username
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
        },
      },
    });

    if (error) {
      set({ loading: false });
      return { error: error.message };
    }

    // 3. If the user was created and the trigger fired,
    //    update the username just in case (the trigger might have set null)
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id);
    }

    set({ loading: false });
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },
}));
