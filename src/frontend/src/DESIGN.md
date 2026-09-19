# Design Brief — Rossie

## Overview
A mobile-first full-stack app for organizations to manage labour contracts, attendance tracking, advances, salary payments, and labour records.

## Theme
- **Type**: Clean light mobile workforce management UI
- **Mood**: Professional, friendly, clear, practical
- **Visual style**: White cards over a pale blue background, navy typography, blue primary actions, orange secondary accents, soft rounded corners and restrained shadows
- **Reference**: The supplied Rossie mobile UI reference image

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Background | #F5F9FF | App/page background |
| Card | #FFFFFF | Cards, forms, dialogs |
| Primary | #2F7FF5 | Primary actions, active navigation, links |
| Primary dark | #1769DF | Button gradient endpoint |
| Primary soft | #EAF3FF | Active tabs, info surfaces |
| Secondary | #FF8A24 | Secondary actions and highlights |
| Secondary soft | #FFF2E5 | Orange status/accent surfaces |
| Success | #159B76 | Present/approved states |
| Danger | #DC3E50 | Absent/error states |
| Warning | #B66B00 | Pending/partial states |
| Text primary | #102A52 | Headings and primary content |
| Text secondary | #6D82A2 | Supporting text |
| Border | #DBE7F5 | Card/input separators |

## Typography
- **Display / Body**: Figtree
- **Mono**: Geist Mono
- **Scale**: Compact, mobile-optimized

## Layout
- Mobile-first with fixed bottom navigation
- Fixed headers where already required by the existing workflow
- Scrollable content with safe-area spacing
- Rounded cards and controls
- White dialog surfaces over a soft light backdrop

## Components
- **Buttons**: Blue gradient primary; orange reserved for secondary/accent actions
- **Badges**: Green/red/orange semantic states
- **Cards**: White surfaces with subtle blue-gray borders and soft shadows
- **Dialogs**: White cards with light borders and restrained elevation
- **Tab Bar**: White floating navigation with blue active state

## Motion
- Keep the existing transitions and swipe behavior
- Avoid heavy glow effects; use subtle elevation and state transitions

## Accessibility
- Maintain touch targets >= 44px
- Preserve visible focus rings
- Keep strong navy-on-white contrast
