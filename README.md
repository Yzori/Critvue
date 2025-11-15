# Critvue

A hybrid review platform enabling creators to receive structured, high-quality feedback on their work using AI and paid human reviewers.

## Overview

Critvue is tailored for designers, writers, artists, and makers who seek improvement and validation without wasting time in noisy communities. Get instant AI critique plus the option for peer or paid expert human reviews, all delivered in structured, actionable reports.

## Key Features

- Multi-category review system (writing, art, design, portfolios)
- AI feedback engine with category-specific templates
- Reviewer marketplace with skill-based tagging and paid tiers
- Downloadable/shareable review reports
- Review quality rating and gamified feedback reputation

## Tech Stack

- **Frontend**: Next.js 15.0.3, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python 3.12+), PostgreSQL, Alembic
- **Authentication**: JWT tokens with refresh token rotation
- **Testing**: Pytest (backend), Jest/React Testing Library (frontend)
- **Deployment**: Docker, Railway/Vercel (planned)

## Project Structure

```
Critvue/
├── backend/          # FastAPI backend application
│   ├── app/          # Application code
│   ├── docs/         # Backend-specific documentation
│   └── tests/        # Backend tests
├── frontend/         # Next.js frontend application
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and API client
│   └── contexts/     # React contexts
└── docs/             # Project documentation
    ├── api/          # API documentation
    ├── design/       # UI/UX design specs
    ├── features/     # Feature documentation
    ├── frontend/     # Frontend guides
    ├── guides/       # Developer guides
    ├── product/      # Product vision & brand
    ├── research/     # User research
    └── technical/    # Architecture & tech docs
```

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
createdb critvue
alembic upgrade head

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run server
uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000
API documentation at http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Frontend will be available at http://localhost:3000

## Documentation

Complete documentation is available in the `/docs` directory:

- **[Documentation Index](/docs/README.md)** - Complete documentation guide
- **[Product Brief](/docs/product/critvue_product_brief.md)** - Product vision and features
- **[Tech Stack](/docs/technical/critvue_techstack.md)** - Technical architecture
- **[API Reference](/docs/api/profile-api.md)** - Backend API documentation
- **[Frontend Guide](/docs/frontend/README.md)** - Frontend development guide
- **[Brand Guidelines](/docs/product/critvue_brand_style.md)** - Design system and brand

### Backend Documentation

Backend-specific documentation is in `/backend/docs`:

- [API Reference](/backend/docs/api/API_REFERENCE.md)
- [Testing Guide](/backend/docs/testing/TESTING.md)
- [Review System](/backend/docs/review-system/QUICKSTART.md)
- [Avatar Upload](/backend/docs/features/avatar-quick-start.md)

## Current Features

### Authentication & User Management
- Email/password authentication with JWT
- Refresh token rotation for security
- Password reset flow
- Email verification system
- User profiles with avatar upload

### Profile System
- User profiles with customizable fields (bio, title, etc.)
- Avatar upload with multi-size variants (64px-1024px)
- Secure image processing and storage
- Profile privacy controls

### Navigation System
- Mobile-first responsive navigation
- User menu with avatar display
- Hamburger menu for mobile
- Smooth animations and transitions

### Review System (In Development)
- Multi-category review structure
- AI feedback integration (planned)
- Reviewer marketplace (planned)

## Development

### Running Tests

Backend:
```bash
cd backend
pytest
pytest --cov=app  # With coverage
```

Frontend:
```bash
cd frontend
npm test
npm run test:watch  # Watch mode
```

### Code Quality

Backend:
```bash
# Format code
black app tests

# Type checking
mypy app

# Linting
flake8 app tests
```

Frontend:
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://user:password@localhost/critvue
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Avatar Upload
MAX_AVATAR_SIZE=5242880
AVATAR_STORAGE_PATH=/path/to/uploads/avatars
AVATAR_BASE_URL=/files/avatars
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[License information to be added]

## Contact

For questions or support, please open an issue in the repository.

---

Built with passion for creators seeking meaningful feedback.
