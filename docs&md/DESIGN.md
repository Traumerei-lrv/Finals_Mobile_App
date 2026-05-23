---
name: Professional Velocity
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fa'
  on-surface: '#111c2c'
  on-surface-variant: '#43474e'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#1960a3'
  on-secondary: '#ffffff'
  secondary-container: '#7db6ff'
  on-secondary-container: '#00477f'
  tertiary: '#1b2127'
  on-tertiary: '#ffffff'
  tertiary-container: '#30363c'
  on-tertiary-container: '#989fa6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#d3e4ff'
  secondary-fixed-dim: '#a2c9ff'
  on-secondary-fixed: '#001c38'
  on-secondary-fixed-variant: '#004881'
  tertiary-fixed: '#dde3eb'
  tertiary-fixed-dim: '#c1c7cf'
  on-tertiary-fixed: '#161c22'
  on-tertiary-fixed-variant: '#41474e'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3fa'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  badge-label:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 16px
  stack-gap-sm: 8px
  stack-gap-md: 16px
  stack-gap-lg: 24px
  section-margin: 32px
---

## Brand & Style

The brand personality is rooted in reliability, efficiency, and professional growth. This design system facilitates a seamless connection between talent and opportunity by removing visual friction and emphasizing clarity. The target audience includes ambitious job seekers and streamlined corporate recruiters who require a high-trust environment.

The design style is **Corporate / Modern**. It leverages generous whitespace to reduce cognitive load during dense data browsing. Every interaction is designed to feel intentional and precise, moving away from decorative flourishes in favor of functional elegance and a structured, systematic aesthetic.

## Colors

The palette is anchored by a deep "Midnight Navy" primary color to establish authority and trust. A secondary "Corporate Blue" provides actionable contrast for buttons and links. 

Neutral grays are used to define information hierarchy without overwhelming the content. Role-based tokens are specifically assigned to distinguish user types:
- **Seeker:** A vibrant blue suggesting activity and potential.
- **Recruiter:** A stable green representing growth and placement.
- **Admin:** A neutral slate for oversight and management.

## Typography

This design system utilizes **Hanken Grotesk** for headings to provide a sharp, contemporary professional feel. For all functional text, body copy, and inputs, **Inter** is used for its exceptional legibility and systematic performance at small sizes.

On mobile devices, headlines scale down to prevent excessive line breaks, while body sizes remain at a minimum of 14px to ensure accessibility during quick scanning.

## Layout & Spacing

The design system employs a **Fluid Grid** model based on a 4px baseline unit. 

- **Mobile:** A 4-column layout with 16px gutters and 16px side margins.
- **Tablet/Desktop:** Content is centered within a max-width container (up to 1200px) using a 12-column grid.

Spacing follows a strict "Stack and Inline" philosophy, where vertical gaps between related cards are 16px, while distinct sections are separated by 32px to provide clear visual breathing room.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and subtle **Ambient Shadows**. 

The background uses a very light gray (#F7FAFC) to allow white cards to "pop" without high-contrast strain. Shadows are reserved for floating elements like Primary Action Buttons or active Job Cards. Shadows should be highly diffused: `0px 4px 12px rgba(26, 54, 93, 0.08)`, using a slight tint of the primary color to maintain brand harmony.

## Shapes

The shape language is **Soft**. A 4px (0.25rem) radius is the standard for most interface elements, including input fields and buttons. This provides a balance between the rigidity of corporate structures and the approachability of a modern mobile app. 

- **Cards:** Use `rounded-lg` (8px) to soften the layout.
- **Badges/Chips:** Use full pill-rounding to differentiate them from interactive buttons.

## Components

- **Buttons:** Primary buttons use the Midnight Navy background with white text. Secondary buttons use a transparent background with a 1px Midnight Navy border.
- **Role Badges:** Small, high-contrast labels using the role-based color tokens. Text is uppercase Inter (Bold).
- **Job Cards:** White surfaces with 8px corner radius and a 1px border (#E2E8F0). No shadow in the default state; a soft shadow on press/hover.
- **Input Fields:** 4px radius, 1px border (#CBD5E0). Active state uses a 2px Corporate Blue border.
- **Search Bar:** A prominent, full-width component with a light gray fill to distinguish it from the content cards below.
- **Lists:** Traditional list items separated by thin 1px dividers to maximize vertical density for job listings.