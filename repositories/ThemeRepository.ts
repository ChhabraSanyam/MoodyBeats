/**
 * Repository interface for theme asset management
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { TapeTheme } from '../models';

export interface ThemeRepository {
  getPresetTheme(preset: string): TapeTheme;
  saveCustomAsset(assetId: string, data: Blob): Promise<string>;
  getCustomAsset(assetId: string): Promise<Blob | null>;
}
