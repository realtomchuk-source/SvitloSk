# Структура даних SvitloSk

Опис бази даних та потоків інформації в проекті.

## 🗄 Таблиці Supabase (Public)

### 1. `user_profiles`
Зберігає профілі користувачів та їхні ролі.
- `id`: uuid (Primary Key, references auth.users)
- `role`: text (admin, moderator, user)
- `status`: text (active, blocked)
- `email`: text (опціонально, для відображення в адмінці)
- `start_group`: text (черга користувача)
- `tomorrow_push`: boolean (сповіщення)
- `created_at`: timestamp
- `last_login`: timestamp

### 2. `parser_logs`
Логи роботи парсера.
- `id`: bigserial (PK)
- `level`: text (INFO, SUCCESS, WARNING, ERROR)
- `message`: text
- `source`: text (назва парсера або компонента)
- `timestamp`: timestamp with time zone
- `details`: jsonb (додаткові дані помилки)

### 3. `daily_stats`
Агрегована статистика для дашборду.
- `date`: date (PK)
- `processed_count`: integer
- `error_count`: integer
- `avg_latency`: float

### 4. `announcements` (Реалізовано)
Глобальні повідомлення для користувачів.
- `id`: uuid (PK)
- `text`: text (markdown)
- `is_active`: boolean
- `created_at`: timestamp
- `created_by`: uuid (references user_profiles)

### 5. `admin_actions` (Реалізовано)
Аудит-лог дій адміністратора.
- `id`: uuid (PK)
- `admin_id`: uuid
- `action`: text
- `target_type`: text
- `target_id`: text
- `timestamp`: timestamp

### 6. `feature_flags` (Заплановано)
Керування доступністю функцій.
- `key`: text (PK)
- `is_enabled`: boolean
- `description`: text
- `updated_at`: timestamp

---

## 🔄 Потоки даних

1. **Parser -> Supabase**: Парсер збирає дані та записує їх у `parser_logs` та оновлює графіки.
2. **FastAPI -> Supabase**: Сервіс аналітики періодично зчитує логи та розраховує дані для `daily_stats`.
3. **Admin Panel -> Supabase**: 
   - Зчитує аналітику та логи.
   - Управлялає ролями в `user_profiles`.
   - Публікує анонси в `announcements`.

---

## 🔒 Безпека (RLS)
Усі таблиці будуть захищені за допомогою Row Level Security:
- **Admin**: Повний доступ до всіх таблиць.
- **User**: Доступ тільки до свого профілю та активних анонсів.
- **Anon**: Доступ заборонено.
