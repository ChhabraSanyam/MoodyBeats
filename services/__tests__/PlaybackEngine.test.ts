/**
 * Unit tests for PlaybackEngine service
 * Requirements: 6.1, 6.2
 */

// Mock GlitchController BEFORE imports
jest.mock('../GlitchController', () => ({
  GlitchController: jest.fn().mockImplementation(() => ({
    recordButtonPress: jest.fn(),
    recordFFREWAction: jest.fn(),
    checkOverheatLevel: jest.fn(),
    onGlitchTrigger: jest.fn(() => jest.fn()),
    isGlitchActive: jest.fn(() => false),
    clearExpiredGlitch: jest.fn((glitch) => glitch),
    cleanup: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
  })),
}));

// Mock Expo Audio
const mockAudioPlayer = jest.fn().mockImplementation(() => ({
  load: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  getCurrentStatus: jest.fn().mockResolvedValue({
    isLoaded: true,
    duration: 180,
    currentTime: 0,
    isPlaying: false,
  }),
  addListener: jest.fn(),
  setPlaybackRate: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: mockAudioPlayer,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

import { Mixtape } from '../../models';
import { PlaybackEngine } from '../PlaybackEngine';

describe('PlaybackEngine', () => {
  let engine: PlaybackEngine;
  let mockSound: any;
  let mockMixtape: Mixtape;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock sound object
    mockSound = {
      load: jest.fn().mockResolvedValue(undefined),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      seekTo: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      getCurrentStatus: jest.fn().mockResolvedValue({
        isLoaded: true,
        duration: 180,
        currentTime: 0,
        isPlaying: false,
      }),
      addListener: jest.fn(),
      setPlaybackRate: jest.fn().mockResolvedValue(undefined),
    };

    // Mock createAudioPlayer to return our mock sound
    mockAudioPlayer.mockImplementation(() => mockSound);

    // Create test mixtape
    mockMixtape = {
      id: 'test-mixtape-1',
      title: 'Test Mixtape',
      note: 'Test note',
      sideA: [
        {
          id: 'track-1',
          title: 'Track 1',
          duration: 180000,
          source: { type: 'local', uri: 'file://track1.mp3' },
        },
        {
          id: 'track-2',
          title: 'Track 2',
          duration: 200000,
          source: { type: 'local', uri: 'file://track2.mp3' },
        },
      ],
      sideB: [
        {
          id: 'track-3',
          title: 'Track 3',
          duration: 150000,
          source: { type: 'local', uri: 'file://track3.mp3' },
        },
      ],
      theme: {
        preset: 'vhs-static-grey',
      },
      envelope: {
        color: '#FFE4B5',
      },
      createdAt: new Date('2025-11-27'),
      updatedAt: new Date('2025-11-27'),
    };

    engine = new PlaybackEngine();
  });

  afterEach(async () => {
    if (engine) {
      await engine.cleanup();
    }
  });

  describe('Initialization', () => {
    it('should create engine with initial state', () => {
      const state = engine.getCurrentState();
      
      expect(state.mixtapeId).toBe('');
      expect(state.currentSide).toBe('A');
      expect(state.currentTrackIndex).toBe(0);
      expect(state.position).toBe(0);
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('load()', () => {
    it('should load a mixtape and set initial state', async () => {
      await engine.load(mockMixtape);
      
      const state = engine.getCurrentState();
      expect(state.mixtapeId).toBe('test-mixtape-1');
      expect(state.currentSide).toBe('A');
      expect(state.currentTrackIndex).toBe(0);
      expect(mockAudioPlayer).toHaveBeenCalledWith(
        { uri: 'file://track1.mp3' },
        { shouldPlay: false },
        expect.any(Function)
      );
    });

    it('should unload previous sound when loading new mixtape', async () => {
      await engine.load(mockMixtape);
      const firstUnloadCall = mockSound.unloadAsync;
      
      await engine.load(mockMixtape);
      
      expect(firstUnloadCall).toHaveBeenCalled();
    });

    it('should handle empty mixtape sides', async () => {
      const emptyMixtape: Mixtape = {
        ...mockMixtape,
        sideA: [],
        sideB: [],
      };
      
      await engine.load(emptyMixtape);
      
      const state = engine.getCurrentState();
      expect(state.mixtapeId).toBe('test-mixtape-1');
      expect(mockAudioPlayer).not.toHaveBeenCalled();
    });
  });

  describe('play()', () => {
    it('should start playback and update state', async () => {
      await engine.load(mockMixtape);
      await engine.play();
      
      expect(mockSound.playAsync).toHaveBeenCalled();
      const state = engine.getCurrentState();
      expect(state.isPlaying).toBe(true);
    });

    it('should do nothing if no sound is loaded', async () => {
      await engine.play();
      
      expect(mockSound.playAsync).not.toHaveBeenCalled();
    });
  });

  describe('pause()', () => {
    it('should pause playback and update state', async () => {
      await engine.load(mockMixtape);
      await engine.play();
      
      await engine.pause();
      
      expect(mockSound.pauseAsync).toHaveBeenCalled();
    });

    it('should do nothing if no sound is loaded', async () => {
      await engine.pause();
      
      expect(mockSound.pauseAsync).not.toHaveBeenCalled();
    });
  });

  describe('fastForward()', () => {
    beforeEach(() => {
      mockSound.setRateAsync = jest.fn().mockResolvedValue(undefined);
    });

    it('should enable fast forward and increase playback rate', async () => {
      await engine.load(mockMixtape);
      await engine.play();
      
      await engine.fastForward();
      
      const state = engine.getCurrentState();
      expect(state.isFastForwarding).toBe(true);
      // Should use pitch shift (false) for authentic tape effect
      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, false);
    });

    it('should start playback if not already playing', async () => {
      await engine.load(mockMixtape);
      
      await engine.fastForward();
      
      expect(mockSound.playAsync).toHaveBeenCalled();
      const state = engine.getCurrentState();
      expect(state.isPlaying).toBe(true);
    });

    it('should do nothing if no sound is loaded', async () => {
      await engine.fastForward();
      
      expect(mockSound.setRateAsync).not.toHaveBeenCalled();
    });

    it('should stop rewinding when fast forwarding', async () => {
      await engine.load(mockMixtape);
      await engine.rewind();
      
      await engine.fastForward();
      
      const state = engine.getCurrentState();
      expect(state.isRewinding).toBe(false);
      expect(state.isFastForwarding).toBe(true);
    });
  });

  describe('rewind()', () => {
    it('should enable rewind', async () => {
      await engine.load(mockMixtape);
      await engine.play();
      
      await engine.rewind();
      
      const state = engine.getCurrentState();
      expect(state.isRewinding).toBe(true);
    });

    it('should do nothing if no sound is loaded', async () => {
      await engine.rewind();
      
      const state = engine.getCurrentState();
      expect(state.isRewinding).toBe(false);
    });

    it('should stop fast forwarding when rewinding', async () => {
      mockSound.setRateAsync = jest.fn().mockResolvedValue(undefined);
      await engine.load(mockMixtape);
      await engine.fastForward();
      
      await engine.rewind();
      
      const state = engine.getCurrentState();
      expect(state.isFastForwarding).toBe(false);
      expect(state.isRewinding).toBe(true);
    });
  });

  describe('flipSide()', () => {
    it('should switch from side A to side B', async () => {
      await engine.load(mockMixtape);
      
      await engine.flipSide();
      
      const state = engine.getCurrentState();
      expect(state.currentSide).toBe('B');
      expect(state.currentTrackIndex).toBe(0);
      expect(state.position).toBe(0);
      expect(mockAudioPlayer).toHaveBeenCalledWith(
        { uri: 'file://track3.mp3' },
        { shouldPlay: false },
        expect.any(Function)
      );
    });

    it('should switch from side B to side A', async () => {
      await engine.load(mockMixtape);
      await engine.flipSide(); // Go to B
      
      await engine.flipSide(); // Go back to A
      
      const state = engine.getCurrentState();
      expect(state.currentSide).toBe('A');
      expect(state.currentTrackIndex).toBe(0);
    });

    it('should pause playback when flipping', async () => {
      await engine.load(mockMixtape);
      await engine.play();
      
      await engine.flipSide();
      
      expect(mockSound.pauseAsync).toHaveBeenCalled();
      const state = engine.getCurrentState();
      expect(state.isPlaying).toBe(false);
    });

    it('should stop fast forward when flipping', async () => {
      mockSound.setRateAsync = jest.fn().mockResolvedValue(undefined);
      await engine.load(mockMixtape);
      await engine.fastForward();
      
      await engine.flipSide();
      
      const state = engine.getCurrentState();
      expect(state.isFastForwarding).toBe(false);
    });

    it('should stop rewind when flipping', async () => {
      await engine.load(mockMixtape);
      await engine.rewind();
      
      await engine.flipSide();
      
      const state = engine.getCurrentState();
      expect(state.isRewinding).toBe(false);
    });
  });

  describe('isAtEndOfSide()', () => {
    it('should return true when at end of side', async () => {
      await engine.load(mockMixtape);
      
      // Manually set state to end of side
      const state = engine.getCurrentState();
      (engine as any).state.currentTrackIndex = mockMixtape.sideA.length - 1;
      (engine as any).state.position = state.duration;
      
      expect(engine.isAtEndOfSide()).toBe(true);
    });

    it('should return false when not at end of side', async () => {
      await engine.load(mockMixtape);
      
      expect(engine.isAtEndOfSide()).toBe(false);
    });
  });

  describe('getOppositeSide()', () => {
    it('should return B when on side A', async () => {
      await engine.load(mockMixtape);
      
      expect(engine.getOppositeSide()).toBe('B');
    });

    it('should return A when on side B', async () => {
      await engine.load(mockMixtape);
      await engine.flipSide();
      
      expect(engine.getOppositeSide()).toBe('A');
    });
  });

  describe('seekTo()', () => {
    it('should seek to specified position', async () => {
      await engine.load(mockMixtape);
      
      await engine.seekTo(50000);
      
      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(50000);
    });

    it('should do nothing if no sound is loaded', async () => {
      await engine.seekTo(50000);
      
      expect(mockSound.setPositionAsync).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentState()', () => {
    it('should return a copy of the current state', async () => {
      await engine.load(mockMixtape);
      
      const state1 = engine.getCurrentState();
      const state2 = engine.getCurrentState();
      
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different objects
    });
  });

  describe('onStateChange()', () => {
    it('should register callback and receive state updates', async () => {
      const callback = jest.fn();
      
      engine.onStateChange(callback);
      await engine.load(mockMixtape);
      
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0]).toHaveProperty('mixtapeId', 'test-mixtape-1');
    });

    it('should return unsubscribe function', async () => {
      const callback = jest.fn();
      
      const unsubscribe = engine.onStateChange(callback);
      await engine.load(mockMixtape);
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      callback.mockClear();
      unsubscribe();
      
      await engine.play();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      engine.onStateChange(callback1);
      engine.onStateChange(callback2);
      
      await engine.load(mockMixtape);
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();
      
      engine.onStateChange(errorCallback);
      engine.onStateChange(normalCallback);
      
      await engine.load(mockMixtape);
      
      // Both callbacks should be called despite error
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('cleanup()', () => {
    it('should unload sound and clear state', async () => {
      await engine.load(mockMixtape);
      
      await engine.cleanup();
      
      expect(mockSound.unloadAsync).toHaveBeenCalled();
      const state = engine.getCurrentState();
      expect(state.mixtapeId).toBe('');
    });

    it('should clear all callbacks', async () => {
      const callback = jest.fn();
      engine.onStateChange(callback);
      
      await engine.cleanup();
      await engine.load(mockMixtape);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Overheat Mechanic', () => {
    beforeEach(() => {
      mockSound.setRateAsync = jest.fn().mockResolvedValue(undefined);
    });

    it('should increment overheat level when fast forwarding', async () => {
      await engine.load(mockMixtape);
      
      const initialState = engine.getCurrentState();
      expect(initialState.overheatLevel).toBe(0);
      
      await engine.fastForward();
      
      const state = engine.getCurrentState();
      expect(state.overheatLevel).toBeGreaterThan(0);
    });

    it('should increment overheat level when rewinding', async () => {
      await engine.load(mockMixtape);
      
      const initialState = engine.getCurrentState();
      expect(initialState.overheatLevel).toBe(0);
      
      await engine.rewind();
      
      const state = engine.getCurrentState();
      expect(state.overheatLevel).toBeGreaterThan(0);
    });

    it('should trigger overheat state when meter reaches maximum', async () => {
      await engine.load(mockMixtape);
      
      // Fast forward multiple times to reach overheat
      for (let i = 0; i < 10; i++) {
        await engine.fastForward();
        await engine.pause();
      }
      
      const state = engine.getCurrentState();
      expect(state.isOverheated).toBe(true);
      expect(state.overheatLevel).toBe(100);
    });

    it('should disable FF when overheated', async () => {
      await engine.load(mockMixtape);
      
      // Trigger overheat
      for (let i = 0; i < 10; i++) {
        await engine.fastForward();
        await engine.pause();
      }
      
      expect(engine.getCurrentState().isOverheated).toBe(true);
      
      // Try to fast forward again
      mockSound.setRateAsync.mockClear();
      await engine.fastForward();
      
      // Should not call setRateAsync because overheated
      expect(mockSound.setRateAsync).not.toHaveBeenCalled();
    });

    it('should disable REW when overheated', async () => {
      await engine.load(mockMixtape);
      
      // Trigger overheat
      for (let i = 0; i < 10; i++) {
        await engine.rewind();
        await engine.pause();
      }
      
      expect(engine.getCurrentState().isOverheated).toBe(true);
      
      // Try to rewind again
      const stateBefore = engine.getCurrentState();
      await engine.rewind();
      
      // Should not enable rewinding because overheated
      const stateAfter = engine.getCurrentState();
      expect(stateAfter.isRewinding).toBe(false);
    });

    it('should reset overheat after cooldown period', async () => {
      jest.useFakeTimers();
      // Create new engine after setting up fake timers
      const testEngine = new PlaybackEngine();
      
      await testEngine.load(mockMixtape);
      
      // Trigger overheat
      for (let i = 0; i < 10; i++) {
        await testEngine.fastForward();
        await testEngine.pause();
      }
      
      expect(testEngine.getCurrentState().isOverheated).toBe(true);
      
      // Fast forward time by cooldown duration (5 seconds)
      jest.advanceTimersByTime(5000);
      
      const state = testEngine.getCurrentState();
      expect(state.isOverheated).toBe(false);
      expect(state.overheatLevel).toBe(0);
      
      await testEngine.cleanup();
      jest.useRealTimers();
    });

    it('should gradually decay overheat meter over time', async () => {
      jest.useFakeTimers();
      // Create new engine after setting up fake timers
      const testEngine = new PlaybackEngine();
      
      await testEngine.load(mockMixtape);
      
      // Increment overheat a bit
      await testEngine.fastForward();
      await testEngine.pause();
      
      const initialLevel = testEngine.getCurrentState().overheatLevel;
      expect(initialLevel).toBeGreaterThan(0);
      expect(initialLevel).toBe(15); // OVERHEAT_INCREMENT = 15
      
      // Advance time by 1 second intervals to trigger decay
      jest.advanceTimersByTime(1000);
      let state = testEngine.getCurrentState();
      expect(state.overheatLevel).toBe(13); // 15 - 2 = 13
      
      jest.advanceTimersByTime(1000);
      state = testEngine.getCurrentState();
      expect(state.overheatLevel).toBe(11); // 13 - 2 = 11
      
      jest.advanceTimersByTime(1000);
      state = testEngine.getCurrentState();
      expect(state.overheatLevel).toBe(9); // 11 - 2 = 9
      
      expect(state.overheatLevel).toBeLessThan(initialLevel);
      expect(state.overheatLevel).toBeGreaterThanOrEqual(0);
      
      await testEngine.cleanup();
      jest.useRealTimers();
    });

    it('should not decay overheat meter when overheated', async () => {
      jest.useFakeTimers();
      // Create new engine after setting up fake timers
      const testEngine = new PlaybackEngine();
      
      await testEngine.load(mockMixtape);
      
      // Trigger overheat
      for (let i = 0; i < 10; i++) {
        await testEngine.fastForward();
        await testEngine.pause();
      }
      
      expect(testEngine.getCurrentState().isOverheated).toBe(true);
      expect(testEngine.getCurrentState().overheatLevel).toBe(100);
      
      // Advance time by 2 seconds (but still in cooldown)
      jest.advanceTimersByTime(2000);
      
      // Should still be at 100 because we're in cooldown
      const state = testEngine.getCurrentState();
      expect(state.overheatLevel).toBe(100);
      
      await testEngine.cleanup();
      jest.useRealTimers();
    });

    it('should clear cooldown timer on cleanup', async () => {
      jest.useFakeTimers();
      // Create new engine after setting up fake timers
      const testEngine = new PlaybackEngine();
      
      await testEngine.load(mockMixtape);
      
      // Trigger overheat
      for (let i = 0; i < 10; i++) {
        await testEngine.fastForward();
        await testEngine.pause();
      }
      
      expect(testEngine.getCurrentState().isOverheated).toBe(true);
      
      await testEngine.cleanup();
      
      // State should be reset
      const state = testEngine.getCurrentState();
      expect(state.overheatLevel).toBe(0);
      expect(state.isOverheated).toBe(false);
      
      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle track loading errors', async () => {
      (mockAudioPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load audio')
      );
      
      await engine.load(mockMixtape);
      
      // Should not throw, engine should handle error gracefully
      const state = engine.getCurrentState();
      expect(state.mixtapeId).toBe('test-mixtape-1');
    });

    it('should handle play errors', async () => {
      await engine.load(mockMixtape);
      mockSound.playAsync.mockRejectedValueOnce(new Error('Play failed'));
      
      await engine.play();
      
      // Should not throw
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle seek errors', async () => {
      await engine.load(mockMixtape);
      mockSound.setPositionAsync.mockRejectedValueOnce(new Error('Seek failed'));
      
      await engine.seekTo(50000);
      
      // Should not throw
      expect(mockSound.setPositionAsync).toHaveBeenCalled();
    });
  });
});
