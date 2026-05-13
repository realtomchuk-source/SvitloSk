проаналізуй проро# Швидкий старт адмін-панелі SvitloSk

## 📋 Покрокова інструкція

### Крок 1: Налаштування Supabase

1. Відкрийте ваш проєкт у [Supabase Dashboard](https://app.supabase.com)
2. Перейдіть у розділ **SQL Editor**
3. Скопіюйте вміст файлу `test_data.sql` та виконайте його
4. Перевірте, що таблиці створені:
   - `user_profiles` (15 користувачів)
   - `parser_logs` (50+ записів логів)
   - `daily_stats` (7 днів статистики)
   - `hourly_load` (погодинні дані)

### Крок 2: Налаштування змінних середовища

1. Створіть файл `.env` у папці `SvitloSk/web/`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Знайдіть ці значення у Supabase Dashboard → Settings → API

### Крок 3: Запуск проєкту

1. Відкрийте термінал у папці `SvitloSk/web`
2. Виконайте команди:
   ```bash
   npm install
   npm run dev
   ```
3. Відкрийте браузер за адресою `http://localhost:5173`

### Крок 4: Доступ до адмін-панелі

1. У браузері перейдіть на `/admin` або `http://localhost:5173/SvitloSk/#/admin`
2. Ви побачите адмін-панель з навігацією:
   - **Дашборд** - загальний огляд
   - **Користувачі** - управління користувачами
   - **Аналітика** - статистика та звіти
   - **Редактор графіка** - ручне редагування
   - **Логи парсера** - перегляд логів
   - **Налаштування** - конфігурація

## 🎯 Що можна протестувати

### Користувачі (Users)
- ✅ Перегляд списку з 15 тестових користувачів
- ✅ Пошук за email (спробуйте: "gmail", "admin", "user")
- ✅ Блокування/розблокування користувачів (кнопка "Заблокувати"/"Розблокувати")
- ✅ Відображення ролей (admin, moderator, user)
- ✅ Статуси (active, blocked)

### Аналітика (Analytics)
- ✅ Карточки з метриками:
  - Оброблено записів (сума за 7 днів)
  - Кількість помилок
  - Середня затримка
- ✅ Таблиця денної статистики за останні 7 днів
- ✅ Список останніх помилок парсера (якщо є ERROR-логи)

### Логи парсера (Logs)
- ✅ Перегляд 50+ тестових логів
- ✅ Фільтрація за рівнем:
  - ALL - всі логи
  - INFO - інформаційні
  - SUCCESS - успішні операції
  - WARNING - попередження
  - ERROR - помилки
- ✅ Пошук у логах (спробуйте: "парсер", "графік", "помилка")
- ✅ Кнопка оновлення (RefreshCw icon)
- ✅ Статистика по типам логів

## 🔧 Налаштування RLS (Row Level Security)

Якщо ви бачите помилку "permission denied", виконайте наступне:

### Варіант 1: Тимчасово вимкнути RLS (для тестування)
```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parser_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_load DISABLE ROW LEVEL SECURITY;
```

### Варіант 2: Налаштувати політики для анонімного доступу
```sql
-- Дозволити читання всім (тільки для розробки!)
CREATE POLICY "Allow anonymous read on user_profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read on parser_logs" ON parser_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read on daily_stats" ON daily_stats
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read on hourly_load" ON hourly_load
  FOR SELECT USING (true);

-- Дозволити оновлення для тестування
CREATE POLICY "Allow anonymous update on user_profiles" ON user_profiles
  FOR UPDATE USING (true);
```

⚠️ **Увага**: Ці політики дозволяють доступ без автентифікації. Використовуйте тільки для локального тестування!

## 🐛 Troubleshooting

### Помилка: "table does not exist"
**Рішення**: Виконайте `test_data.sql` у Supabase SQL Editor

### Помилка: "permission denied for table"
**Рішення**: Вимкніть RLS або налаштуйте політики (див. вище)

### Компоненти не відображаються
**Рішення**: 
1. Перевірте консоль браузера (F12)
2. Переконайтеся, що `QueryProvider` обгортає `App` у `main.tsx`
3. Перевірте, що Supabase URL та ключі правильні в `.env`

### Дані не оновлюються після змін
**Рішення**:
1. Натисніть кнопку оновлення (RefreshCw) у компоненті
2. Або перезавантажте сторінку (F5)
3. React Query кешує дані на 5 хвилин

### Помилка: "Cannot find module '@tanstack/react-query'"
**Рішення**: 
```bash
cd SvitloSk/web
npm install @tanstack/react-query --legacy-peer-deps
```

## 📊 Тестові дані

### Користувачі для тестування:
- `admin@svitlosk.com` - адміністратор (active)
- `moderator@svitlosk.com` - модератор (active)
- `user3@gmail.com` - заблокований користувач
- `demo@svitlosk.com` - заблокований користувач

### Статистика:
- 7 днів денної статистики (1456-1789 записів/день)
- 17 годин погодинного навантаження (25-201 запит/годину)
- 50+ логів парсера (INFO, SUCCESS, WARNING, ERROR)

## 🚀 Наступні кроки

1. **Додати автентифікацію**:
   - Налаштувати Supabase Auth
   - Додати перевірку ролі `admin` перед доступом
   - Створити сторінку логіну

2. **Покращити UI**:
   - Додати графіки (recharts або chart.js)
   - Реалізувати експорт звітів у CSV
   - Додати Realtime-підписки для логів

3. **Оптимізація**:
   - Додати пагінацію для великих списків
   - Реалізувати віртуальний скролінг
   - Додати debounce для пошуку

4. **Безпека**:
   - Налаштувати правильні RLS політики
   - Додати rate limiting
   - Реалізувати CSRF-захист

## 📚 Додаткові ресурси

- [Документація Supabase](https://supabase.com/docs)
- [React Query документація](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## 💡 Корисні команди

```bash
# Запуск dev-сервера
npm run dev

# Збірка для продакшн
npm run build

# Перевірка типів TypeScript
npm run type-check

# Лінтинг коду
npm run lint

# Перегляд збірки
npm run preview
```

## ✅ Чеклист готовності

- [ ] Supabase проєкт створено
- [ ] Таблиці створені (`test_data.sql` виконано)
- [ ] Змінні середовища налаштовані (`.env`)
- [ ] Залежності встановлені (`npm install`)
- [ ] Dev-сервер запущено (`npm run dev`)
- [ ] Адмін-панель відкривається на `/admin`
- [ ] Користувачі відображаються
- [ ] Аналітика працює
- [ ] Логи завантажуються
- [ ] Блокування/розблокування працює

Якщо всі пункти виконані - вітаємо! Адмін-панель готова до використання! 🎉
