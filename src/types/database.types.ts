// Types generated from the Supabase SQL schema

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number;
  total_poops: number;
  created_at: string;
}


export interface Entry {
  id: string;
  user_id: string;
  created_at: string;
  duration_seconds: number | null;
  bristol_scale: number | null; // 1-7
  description: string | null;
  fun_rating: number | null; // 1-5
}

export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_name: string;
  unlocked_at: string;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'level' | 'total_poops' | 'created_at'> & {
          level?: number;
          total_poops?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      entries: {
        Row: Entry;
        Insert: Omit<Entry, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Entry, 'id'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: Partial<Omit<Friendship, 'id'>>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, 'id' | 'unlocked_at'> & {
          id?: string;
          unlocked_at?: string;
        };
        Update: Partial<Omit<Achievement, 'id'>>;
      };
    };
  };
}
