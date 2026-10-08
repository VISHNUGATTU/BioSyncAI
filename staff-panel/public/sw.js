/**
 * BioSync AI Staff & Dispatcher - Web Push Service Worker
 * 
 * Handles background push notifications, urgent dispatch audio alert triggers,
 * and deep-linking to patient appointment screens on desktop web browsers.
 */

const CACHE_NAME = 'biosync-staff-v1';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

// Push Event: Handle server push notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'BioSync Dispatch Alert', body: event.data.text() };
    }
  }

  const title = data.title || '🚨 Urgent Patient Dispatch Assigned';
  const options = {
    body: data.body || 'A new urgent phlebotomy appointment requires immediate sample collection.',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png',
    tag: data.tag || 'biosync-dispatch-urgent',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      appointmentId: data.appointmentId || null,
      timestamp: Date.now(),
      priority: data.priority || 'URGENT',
    },
    actions: [
      { action: 'open_appointment', title: 'Open Dispatch' },
      { action: 'dismiss', title: 'Acknowledge' },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Broadcast to all open tabs so client-side audio synthesizer can chime
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'BIOSYNC_URGENT_DISPATCH_ALERT',
            payload: { title, ...options.data },
          });
        });
      }),
    ])
  );
});

// Notification Click: Focus existing client or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_APPOINTMENT',
            appointmentId: event.notification.data?.appointmentId,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
