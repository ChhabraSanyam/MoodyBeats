/**
 * Core domain models for MoodyBeats
 * Requirements: 1.1, 3.1, 4.1, 5.1
 */

export interface AudioSource {
  type: 'local' | 'url';
  uri: string;
  metadata?: {
    provider?: 'direct';
  };
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  source: AudioSource;
}

export interface TapeTheme {
  preset: 'vhs-static-grey' | 'pumpkin-orange' | 'ghostly-green';
  pattern?: string;
  texture?: string;
  overlay?: string;
}

export interface EnvelopeCustomization {
  color: string;
  sigil?: string;
}

export interface Mixtape {
  id: string;
  title: string;
  note?: string;
  sideA: Track[];
  sideB: Track[];
  theme: TapeTheme;
  envelope: EnvelopeCustomization;
  createdAt: Date;
  updatedAt: Date;
}
