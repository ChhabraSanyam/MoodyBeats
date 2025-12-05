/**
 * Tests for GlitchController service
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { GlitchMode } from '../../models/PlaybackState';
import { GlitchController } from '../GlitchController';

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setPositionAsync: jest.fn(),
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
        status: { isLoaded: true },
      }),
    },
  },
}));

describe('GlitchController', () => {
  let controller: GlitchController;

  beforeEach(() => {
    controller = new GlitchController();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await controller.cleanup();
  });

  describe('Button Mashing Detection', () => {
    it('should trigger glitch after rapid button presses', (done) => {
      // Requirements: 11.1
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(glitchMode).toBeDefined();
        expect(glitchMode.type).toMatch(/crt-scanline|phosphor-green|ui-shake|tape-jitter/);
        expect(glitchMode.duration).toBe(3000);
        unsubscribe();
        done();
      });

      // Simulate rapid button mashing (5 presses within 2 seconds)
      controller.recordButtonPress('play');
      controller.recordButtonPress('pause');
      controller.recordButtonPress('play');
      controller.recordButtonPress('pause');
      controller.recordButtonPress('play');
    });

    it('should not trigger glitch with slow button presses', (done) => {
      let glitchTriggered = false;

      const unsubscribe = controller.onGlitchTrigger(() => {
        glitchTriggered = true;
      });

      // Simulate slow button presses
      controller.recordButtonPress('play');
      
      setTimeout(() => {
        controller.recordButtonPress('pause');
      }, 600);

      setTimeout(() => {
        controller.recordButtonPress('play');
      }, 1200);

      setTimeout(() => {
        expect(glitchTriggered).toBe(false);
        unsubscribe();
        done();
      }, 1500);
    });
  });

  describe('FF/REW Sequence Detection', () => {
    it('should trigger glitch after repeated FF/REW alternations', (done) => {
      // Requirements: 11.2
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(glitchMode).toBeDefined();
        expect(glitchMode.audioJumpscare).toBeDefined();
        unsubscribe();
        done();
      });

      // Simulate alternating FF/REW pattern
      controller.recordFFREWAction('ff');
      controller.recordFFREWAction('rew');
      controller.recordFFREWAction('ff');
      controller.recordFFREWAction('rew');
    });

    it('should not trigger glitch with non-alternating FF/REW', (done) => {
      let glitchTriggered = false;

      const unsubscribe = controller.onGlitchTrigger(() => {
        glitchTriggered = true;
      });

      // Simulate non-alternating pattern
      controller.recordFFREWAction('ff');
      controller.recordFFREWAction('ff');
      controller.recordFFREWAction('ff');

      setTimeout(() => {
        expect(glitchTriggered).toBe(false);
        unsubscribe();
        done();
      }, 100);
    });
  });

  describe('Extreme Overheat Detection', () => {
    it('should trigger glitch at extreme overheat level', (done) => {
      // Requirements: 11.3
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(glitchMode).toBeDefined();
        unsubscribe();
        done();
      });

      // Check with extreme overheat level (>= 95)
      controller.checkOverheatLevel(95);
    });

    it('should not trigger glitch below extreme overheat threshold', (done) => {
      let glitchTriggered = false;

      const unsubscribe = controller.onGlitchTrigger(() => {
        glitchTriggered = true;
      });

      // Check with high but not extreme overheat level
      controller.checkOverheatLevel(90);

      setTimeout(() => {
        expect(glitchTriggered).toBe(false);
        unsubscribe();
        done();
      }, 100);
    });
  });

  describe('Visual Effects', () => {
    it('should select one of the available visual effects', (done) => {
      // Requirements: 11.4
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(['crt-scanline', 'phosphor-green', 'ui-shake', 'tape-jitter']).toContain(
          glitchMode.type
        );
        unsubscribe();
        done();
      });

      // Trigger glitch
      controller.checkOverheatLevel(95);
    });
  });

  describe('Audio Jumpscares', () => {
    it('should include a jumpscare sound in glitch mode', (done) => {
      // Requirements: 11.5
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(glitchMode.audioJumpscare).toBeDefined();
        expect(typeof glitchMode.audioJumpscare).toBe('string');
        unsubscribe();
        done();
      });

      // Trigger glitch
      controller.checkOverheatLevel(95);
    });
  });

  describe('Glitch Cooldown', () => {
    it('should not trigger multiple glitches within cooldown period', (done) => {
      let glitchCount = 0;

      const unsubscribe = controller.onGlitchTrigger(() => {
        glitchCount++;
      });

      // Trigger first glitch
      controller.checkOverheatLevel(95);

      // Try to trigger second glitch immediately
      setTimeout(() => {
        controller.checkOverheatLevel(95);
      }, 100);

      // Check that only one glitch was triggered
      setTimeout(() => {
        expect(glitchCount).toBe(1);
        unsubscribe();
        done();
      }, 500);
    });
  });

  describe('Glitch Duration', () => {
    it('should set correct duration for glitch mode', (done) => {
      const unsubscribe = controller.onGlitchTrigger((glitchMode) => {
        expect(glitchMode.duration).toBe(3000);
        expect(glitchMode.startTime).toBeLessThanOrEqual(Date.now());
        unsubscribe();
        done();
      });

      controller.checkOverheatLevel(95);
    });
  });

  describe('Glitch Active Check', () => {
    it('should correctly identify active glitch', () => {
      const glitchMode: GlitchMode = {
        type: 'crt-scanline',
        audioJumpscare: 'jumpscare-1',
        startTime: Date.now(),
        duration: 3000,
      };

      expect(controller.isGlitchActive(glitchMode)).toBe(true);
    });

    it('should correctly identify expired glitch', () => {
      const glitchMode: GlitchMode = {
        type: 'crt-scanline',
        audioJumpscare: 'jumpscare-1',
        startTime: Date.now() - 5000, // 5 seconds ago
        duration: 3000,
      };

      expect(controller.isGlitchActive(glitchMode)).toBe(false);
    });

    it('should return false for null glitch mode', () => {
      expect(controller.isGlitchActive(null)).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should clear all tracking state', () => {
      // Record some actions
      controller.recordButtonPress('play');
      controller.recordButtonPress('pause');
      controller.recordFFREWAction('ff');

      // Reset
      controller.reset();

      // Try to trigger glitch - should not work since history is cleared
      let glitchTriggered = false;
      const unsubscribe = controller.onGlitchTrigger(() => {
        glitchTriggered = true;
      });

      controller.recordButtonPress('play');
      controller.recordButtonPress('pause');

      setTimeout(() => {
        expect(glitchTriggered).toBe(false);
        unsubscribe();
      }, 100);
    });
  });
});
