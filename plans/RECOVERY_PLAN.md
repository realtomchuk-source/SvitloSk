# 🔧 План відновлення зовнішнього вигляду SvitloSk

> **Мета**: привести React-версію проекту (SvitloSk/web) до візуальної відповідності з оригіналом SSSK  
> **Еталон**: https://realtomchuk-source.github.io/svitlo-starkon/pwa/index.html  
> **Пріоритет сторінок**: Home → Cabinet → (Tomorrow — з нуля, пізніше)  
> **Дата створення**: 2026-04-23

---

## 📋 Зміст

1. [Фаза 0: Передумови та підготовка](#фаза-0-передумови-та-підготовка)
2. [Фаза 1: Фундамент (CSS, шрифти, шляхи, body)](#фаза-1-фундамент)
3. [Фаза 2: Home Page — повне відновлення](#фаза-2-home-page)
4. [Фаза 3: Cabinet Page — повне відновлення](#фаза-3-cabinet-page)
5. [Фаза 4: Навігація (4 вкладки)](#фаза-4-навігація)
6. [Фаза 5: Полірування та PWA](#фаза-5-полірування)
7. [Додаток A: Компонентна карта](#додаток-a-компонентна-карта)
8. [Додаток B: Файли які створити / видалити / змінити](#додаток-b-файлова-карта)

---

## Фаза 0: Передумови та підготовка

### 0.1 Зупинити dev-сервер (якщо працює)
```bash
# Ctrl+C у терміналі або:
npx kill-port 5173
```

### 0.2 Створити git-гілку для відновлення
```bash
cd web
git checkout -b fix/visual-recovery
```

### 0.3 Перевірити що дані на місці
Файли які повинні бути в `web/public/data/`:
- [x] `today.json`
- [x] `tomorrow.json`
- [x] `health.json`
- [x] `schedule_api.json`
- [x] `apps.json`
- [x] `unified_schedules.json`
- [x] `history_api.json`

Файли які повинні бути в `web/public/assets/`:
- [x] `power_off.png`, `power_on.png`
- [x] `bulb_on.png`, `bulb_off.png`
- [x] `app-icon.svg`, `app-icon-maskable.svg`
- [x] `icon-192.png`, `icon-512.png`, `icon-180.png`
- [x] `logo.png`
- [x] Всі інші SVG/PNG

---

## Фаза 1: Фундамент

> **Ціль**: виправити глобальні CSS-конфлікти, шрифти, шляхи до файлів, body-стилі

### 1.1 Виправити `index.html` — прибрати темний фон

**Файл**: `web/index.html`

**Було**:
```html
<body class="bg-zinc-900 text-white overflow-hidden">
```

**Стало**:
```html
<body>
```

**Обґрунтування**: тема керується через legacy CSS (`style.css`), Tailwind-класи на body конфліктують. `overflow-hidden` блокує скрол сторінки.

---

### 1.2 Підключити Google Fonts

**Файл**: `web/index.html` — додати в `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;800&family=Tektur:wght@400;600;700;800;900&display=swap" rel="stylesheet">
```

**Обґрунтування**: оригінал використовує Inter (основний), Outfit (hero status), Tektur (dashboard tablo). Без них типографіка зовсім інша.

---

### 1.3 Розділити CSS імпорти за сторінками

**Файл**: `web/src/main.tsx`

**Було** (все завантажується одночасно):
```tsx
import './styles/index.css'
import './styles/legacy/style.css'
import './styles/legacy/home.css'
import './styles/legacy/tech-ui.css'
import './styles/legacy/selector.css'
import './styles/legacy/sssk-modern.css'
import './styles/legacy/cabinet-v3.css'
```

**Стало** — залишити тільки глобальні:
```tsx
import './styles/index.css'
import './styles/legacy/style.css'
```

Сторінкові CSS підключати безпосередньо в компонентах:
- `pages/Home.tsx` → `import '@/styles/legacy/home.css'` + `tech-ui.css` + `selector.css` + `sssk-modern.css`
- `pages/Cabinet.tsx` → `import '@/styles/legacy/cabinet-v3.css'`

**Обґрунтування**: в оригіналі `index.html` підключає тільки `style.css` + `home.css` + `tech-ui.css` + `selector.css` + `sssk-modern.css`. Cabinet підключає `style.css` + `cabinet-v3.css`. Змішування всіх CSS одночасно — головна причина візуальних проблем.

---

### 1.4 Вичистити конфлікти body в legacy CSS

**Файл**: `web/src/styles/legacy/style.css`

Прибрати/закоментувати дублювання body:
```css
/* ПРИБРАТИ: */
body {
    background-color: #FAFAFA !important;
}
```

Залишити один визначений body-стиль. Оригінал Home має `background: #000; color: #fff;` на body, а Cabinet — світлий. 

**Рішення**: body буде нейтральним, а фон задаватиметься через клас на `#app` або `<section>`:
- Home: `page-home` клас → `background: #000; color: #fff`
- Cabinet: `page-cabinet` клас → `background: linear-gradient(180deg, #F0F2F8, #FFFFFF)`

---

### 1.5 Виправити `styles/index.css`

**Було**:
```css
@import "tailwindcss";

:root {
  font-family: Inter, system-ui, ...;
}

body {
    margin: 0;
    padding: 0;
    background: #000;
}
```

**Стало**:
```css
@import "tailwindcss";

:root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 0;
}
```

**Обґрунтування**: background на body прибираємо — він буде керуватися через page-класи.

---

### 1.6 Виправити `fetchSchedule` — шлях з base

**Файл**: `web/src/services/scheduleService.ts`

**Було**:
```ts
const response = await fetch(`/data/${type}.json?t=${Date.now()}`);
```

**Стало**:
```ts
const base = import.meta.env.BASE_URL;
const response = await fetch(`${base}data/${type}.json?t=${Date.now()}`);
```

**Обґрунтування**: `vite.config.ts` має `base: '/SvitloSk/'`. Без base prefix fetch іде на `/data/...` замість `/SvitloSk/data/...`.

---

### 1.7 Виправити шляхи до зображень

Замість відносних рядків — використовувати Vite import:

**Файл**: `web/src/pages/Home.tsx` (і аналогічно Tomorrow.tsx)

**Було**:
```tsx
src="assets/power_off.png"
```

**Стало**:
```tsx
import powerOff from '@/assets/power_off.png';
import powerOn from '@/assets/power_on.png';
// ...
src={isOn ? powerOff : powerOn}
```

**Обґрунтування**: при Vite build відносний рядок `"assets/..."` не буде вирішений правильно. Import дає хешовану URL.

---

### 1.8 Виправити `adminService.ts` шляхи (якщо є аналогічна проблема)

**Файл**: `web/src/services/adminService.ts`

Перевірити всі `fetch()` виклики — додати `import.meta.env.BASE_URL`.

---

## Фаза 2: Home Page

> **Ціль**: відтворити вигляд Home сторінки 1:1 з оригіналом

### Еталонна структура HTML (з оригінального index.html):
```
body.page-home (background: #000)
└── #app
    └── main.content-area
        └── section#home-section
            ├── .pwa-page-label → "STARKON СВІТЛО"
            ├── #smart-hero.hero-card.status-on/off
            │   ├── .hero-icon > img
            │   ├── .hero-text-block
            │   │   ├── .hero-status
            │   │   ├── .hero-timer
            │   │   └── .hero-context.hero-context--active
            │   ├── .hero-phase#hero-phase-capsule
            │   │   ├── .phase-track
            │   │   ├── .phase-fill
            │   │   └── .phase-dot (×3)
            │   └── .hero-timeline-capsule
            │       └── .hero-tl-track
            │           ├── .hero-tl-segments (48 .hero-tl-segment)
            │           └── .hero-tl-pointer
            ├── #dynamic-info-block.dash-container.status-on/off
            │   ├── .dash-segment.dash-date
            │   └── .dash-segment.dash-clock
            ├── .section-container (timeline block)
            └── #subqueue-selector
                └── .selector-container
                    └── .selector-scroll
                        └── .selector-card (×12)
```

### 2.1 Переписати `Home.tsx`

**Ключові зміни**:
1. Обгортка `body` або верхній `div` отримує клас `page-home`
2. Hero card: використовувати CSS-класи `.hero-tl-segment.available` / `.unavailable` замість Tailwind `bg-orange-500/80`
3. Dashboard: правильна структура з `dash-day`, `dash-date-num`, `dash-clock`, `dash-clock-sec`
4. CSS-імпорти: підключити `home.css`, `tech-ui.css`, `selector.css`, `sssk-modern.css`
5. Зображення: через import

---

### 2.2 Переписати `Selector.tsx` → `SubqueueSelector.tsx`

**Ключові зміни**:
1. Обгортка: `<div id="subqueue-selector">` (для selector.css стилів)
2. Додати class `dark`/`light` залежно від статусу (status-on → dark)
3. Внутрішня структура: `.selector-container > .selector-scroll > .selector-card`
4. Dot статусу: `.status-dot.on` / `.status-dot.off`
5. Активна картка: `.selector-card.active`
6. Прибрати Tailwind-класи, використовувати тільки legacy CSS-класи

---

### 2.3 Створити компонент `InteractiveTimeline.tsx`

Спрощена React-версія оригінального `<svitlo-timeline-block>`:

**Мінімальний функціонал для Фази 2**:
- 48 сегментів (по 30 хв) з кольорами on/off
- Горизонтальний slider (input[type=range]) 
- Scrubber preview bubble (час + статус)
- Поточна позиція (вертикальна лінія / точка)

**CSS**: використати існуючі стилі з `style.css` (`.scrubber-preview`, `.preview-on`, `.preview-off`)

**Повний інтерактивний функціонал** (touch, drag, 3D wheel) — окрема задача на пізніше.

---

### 2.4 Створити `HeroCard.tsx` (опціонально — можна залишити inline в Home)

Виділити Hero Card в окремий компонент для чистоти.

**Props**:
```ts
interface HeroCardProps {
  isOn: boolean;
  timerH: number;
  timerM: number;
  nextChangeHour: number;
  scheduleString: string; // "110011..." для mini-graph
  currentTimePercent: number; // 0-100 для pointer
}
```

---

### 2.5 Створити `DashboardBar.tsx`

**Props**:
```ts
interface DashboardBarProps {
  isOn: boolean;
  realTime: Date;
}
```

**Рендерить**: `.dash-container.status-on/off` з двома сегментами.

---

## Фаза 3: Cabinet Page

> **Ціль**: відтворити вигляд Cabinet 1:1 з оригіналом

### Еталонна структура HTML (з оригінального cabinet.html):
```
body (light bg, linear-gradient)
└── #app
    └── main.content-area
        └── section#cabinet-section-v3.cabinet-container-v3
            ├── .v3-section
            │   └── .v3-profile-block (динамічний профіль)
            ├── .v3-section
            │   ├── h3.v3-section-title → "Налаштування сповіщень"
            │   └── .v3-cards-container
            │       └── .v3-card.active / .v3-card.empty (×2)
            ├── .cabinet-section
            │   └── .soft-container
            │       ├── .soft-item (Стартова підчерга)
            │       └── .soft-item (Графік на завтра + toggle)
            └── .cabinet-section
                └── .light-list
                    ├── .light-item (Про застосунок)
                    ├── .light-item (Поділитись)
                    └── .light-item (Зворотний зв'язок)
```

### 3.1 Виправити Cabinet.tsx — фон сторінки

Додати обгортку з класом `page-cabinet` для світлого фону:
```css
.page-cabinet {
  background: linear-gradient(180deg, #F0F2F8 0%, #FFFFFF 100%);
  min-height: 100vh;
}
```

---

### 3.2 Виправити Profile Block

**Було**: `<div className="profile-card-v3">` (клас не існує в CSS)

**Стало**: `<div className="v3-profile-block">` зі структурою:
```html
<div class="v3-profile-block">
  <div class="v3-avatar"><!-- icon --></div>
  <div class="v3-profile-info">
    <div class="v3-profile-main-row">
      <div class="v3-profile-name">Локальний режим</div>
    </div>
    <div class="v3-profile-status">Дані збережено у вашому браузері</div>
  </div>
</div>
```

---

### 3.3 Виправити Notification Cards

Замінити `v3-slot-card` (не існує в CSS) на `v3-card` зі структурою:
```html
<div class="v3-card active">
  <div class="v3-card-row">
    <div class="v3-card-left">
      <div class="v3-card-title">{locationName}</div>
      <div class="v3-card-subtitle">{group}</div>
    </div>
    <div class="v3-card-right">
      <div class="v3-card-right-top">{notifyTime} хв</div>
    </div>
  </div>
</div>
```

---

### 3.4 Створити BottomSheet.tsx

Глобальний компонент для модальних вікон:
- Оберіть підчергу (picker grid)
- Про застосунок
- Зворотний зв'язок

**CSS-класи**: `v3-bottom-sheet-overlay`, `v3-bottom-sheet`, `v3-sheet-handle`, `v3-sheet-header`

---

### 3.5 Створити Toast.tsx

Глобальний компонент для повідомлень:

**CSS-класи**: `v3-toast-container`, `v3-toast`, `.show`

---

### 3.6 CSS-імпорт для Cabinet

```tsx
// pages/Cabinet.tsx
import '@/styles/legacy/cabinet-v3.css';
```

**НЕ** імпортувати `home.css`, `tech-ui.css`, `selector.css`.

---

## Фаза 4: Навігація

> **Ціль**: 4 вкладки як в оригіналі

### 4.1 Оновити навігацію в App.tsx

**4 вкладки**:
| # | label | path | icon | сторінка |
|---|-------|------|------|----------|
| 1 | Home | `/` | house | Home.tsx |
| 2 | Archive | `/archive` | calendar | Archive.tsx (заглушка) |
| 3 | App | `/apps` | bookmark | Apps.tsx (заглушка) |
| 4 | Profile | `/cabinet` | person | Cabinet.tsx |

### 4.2 Створити заглушки Archive.tsx та Apps.tsx

Прості сторінки з повідомленням "Сторінка в розробці" в стилі оригіналу.

### 4.3 Оновити Routes

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/archive" element={<Archive />} />
  <Route path="/apps" element={<Apps />} />
  <Route path="/cabinet" element={<Cabinet />} />
</Routes>
```

---

## Фаза 5: Полірування

### 5.1 Loading Screen

Створити `LoadingScreen.tsx` з SVG bulb анімацією з оригіналу.

### 5.2 Queue Picker Overlay

Створити `QueuePickerOverlay.tsx` — модальне вікно з grid 4×3 кнопок підчерг.

**CSS-класи**: `.overlay`, `.picker-container`, `.picker-header`, `.group-grid`, `.group-btn`

### 5.3 PWA перевірка

- Виправити `manifest` у `vite.config.ts`:
  - `theme_color`: `#D77727` (як в оригіналі, не `#1976d2`)
  - Правильні шляхи до іконок
- Перевірити Service Worker
- Додати `<link rel="apple-touch-icon">`

### 5.4 Meta-теги

```html
<link rel="icon" type="image/svg+xml" href="/SvitloSk/assets/app-icon.svg">
<link rel="apple-touch-icon" href="/SvitloSk/assets/icon-180.png">
```

### 5.5 Видалити зайві файли

- `src/App.css` — не використовується
- `src/assets/react.svg` — дефолтний Vite
- `src/assets/vite.svg` — дефолтний Vite
- `src/assets/hero.png` — не використовується
- `src/styles/legacy/tomorrow-timeline.css` — не потрібен (Tomorrow буде з нуля)
- `src/components/HeroCard.tsx` — старий, замінюється
- `src/components/GroupSelector.tsx` — старий, замінюється
- `src/components/Timeline.tsx` — старий, замінюється
- `src/components/cabinet/DndSettings.tsx` — перевірити використання
- `src/components/cabinet/SlotCard.tsx` — перевірити використання
- `src/components/cabinet/SubscriptionWizard.tsx` — перевірити використання

---

## Додаток A: Компонентна карта

### Нові компоненти які створити:

```
src/components/
├── home/
│   ├── HeroCard.tsx           ← grid-based hero (icon + text + capsule + timeline)
│   ├── DashboardBar.tsx       ← dash-container (date + clock)
│   ├── InteractiveTimeline.tsx ← 48-segment timeline with scrubber
│   └── SubqueueSelector.tsx   ← horizontal card carousel
├── cabinet/
│   ├── ProfileBlock.tsx       ← v3-profile-block
│   ├── NotificationCard.tsx   ← v3-card (active/empty)
│   ├── SettingsSection.tsx    ← soft-container + soft-items
│   └── InfoSection.tsx        ← light-list + light-items
├── shared/
│   ├── BottomSheet.tsx        ← universal modal sheet
│   ├── Toast.tsx              ← notification toast
│   ├── QueuePickerOverlay.tsx ← fullscreen grid picker
│   └── LoadingScreen.tsx      ← SVG bulb animation
└── navigation/
    └── BottomNav.tsx          ← glass-nav with 4 tabs
```

### Компоненти які видалити/замінити:

| Старий файл | Замінюється на |
|---|---|
| `components/HeroCard.tsx` | `components/home/HeroCard.tsx` |
| `components/Selector.tsx` | `components/home/SubqueueSelector.tsx` |
| `components/Timeline.tsx` | `components/home/InteractiveTimeline.tsx` |
| `components/GroupSelector.tsx` | `components/shared/QueuePickerOverlay.tsx` |
| `components/cabinet/SlotCard.tsx` | `components/cabinet/NotificationCard.tsx` |
| `components/cabinet/DndSettings.tsx` | Інтегрується в `SettingsSection.tsx` |
| `components/cabinet/SubscriptionWizard.tsx` | Інтегрується в `BottomSheet.tsx` |

---

## Додаток B: Файлова карта змін

### Файли які ЗМІНИТИ:

| Файл | Що змінити |
|---|---|
| `web/index.html` | Body класи, Google Fonts, meta-теги, favicon |
| `web/src/main.tsx` | Прибрати зайві CSS-імпорти |
| `web/src/App.tsx` | 4 вкладки навігації, page-class обгортка, нові routes |
| `web/src/pages/Home.tsx` | Повний перепис з правильними CSS-класами |
| `web/src/pages/Cabinet.tsx` | Повний перепис з правильними CSS-класами |
| `web/src/styles/index.css` | Прибрати background: #000 з body |
| `web/src/styles/legacy/style.css` | Прибрати !important на body background |
| `web/src/styles/legacy/cabinet-v3.css` | Прибрати дублювання body стилів |
| `web/src/services/scheduleService.ts` | Додати BASE_URL до fetch |
| `web/src/services/adminService.ts` | Додати BASE_URL до fetch |
| `web/vite.config.ts` | theme_color в manifest |

### Файли які СТВОРИТИ:

| Файл | Опис |
|---|---|
| `src/components/home/HeroCard.tsx` | Hero card компонент |
| `src/components/home/DashboardBar.tsx` | Date + Clock bar |
| `src/components/home/InteractiveTimeline.tsx` | Timeline з 48 сегментами |
| `src/components/home/SubqueueSelector.tsx` | Horizontal card selector |
| `src/components/cabinet/ProfileBlock.tsx` | Profile header |
| `src/components/cabinet/NotificationCard.tsx` | Slot notification card |
| `src/components/cabinet/SettingsSection.tsx` | Settings list |
| `src/components/cabinet/InfoSection.tsx` | Info/about list |
| `src/components/shared/BottomSheet.tsx` | Modal bottom sheet |
| `src/components/shared/Toast.tsx` | Toast notification |
| `src/components/shared/QueuePickerOverlay.tsx` | Queue picker |
| `src/components/shared/LoadingScreen.tsx` | Loading animation |
| `src/components/navigation/BottomNav.tsx` | 4-tab navigation |
| `src/pages/Archive.tsx` | Stub page |
| `src/pages/Apps.tsx` | Stub page |
| `src/styles/pages.css` | Page-specific backgrounds |

### Файли які ВИДАЛИТИ:

| Файл | Причина |
|---|---|
| `src/App.css` | Не використовується |
| `src/assets/react.svg` | Дефолтний Vite |
| `src/assets/vite.svg` | Дефолтний Vite |
| `src/styles/legacy/tomorrow-timeline.css` | Tomorrow буде з нуля |

---

## ⏱ Орієнтовний порядок виконання

```
Фаза 1 (Фундамент)          ████████░░  ~30 хв
├── 1.1 index.html body
├── 1.2 Google Fonts
├── 1.3 CSS imports split
├── 1.4 Body conflicts cleanup
├── 1.5 index.css cleanup
├── 1.6 fetchSchedule base path
├── 1.7 Image imports
└── 1.8 Admin service paths

Фаза 2 (Home)                ██████████  ~60 хв
├── 2.1 Home.tsx rewrite
├── 2.2 SubqueueSelector.tsx
├── 2.3 InteractiveTimeline.tsx
├── 2.4 HeroCard.tsx
└── 2.5 DashboardBar.tsx

Фаза 3 (Cabinet)             ████████░░  ~40 хв
├── 3.1 Cabinet page background
├── 3.2 ProfileBlock.tsx
├── 3.3 NotificationCard.tsx
├── 3.4 BottomSheet.tsx
├── 3.5 Toast.tsx
└── 3.6 Cabinet CSS imports

Фаза 4 (Navigation)          ████░░░░░░  ~20 хв
├── 4.1 BottomNav.tsx (4 tabs)
├── 4.2 Archive.tsx + Apps.tsx stubs
└── 4.3 Routes update

Фаза 5 (Polish)              ████░░░░░░  ~20 хв
├── 5.1 LoadingScreen.tsx
├── 5.2 QueuePickerOverlay.tsx
├── 5.3 PWA manifest fix
├── 5.4 Meta tags
└── 5.5 Cleanup unused files
```

---

## ✅ Критерії успіху

1. **Home** виглядає ідентично оригіналу: чорний фон, hero card з glass-ефектом, dashboard bar, selector carousel
2. **Cabinet** виглядає ідентично оригіналу: світлий фон, profile block, notification cards, settings, light list
3. **Навігація** — 4 вкладки, glass-nav фіксований знизу, active стан оранжевий
4. **Дані** завантажуються коректно з `/data/today.json`
5. **Зображення** відображаються (power_on/off, icons)
6. **Шрифти** Inter, Outfit, Tektur працюють
7. **CSS** — відсутні конфлікти між сторінками
8. **PWA** — manifest коректний, SW реєструється
