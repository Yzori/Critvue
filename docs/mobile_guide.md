## 📱 Mobile-First UX Guide for Critvue

This guide ensures Critvue delivers an exceptional, responsive experience on mobile devices from MVP through scale. Prioritize core flows, reduce friction, and ensure clarity even on small screens.

---

### 🎯 Mobile Design Philosophy
- **Essentialism:** Only the most important elements per screen
- **One action per screen:** Avoid clutter, reduce cognitive load
- **Touch-friendly:** Tap targets >= 44px, generous spacing
- **Progressive Disclosure:** Start minimal, reveal detail on interaction
- **Offline-aware + async-friendly:** Account for slower networks

---

### 🧭 Layout & Grid
- Base grid: 4pt/8pt spacing scale
- Max content width: 100% with 24px side padding
- Stack vertical: 1-column layout with top-down hierarchy
- Collapse multi-panel layouts into tabs, accordions, or modals

---

### 🧩 Key Screens & Flows

#### 1. **Landing Page**
- Hero: Large title, CTA first ("Try it free")
- Benefits: Icons/text blocks, stacked vertically
- Mobile Nav: Sticky bottom nav or hamburger with modal
- Action: Scroll-triggered CTA sticky header

#### 2. **Upload Flow**
- Step 1: File picker (camera or browse)
- Step 2: Category selector (radio cards or dropdown)
- Step 3: Prompt fields with soft input focus
- Progress bar or step counter always visible

#### 3. **AI Feedback Display**
- Card stack layout with swipable or expandable feedback blocks
- Use emoji or icons to visually distinguish feedback points
- Keep text size readable (base 16px+, line-height 1.5)

#### 4. **Request Human Review**
- Reviewer preview cards (avatar, tag, price)
- Tap to expand → see details → confirm → pay
- Use bottom sheet modal for review submission or confirmation

#### 5. **Review Report View**
- Vertical accordion: Section headers collapse/expand
- CTA: Download, Share, Save for later
- Optional: Timeline or progress indicator for multiple feedback rounds

---

### 🖼️ Image & File Handling
- Always show preview thumbnail after upload
- Lazy-load review images or text blocks
- Confirm before replacing uploaded work

---

### 🧠 Interaction Patterns
- Bottom sheet modals for micro-interactions
- Swipable cards (reviews, feedback, history)
- Pull-to-refresh for dashboard or report updates
- Tap-to-copy for quotes or key points

---

### 🪄 Animation & Motion (Framer Motion)
- Slide in/out transitions between steps (subtle)
- Fade in feedback with slight delay for sequencing
- Touch feedback: ripple or scale tap effect on buttons
- Keyboard-aware layout shifting for form fields

---

### ♿ Accessibility
- High contrast buttons & inputs
- Text always resizable (use rem/em units)
- Clear focus indicators (especially on CTA)
- VoiceOver tested for input fields, feedback results

---

### 📦 Performance Targets
- <2s TTI (time-to-interactive)
- Avoid blocking fonts/scripts on mobile load
- Optimize AI response rendering time
- Compress uploads + images automatically

---

### ✅ Tools to Aid Mobile-First
- **Tailwind responsive classes** (`sm:`, `md:`, `lg:`)
- **React Hook Form + Zod** for tight form UX
- **Headless UI + shadcn/ui** for modals, tabs, disclosures
- **React Lazy + Suspense** for async feedback delivery

---

Prioritize mobile first. Desktop polish can follow — most creators submit on the go.

Let me know if you’d like to wireframe the upload-to-report flow next.
