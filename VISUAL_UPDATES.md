# Visual Updates & Design Guide

## Color System

### Primary Colors
- **Blue** (#3b82f6) - In Progress actions, primary interface elements
- **Green** (#10b981) - Completed actions, success states
- **Purple** (#8b5cf6) - Hover states, secondary accents
- **Orange** (#f97316) - Call-to-action, submit buttons
- **Pink** (#ec4899) - Highlights, gradients

### Neutral Colors
- **Text Dark** (#0f1419) - Primary text
- **Text Muted** (#6b7280) - Secondary text, labels
- **Light Background** (#f8fafb) - Surface
- **Border Light** (#e5e7eb) - Dividers

### Backgrounds
- Light gradient: 135deg from soft blue (#f0f4ff) → soft orange (#fff4f0) → soft green (#f0fff4)
- Auth dark gradient: Deep purples and blues with subtle overlays

---

## Typography Hierarchy

### No Bold Text Policy
- Page titles: font-size 24px, font-weight 500-600
- Section headings: font-size 20px, font-weight 500
- Card titles: font-size 16px, font-weight 500
- Labels: font-size 13px, font-weight 500-700
- Body text: font-size 14-16px, font-weight 400-500

---

## Component Styling

### Stat Cards
```
• Background: White with transparency (rgba 95%)
• Border: Light gray, 1px
• Border-radius: 12px
• Shadow: 0 2px 8px rgba(15,20,25,0.06)
• Icon: Colored background (10% opacity matching icon color)
• Hover: Translate Y-4px, enhanced shadow
• Transition: 280ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Task Cards
```
• Background: White with 88% opacity
• Border: Light gray with 60% opacity
• Left border: 4px colored (priority-based)
• Border-radius: 10px
• Shadow: 0 2px 6px rgba(15,20,25,0.04)
• Hover: Translate Y-2px, enhanced shadow, stronger border
• Transition: 240ms cubic-bezier(0.34, 1.56, 0.64, 1)

Priority Colors:
- High: Red (#ef4444)
- Medium: Purple (#8b5cf6)
- Low: Blue (#3b82f6)
```

### Member Quick Action Buttons
```
In Progress Button:
• Background: Linear gradient 135deg from #3b82f6 to #0ea5e9
• Shadow: 0 4px 12px rgba(59,130,246,0.2)
• Border-radius: 8px
• Padding: 6px 10px
• Font-size: 12px, font-weight 500
• Icon: 14px
• Hover: Translate Y-2px, shadow 0 8px 20px rgba(59,130,246,0.3)
• Transition: 240ms cubic-bezier(0.34, 1.56, 0.64, 1)

Completed Button:
• Background: Linear gradient 135deg from #10b981 to #14b8a6
• Shadow: 0 4px 12px rgba(16,185,129,0.2)
• Hover: Translate Y-2px, shadow 0 8px 20px rgba(16,185,129,0.3)
• (Same structure as In Progress, different colors)
```

### Primary Buttons
```
• Background: Linear gradient 135deg from #10b981 to #14b8a6
• Color: White
• Shadow: 0 4px 12px rgba(16,185,129,0.25)
• Border-radius: 8px
• Min-height: 43px
• Hover: Translate Y-2px, enhanced shadow
• Active: Translate Y 0px
• Transition: 200ms ease
```

### Ghost Buttons
```
• Background: White
• Color: Text color (#0f1419)
• Border: 1px solid light gray
• Padding: 0 14px
• Shadow: 0 1px 3px rgba(15,20,25,0.06)
• Hover: Background light gray, border purple, text purple, enhanced shadow
• Transition: 200ms ease
```

### Input Fields & Selects
```
• Border-radius: 8px
• Border: 1px solid light gray
• Background: White
• Padding: 6-12px
• Font-size: 12-15px
• Focus: Border purple, glow 0 0 0 3px rgba(139,92,246,0.1)
• Transition: 200ms ease
```

### Kanban Lanes
```
• Background: White with 60% opacity
• Border: Light gray with 40% opacity, 1px
• Border-radius: 12px
• Padding: 14px
• Min-height: 430px
• Hover: Background 75% opacity, stronger border, subtle shadow
• Transition: 280ms ease
• Status labels: Uppercase, 13px, 500 weight, 0.5px letter-spacing
```

### Progress Ring
```
• Size: 70x70px
• Border: 8px solid green with 20% opacity
• Border-radius: 50%
• Color: Green
• Font-weight: 600
• Background: Linear gradient white to light blue
• Shadow: 0 4px 16px rgba(16,185,129,0.15)
• Hover: Stronger border, enhanced shadow, scale 1.05
• Transition: 280ms ease
```

---

## Animations

### Float Animation (Floating Brain)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
Duration: 3s infinite
Easing: ease-in-out
```

### Hover Lifts
```
Stat Cards: translateY(-4px)
Task Cards: translateY(-2px)
Quick Action Buttons: translateY(-2px)
Progress Ring: scale(1.05)
Timing: 240-280ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Button Transitions
```
All buttons: 200-240ms ease/cubic-bezier easing
Shadow enhancement on hover
Gradient shifts for depth
Smooth color transitions
```

---

## Spacing & Sizing

### Gap & Padding Scale
- Extra small: 6px (tight spacing for button groups)
- Small: 8px (between controls)
- Medium: 12px (card internal spacing)
- Large: 16px (between sections)
- Extra large: 18-20px (major padding)

### Border Radius
- Inputs/buttons: 8px
- Cards: 10-12px
- Large elements: 12-14px
- Full round: 999px (for circular elements)

---

## Shadow System

### Subtle (Resting State)
```
0 1px 3px rgba(15, 20, 25, 0.06)
```

### Moderate (Hover State)
```
0 4px 12px rgba(0, 0, 0, 0.10)
0 6px 16px rgba(139, 92, 246, 0.15) [purple-tinted]
```

### Elevated (Hover/Focus)
```
0 8px 24px rgba(15, 20, 25, 0.12)
0 12px 32px rgba(color, 0.20-0.30) [color-tinted]
```

### Special (Auth Submit Button)
```
0 12px 32px rgba(249, 115, 22, 0.30)
Hover: 0 20px 48px rgba(249, 115, 22, 0.40)
```

---

## Responsive Design

### Desktop
- Full layout maintained
- Hover effects active
- All animations enabled

### Tablet (max-width: 1120px)
- Grid layout adjusts
- Layout converts to single column
- Hover effects still present

### Mobile (max-width: 680px)
- Full single column layout
- Touch-optimized button sizing
- Animations remain but may be reduced
- Larger touch targets (44+ px)

---

## Accessibility Notes
✓ All colors have sufficient contrast (WCAG AA)
✓ Font sizes readable on all devices
✓ Interactive elements have clear focus states
✓ Icons paired with text labels
✓ Keyboard navigation supported
✓ No information conveyed by color alone

---

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- Gradient support required
- Animation performance optimized with cubic-bezier easing

---

## Future Enhancement Ideas
- Dark mode variant
- Custom theme switcher
- Advanced animations on task drag-and-drop
- Micro-interactions for task completion
- Notification toast animations
- Skeleton screens during loading
