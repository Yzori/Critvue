# Critvue Documentation

Welcome to the Critvue documentation! This guide will help you navigate through all available documentation for the platform.

## Getting Started

- [Project Overview](../README.md) - Main project README

## Documentation Structure

```
docs/
├── README.md           # This file - documentation index
├── design/             # UI/UX design specifications
├── development/        # Development standards and plans
├── frontend/           # Frontend-specific guides
├── product/            # Product vision and brand guidelines
└── technical/          # Architecture and tech stack

backend/docs/           # Backend-specific documentation
├── api/                # API reference
├── features/           # Feature implementations
├── review-system/      # Review system documentation
└── testing/            # Testing guides
```

## Product Documentation

Product vision, brand guidelines, and design systems:

- [Product Brief](product/critvue_product_brief.md) - Product vision, features, and roadmap
- [Brand & Design System](product/critvue_brand_style.md) - Critvue brand colors, typography, and design principles
- [Mobile-First UX Guide](product/mobile_guide.md) - Mobile interaction patterns and best practices

## Design Documentation

UI/UX design specifications for key features:

- [Homepage Design Spec](design/homepage-design-spec.md) - Complete homepage design specification
- [Profile Design Spec](design/profile-design-spec.md) - Profile page design and layout
- [Review Request Form Redesign](design/REVIEW_REQUEST_FORM_REDESIGN.md) - Review request form specifications
- [Expert Reviewer System](design/expert-reviewer-system.md) - Expert reviewer feature design
- [Expert Application System](design/expert-application-system.md) - Expert application flow design

## Development Documentation

Coding standards and development guidelines:

- [Coding Standards](development/CODING_STANDARDS.md) - Code style, patterns, and best practices
- [Codebase Restructure Plan](development/CODEBASE_RESTRUCTURE_PLAN.md) - Ongoing refactoring plan

## Technical Documentation

Architecture, tech stack, and implementation details:

- [Tech Stack Overview](technical/critvue_techstack.md) - Technologies, frameworks, and tools
- [Tier System Implementation](technical/TIER_SYSTEM_IMPLEMENTATION.md) - User tier system details

## Frontend Documentation

Next.js frontend implementation guides:

- [Frontend Overview](frontend/README.md) - Frontend architecture and setup
- [Authentication Guide](frontend/AUTH_GUIDE.md) - Complete authentication system documentation

## Backend Documentation

FastAPI backend documentation (in separate location):

- [Backend Docs](../backend/docs/README.md) - Backend documentation index
- [API Reference](../backend/docs/api/API_REFERENCE.md) - Complete API endpoint reference
- [Testing Guide](../backend/docs/testing/TESTING.md) - Backend testing documentation
- [Review System](../backend/docs/review-system/) - Review system documentation

---

## Documentation Guidelines

When adding new documentation:

1. **Location**: Place docs in the appropriate category folder
2. **Naming**: Use clear, descriptive names (e.g., `FEATURE_NAME.md`)
3. **Linking**: Update this README when adding new major documentation
4. **Format**: Use Markdown with clear headings and code examples
5. **Maintenance**: Keep docs updated as features evolve

## Quick Links by Role

**New Developer:**
1. Read [Product Brief](product/critvue_product_brief.md)
2. Review [Tech Stack](technical/critvue_techstack.md)
3. Follow [Coding Standards](development/CODING_STANDARDS.md)

**Designer:**
1. Read [Brand & Design System](product/critvue_brand_style.md)
2. Review [Mobile UX Guide](product/mobile_guide.md)
3. Check [Design Specs](design/homepage-design-spec.md)

**Backend Developer:**
1. Review [Backend Docs](../backend/docs/README.md)
2. Read [API Reference](../backend/docs/api/API_REFERENCE.md)
3. Check [Coding Standards](development/CODING_STANDARDS.md)

**Frontend Developer:**
1. Review [Frontend Overview](frontend/README.md)
2. Read [Authentication Guide](frontend/AUTH_GUIDE.md)
3. Follow [Coding Standards](development/CODING_STANDARDS.md)
