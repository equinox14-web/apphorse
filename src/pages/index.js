// Pages - Indexage centralisé pour imports cohérents

// Pages principales
export { default as Dashboard } from './Dashboard';
export { default as DemoStart } from './DemoStart';
export { default as LandingPage } from './LandingPage';
export { default as Weather } from './Weather';
export { default as TrainingDetail } from './TrainingDetail';
export { default as Calendar } from './Calendar';
export { default as HalfLease } from './HalfLease';
export { default as Messaging } from './Messaging';
export { default as Competition } from './Competition';
export { default as Support } from './Support';
export { default as Payment } from './Payment';
export { default as Assistant } from './Assistant';
export { default as AITrainingCoach } from './AITrainingCoach';
export { default as AdminPlans } from './AdminPlans';
export { default as DiagnosticPlans } from './DiagnosticPlans';

// Réexporter les sous-dossiers (qui ont leurs propres index.js)
export * from './auth';
export * from './horse';
export * from './nutrition/index';
export * from './management';
export * from './profile';
