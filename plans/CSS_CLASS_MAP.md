# Технічна карта: CSS-класи оригіналу → React-компоненти

> Швидкий довідник: які CSS-класи з legacy стилів використовувати в кожному компоненті.  
> Джерело: SSSK/pwa/index.html, cabinet.html та відповідні CSS файли.

---

## HOME PAGE

### Потрібні CSS файли:
- `style.css` — глобальні стилі, навігація, overlays
- `home.css` — dashboard tablo, queue selector, capsule clock
- `tech-ui.css` — hero card (grid layout, capsule, timeline, dash-container)
- `selector.css` — subqueue pill selector
- `sssk-modern.css` — section spacing, pointer overrides

---

### HeroCard.tsx

```
CSS-файл: tech-ui.css

Кореневий елемент:
  #smart-hero.hero-card.status-on  (або .status-off)

Grid layout (tech-ui.css):
  grid-template-columns: auto 1fr auto
  grid-template-rows: 1fr auto

Дочірні елементи:
┌─────────────────────────────────────────────────┐
│ .hero-icon         │ .hero-text-block │ .hero-  │
│   > img            │   > .hero-status │ phase   │
│   (64×64)          │   > .hero-timer  │  > .phase-track
│                    │   > .hero-context │  > .phase-fill
│                    │     .hero-context │  > .phase-dot ×3
│                    │     --active      │         │
├─────────────────────────────────────────────────┤
│ .hero-timeline-capsule (grid-column: 1/span 3)  │
│   > .hero-tl-track                              │
│     > .hero-tl-segments                         │
│       > div.hero-tl-segment.available/unavailable│
│     > .hero-tl-pointer (absolute, left: %)      │
└─────────────────────────────────────────────────┘

Статус-залежні класи:
  .hero-card.status-on  → border-color: orange, phase-fill orange
  .hero-card.status-off → border-color: grey, phase-fill grey

Зображення:
  status-on  → power_off.png (значок "вимкнути" = зараз увімкнено)
  status-off → power_on.png  (значок "увімкнути" = зараз вимкнено)
```

---

### DashboardBar.tsx

```
CSS-файл: tech-ui.css

Кореневий елемент:
  #dynamic-info-block.dash-container.status-on (або .status-off)

Grid layout (tech-ui.css):
  grid-template-columns: 1fr 1fr
  height: 48px

Дочірні елементи:
┌──────────────────────┬──────────────────────┐
│ .dash-segment        │ .dash-segment        │
│ .dash-date           │ .dash-clock          │
│   > .dash-day (ПН)   │   > span (18:45)     │
│   > .dash-date-num   │   > .dash-clock-sec  │
│     (23.04.2026)     │     (32)             │
└──────────────────────┴──────────────────────┘

Статус-залежні кольори:
  .status-on  → .dash-day color: #ee7221 (orange)
  .status-off → .dash-day color: #374151 (grey)
```

---

### SubqueueSelector.tsx

```
CSS-файл: selector.css

Кореневий елемент:
  #subqueue-selector  (+ клас .dark або .light)
    └── .selector-wrap
        └── .selector-container (glass bg, border = accent color)
            └── .selector-scroll (horizontal scroll, flex, gap: 8px)
                └── .selector-card (×12, flex: 0 0 56px)
                    ├── .status-dot.on / .status-dot.off (6×6 кружок)
                    ├── .selector-num (22px, число "1.1")
                    └── .selector-label (8px, "підчерга", display:none / block)

Стани:
  .selector-card.active → scale(1.05), border: 2px solid accent, box-shadow
  
  #subqueue-selector.dark  → accent = #FF5C00 (power ON)
  #subqueue-selector.light → accent = #475569 (power OFF)

Fade-ефекти:
  .selector-container::before (left fade)
  .selector-container::after  (right fade)
```

---

### InteractiveTimeline.tsx (спрощена версія)

```
CSS-файл: style.css (scrubber-preview, timeline classes)

Кореневий елемент:
  .section-container (padding: 0 34px)
    └── .interactive-timeline-container (або custom)
        ├── 48 сегментів (div)
        ├── input[type=range].timeline-scrubber
        └── .scrubber-preview.preview-on / .preview-off
            ├── час (span)
            └── статус (span)
```

