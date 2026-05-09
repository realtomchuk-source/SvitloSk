self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png', // Переконайтеся, що така іконка є в папці public
      badge: '/badge.png',       // (Опціонально) Маленька біла іконка для шторки Android
      vibrate: [200, 100, 200],  // Вібрація
      data: { url: data.clickUrl || '/' } // Куди переходити по кліку
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Помилка обробки push-повідомлення:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Закриваємо пуш після кліку
  const urlToOpen = event.notification.data?.url || '/';
  
  // Відкриваємо вікно PWA або фокусуємось на ньому, якщо воно вже відкрите
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});