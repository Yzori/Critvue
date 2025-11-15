# Expert Application - Complete File Manifest

All file paths are absolute for easy reference.

## Core Application Files

### Main Pages
- `/home/user/Critvue/frontend/app/apply/expert/page.tsx` - Main application entry point
- `/home/user/Critvue/frontend/app/apply/expert/success/page.tsx` - Success confirmation page

### Container & Coordination
- `/home/user/Critvue/frontend/components/expert-application/application-container.tsx` - Main container coordinating all steps

### UI Components
- `/home/user/Critvue/frontend/components/expert-application/application-progress.tsx` - Progress indicator
- `/home/user/Critvue/frontend/components/expert-application/application-navigation.tsx` - Bottom navigation
- `/home/user/Critvue/frontend/components/expert-application/auto-save-indicator.tsx` - Save status indicator
- `/home/user/Critvue/frontend/components/expert-application/celebration-modal.tsx` - Confetti celebrations

### Application Steps
- `/home/user/Critvue/frontend/components/expert-application/steps/step-1-welcome.tsx` - Welcome & introduction
- `/home/user/Critvue/frontend/components/expert-application/steps/step-2-personal-info.tsx` - Personal information form
- `/home/user/Critvue/frontend/components/expert-application/steps/step-3-professional-background.tsx` - Professional background
- `/home/user/Critvue/frontend/components/expert-application/steps/step-4-skills.tsx` - Skills & specializations
- `/home/user/Critvue/frontend/components/expert-application/steps/step-5-portfolio.tsx` - Portfolio upload
- `/home/user/Critvue/frontend/components/expert-application/steps/step-6-credentials.tsx` - Professional credentials
- `/home/user/Critvue/frontend/components/expert-application/steps/step-7-references.tsx` - Professional references
- `/home/user/Critvue/frontend/components/expert-application/steps/step-8-sample-review.tsx` - Sample review submission

## Core Infrastructure

### State Management
- `/home/user/Critvue/frontend/stores/expert-application-store.ts` - Zustand store with persistence

### Types & Validation
- `/home/user/Critvue/frontend/lib/expert-application/types.ts` - TypeScript type definitions
- `/home/user/Critvue/frontend/lib/expert-application/validation.ts` - Zod validation schemas
- `/home/user/Critvue/frontend/lib/expert-application/auto-save.ts` - Auto-save utilities

## Documentation

### Implementation Guides
- `/home/user/Critvue/frontend/EXPERT_APPLICATION_IMPLEMENTATION.md` - Complete implementation guide
- `/home/user/Critvue/frontend/EXPERT_APPLICATION_QUICK_START.md` - Quick start guide
- `/home/user/Critvue/EXPERT_APPLICATION_SUMMARY.md` - Build summary

### Research
- `/home/user/Critvue/docs/research/EXPERT_REVIEWER_APPLICATION_UX_RESEARCH.md` - UX research findings

## Existing UI Components (Used)

- `/home/user/Critvue/frontend/components/ui/button.tsx`
- `/home/user/Critvue/frontend/components/ui/card.tsx`
- `/home/user/Critvue/frontend/components/ui/input.tsx`
- `/home/user/Critvue/frontend/components/ui/label.tsx`
- `/home/user/Critvue/frontend/components/ui/textarea.tsx`
- `/home/user/Critvue/frontend/components/ui/badge.tsx`
- `/home/user/Critvue/frontend/components/ui/file-upload.tsx`
- `/home/user/Critvue/frontend/components/ui/bottom-sheet.tsx`

## Configuration Files

- `/home/user/Critvue/frontend/app/globals.css` - Tailwind CSS with Critvue design tokens
- `/home/user/Critvue/frontend/package.json` - Dependencies and scripts

## Quick Access Commands

```bash
# Navigate to project
cd /home/user/Critvue/frontend

# Start development server
npm run dev

# Open in browser
# http://localhost:3000/apply/expert

# View main page
cat /home/user/Critvue/frontend/app/apply/expert/page.tsx

# View store
cat /home/user/Critvue/frontend/stores/expert-application-store.ts

# View types
cat /home/user/Critvue/frontend/lib/expert-application/types.ts

# View validation
cat /home/user/Critvue/frontend/lib/expert-application/validation.ts
```

## File Statistics

- **Total Application Files**: 20
- **Total Lines of Code**: ~3,500+
- **Components**: 15+
- **Steps**: 8
- **Documentation Pages**: 4

## Import Examples

```typescript
// Import store
import { useExpertApplicationStore } from '@/stores/expert-application-store'

// Import types
import { PersonalInfo, Skill } from '@/lib/expert-application/types'

// Import validation
import { personalInfoSchema } from '@/lib/expert-application/validation'

// Import auto-save hook
import { useAutoSave } from '@/lib/expert-application/auto-save'

// Import components
import { ApplicationProgress } from '@/components/expert-application/application-progress'
```

---

All files are ready to use! Start development with `npm run dev` and navigate to `/apply/expert`.
