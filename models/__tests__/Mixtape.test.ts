/**
 * Basic tests for Mixtape model types
 */

import type { AudioSource, EnvelopeCustomization, Mixtape, TapeTheme, Track } from '../Mixtape';

describe('Mixtape Models', () => {
  describe('AudioSource', () => {
    it('should create a local audio source', () => {
      const source: AudioSource = {
        type: 'local',
        uri: 'file://path/to/audio.mp3',
      };
      
      expect(source.type).toBe('local');
      expect(source.uri).toBe('file://path/to/audio.mp3');
    });

    it('should create a URL audio source with metadata', () => {
      const source: AudioSource = {
        type: 'url',
        uri: 'https://example.com/audio.mp3',
        metadata: {
          provider: 'direct',
        },
      };
      
      expect(source.type).toBe('url');
      expect(source.metadata?.provider).toBe('direct');
    });
  });

  describe('Track', () => {
    it('should create a track with required fields', () => {
      const track: Track = {
        id: 'track-1',
        title: 'Test Song',
        duration: 180,
        source: {
          type: 'local',
          uri: 'file://test.mp3',
        },
      };
      
      expect(track.id).toBe('track-1');
      expect(track.title).toBe('Test Song');
      expect(track.duration).toBe(180);
    });

    it('should create a track with optional artist', () => {
      const track: Track = {
        id: 'track-2',
        title: 'Another Song',
        artist: 'Test Artist',
        duration: 240,
        source: {
          type: 'local',
          uri: 'file://test2.mp3',
        },
      };
      
      expect(track.artist).toBe('Test Artist');
    });
  });

  describe('TapeTheme', () => {
    it('should create a theme with preset', () => {
      const theme: TapeTheme = {
        preset: 'vhs-static-grey',
      };
      
      expect(theme.preset).toBe('vhs-static-grey');
    });

    it('should create a theme with customizations', () => {
      const theme: TapeTheme = {
        preset: 'pumpkin-orange',
        pattern: 'retro-lines',
        texture: 'crt-scan',
        overlay: 'vhs-static',
      };
      
      expect(theme.pattern).toBe('retro-lines');
      expect(theme.texture).toBe('crt-scan');
      expect(theme.overlay).toBe('vhs-static');
    });
  });

  describe('EnvelopeCustomization', () => {
    it('should create envelope with color', () => {
      const envelope: EnvelopeCustomization = {
        color: '#FFE4B5',
      };
      
      expect(envelope.color).toBe('#FFE4B5');
    });

    it('should create envelope with sigil', () => {
      const envelope: EnvelopeCustomization = {
        color: '#FFE4B5',
        sigil: 'moon-stars',
      };
      
      expect(envelope.sigil).toBe('moon-stars');
    });
  });

  describe('Mixtape', () => {
    it('should create a complete mixtape', () => {
      const mixtape: Mixtape = {
        id: 'mixtape-1',
        title: 'Summer Vibes',
        note: 'For the road trip',
        sideA: [
          {
            id: 'track-1',
            title: 'Song 1',
            duration: 180,
            source: { type: 'local', uri: 'file://song1.mp3' },
          },
        ],
        sideB: [],
        theme: {
          preset: 'pumpkin-orange',
        },
        envelope: {
          color: '#FFE4B5',
        },
        createdAt: new Date('2025-11-27'),
        updatedAt: new Date('2025-11-27'),
      };
      
      expect(mixtape.id).toBe('mixtape-1');
      expect(mixtape.title).toBe('Summer Vibes');
      expect(mixtape.sideA).toHaveLength(1);
      expect(mixtape.sideB).toHaveLength(0);
    });
  });
});
