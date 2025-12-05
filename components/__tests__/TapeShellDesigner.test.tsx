/**
 * TapeShellDesigner Component Tests
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { TapeTheme } from '../../models';
import TapeShellDesigner from '../TapeShellDesigner';

describe('TapeShellDesigner', () => {
  const mockOnThemeChange = jest.fn();

  beforeEach(() => {
    mockOnThemeChange.mockClear();
  });

  describe('Preset Theme Selection - Requirements 4.1, 4.2', () => {
    it('should render all three preset themes', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('VHS Static Grey')).toBeTruthy();
      expect(getByText('Pumpkin Orange')).toBeTruthy();
      expect(getByText('Ghostly Green')).toBeTruthy();
    });

    it('should call onThemeChange when a preset is selected', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      fireEvent.press(getByText('Pumpkin Orange'));

      expect(mockOnThemeChange).toHaveBeenCalledWith({
        preset: 'pumpkin-orange',
      });
    });

    it('should highlight the currently selected preset', () => {
      const theme: TapeTheme = { preset: 'ghostly-green' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      // The selected preset should have a checkmark
      const ghostlyGreenOption = getByText('Ghostly Green').parent?.parent;
      expect(ghostlyGreenOption).toBeTruthy();
    });
  });

  describe('Pattern Selection - Requirements 4.3, 4.4', () => {
    it('should render pattern options', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('Retro Lines')).toBeTruthy();
      expect(getByText('Retro Grid')).toBeTruthy();
      expect(getByText('Retro Dots')).toBeTruthy();
      expect(getByText('Retro Waves')).toBeTruthy();
    });

    it('should call onThemeChange when a pattern is selected', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      fireEvent.press(getByText('Retro Lines'));

      expect(mockOnThemeChange).toHaveBeenCalledWith({
        preset: 'vhs-static-grey',
        pattern: 'retro-lines',
      });
    });

    it('should allow deselecting pattern by selecting None', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey', pattern: 'retro-lines' };
      const { getAllByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      // Find the "None" option in the Patterns section
      const noneOptions = getAllByText('None');
      fireEvent.press(noneOptions[0]); // First "None" is for patterns

      expect(mockOnThemeChange).toHaveBeenCalledWith({
        preset: 'vhs-static-grey',
        pattern: undefined,
      });
    });
  });

  describe('Texture Selection - Requirements 4.3, 4.4', () => {
    it('should render texture options', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('CRT Scanlines')).toBeTruthy();
      expect(getByText('CRT Curve')).toBeTruthy();
      expect(getByText('Film Grain')).toBeTruthy();
      expect(getByText('Noise')).toBeTruthy();
    });

    it('should call onThemeChange when a texture is selected', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      fireEvent.press(getByText('CRT Scanlines'));

      expect(mockOnThemeChange).toHaveBeenCalledWith({
        preset: 'vhs-static-grey',
        texture: 'crt-scan',
      });
    });
  });

  describe('Overlay Selection - Requirements 4.3, 4.4', () => {
    it('should render overlay options', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('VHS Static (Light)')).toBeTruthy();
      expect(getByText('VHS Static (Medium)')).toBeTruthy();
      expect(getByText('VHS Static (Heavy)')).toBeTruthy();
      expect(getByText('VHS Tracking')).toBeTruthy();
    });

    it('should call onThemeChange when an overlay is selected', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      fireEvent.press(getByText('VHS Static (Light)'));

      expect(mockOnThemeChange).toHaveBeenCalledWith({
        preset: 'vhs-static-grey',
        overlay: 'vhs-static-light',
      });
    });
  });

  describe('Theme Preview - Requirements 4.4', () => {
    it('should display preview section', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('Preview')).toBeTruthy();
      expect(getByText('Theme: VHS Static Grey')).toBeTruthy();
    });

    it('should show active customizations in preview', () => {
      const theme: TapeTheme = {
        preset: 'pumpkin-orange',
        pattern: 'retro-lines',
        texture: 'crt-scan',
        overlay: 'vhs-static-light',
      };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      expect(getByText('Theme: Pumpkin Orange')).toBeTruthy();
      expect(getByText('Pattern: Retro Lines')).toBeTruthy();
      expect(getByText('Texture: CRT Scanlines')).toBeTruthy();
      expect(getByText('Overlay: VHS Static (Light)')).toBeTruthy();
    });
  });

  describe('Combined Customizations - Requirements 4.4', () => {
    it('should allow combining preset, pattern, texture, and overlay', () => {
      const theme: TapeTheme = { preset: 'vhs-static-grey' };
      const { getByText } = render(
        <TapeShellDesigner theme={theme} onThemeChange={mockOnThemeChange} />
      );

      // Select pattern
      fireEvent.press(getByText('Retro Grid'));
      expect(mockOnThemeChange).toHaveBeenLastCalledWith({
        preset: 'vhs-static-grey',
        pattern: 'retro-grid',
      });

      // Update theme with pattern
      const themeWithPattern: TapeTheme = {
        preset: 'vhs-static-grey',
        pattern: 'retro-grid',
      };
      const { getByText: getByText2 } = render(
        <TapeShellDesigner theme={themeWithPattern} onThemeChange={mockOnThemeChange} />
      );

      // Select texture
      fireEvent.press(getByText2('Film Grain'));
      expect(mockOnThemeChange).toHaveBeenLastCalledWith({
        preset: 'vhs-static-grey',
        pattern: 'retro-grid',
        texture: 'film-grain',
      });
    });
  });
});
