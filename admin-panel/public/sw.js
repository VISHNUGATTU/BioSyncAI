/**
 * BioSync AI Admin & Central Lab Dispatcher - Web Push Service Worker
 */

const CACHE_NAME = 'biosync-admin-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'BioSync Admin Alert', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 New Urgent Home Phlebotomy Booking';
  const options = {
    body: data.body || 'A new patient test panel requires immediate phlebotomist dispatch assignment.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'biosync-admin-dispatch',
    renotify: true,
    requireInteraction: true,
    data: {
      url: '/appointments',
      appointmentId: data.appointmentId || null,
    },
    actions: [
      { action: 'open_dashboard', title: 'Open Lab Dispatch' },
      { action: 'dismiss', title: 'Acknowledge' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'ADMIN_DISPATCH_ALERT_SOUND',
            payload: data,
          });
        });
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/appointments');
      }
    })
  );
});
