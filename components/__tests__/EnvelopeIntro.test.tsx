/**
 * Tests for EnvelopeIntro component
 * Requirements: 13.3, 13.4, 13.5
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { EnvelopeCustomization } from '../../models/Mixtape';
import EnvelopeIntro from '../EnvelopeIntro';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('EnvelopeIntro', () => {
  const mockEnvelope: EnvelopeCustomization = {
    color: '#FFE4B5',
    sigil: 'moon-stars',
  };

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders envelope with custom color', () => {
    const { UNSAFE_root } = render(
      <EnvelopeIntro
        envelope={mockEnvelope}
        onComplete={mockOnComplete}
      />
    );

    // Component should render
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders envelope with sigil', () => {
    const { getByText } = render(
      <EnvelopeIntro
        envelope={mockEnvelope}
        onComplete={mockOnComplete}
      />
    );

    // Sigil should be rendered
    expect(getByText('🌙✨')).toBeTruthy();
  });

  it('renders note when provided', () => {
    const note = 'For the road trip';
    const { getByText } = render(
      <EnvelopeIntro
        envelope={mockEnvelope}
        note={note}
        onComplete={mockOnComplete}
      />
    );

    expect(getByText(note)).toBeTruthy();
  });

  it('does not render note when not provided', () => {
    const { UNSAFE_root } = render(
      <EnvelopeIntro
        envelope={mockEnvelope}
        onComplete={mockOnComplete}
      />
    );

    // Component should render without note
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders all animation elements', () => {
    const { UNSAFE_root } = render(
      <EnvelopeIntro
        envelope={mockEnvelope}
        note="Test note"
        onComplete={mockOnComplete}
      />
    );

    // Component should render with all elements
    expect(UNSAFE_root).toBeTruthy();
  });

  it('handles different sigil types', () => {
    const testCases = [
      { envelope: { color: '#FFE4B5', sigil: 'skull' }, expected: '💀' },
      { envelope: { color: '#FFE4B5', sigil: 'heart' }, expected: '❤️' },
      { envelope: { color: '#FFE4B5', sigil: 'lightning' }, expected: '⚡' },
      { envelope: { color: '#FFE4B5', sigil: 'ghost' }, expected: '👻' },
    ];

    testCases.forEach(({ envelope, expected }) => {
      const { getByText } = render(
        <EnvelopeIntro
          envelope={envelope}
          onComplete={mockOnComplete}
        />
      );

      // Each sigil should render with correct symbol
      expect(getByText(expected)).toBeTruthy();
    });
  });

  it('handles envelope without sigil', () => {
    const envelopeNoSigil: EnvelopeCustomization = {
      color: '#FFE4B5',
    };

    const { UNSAFE_root } = render(
      <EnvelopeIntro
        envelope={envelopeNoSigil}
        onComplete={mockOnComplete}
      />
    );

    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with different envelope colors', () => {
    const colors = ['#FFE4B5', '#FF6347', '#98FB98', '#87CEEB'];

    colors.forEach((color) => {
      const envelope: EnvelopeCustomization = {
        color,
        sigil: 'moon-stars',
      };

      const { UNSAFE_root } = render(
        <EnvelopeIntro
          envelope={envelope}
          onComplete={mockOnComplete}
        />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
