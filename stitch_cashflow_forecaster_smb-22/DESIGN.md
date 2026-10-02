---
name: Horizon Clarity
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#42484a'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#72787b'
  outline-variant: '#c2c7cb'
  surface-tint: '#47626e'
  primary: '#001820'
  on-primary: '#ffffff'
  primary-container: '#0f2d37'
  on-primary-container: '#7895a1'
  inverse-primary: '#aecbd8'
  secondary: '#036c50'
  on-secondary: '#ffffff'
  secondary-container: '#9ef4d0'
  on-secondary-container: '#127256'
  tertiary: '#2b0a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a1b04'
  on-tertiary-container: '#c77f60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e7f4'
  primary-fixed-dim: '#aecbd8'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#2f4b55'
  secondary-fixed: '#9ef4d0'
  secondary-fixed-dim: '#83d7b5'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513b'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#6f371e'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
  surface-main: '#F9F7F2'
  surface-card: '#FFFFFF'
  text-primary: '#1A1A1A'
  text-muted: '#606060'
  border-subtle: '#E5E1D8'
  success-soft: '#E8F5EE'
  warning-soft: '#FDF2ED'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  display-price:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  container-max: 1200px
---

## Brand & Style

The design system is built on a foundation of **Modern Professionalism**. It draws inspiration from the "New Fintech" movement—exemplified by platforms like Mercury and Stripe—where the interface acts as a calm, invisible advisor rather than a complex tool. 

The primary goal is to transform financial anxiety into a sense of control. This is achieved through:
- **Minimalism:** Heavy use of "breathing room" (whitespace) to prevent information density from feeling overwhelming.
- **Corporate Modernity:** A balanced, structured layout that feels institutional yet accessible.
- **Reassurance:** Using soft edges, warm background tones, and a "human" tone of voice in microcopy to move away from the clinical feel of traditional banking.
- **Tactile Softness:** Subtle depth through soft shadows and layered surfaces makes the UI feel tangible and reliable.

## Colors

The palette is designed to be "Financial-Grade" but approachable. 

- **Primary (Deep Teal):** Used for navigation, headers, and primary actions. It provides the grounding "Trust" element.
- **Secondary (Mint):** Used exclusively for healthy states, positive growth, and "Connect" actions. It represents the "Safe" zone.
- **Tertiary (Warm Coral):** A non-alarming warning color. It signals attention without triggering panic, used for projected shortfalls.
- **Background (Cream):** A warm off-white (`#F9F7F2`) is used instead of pure white to reduce eye strain and feel more like a premium physical document.

Color is used functionally: if the line chart is Mint, the user is safe. If it shifts to Coral, action is required.

## Typography

This design system employs a dual-font strategy:
1. **Plus Jakarta Sans (Headings):** Selected for its friendly, rounded terminals that soften the "seriousness" of financial data. Used for balances, headers, and card titles.
2. **Inter (Body/Data):** Selected for its exceptional legibility in data-heavy contexts. Its neutral, systematic nature ensures that transaction lists and settings remain easy to scan.

**Hierarchy Rules:**
- Use `display-price` for the main dashboard balance.
- Use `label-md` for secondary metadata and table headers.
- Maintain a generous line-height (1.5x) for body text to improve readability for busy business owners.

## Layout & Spacing

The system uses a **Fluid Grid with fixed maximums** to ensure a premium feel on large displays while remaining functional on laptops.

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Rhythm:** An 8px base unit drives all spacing.
- **Sectioning:** Use large vertical gaps (64px+) between major dashboard sections (e.g., Forecast vs. Transaction List) to create a sense of calm.
- **Sidebar:** A fixed 280px left sidebar is used for navigation, providing a stable anchor for the application. On mobile, this transitions to a simplified bottom navigation bar.

## Elevation & Depth

To maintain a modern, clean look, this design system avoids heavy shadows in favor of **Tonal Layering** and **Ambient Depth**.

- **Level 0 (Background):** The warm off-white surface (`#F9F7F2`).
- **Level 1 (Cards/Content):** Pure white surfaces (`#FFFFFF`) with a very soft, diffused shadow (0px 4px 20px, 4% opacity of the Primary color).
- **Interactive States:** On hover, cards may lift slightly (0px 8px 30px, 8% opacity).
- **Outlines:** Use a `border-subtle` (`#E5E1D8`) for form inputs and table rows instead of shadows to keep the UI "flat" and crisp.

## Shapes

The shape language is "Generously Rounded." 

- **Primary Radius:** 16px (1rem) for all main dashboard cards and the chart container.
- **Component Radius:** 8px (0.5rem) for buttons, input fields, and tags.
- **Icons:** Use "rounded" icon sets (e.g., Lucide or Phosphor in Rounded/Duotone styles) to match the typography. 

Avoid sharp 90-degree corners entirely; they feel too "aggressive" for a reassuring financial co-pilot.

## Components

### Buttons
- **Primary:** Deep Teal background, white text, 8px radius. High contrast for "Connect Bank" or "Save."
- **Secondary:** Transparent with `border-subtle`, Deep Teal text.
- **Ghost:** No border or background until hover. Used for "Cancel" or "Dismiss."

### Charts (The Hero)
- **Line Chart:** 3px stroke width. Soft Mint for positive balance, transitioning to Warm Coral if the line crosses the $0 dashed threshold.
- **Fill:** A subtle 5% opacity gradient fill below the line to give the data "weight."

### Input Fields
- White background, 1px `border-subtle`, 8px radius. 
- Focus state: 2px Deep Teal border with no outer glow.

### Status Pills (Chips)
- **Safe:** Mint background (10% opacity) with Deep Teal text.
- **Warning:** Coral background (10% opacity) with Deep Teal text.
- **Manual Entry:** A light gray pill to differentiate user-added data from bank-synced data.

### Shortfall Banner
- Positioned at the top of the dashboard.
- Warm Coral background at 10% opacity, 1px Coral border, matching Coral icon. 
- Avoid "Red" or "Alert" iconography; use "Info" or "Calendar" icons to keep the tone helpful.