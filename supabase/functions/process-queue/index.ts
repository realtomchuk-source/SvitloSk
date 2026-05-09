import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

// Отримуємо VAPID-ключі з безпечного середовища Supabase
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:support@svitlo-starkon.com'; // Ваш email для Web Push

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Беремо до 500 повідомлень з черги, час яких вже настав
    const { data: queue, error: fetchError } = await supabase
      .from('push_queue')
      .select('id, user_id, title, body')
      .eq('status', 'pending')
      .lte('send_at', new Date().toISOString())
      .limit(500);

    if (fetchError) throw fetchError;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ message: 'Черга порожня 💤' }), { headers: { "Content-Type": "application/json" } });
    }

    // 2. Отримуємо Web Push токени для цих користувачів
    const userIds = [...new Set(queue.map(q => q.user_id))];
    const { data: tokensData, error: tokenError } = await supabase
      .from('user_push_tokens')
      .select('user_id, push_token')
      .in('user_id', userIds);

    if (tokenError) throw tokenError;

    // Створюємо словник: user_id -> токен підписки
    const tokenMap = new Map();
    if (tokensData) {
      tokensData.forEach(t => tokenMap.set(t.user_id, t.push_token));
    }

    const successIds: number[] = [];
    const failedIds: number[] = [];
    const invalidUserIds: string[] = []; // Збираємо відписки

    // 3. Відправляємо повідомлення
    for (const item of queue) {
      const pushToken = tokenMap.get(item.user_id);
      
      if (!pushToken) {
        // У користувача немає токена (можливо вийшов з акаунту)
        failedIds.push(item.id);
        continue;
      }

      try {
        // Підтримуємо як JSON-об'єкт, так і строку
        const subscription = typeof pushToken === 'string' ? JSON.parse(pushToken) : pushToken;
        const payload = JSON.stringify({ title: item.title, body: item.body });

        await webpush.sendNotification(subscription, payload);
        successIds.push(item.id);
      } catch (err: any) {
        console.error(`Помилка відправки для ${item.id}:`, err);
        failedIds.push(item.id);
        
        // Якщо токен протух або користувач заборонив сповіщення
        if (err.statusCode === 404 || err.statusCode === 410) {
          invalidUserIds.push(item.user_id);
        }
      }
    }

    // 4. Оновлюємо статуси відправки в базі
    if (successIds.length > 0) {
      await supabase.from('push_queue').update({ status: 'sent' }).in('id', successIds);
    }
    if (failedIds.length > 0) {
      await supabase.from('push_queue').update({ status: 'failed' }).in('id', failedIds);
    }

    // 5. Видаляємо мертві токени (щоб більше не намагатися туди слати)
    if (invalidUserIds.length > 0) {
      await supabase.from('user_push_tokens').delete().in('user_id', invalidUserIds);
    }

    // 6. ОЧИЩЕННЯ БАЗИ: Видаляємо старі відправлені повідомлення (старші 3 днів)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await supabase
      .from('push_queue')
      .delete()
      .in('status', ['sent', 'failed'])
      .lte('created_at', threeDaysAgo.toISOString());

    return new Response(JSON.stringify({ 
      message: 'Пакет успішно оброблено 🚀', 
      sent: successIds.length, 
      failed: failedIds.length 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
