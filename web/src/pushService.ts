// Функція для розшифровки VAPID ключа
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push-сповіщення не підтримуються цим браузером (можливо потрібен HTTPS або це iOS без PWA).');
  }

  // 1. Реєструємо нашого фонового слухача (sw.js)
  const registration = await navigator.serviceWorker.register('/sw.js');

  // 2. Запитуємо дозвіл у користувача
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Користувач заборонив надсилати сповіщення.');
  }

  // 3. Створюємо унікальну підписку для цього пристрою
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  // Повертаємо готовий JSON підписки (який потім відправимо в Supabase)
  return JSON.stringify(subscription);
}