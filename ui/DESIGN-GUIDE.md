---
title: Zona Xtreme UI Design Guide
description: Dark theme, mobile-first guidelines for reusable shadcn-based components
---

## 1. Design Principles
1. **Dark-first experience:** Every screen loads in dark mode; avoid light backgrounds. Use light surfaces only as accents or overlays with opacity under 10%.
2. **Mobile-first:** Design bottom-up for 360–480px widths, then scale up to tablets (768–1024px) and desktop (1280px+). Changes on larger screens should feel like progressive enhancement.
3. **Minimalist Vercel-inspired visuals:** Keep layouts clean, remove decorative clutter, leverage whitespace, and favor purposeful typography.
4. **Consistent component library:** Build UI blocks as reusable shadcn components under `ui/src/components`. Avoid inline styling except for quick prototypes.
5. **Clarity over ornamentation:** Prioritize legibility, hierarchy, and predictable motion.

## 2. Color System (HSL references)
| Token | Value | Usage |
| --- | --- | --- |
| `--background` | `220 18% 6%` | Page background, gradients, app shell.
| `--foreground` | `210 40% 96%` | Primary text/icons.
| `--card` | `220 18% 10%` | Surfaces for cards, panels.
| `--card-foreground` | `210 40% 96%` | Text/icons inside cards.
| `--primary` | `210 100% 67%` | CTAs, critical emphasis, active state.
| `--secondary` | `220 15% 18%` | Secondary buttons, subdued containers.
| `--accent` | `265 80% 70%` | Highlights, progress, subtle accent lines.
| `--muted` | `220 10% 35%` | Borders, dividers, subtle text.
| `--destructive` | `0 72% 55%` | Error copy, destructive buttons.
| `--ring` | `210 100% 67%` | Focus ring + interactive outlines.

**Gradients:** Use subtle atmospheric gradients (opacity < 40%) anchored to top-left or bottom-right only. Combine with blur/glass effects sparingly.

## 3. Typography & Iconography
- **Typeface:** `"Space Grotesk", "Inter", sans-serif` for headings; `"Inter", system sans` for body.
- **Scale:**
  - Title: `clamp(1.5rem, 2.8vw, 2.4rem)`
  - Section heading: `clamp(1.1rem, 1.8vw, 1.5rem)`
  - Body: `1rem` (base 16px). Use `0.875rem` for metadata.
- **Weights:** 500 for headings, 400 for paragraphs, 600 for CTA buttons.
- **Icons:** Use phosphor icons or lucide-react with stroke width 1.5. Maintain a minimum touch target of 44px.

## 4. Layout & Spacing
- **Grid:** Base spacing unit = 4px. Compose sections using multiples of 8px for vertical rhythm.
- **Containers:**
  - Mobile: full-bleed with 16px horizontal padding.
  - Tablet: max-width 768px, 24px padding.
  - Desktop: max-width 1200px, 32px padding; split panes at ≥1024px using `grid-cols-[1fr_320px]` where needed.
- **Cards:** Apply `.glass` utility or Tailwind classes `bg-card/70 backdrop-blur border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]`.

## 5. Component Guidelines (shadcn wrappers)
1. **Location:** `ui/src/components/<ComponentName>`. Export composed components that wrap shadcn primitives plus domain props.
2. **Props:** Prefer declarative props like `variant="warning"` instead of manual class names. Expose `className` for edge cases.
3. **State tokens:** Map success/warning/error variants to color tokens: `success -> accent`, `warning -> 45 100% 50%`, `error -> destructive`.
4. **Interactive states:**
   - Hover: lighten foreground or elevate opacity by +10%.
   - Active: translate by `translate-y-0.5` and reduce shadow.
   - Focus: `ring-2 ring-primary/70 offset-2 offset-background`.
5. **Animations:** Use the predefined `fadeIn`, `slideIn`, and CSS-based stagger (add `animation-delay`). Keep durations ≤ 400ms.

## 6. Responsive Behavior
- **Stack first:** Mobile screens stack vertically; convert to `grid` or `flex-row` at `md:` breakpoints.
- **Toolbar:** On phones, place critical actions in a bottom sheet or sticky footer; on desktop move them to the top-right.
- **Tables/Data:** Use cards with key-value pairs on mobile. Switch to data tables (`<Table>`) only after `lg:`.
- **Charts/Timers:** Maintain 16:9 ratio using `aspect-video` and allow shrink to 280px width. Ensure tick labels remain readable.

## 7. Motion & Feedback
- **Transitions:** Default to `transition-all duration-200 ease-out`.
- **Micro-interactions:** Limit to one animation per component. Combine scale (`scale-95`), opacity, or blur for emphasis.
- **Skeletons:** Use `animate-pulse` with `bg-secondary/60` for loading states lasting >400ms.
- **Realtime updates:** When data updates via WebSocket, flash a `bg-accent/20` overlay for 600ms to signal change.

## 8. Accessibility & Internationalization
- Maintain 4.5:1 contrast for text vs. background; verify tokens before merging.
- All interactive elements must be reachable via keyboard (`Tab`) and include `aria-label` when the label is not textual.
- Copy is Spanish in UI but English in code/comments. Keep translations in locale files.
- Provide haptic-style feedback cues using subtle vibration (web `navigator.vibrate`) only on supported devices.

## 9. Implementation Checklist
1. Apply `.dark` class at the root (already enabled in `main.tsx`).
2. Import shared CSS tokens from `globals.css` in every route entry.
3. Build new modules by composing shadcn primitives (Button, Card, Dialog, Sheet, Tabs) and exporting them from `ui/src/components`.
4. Validate mobile layout in Chrome dev tools (iPhone 12) before QA.
5. Document any deviation from this guide inside the PR description.
