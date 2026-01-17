import { useEffect } from 'react';
import { canAccess } from '../utils/permissions';

const NotificationManager = () => {
    useEffect(() => {
        // Only run if user has 'alerts' permission (Paid Plans)
        if (!canAccess('alerts')) return;

        // Check if browser supports notifications
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }

        const checkAndNotify = () => {
            // 1. Permission Check
            // We need 'granted' permission to send browser notifications.
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }

            if (Notification.permission !== "granted") return;

            // 2. Load Data
            // We fetch care items directly from localStorage to ensure we have the latest data.
            const savedCare = localStorage.getItem('appHorse_careItems_v3');
            if (!savedCare) return;

            const items = JSON.parse(savedCare);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // 3. Filter Urgent Items
            // Criteria:
            // - Not completed
            // - Due Date passed OR Due within 7 days
            const urgentItems = items.filter(item => {
                if (item.status === 'completed') return false;

                const dueDate = new Date(item.date);
                dueDate.setHours(0, 0, 0, 0);

                const diffTime = dueDate - now;
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return daysLeft <= 7;
            });

            if (urgentItems.length === 0) return;

            // 4. Rate Limiting
            // Avoid spamming the user on every page reload. Limit to once every 12 hours.
            const lastNotifyStr = localStorage.getItem('last_notification_sent');
            const nowTime = new Date();

            if (lastNotifyStr) {
                const lastNotify = new Date(lastNotifyStr);
                const diffHours = (nowTime - lastNotify) / (1000 * 60 * 60);
                if (diffHours < 12) return; // Silent return if too soon
            }

            // 5. Build & Send Notification
            const count = urgentItems.length;
            const title = "Rappels Sanitaires Equinox";
            const body = count === 1
                ? `Rappel : ${urgentItems[0].name} pour ${urgentItems[0].horse} est à prévoir.`
                : `Vous avez ${count} soins à prévoir ou en retard.`;

            new Notification(title, {
                body: body,
                icon: "/Logo_equinox.png",
                tag: 'care-reminder' // 'tag' prevents duplicate notifications stacking up
            });

            // Update timestamp
            localStorage.setItem('last_notification_sent', nowTime.toISOString());
        };

        // Run check on mount
        checkAndNotify();

        // Optional: Run check every hour if app stays open
        const interval = setInterval(checkAndNotify, 3600000);
        return () => clearInterval(interval);

    }, []);

    return null; // This component renders nothing
};

export default NotificationManager;
