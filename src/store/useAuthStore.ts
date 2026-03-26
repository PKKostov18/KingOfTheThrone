import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/database.types';
import { useGameStore } from './useGameStore';
import { useSettingsStore } from './useSettingsStore';

interface AvatarUploadInput {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
}

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB
const MIN_AVATAR_DIMENSION = 96;
const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BANNED_FILE_NAME_HINTS = /(nsfw|nude|porn|sex|xxx|hentai|fetish|onlyfans)/i;
const AVATAR_MODERATION_FUNCTION = process.env.EXPO_PUBLIC_AVATAR_MODERATION_FUNCTION?.trim() ?? '';
const ALLOW_UNMODERATED_AVATARS = process.env.EXPO_PUBLIC_ALLOW_UNMODERATED_AVATARS === 'true';

function normalizeAvatarInput(image: string | AvatarUploadInput): AvatarUploadInput {
  return typeof image === 'string' ? { uri: image } : image;
}

function inferFileExt(uri: string, mimeType?: string | null): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  const uriParts = uri.split('.');
  const ext = (uriParts.pop()?.toLowerCase() ?? 'jpg').split('?')[0];
  if (ext === 'jpeg' || ext === 'jpg' || ext === 'png' || ext === 'webp') return ext;
  return 'jpg';
}

function validateAvatarUpload(input: AvatarUploadInput) {
  const mime = input.mimeType ?? '';
  if (mime && !ALLOWED_AVATAR_MIME.has(mime)) {
    throw new Error('Only JPG, PNG, or WEBP images are allowed for profile photos.');
  }

  if (typeof input.fileSize === 'number' && input.fileSize > MAX_AVATAR_BYTES) {
    throw new Error('Profile photos must be smaller than 3MB.');
  }

  if (
    typeof input.width === 'number' &&
    typeof input.height === 'number' &&
    (input.width < MIN_AVATAR_DIMENSION || input.height < MIN_AVATAR_DIMENSION)
  ) {
    throw new Error('Profile photos are too small. Please choose an image at least 96x96.');
  }

  if (input.fileName && BANNED_FILE_NAME_HINTS.test(input.fileName)) {
    throw new Error('That image file appears to violate avatar rules. Please choose a different photo.');
  }
}

async function enforceAvatarModeration(publicUrl: string, filePath: string) {
  // Strong mode: no moderation backend configured => disallow photo avatars.
  if (!AVATAR_MODERATION_FUNCTION) {
    if (!ALLOW_UNMODERATED_AVATARS) {
      await supabase.storage.from('avatars').remove([filePath]);
      throw new Error('Photo avatars are disabled until moderation is configured. Please use an emoji avatar.');
    }
    return;
  }

  const { data, error } = await supabase.functions.invoke(AVATAR_MODERATION_FUNCTION, {
    body: { imageUrl: publicUrl },
  });

  if (error) {
    await supabase.storage.from('avatars').remove([filePath]);
    throw new Error('Could not verify avatar safety. Please try again later.');
  }

  const isSafe = data?.safe === true || data?.allowed === true;
  if (!isSafe) {
    await supabase.storage.from('avatars').remove([filePath]);
    const reason = typeof data?.reason === 'string' ? data.reason : 'inappropriate content detected';
    throw new Error(`Avatar rejected: ${reason}.`);
  }
}

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
  uploadAvatar: (image: string | AvatarUploadInput) => Promise<void>;

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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        initialized: false,
      });

      // Scope local persisted stores to the active account.
      await useGameStore.getState().setStorageUser(session?.user?.id ?? null);
      await useSettingsStore.getState().setStorageUser(session?.user?.id ?? null);

      set({ initialized: true });

      // If there's a logged-in user, load their profile (non-blocking)
      if (session?.user) {
        get().fetchProfile().catch(() => {});
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const prevUserId = get().user?.id ?? null;
        const nextUserId = session?.user?.id ?? null;

        if (prevUserId !== nextUserId) {
          await useGameStore.getState().setStorageUser(nextUserId);
          await useSettingsStore.getState().setStorageUser(nextUserId);
        }

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

  uploadAvatar: async (image: string | AvatarUploadInput) => {
    const user = get().user;
    if (!user) throw new Error('Not logged in');

    set({ loading: true });

    try {
      const input = normalizeAvatarInput(image);
      validateAvatarUpload(input);

      const fileExt = inferFileExt(input.uri, input.mimeType);
      const mimeType =
        input.mimeType ?? (fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg');
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Read the file as ArrayBuffer (works reliably in React Native)
      const response = await fetch(input.uri);
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

      // Enforce NSFW policy through moderation backend (or strict disable mode).
      await enforceAvatarModeration(publicUrl, filePath);

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

    // Supabase can return a "fake success" for already-registered emails.
    // In that case, identities is empty and no new account is created.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      set({ loading: false });
      return { error: 'This email is already registered. Please sign in instead.' };
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
