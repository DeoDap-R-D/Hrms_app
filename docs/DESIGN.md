# TrackPunch — Design System & UI Redesign Plan

A premium, enterprise-grade redesign of the TrackPunch HRMS mobile app, inspired by the
craft of Stripe, Linear, Notion and Vercel — adapted natively for React Native.

> **Scope:** UI/UX, visual design, layout, spacing, typography, color, icons,
> motion, theming and state design only. **All APIs, workflows, data and features
> are unchanged.**

---

## 1. Design principles

1. **Calm, content-first surfaces** — generous whitespace, one accent, restrained color.
2. **8px spatial system** — every margin, padding, gap and size is a multiple of 4/8.
3. **Depth through light, not lines** — soft layered shadows + subtle borders, no heavy dividers.
4. **Motion with meaning** — short (150–260ms) eased transitions; entrance stagger, press feedback, skeletons.
5. **Legible hierarchy** — a tight type scale, 2 weights, strong contrast (WCAG AA).
6. **Themeable** — every color is a token; full light + dark parity.

---

## 2. Color palette

Brand is a refined **indigo** (premium evolution of the original corporate blue).

### Brand / accent
| Token | Hex |
|-------|-----|
| `brand` | `#4F46E5` |
| `brandHover` | `#4338CA` |
| `brandSoft` (gradient end) | `#6D5DF6` |
| `brandFg` (on-brand text) | `#FFFFFF` |

### Light theme
| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#F6F7F9` | app background |
| `surface` | `#FFFFFF` | cards, sheets |
| `surfaceAlt` | `#F1F3F6` | insets, chips |
| `border` | `#E7E9EE` | hairline borders |
| `text` | `#13151A` | primary text |
| `textMuted` | `#5A6172` | secondary text |
| `textSubtle` | `#9CA3B0` | tertiary / placeholders |
| `primary` | `#4F46E5` | interactive |
| `primarySoft` | `#EEF0FE` | tinted backgrounds |

### Dark theme
| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#0A0C10` | app background |
| `surface` | `#14171F` | cards, sheets |
| `surfaceAlt` | `#1B1F29` | insets, chips |
| `border` | `#262B36` | hairline borders |
| `text` | `#F4F6FA` | primary text |
| `textMuted` | `#A3ABBA` | secondary text |
| `textSubtle` | `#6B7280` | tertiary / placeholders |
| `primary` | `#818CF8` | interactive (lightened) |
| `primarySoft` | `#1E2236` | tinted backgrounds |

### Semantic (light / dark)
| Role | Light | Dark | Soft (L/D) |
|------|-------|------|------------|
| success | `#16A34A` | `#22C55E` | `#DCFCE7` / `#0E2A1A` |
| warning | `#D97706` | `#F59E0B` | `#FEF3C7` / `#2A1F0A` |
| danger | `#DC2626` | `#F87171` | `#FEE2E2` / `#2A1314` |
| info | `#4F46E5` | `#818CF8` | `#EEF0FE` / `#1E2236` |

---

## 3. Typography

System font stack (SF/Roboto) for native feel and zero load cost.

| Style | Size / Line | Weight | Tracking |
|-------|-------------|--------|----------|
| display | 32 / 38 | 800 | -0.5 |
| h1 | 26 / 32 | 700 | -0.4 |
| h2 | 21 / 28 | 700 | -0.3 |
| h3 | 17 / 24 | 600 | -0.2 |
| title | 16 / 22 | 600 | -0.1 |
| body | 15 / 22 | 400 | 0 |
| bodyMd | 15 / 22 | 500 | 0 |
| small | 13 / 18 | 500 | 0 |
| caption | 12 / 16 | 600 | 0.2 |
| overline | 11 / 14 | 700 | 0.8 (uppercase) |

---

## 4. Spacing, radius, elevation

- **Spacing (8px grid):** `1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48`.
- **Radius:** `sm=10, md=14, lg=18, xl=24, pill=999`.
- **Elevation:** `xs` (1dp), `sm` (3dp), `md` (8dp), `lg` (16dp) — soft, low-opacity, brand-tinted on CTAs.

---

## 5. Motion

| Interaction | Spec |
|-------------|------|
| Screen enter | native-stack slide; content fades+rises 8px, 240ms |
| List items | staggered fade/slide, 40ms step, cap 8 |
| Press | scale to 0.97, 120ms spring |
| Skeleton | shimmer pulse 1100ms loop |
| Tab change | icon scale + color tween 180ms |

Built on RN `Animated` (no native rebuild required).

---

## 6. Component specs

- **Button** — variants `primary` (gradient + brand shadow), `secondary` (soft fill), `outline`, `ghost`, `danger`; sizes `sm/md/lg`; press-scale; loading spinner; optional leading icon. Min touch target 44px.
- **Card** — `surface`, radius `lg`, elevation `sm`, optional pressable with press-scale.
- **Input / Textarea** — floating label, focus ring (brand), error state, leading icon, password reveal.
- **Select / DateField** — bottom-sheet picker, large touch rows, check state.
- **Badge / Pill** — semantic soft bg + bold fg.
- **Avatar** — image or gradient initials, ring option.
- **StatTile** — label + value + delta + icon, used in dashboards.
- **Skeleton** — shimmer blocks for list/detail loading.
- **EmptyState / ErrorState** — illustrative icon medallion, title, message, primary CTA + retry.
- **Header** — gradient hero (brand) or plain themed; large title + subtitle + actions.
- **SegmentedControl / ThemeToggle** — for filters and light/dark/system.

---

## 7. Dashboard structure (Home)

```
┌───────────────────────────────┐
│ Hero (brand gradient)         │
│  avatar · greeting · name     │  bell
│  ── live punch capsule ──     │  status dot + In time + worked
│  [ Punch In / Out ]  big CTA  │
├───────────────────────────────┤  (card overlaps hero -24)
│ StatTiles row: Present · Hrs  │
│ Quick actions grid (2×3)      │
│ Today / recent activity list  │
└───────────────────────────────┘
```

---

## 8. Responsive plan

RN targets phones primarily; the layout adapts by width breakpoints:
- `useResponsive()` exposes `width`, `isTablet` (≥600), `columns`.
- Grids: 3-col (phone) → 4-col (≥600) → 6-col (≥840).
- Content max-width 560 centered on tablets; cards gain horizontal padding.
- All touch targets ≥44px; font sizes fixed (no scaling jumps), honoring OS font scale.

---

## 9. Accessibility

- AA contrast on text/!interactive in both themes.
- `accessibilityRole`/`accessibilityLabel` on buttons, tabs, inputs.
- Focus rings on inputs; hit slop ≥8px; respects `prefers dark` via system theme.

---

## 10. Implementation map

| Layer | Files |
|-------|-------|
| Tokens | `src/theme/tokens.ts` |
| Provider/hook | `src/theme/ThemeProvider.tsx`, `useTheme`, `useThemedStyles` |
| Motion | `src/components/motion/*` (FadeInView, Pressable, Skeleton) |
| Responsive | `src/utils/responsive.ts` |
| Icon | `src/components/ui/Icon.tsx` |
| Components | `src/components/ui/*` (themed rebuild) |
| Screens | `src/screens/**` (adopt `useTheme`) |
