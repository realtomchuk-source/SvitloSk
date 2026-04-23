# ✅ Чеклист виконання — SvitloSk Visual Recovery

> Позначайте `[x]` після виконання кожного пункту.

---

## Фаза 1: Фундамент

- [ ] 1.1 `index.html` — прибрати `class="bg-zinc-900 text-white overflow-hidden"` з body
- [ ] 1.2 `index.html` — додати Google Fonts (Inter, Outfit, Tektur) в `<head>`
- [ ] 1.3 `index.html` — виправити favicon та apple-touch-icon шляхи
- [ ] 1.4 `main.tsx` — прибрати CSS-імпорти: `home.css`, `tech-ui.css`, `selector.css`, `sssk-modern.css`, `cabinet-v3.css`
- [ ] 1.5 `main.tsx` — залишити тільки: `styles/index.css`, `styles/legacy/style.css`, `styles/pages.css`
- [ ] 1.6 `styles/index.css` — прибрати `background: #000` з body
- [ ] 1.7 `styles/legacy/style.css` — прибрати `background-color: #FAFAFA !important` з body
- [ ] 1.8 `styles/legacy/cabinet-v3.css` — прибрати глобальний body override
- [ ] 1.9 Створити `styles/pages.css` з page-home (dark) та page-cabinet (light) фонами
- [ ] 1.10 `scheduleService.ts` — додати `import.meta.env.BASE_URL` до fetch URL
- [ ] 1.11 `adminService.ts` — додати `import.meta.env.BASE_URL` до fetch URL
- [ ] 1.12 `Home.tsx` — замінити `src="assets/..."` на Vite import
- [ ] 1.13 Перевірити запуск: `npm run dev` → сторінка відкривається без помилок

---

## Фаза 2: Home Page

- [ ] 2.1 Створити `src/components/home/` папку
- [ ] 2.2 Створити `HeroCard.tsx` з правильною grid-структурою та CSS-класами
- [ ] 2.3 Створити `DashboardBar.tsx` з `.dash-container` структурою
- [ ] 2.4 Створити `SubqueueSelector.tsx` з `#subqueue-selector` обгорткою
- [ ] 2.5 Створити базовий `InteractiveTimeline.tsx` (48 сегментів)
- [ ] 2.6 Переписати `Home.tsx`:
  - [ ] Додати CSS-імпорти (home.css, tech-ui.css, selector.css, sssk-modern.css)
  - [ ] Обгортка з класом `page-home`
  - [ ] Використати нові компоненти
  - [ ] `.pwa-page-label` заголовок
  - [ ] `.section-container` для message
- [ ] 2.7 Перевірити: hero card відображається з glass-ефектом на чорному фоні
- [ ] 2.8 Перевірити: dashboard bar показує дату та годинник
- [ ] 2.9 Перевірити: selector carousel скролиться, active підсвічується
- [ ] 2.10 Перевірити: при зміні підчерги hero оновлюється

---

## Фаза 3: Cabinet Page

- [ ] 3.1 Створити `src/components/cabinet/` папку (оновити існуючу)
- [ ] 3.2 Створити `ProfileBlock.tsx` з `.v3-profile-block` класом
- [ ] 3.3 Створити `NotificationCard.tsx` з `.v3-card` класом
- [ ] 3.4 Створити `SettingsSection.tsx` з `.soft-container` + `.soft-item`
- [ ] 3.5 Створити `InfoSection.tsx` з `.light-list` + `.light-item`
- [ ] 3.6 Створити `src/components/shared/BottomSheet.tsx`
- [ ] 3.7 Створити `src/components/shared/Toast.tsx`
- [ ] 3.8 Переписати `Cabinet.tsx`:
  - [ ] Додати CSS-імпорт (cabinet-v3.css)
  - [ ] Обгортка з класом `page-cabinet`
  - [ ] Використати нові компоненти
  - [ ] Правильна структура секцій
- [ ] 3.9 Перевірити: світлий фон (gradient)
- [ ] 3.10 Перевірити: profile block з avatar та текстом
- [ ] 3.11 Перевірити: soft-container з toggle працює
- [ ] 3.12 Перевірити: light-list з chevron відображається

---

## Фаза 4: Навігація

- [ ] 4.1 Створити `src/components/navigation/BottomNav.tsx`
- [ ] 4.2 Створити `src/pages/Archive.tsx` (заглушка)
- [ ] 4.3 Створити `src/pages/Apps.tsx` (заглушка)
- [ ] 4.4 Оновити `App.tsx`:
  - [ ] Замінити inline nav на `<BottomNav />`
  - [ ] Додати routes для Archive та Apps
  - [ ] Видалити Tomorrow route (поки що)
- [ ] 4.5 Перевірити: 4 вкладки відображаються
- [ ] 4.6 Перевірити: active стан підсвічується оранжевим
- [ ] 4.7 Перевірити: перехід між сторінками працює

---

## Фаза 5: Полірування

- [ ] 5.1 Створити `src/components/shared/LoadingScreen.tsx`
- [ ] 5.2 Створити `src/components/shared/QueuePickerOverlay.tsx`
- [ ] 5.3 `vite.config.ts` — виправити `theme_color` на `#D77727`
- [ ] 5.4 `index.html` — додати `<link rel="manifest">` та meta теги
- [ ] 5.5 Видалити зайві файли: `App.css`, `react.svg`, `vite.svg`, `hero.png`
- [ ] 5.6 Фінальна перевірка: `npm run build` без помилок
- [ ] 5.7 Фінальна перевірка: `npm run preview` — все виглядає як оригінал

---

## Фінальний чек

- [ ] Home виглядає як https://realtomchuk-source.github.io/svitlo-starkon/pwa/index.html
- [ ] Cabinet виглядає як оригінальний cabinet.html
- [ ] Навігація — 4 вкладки, glass-nav
- [ ] Дані завантажуються (today.json)
- [ ] Зображення відображаються
- [ ] Шрифти Inter, Outfit, Tektur працюють
- [ ] CSS без конфліктів між сторінками
- [ ] Git commit: `git add . && git commit -m "fix: visual recovery — match original SSSK design"`
