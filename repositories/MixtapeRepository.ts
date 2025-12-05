/**
 * Repository interface for mixtape data persistence
 * Requirements: 14.1, 14.2, 15.1, 15.2, 15.3
 */

import { Mixtape } from '../models';

export interface MixtapeRepository {
  getAll(): Promise<Mixtape[]>;
  getById(id: string): Promise<Mixtape | null>;
  save(mixtape: Mixtape): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
