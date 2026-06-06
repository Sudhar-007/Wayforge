# Wayforge — Design Tokens

Portable source of truth for the Wayforge redesign. Two files do the work:

| File | Role |
| --- | --- |
| `wayforge.tokens.css` | All design tokens as CSS variables (light + dark) **plus** ready-made component classes (`.pf-btn`, `.pf-card`, `.pf-input`, …). This is the canonical source. |
| `tailwind.config.js` | Maps every token to a Tailwind `theme` key so you get utilities (`bg-accent`, `text-2`, `rounded-md`, `text-h1`, …). Semantic tokens point at `var(--…)`, so they flip with the theme automatically. |

## Install

1. Drop both files into your project (e.g. `src/styles/wayforge.tokens.css`, root `tailwind.config.js`).
2. Import the tokens once, globally — **before** Tailwind's layers:
   ```css
   /* src/index.css */
   @import "./styles/wayforge.tokens.css";
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Load the three webfonts (already in `wayforge.tokens.css` comments):
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
   ```

## Light / dark

The theme switches on a single attribute — no class juggling:

```html
<html data-theme="light">   <!-- or data-theme="dark" -->
```

`darkMode: ['selector', '[data-theme="dark"]']` is already set in the config, so `dark:` variants also work if you prefer them. Every **semantic** token (`--accent`, `--bg`, `--surface`, `--text*`, `--border*`, node/section/status/edge colors, shadows) is redefined under `[data-theme="dark"]`, so the same utility renders correctly in both modes. The green brightens (`#0a9457` → `#34cf7e`) so it keeps its pop on charcoal.

---

## Token → Tailwind map

### Accent (one green, flips per theme)
| CSS var | Tailwind utility | Light | Dark |
| --- | --- | --- | --- |
| `--accent` | `bg-accent` / `text-accent` / `border-accent` | `#0a9457` | `#34cf7e` |
| `--accent-hover` | `bg-accent-hover` | `#097a49` | `#6fe3a0` |
| `--accent-soft` | `bg-accent-soft` | `#ecfdf3` | `rgba(20,179,104,.14)` |
| `--accent-on` | `text-accent-on` | `#ffffff` | `#04140c` |

Full static ramp also available: `green-50 … green-900` (e.g. `bg-green-600`).

### Neutrals (charcoal → white)
| CSS var | Tailwind utility | Light | Dark |
| --- | --- | --- | --- |
| `--bg` | `bg-bg` | `#f7f8f9` | `#0c0e10` |
| `--bg-elev` | `bg-bg-elev` | `#ffffff` | `#121417` |
| `--surface` | `bg-surface` | `#ffffff` | `#161a1d` |
| `--surface-2` | `bg-surface-2` | `#fcfcfd` | `#1b2024` |
| `--surface-3` | `bg-surface-3` | `#eef0f2` | `#21272c` |
| `--border` | `border-border` | `#e3e6e9` | `#282e33` |
| `--border-strong` | `border-border-strong` | `#cdd2d7` | `#353c42` |
| `--text` | `text-text` | `#16191c` | `#f4f6f7` |
| `--text-2` | `text-2` | `#4d555c` | `#aeb6bd` |
| `--text-3` | `text-3` | `#6c757e` | `#828b92` |
| `--text-4` | `text-4` | `#9aa2aa` | `#5e666d` |

Full static ramp: `neutral-0 … neutral-950`.

### Node / canvas / status (maps 1:1 onto your current `tailwind.config.js`)
| CSS var | Tailwind utility | Notes |
| --- | --- | --- |
| `--node-surface` | `bg-node-surface` | replaces `node.bg` |
| `--node-border` | `border-node-border` | replaces `node.border` |
| `--section-surface` / `--section-text` | `bg-section-surface` / `text-section-text` | section-header node |
| `--canvas-dot` | `bg-canvas-dot` | dotted canvas background |
| `--status-not` | `status-not-started` | neutral |
| `--status-prog` | `status-in-progress` | amber `#e8911c` |
| `--status-done` | `status-completed` | green (reinforces accent) |
| `--status-skip` | `status-skipped` | muted |
| `--edge-required` / `--edge-optional` | `edge-required` / `edge-optional` | DAG edge strokes |

> Status keeps its **own** scale, distinct from the UI accent, so progress stays legible. This slots directly into `src/lib/statusStyles.ts` — swap the literal class strings for the `status-*` utilities above.

### Typography
| Token | Tailwind | Value |
| --- | --- | --- |
| display font | `font-display` | Schibsted Grotesk |
| text/UI font | `font-sans` | Hanken Grotesk |
| mono | `font-mono` | JetBrains Mono |
| `--t-display` | `text-display` | 60 / 1.02 / -0.03em / 700 |
| `--t-h1` | `text-h1` | 40 / 1.06 / -0.025em |
| `--t-h2` | `text-h2` | 28 / 1.12 / -0.02em |
| `--t-h3` | `text-h3` | 20 / 1.25 / -0.012em |
| `--t-lg` | `text-lg` | 17 / 1.5 |
| `--t-base` | `text-base` | 15 / 1.55 |
| `--t-sm` | `text-sm` | 13.5 / 1.5 |
| `--t-xs` | `text-xs` | 12 / 1.4 |
| `--t-eyebrow` | `text-eyebrow` | 11.5 / 0.14em, uppercase, mono |

### Spacing · Radius · Shadow
| Token | Tailwind | Value |
| --- | --- | --- |
| `--s-1 … --s-24` | `p-1 m-2 gap-6 …` | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 px |
| `--r-sm` | `rounded-sm` | 7px |
| `--r-md` | `rounded-md` | 11px — **buttons, inputs** |
| `--r-lg` | `rounded-lg` | 16px — **cards** |
| `--r-xl` | `rounded-xl` | 22px — **modals** |
| `--r-pill` | `rounded-pill` | 999px — pills, progress |
| `--shadow-sm/md/lg` | `shadow-sm/md/lg` | subtle in light; border-led in dark |

---

## Component classes (optional, in `wayforge.tokens.css`)

If you'd rather not rebuild primitives in Tailwind, these are ready to use and already theme-aware:

`.pf-btn` (`--primary` `--secondary` `--ghost` `--danger`, sizes `--sm` `--lg` `--block`) · `.pf-card` (`--hover`) · `.pf-pill` · `.pf-input` `.pf-select` `.pf-textarea` `.pf-label` `.pf-hint` · `.pf-seg` / `.pf-seg-item` (segmented control) · `.pf-status` · `.pf-progress` · `.pf-iconbtn` · `.pf-divider`.

All of them read the tokens above, so changing a variable re-skins every component in both themes.
