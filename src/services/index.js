// Services - Logique métier centralisée
export * from './aiNutritionService.js';
export * from './barymetricService.js';
export * from './dataSyncService.js';
export * from './firestoreSync.js';
export * from './geminiService.js';
export { cloudPhotoService as default } from './cloudPhotoService.js';
export { cloudPhotoService } from './cloudPhotoService.js';
export { migrationService } from './migrationService.js';

// NEW: Firestore & Sync Services
export { firestoreService, default as firestoreServiceDefault } from './firestoreService.js';
export { syncService, default as syncServiceDefault } from './syncService.js';
export { notificationService, default as notificationServiceDefault } from './notificationService.js';
export { cacheStrategy, default as cacheStrategyDefault } from './cacheStrategy.js';
