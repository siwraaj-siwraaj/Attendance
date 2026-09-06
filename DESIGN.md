# Design Brief

## Direction

Rossie — a dark, dense attendance & salary manager for construction labour, with a role-based permission system and admin panel.

## Tone

Industrial/utilitarian construction ledger: warm charcoal surfaces, sharp amber brand accent, high information density, restrained decoration.

## Differentiation

Role-aware surfaces: distinct semantic role badges (admin/attendance/contract/view/pending) and a tab bar that reconfigures per permission, so access level is visible at a glance.

## Color Palette

| Token              | OKLCH           | Role                                   |
| ------------------ | --------------- | -------------------------------------- |
| background         | 0.13 0.012 60   | App base (warm near-black)             |
| foreground         | 0.93 0.01 60    | Primary text                           |
| card               | 0.16 0.014 60   | Cards, tables, panels                  |
| popover            | 0.19 0.016 60   | Dropdowns, dialogs                     |
| primary            | 0.72 0.15 55    | Brand amber — CTAs, active states      |
| primary-foreground | 0.16 0.02 60    | Dark text on amber                     |
| secondary          | 0.2 0.015 60    | Secondary buttons                      |
| muted              | 0.2 0.015 60    | Muted fills                            |
| muted-foreground   | 0.65 0.02 60    | Labels, secondary text                 |
| accent             | 0.24 0.02 60    | Hover / selected surfaces              |
| destructive        | 0.6 0.2 25      | Remove access, delete                  |
| success            | 0.65 0.15 150   | Present / approved                     |
| warning            | 0.75 0.14 80    | Partial / pending role                 |
| border             | 0.24 0.015 60   | Hairlines, dividers                    |
| input              | 0.19 0.016 60   | Form fields                            |
| ring               | 0.72 0.15 55    | Focus rings                            |

## Typography

- Display: Space Grotesk — app title, section headings, summary values (bold, tight tracking)
- Body: Figtree — UI labels, table content, forms
- Mono: Geist Mono — attendance counts, salary figures, tabular numeric columns
- Scale: headings text-lg/xl font-bold tracking-tight, labels text-xs font-semibold uppercase tracking-widest, body text-sm/base

## Elevation & Depth

Layered dark surfaces with subtle elevation: `bg-card` panels, `shadow-card` for floating elements, `shadow-elevated` for dialogs; hierarchy from borders and the amber accent rather than heavy shadows.

## Structural Zones

| Zone          | Background  | Border   | Notes                                   |
| ------------- | ----------- | -------- | --------------------------------------- |
| Top header    | `bg-card`   | border-b | brand left, role badge + actions right  |
| Tab bar       | `bg-card`   | border-t | fixed bottom, amber active indicator    |
| Content       | `bg-background` | —    | cards on background, alt `bg-muted/30`  |
| Admin panel   | `bg-card`   | border   | user rows with role badges + actions    |
| Footer/status | `bg-muted/40` | border-t | pending-approval waiting screen         |

## Spacing & Rhythm

Consistent 16–24px section gaps, 8px cell padding, tight 4px micro-spacing; dense tabular-num figures for aligned numeric columns; max-width content column ~1100px.

## Component Patterns

- Buttons: rounded-md, `bg-primary` amber for primary actions, `bg-secondary` for secondary, `bg-destructive` for remove-access
- Cards: rounded-lg `bg-card` with `border-border` hairline, `shadow-card` on elevation
- Badges: pill (rounded-full) role badges — amber admin, green attendance, gold contract, grey view, red pending
- Tables: `bg-card`, sticky header, alternating `bg-muted/30` rows, right-aligned mono numeric cells
- Login form: `.login-card` glass panel, `.login-label` uppercase labels, `.login-input` amber-ringed fields, `.login-submit` amber gradient CTA, `.login-error` destructive banner for invalid credentials
- Combined flow: `.flow-step` stepper (dot + label) with `.flow-step-active` amber and `.flow-step-done` green states, `.flow-connector` hairlines

## Motion

- Entrance: `fade-in` 0.5s ease-out on tab/content switch and login card reveal
- Hover: `transition-smooth` 0.3s on buttons, rows, and interactive rows
- Decorative: subtle `ambient-glow` amber orbs; skeleton shimmer while loading
- Flow: step dots transition 0.25s between pending → active → done

## Constraints

- Token-only styling; no raw hex in components
- Role badges use semantic OKLCH tokens, not fixed hex
- View Only role renders only the Attendance tab (no other tabs)
- Report/print palette stays light and independent of app theme
- AA+ contrast in both light and dark modes
- Single unified login form — no admin/user mode toggle, no Internet Identity
- Login error state uses `.login-input-error` + `.login-error` destructive banner
- Combined contract+attendance flow uses the `.flow-step` stepper (no dead zones)

## Signature Detail

The amber role-badge + active-tab indicator system — one sharp accent colour that makes each user's access level and current section instantly scannable across the dense ledger layout.
