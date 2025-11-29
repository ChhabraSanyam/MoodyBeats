/**
 * Basic tests for PlaybackState model types
 */

import type { GlitchMode, PlaybackState } from '../PlaybackState';

describe('PlaybackState Models', () => {
  describe('GlitchMode', () => {
    it('should create a glitch mode with required fields', () => {
      const glitch: GlitchMode = {
        type: 'crt-scanline',
        startTime: Date.now(),
        duration: 2000,
      };
      
      expect(glitch.type).toBe('crt-scanline');
      expect(glitch.duration).toBe(2000);
    });

    it('should create a glitch mode with audio jumpscare', () => {
      const glitch: GlitchMode = {
        type: 'phosphor-green',
        audioJumpscare: 'spooky-sound-1.mp3',
        startTime: Date.now(),
        duration: 3000,
      };
      
      expect(glitch.audioJumpscare).toBe('spooky-sound-1.mp3');
    });
  });

  describe('PlaybackState', () => {
    it('should create a playback state with all fields', () => {
      const state: PlaybackState = {
        mixtapeId: 'mixtape-1',
        currentSide: 'A',
        currentTrackIndex: 0,
        position: 45,
        duration: 180,
        isPlaying: true,
        isFastForwarding: false,
        isRewinding: false,
        overheatLevel: 0,
        isOverheated: false,
        glitchMode: null,
      };
      
      expect(state.mixtapeId).toBe('mixtape-1');
      expect(state.currentSide).toBe('A');
      expect(state.isPlaying).toBe(true);
      expect(state.glitchMode).toBeNull();
    });

    it('should create a playback state with glitch mode active', () => {
      const glitch: GlitchMode = {
        type: 'ui-shake',
        startTime: Date.now(),
        duration: 1500,
      };
      
      const state: PlaybackState = {
        mixtapeId: 'mixtape-2',
        currentSide: 'B',
        currentTrackIndex: 3,
        position: 120,
        duration: 240,
        isPlaying: true,
        isFastForwarding: false,
        isRewinding: false,
        overheatLevel: 85,
        isOverheated: false,
        glitchMode: glitch,
      };
      
      expect(state.glitchMode).not.toBeNull();
      expect(state.glitchMode?.type).toBe('ui-shake');
      expect(state.overheatLevel).toBe(85);
    });

    it('should create an overheated playback state', () => {
      const state: PlaybackState = {
        mixtapeId: 'mixtape-3',
        currentSide: 'A',
        currentTrackIndex: 1,
        position: 60,
        duration: 200,
        isPlaying: false,
        isFastForwarding: false,
        isRewinding: false,
        overheatLevel: 100,
        isOverheated: true,
        glitchMode: null,
      };
      
      expect(state.isOverheated).toBe(true);
      expect(state.overheatLevel).toBe(100);
      expect(state.isFastForwarding).toBe(false);
      expect(state.isRewinding).toBe(false);
    });
  });
});
