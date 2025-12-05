# Mixtape Import Functionality

## Overview

The MoodyBeats application now supports importing mixtape archives from both URLs and local files. This functionality allows users to share and receive mixtapes through the `.mixblues` archive format.

## Requirements Implemented

- **14.1**: Import from shareable URLs
- **14.2**: Import from local files
- **14.3**: Archive validation
- **14.4**: Successful import handling
- **14.5**: Error handling for invalid archives

## Usage

### Importing from URL

```typescript
import { ArchiveManager } from '../services/ArchiveManager';

const archiveManager = new ArchiveManager();

try {
  // Import from shareable URL
  const mixtape = await archiveManager.importFromURL(
    'https://share.moodybeats.sanyamchhabra.in/t/mixtape-id'
  );
  
  console.log(`Imported: ${mixtape.title}`);
} catch (error) {
  console.error('Import failed:', error.message);
}
```

### Importing from Local File

```typescript
import { ArchiveManager } from '../services/ArchiveManager';

const archiveManager = new ArchiveManager();

try {
  // Import from File object (web) or Blob
  const file = /* File from input or Blob */;
  const mixtape = await archiveManager.importFromFile(file);
  
  console.log(`Imported: ${mixtape.title}`);
} catch (error) {
  console.error('Import failed:', error.message);
}
```

## UI Integration

The import functionality has been integrated into the Library screen (`app/library.tsx`) with:

1. **Import Button**: A floating action button (📥) that opens the import modal
2. **Import Modal**: Provides two import options:
   - **From URL**: Text input for shareable URLs
   - **From File**: File picker for local `.mixblues` files

### User Flow

1. User clicks the import button in the library
2. Modal appears with import options
3. User either:
   - Enters a shareable URL and clicks "Import from URL"
   - Clicks "Choose .mixblues File" to select a local file
4. System validates and imports the archive
5. Success message displays the imported mixtape title
6. Library refreshes to show the new mixtape

## Archive Format

The `.mixblues` archive is a ZIP file containing:

```
mixtape.mixblues
├── metadata.json          # Mixtape metadata and track information
├── audio/                 # Audio files directory
│   ├── track-1.mp3
│   ├── track-2.mp3
│   └── ...
└── assets/                # Theme assets directory
    ├── patterns/
    ├── textures/
    └── overlays/
```

## Validation

The import process validates:

1. **Archive Format**: Must be a valid ZIP file
2. **Metadata Presence**: Must contain `metadata.json`
3. **Metadata Structure**: Must conform to the expected schema
4. **Required Fields**: ID, title, sides, theme, envelope
5. **Track Structure**: Valid track objects with source information
6. **Theme Preset**: Must be one of the valid presets

## Error Handling

The import functionality handles various error scenarios:

### Invalid Archive
- Missing `metadata.json`
- Corrupted ZIP file
- Invalid metadata structure

### Network Errors
- Failed URL download
- Backend unavailable
- Timeout errors

### Storage Errors
- Duplicate mixtape ID
- Storage quota exceeded
- Permission denied

### Graceful Degradation
- Continues import even if some audio files fail to save
- Continues import even if some theme assets fail to save
- Logs warnings for partial failures

## Platform Support

### Web
- URL import: ✅ Full support
- File import: ✅ Uses HTML file input

### iOS/Android
- URL import: ✅ Full support
- File import: ✅ Uses Expo DocumentPicker

## Testing

Comprehensive test coverage includes:

- ✅ Import from shareable URL
- ✅ Import from direct URL
- ✅ Import from local file
- ✅ Import from File object
- ✅ Archive validation
- ✅ Invalid archive rejection
- ✅ Corrupted file handling
- ✅ Duplicate mixtape detection
- ✅ Audio file saving
- ✅ Theme asset saving
- ✅ Partial failure handling
- ✅ Repository error handling

Run tests with:
```bash
npm test -- services/__tests__/ArchiveManager.test.ts
```

## Future Enhancements

1. **Progress Tracking**: Show download/extraction progress
2. **Batch Import**: Import multiple archives at once
3. **Import History**: Track imported mixtapes
4. **Conflict Resolution**: Handle duplicate IDs more gracefully
5. **Import Preview**: Show mixtape details before importing
