/**
 * Service de Notifications
 * Gère les rappels de pesée, soins, etc.
 * Supporte Web Push Notifications et Local Notifications (PWA)
 */

import firestoreService from './firestoreService';

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_TYPES = {
  WEIGHING: 'weighing',
  CARE: 'care',
  BREEDING: 'breeding',
  COMPETITION: 'competition',
};

const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifier si les notifications sont supportées
 */
function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Demander la permission pour les notifications
 */
async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn('⚠️ Notifications non supportées sur ce dispositif');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('❌ Notifications refusées par l\'utilisateur');
    return false;
  }

  // Demander la permission
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Montrer une notification
 */
function showNotification(title, options = {}) {
  if (!isNotificationSupported()) return;

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    tag: 'apphorse-notification',
    requireInteraction: false,
    ...options,
  };

  // Utiliser le Service Worker pour afficher la notification (API correcte)
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      options: defaultOptions,
    });
  }
}

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const notificationService = {
  /**
   * Initialiser les notifications
   */
  init: async (userId) => {
    try {
      console.log('🔔 Initialisation du service de notifications...');

      // Vérifier les permissions
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('⚠️ Notifications non autorisées');
      }

      // Charger les préférences utilisateur
      const prefs = await firestoreService.getDoc(
        `settings/${userId}`,
        'notifications'
      );

      if (!prefs) {
        // Créer les préférences par défaut
        await firestoreService.setDoc(
          `settings/${userId}`,
          'notifications',
          {
            weighing: { enabled: true, frequency: FREQUENCIES.WEEKLY },
            care: { enabled: false },
            breeding: { enabled: false },
            competition: { enabled: false },
          },
          { merge: true }
        );
      }

      // Setup periodic check
      notificationService.setupPeriodicCheck(userId);

      console.log('✅ Service de notifications initialisé');
      return { success: true, enabled: hasPermission };
    } catch (error) {
      console.error('❌ Erreur init notifications:', error);
      return { success: false, enabled: false };
    }
  },

  /**
   * Setup vérification périodique
   */
  setupPeriodicCheck: (userId) => {
    // Vérifier toutes les 30 minutes
    const intervalId = setInterval(() => {
      notificationService.checkAndNotify(userId);
    }, 30 * 60 * 1000);

    // Sauvegarder l'ID pour pouvoir l'arrêter
    sessionStorage.setItem(`notification_interval_${userId}`, intervalId);

    console.log('⏰ Vérification périodique activée (30min)');
  },

  /**
   * Arrêter la vérification périodique
   */
  stopPeriodicCheck: (userId) => {
    const intervalId = sessionStorage.getItem(`notification_interval_${userId}`);
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      sessionStorage.removeItem(`notification_interval_${userId}`);
      console.log('⏸️ Vérification périodique arrêtée');
    }
  },

  /**
   * Vérifier et envoyer les notifications dues
   */
  checkAndNotify: async (userId) => {
    try {
      if (!navigator.onLine) {
        console.log('⚠️ Hors ligne, check notification annulé');
        return { sent: 0 };
      }

      const settings = await firestoreService.getDoc(
        `settings/${userId}`,
        'notifications'
      );

      if (!settings) return { sent: 0 };

      let sent = 0;

      // Check weighing reminders
      if (settings.weighing?.enabled) {
        const weighingSent = await notificationService.checkWeighingReminders(
          userId,
          settings.weighing
        );
        sent += weighingSent;
      }

      // Check care reminders
      if (settings.care?.enabled) {
        const careSent = await notificationService.checkCareReminders(
          userId,
          settings.care
        );
        sent += careSent;
      }

      // Check breeding reminders
      if (settings.breeding?.enabled) {
        const breedingSent = await notificationService.checkBreedingReminders(
          userId,
          settings.breeding
        );
        sent += breedingSent;
      }

      if (sent > 0) {
        console.log(`✅ ${sent} notifications envoyées`);
      }

      return { sent };
    } catch (error) {
      console.error('❌ Erreur checkAndNotify:', error);
      return { sent: 0 };
    }
  },

  /**
   * Vérifier les rappels de pesée
   */
  checkWeighingReminders: async (userId, weighingSettings) => {
    try {
      const frequency = weighingSettings.frequency || FREQUENCIES.WEEKLY;
      const horses = await firestoreService.getAll(`horses/${userId}`);

      let sent = 0;
      const now = Date.now();

      for (const horse of horses) {
        // Récupérer la dernière pesée
        const lastMeasurement = horse.measurements?.[horse.measurements.length - 1];
        if (!lastMeasurement) continue;

        const lastWeighTime = lastMeasurement.timestamp;
        const daysSinceWeighing = (now - lastWeighTime) / (1000 * 60 * 60 * 24);

        // Vérifier si rappel est dû selon la fréquence
        let shouldNotify = false;
        let daysThreshold = 7;

        switch (frequency) {
          case FREQUENCIES.DAILY:
            daysThreshold = 1;
            shouldNotify = daysSinceWeighing >= 1;
            break;
          case FREQUENCIES.WEEKLY:
            daysThreshold = 7;
            shouldNotify = daysSinceWeighing >= 7;
            break;
          case FREQUENCIES.BIWEEKLY:
            daysThreshold = 14;
            shouldNotify = daysSinceWeighing >= 14;
            break;
          case FREQUENCIES.MONTHLY:
            daysThreshold = 30;
            shouldNotify = daysSinceWeighing >= 30;
            break;
        }

        // Envoyer notification
        if (shouldNotify) {
          showNotification(
            `⚖️ ${horse.name} : Rappel pesée`,
            {
              body: `La dernière pesée était il y a ${Math.round(daysSinceWeighing)} jours. Pensez à peser ${horse.name} !`,
              tag: `weighing_${horse.id}`,
              requireInteraction: true,
            }
          );

          // Logger dans les events
          await firestoreService.setDoc(
            `events/${userId}/${Date.now()}_reminder`,
            'reminder',
            {
              type: 'weighing_reminder_sent',
              horseId: horse.id,
              horseName: horse.name,
              sentAt: new Date().toISOString(),
              daysSinceLast: Math.round(daysSinceWeighing),
            }
          );

          sent++;
        }
      }

      return sent;
    } catch (error) {
      console.error('❌ Erreur checkWeighingReminders:', error);
      return 0;
    }
  },

  /**
   * Vérifier les rappels de soins
   */
  checkCareReminders: async (userId, careSettings) => {
    try {
      // Récupérer les événements de soins planifiés
      const events = await firestoreService.query('events/' + userId, [
        where('type', '==', 'care'),
        where('reminder.enabled', '==', true),
      ]);

      let sent = 0;
      const now = Date.now();

      for (const event of events) {
        const eventTime = event.timestamp || event.date;
        const minutesBefore = event.reminder?.offset_minutes || 24 * 60; // 24h par défaut
        const reminderTime = eventTime - minutesBefore * 60 * 1000;

        if (now >= reminderTime && now < eventTime) {
          showNotification(
            `🏥 Rappel soins`,
            {
              body: `N'oubliez pas: ${event.description || 'Événement de soin prévu'}`,
              tag: `care_${event.id}`,
            }
          );

          sent++;
        }
      }

      return sent;
    } catch (error) {
      console.error('❌ Erreur checkCareReminders:', error);
      return 0;
    }
  },

  /**
   * Vérifier les rappels d'élevage
   */
  checkBreedingReminders: async (userId, breedingSettings) => {
    try {
      // Récupérer les saillies planifiées
      const breeding = await firestoreService.getAll(`breeding/${userId}`);

      let sent = 0;
      const now = Date.now();

      for (const saillie of breeding) {
        const sailleDate = saillie.date || saillie.timestamp;
        const daysUntil = (sailleDate - now) / (1000 * 60 * 60 * 24);

        // Envoyer rappel 7 jours avant
        if (daysUntil <= 7 && daysUntil > 6.9) {
          showNotification(
            `🐎 Saillie prévue`,
            {
              body: `Saillie de ${saillie.mare_name} dans ${Math.round(daysUntil)} jours`,
              tag: `breeding_${saillie.id}`,
            }
          );

          sent++;
        }
      }

      return sent;
    } catch (error) {
      console.error('❌ Erreur checkBreedingReminders:', error);
      return 0;
    }
  },

  /**
   * Créer un rappel personnalisé
   */
  scheduleReminder: async (userId, reminder) => {
    try {
      const {
        type,
        horseId,
        title,
        body,
        reminderTime, // milliseconds
        frequency,
      } = reminder;

      // Sauvegarder dans Firestore
      const reminderId = `reminder_${Date.now()}`;
      await firestoreService.setDoc(
        `reminders/${userId}`,
        reminderId,
        {
          type,
          horseId,
          title,
          body,
          reminderTime,
          frequency,
          createdAt: new Date().toISOString(),
          active: true,
        }
      );

      console.log(`✅ Rappel créé: ${reminderId}`);
      return { success: true, reminderId };
    } catch (error) {
      console.error('❌ Erreur scheduleReminder:', error);
      throw error;
    }
  },

  /**
   * Envoyer une notification immédiate
   */
  sendNow: async (title, options = {}) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('❌ Permission pour notifications refusée');
        return { success: false };
      }

      showNotification(title, options);
      console.log(`✅ Notification envoyée: ${title}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur sendNow:', error);
      return { success: false };
    }
  },

  /**
   * Mettre à jour les préférences de notifications
   */
  updatePreferences: async (userId, preferences) => {
    try {
      await firestoreService.setDoc(
        `settings/${userId}`,
        'notifications',
        preferences,
        { merge: true }
      );

      console.log('✅ Préférences de notification mises à jour');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur updatePreferences:', error);
      throw error;
    }
  },

  /**
   * Récupérer les préférences
   */
  getPreferences: async (userId) => {
    try {
      const prefs = await firestoreService.getDoc(
        `settings/${userId}`,
        'notifications'
      );
      return prefs || {};
    } catch (error) {
      console.error('❌ Erreur getPreferences:', error);
      return {};
    }
  },

  // Constants export
  NOTIFICATION_TYPES,
  FREQUENCIES,
};

export default notificationService;
