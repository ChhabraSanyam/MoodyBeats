/**
 * Playback state models for MoodyBeats
 * Requirements: 6.1, 6.2, 7.1, 9.1, 11.1
 */

export interface GlitchMode {
  type: 'crt-scanline' | 'phosphor-green' | 'ui-shake' | 'tape-jitter';
  audioJumpscare?: string;
  startTime: number;
  duration: number;
}

export interface PlaybackState {
  mixtapeId: string;
  currentSide: 'A' | 'B';
  currentTrackIndex: number;
  position: number;
  duration: number;
  isPlaying: boolean;
  isFastForwarding: boolean;
  isRewinding: boolean;
  overheatLevel: number;
  isOverheated: boolean;
  glitchMode: GlitchMode | null;
}
