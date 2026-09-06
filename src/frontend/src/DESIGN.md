# Design Brief — Labour Manager

## Overview
A mobile-first full-stack app for organizations to manage labour contracts, attendance tracking, advances, salary payments, and labour records. Built on the Internet Computer with a Motoko backend and React/TypeScript frontend.

## Theme
- **Type**: Premium dark labour management dashboard
- **Mood**: Professional, focused, industrial
- **Visual style**: Deep dark backgrounds with vibrant orange accents, glassmorphism cards, subtle glows

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Background | #0a0f1e | Page background |
| Card | #111827 | Card surfaces |
| Primary | #f97316 | Buttons, accents, highlights |
| Primary glow | rgba(249,115,22,0.4) | Glow effects |
| Success | #4ade80 | Present status |
| Danger | #ef4444 | Absent status |
| Warning | #f97316 | Partial attendance |
| Text primary | #f8fafc | Headings |
| Text secondary | #94a3b8 | Body text |
| Border | rgba(255,140,0,0.15) | Card borders |

## Typography
- **Display / Body**: Figtree (sans-serif)
- **Mono**: JetBrains Mono
- **Scale**: Tight, mobile-optimized

## Layout
- Mobile-first with bottom tab bar navigation
- Fixed header (edit mode only)
- Scrollable content area with bottom padding for tab bar
- Glassmorphism cards for dialogs and panels

## Components
- **Buttons**: Bold orange gradient primary; white outline secondary
- **Badges**: Color-coded for attendance (green/red/orange)
- **Cards**: Glassmorphism with subtle orange border glow
- **Dialogs**: Dark glass with stronger orange border
- **Tab Bar**: Fixed bottom, dark glass with orange top border

## Motion
- Fade-in on load (0.5s ease-out)
- Smooth transitions on all interactive elements
- Instant dialog open (no background shift)

## Accessibility
- High contrast text on dark backgrounds
- Visible focus rings
- Touch targets >= 44px