---

## CABINET PAGE

### Потрібні CSS файли:
- `style.css` — глобальні стилі, навігація
- `cabinet-v3.css` — весь cabinet UI

---

### ProfileBlock.tsx

```
CSS-файл: cabinet-v3.css

Кореневий елемент:
  .v3-profile-block
    ├── .v3-avatar (54×54, border-radius: 50%)
    └── .v3-profile-info
        ├── .v3-profile-main-row
        │   └── .v3-profile-name ("Локальний режим")
        ├── .v3-profile-status ("Дані збережено у вашому браузері")
        └── .v3-profile-meta (опціонально)
```

---

### NotificationCard.tsx

```
CSS-файл: cabinet-v3.css

Варіант A — Активний слот:
  .v3-card.active
    └── .v3-card-row
        ├── .v3-card-left
        │   ├── .v3-card-title (locationName)
        │   └── .v3-card-subtitle (group)
        └── .v3-card-right
            └── .v3-card-right-top (notifyTime + " хв")

Варіант B — Порожній слот:
  .v3-card.empty
    └── .v3-card-empty-text ("+ Додати сповіщення")
```

---

### SettingsSection.tsx

```
CSS-файл: cabinet-v3.css

Кореневий елемент:
  .cabinet-section
    └── .soft-container
        ├── .soft-item (Стартова підчерга)
        │   ├── .soft-left
        │   │   ├── svg.soft-icon
        │   │   └── .soft-label
        │   └── div
        │       ├── .soft-value ("1.1")
        │       └── .soft-chevron ("›")
        │
        └── .soft-item (Графік на завтра)
            ├── .soft-left
            │   ├── svg.soft-icon
            │   └── .soft-label
            └── .v3-toggle / .v3-toggle.on
```

---

### InfoSection.tsx

```
CSS-файл: cabinet-v3.css

Кореневий елемент:
  .cabinet-section
    └── .light-list
        └── .light-item (×3)
            ├── .light-left
            │   ├── svg.light-icon
            │   └── .light-label
            └── .light-chevron ("›")
```

---

## NAVIGATION (glass-nav)

```
CSS-файл: style.css

Кореневий елемент:
  nav.glass-nav (fixed bottom, blur, max-width: 410px)
    └── .nav-item (×4)   → Link component
        ├── .nav-item.active → color: #ee7221, bg: rgba(238,114,33,0.1)
        ├── span.icon > svg (24×24, fill: currentColor)
        └── span.nav-text (11px, font-weight: 600)

Вкладки:
  [0] Home     → path="/"         viewBox="0 0 640 640" (house)
  [1] Archive  → path="/archive"  viewBox="0 0 640 640" (calendar)
  [2] App      → path="/apps"     viewBox="0 0 384 512" (bookmark)
  [3] Profile  → path="/cabinet"  viewBox="0 0 640 640" (person)
```

---

## OVERLAYS

### QueuePickerOverlay.tsx
```
CSS-файл: style.css, home.css

  .overlay#home-queue-picker-overlay (.active → display:flex)
    └── .picker-container.fade-in-up
        ├── .picker-header
        │   ├── h2.picker-title ("Оберіть підчергу")
        │   └── .picker-close (svg ×)
        └── .group-grid (grid 3 cols)
            └── .group-btn (×12) / .group-btn.active
                ├── .status-dot / .status-dot.off
                └── .group-num ("1.1")
```

### BottomSheet.tsx
```
CSS-файл: cabinet-v3.css

  .v3-bottom-sheet-overlay (.active → opacity:1, pointer-events:auto)
    └── .v3-bottom-sheet (transform: translateY)
        ├── .v3-sheet-handle (36×5 drag indicator)
        ├── .v3-sheet-header-wrapper
        │   ├── button.v3-sheet-close-btn
        │   ├── h2.v3-sheet-header (title)
        │   └── div (spacer 36px)
        └── .v3-sheet-content (dynamic content)
```

### Toast.tsx
```
CSS-файл: cabinet-v3.css

  .v3-toast-container (.show → bottom: 100px)
    └── .v3-toast (dark glass pill, text)
```
