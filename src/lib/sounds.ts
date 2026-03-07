import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/useSettingsStore';

// ─── Types ──────────────────────────────────────────────
type SoundName = 'tap' | 'coin' | 'upgrade' | 'prestige' | 'poop';

// ─── Player pool ────────────────────────────────────────
const soundPool: Map<SoundName, AudioPlayer> = new Map();
let bgMusic: AudioPlayer | null = null;
let audioInitialized = false;

// ─── Asset mapping ──────────────────────────────────────
const SOUND_ASSETS: Record<SoundName, any> = {
  tap: require('../../assets/sounds/tap.mp3'),
  coin: require('../../assets/sounds/coin.wav'),
  upgrade: require('../../assets/sounds/upgrade.mp3'),
  prestige: require('../../assets/sounds/prestige.mp3'),
  poop: require('../../assets/sounds/poop.wav'),
};

const MUSIC_ASSET: any = null;

// ─── Init ───────────────────────────────────────────────
export async function initAudio() {
  if (audioInitialized) return;
  audioInitialized = true;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });
  } catch {
    // Silently fail in environments without audio support
  }

  // Pre-load all SFX players
  for (const [name, asset] of Object.entries(SOUND_ASSETS) as [SoundName, any][]) {
    if (!asset) continue;
    try {
      const player = createAudioPlayer(asset);
      soundPool.set(name, player);
    } catch {
      // skip this sound
    }
  }
}

// ─── Play SFX ───────────────────────────────────────────
export async function playSfx(name: SoundName) {
  const settings = useSettingsStore.getState();
  if (settings.muted) return;

  const volume = settings.masterVolume * settings.sfxVolume;
  if (volume <= 0) return;

  const player = soundPool.get(name);
  if (!player) return;

  try {
    player.volume = Math.min(volume, 1);
    await player.seekTo(0);
    player.play();
  } catch {
    // sound playback failed
  }
}

// ─── Background Music ───────────────────────────────────
export function startMusic() {
  const settings = useSettingsStore.getState();
  if (settings.muted || !MUSIC_ASSET) return;

  try {
    if (!bgMusic) {
      bgMusic = createAudioPlayer(MUSIC_ASSET);
      bgMusic.loop = true;
      bgMusic.volume = settings.masterVolume * settings.musicVolume;
      bgMusic.play();
    } else {
      bgMusic.volume = settings.masterVolume * settings.musicVolume;
      bgMusic.play();
    }
  } catch {
    // no music asset or playback failed
  }
}

export function stopMusic() {
  try {
    if (bgMusic) {
      bgMusic.pause();
    }
  } catch {
    // silent
  }
}

export function updateMusicVolume() {
  const settings = useSettingsStore.getState();
  if (!bgMusic) return;
  try {
    const vol = settings.muted ? 0 : settings.masterVolume * settings.musicVolume;
    bgMusic.volume = Math.min(vol, 1);
  } catch {
    // silent
  }
}

// ─── Cleanup ────────────────────────────────────────────
export function cleanupAudio() {
  for (const player of soundPool.values()) {
    try { player.remove(); } catch {}
  }
  soundPool.clear();
  try {
    if (bgMusic) {
      bgMusic.remove();
      bgMusic = null;
    }
  } catch {}
}
