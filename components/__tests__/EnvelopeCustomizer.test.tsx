/**
 * EnvelopeCustomizer Component Tests
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { EnvelopeCustomization } from '../../models';
import EnvelopeCustomizer from '../EnvelopeCustomizer';

describe('EnvelopeCustomizer', () => {
  const mockOnEnvelopeChange = jest.fn();

  const defaultEnvelope: EnvelopeCustomization = {
    color: '#FFF8DC',
    sigil: undefined,
  };

  beforeEach(() => {
    mockOnEnvelopeChange.mockClear();
  });

  // Requirements: 5.1, 5.4
  it('renders envelope preview with current customization', () => {
    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    expect(getByText('Preview')).toBeTruthy();
    expect(getByText('Color: Cream')).toBeTruthy();
  });

  // Requirements: 5.2, 5.4
  it('displays light color palette options', () => {
    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    expect(getByText('Envelope Color')).toBeTruthy();
    expect(getByText('Cream')).toBeTruthy();
    expect(getByText('Peach')).toBeTruthy();
    expect(getByText('Lavender')).toBeTruthy();
    expect(getByText('Mint')).toBeTruthy();
  });

  // Requirements: 5.2, 5.4
  it('calls onEnvelopeChange when color is selected', () => {
    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const peachOption = getByText('Peach');
    fireEvent.press(peachOption);

    expect(mockOnEnvelopeChange).toHaveBeenCalledWith({
      color: '#FFDAB9',
      sigil: undefined,
    });
  });

  // Requirements: 5.3
  it('displays preset sigil designs', () => {
    const { getByText, getAllByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    expect(getByText('Sigil Design')).toBeTruthy();
    expect(getByText('None')).toBeTruthy();
    expect(getByText('Moon & Stars')).toBeTruthy();
    expect(getByText('Skull')).toBeTruthy();
    expect(getByText('Heart')).toBeTruthy();
    // Rose appears in both color and sigil, so use getAllByText
    expect(getAllByText('Rose').length).toBeGreaterThan(0);
    expect(getByText('Ghost')).toBeTruthy();
  });

  // Requirements: 5.3, 5.4
  it('calls onEnvelopeChange when sigil is selected', () => {
    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const skullOption = getByText('Skull');
    fireEvent.press(skullOption);

    expect(mockOnEnvelopeChange).toHaveBeenCalledWith({
      color: '#FFF8DC',
      sigil: 'skull',
    });
  });

  // Requirements: 5.4
  it('updates preview when envelope changes', () => {
    const envelopeWithSigil: EnvelopeCustomization = {
      color: '#E6E6FA',
      sigil: 'moon-stars',
    };

    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={envelopeWithSigil}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    expect(getByText('Color: Lavender')).toBeTruthy();
    expect(getByText('Sigil: Moon & Stars')).toBeTruthy();
  });

  // Requirements: 5.3, 5.4
  it('clears sigil when "None" is selected', () => {
    const envelopeWithSigil: EnvelopeCustomization = {
      color: '#FFF8DC',
      sigil: 'heart',
    };

    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={envelopeWithSigil}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const noneOption = getByText('None');
    fireEvent.press(noneOption);

    expect(mockOnEnvelopeChange).toHaveBeenCalledWith({
      color: '#FFF8DC',
      sigil: undefined,
    });
  });

  // Requirements: 5.4
  it('highlights selected color option', () => {
    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const creamOption = getByText('Cream').parent?.parent;
    const style = Array.isArray(creamOption?.props.style)
      ? creamOption?.props.style
      : [creamOption?.props.style];
    
    const hasBorderColor = style.some(
      (s: any) => s && s.borderColor === '#4a9eff'
    );
    expect(hasBorderColor).toBe(true);
  });

  // Requirements: 5.4
  it('displays selected sigil in preview', () => {
    const envelopeWithSigil: EnvelopeCustomization = {
      color: '#FFF8DC',
      sigil: 'skull',
    };

    const { getByText } = render(
      <EnvelopeCustomizer
        envelope={envelopeWithSigil}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    // Verify the sigil is shown in the preview info
    expect(getByText('Sigil: Skull')).toBeTruthy();
  });

  // Requirements: 5.2
  it('provides all light color palette options', () => {
    const { getByText, getAllByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const expectedColors = [
      'Cream',
      'Peach',
      'Lavender',
      'Mint',
      'Sky',
      'Lemon',
      'Blush',
      'Sage',
      'Vanilla',
    ];

    expectedColors.forEach((color) => {
      expect(getByText(color)).toBeTruthy();
    });
    
    // Rose appears in both color and sigil sections
    expect(getAllByText('Rose').length).toBeGreaterThan(0);
  });

  // Requirements: 5.3
  it('provides all preset sigil designs', () => {
    const { getByText, getAllByText } = render(
      <EnvelopeCustomizer
        envelope={defaultEnvelope}
        onEnvelopeChange={mockOnEnvelopeChange}
      />
    );

    const expectedSigils = [
      'None',
      'Moon & Stars',
      'Skull',
      'Heart',
      'Ghost',
      'Crystal',
      'Flame',
      'Lightning',
      'Butterfly',
      'Eye',
      'Pentagram',
    ];

    expectedSigils.forEach((sigil) => {
      expect(getByText(sigil)).toBeTruthy();
    });
    
    // Rose appears in both color and sigil sections
    expect(getAllByText('Rose').length).toBeGreaterThan(0);
  });
});
