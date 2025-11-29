/**
 * Central export for repository utilities
 */

export {
    detectPlatform,
    isMobilePlatform,
    isWebPlatform,
    type PlatformType
} from './platform';

export {
    AudioValidationError,
    SUPPORTED_AUDIO_FORMATS,
    assertValidAudioSource,
    detectUrlProvider,
    getFileExtension,
    isValidAudioFormat,
    validateAudioSource,
    validateAudioUrl,
    validateLocalAudioFile
} from './audioValidation';

export {
    createPlatformStyles,
    getMonospaceFont,
    getPlatformAnimationConfig,
    getPlatformButtonStyles,
    getPlatformCapabilities,
    getPlatformShadow,
    getPlatformSpacing,
    getResponsiveDimensions,
    getResponsiveFontSizes,
    getSafeAreaPadding
} from './platformStyles';

export {
    BREAKPOINTS,
    getColumnCount,
    getContainerWidth,
    getResponsivePadding,
    getResponsiveValue,
    getScreenSize,
    getTapeDeckDimensions,
    scaleSize,
    useDimensionListener,
    type ScreenSize
} from './responsiveLayout';

export {
    BatchProcessor,
    createBatchedMethod,
    debounce,
    throttle
} from './storageBatching';

