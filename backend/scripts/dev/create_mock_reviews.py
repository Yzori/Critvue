"""
Create mock review requests for testing the browse page
"""
import sys
from pathlib import Path

# Add backend root to path (go up 2 levels from scripts/dev/)
backend_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_root))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.review_request import ReviewRequest
from app.models.user import User
from datetime import datetime, timedelta, timezone
import random

# Database setup
DATABASE_URL = "sqlite:///critvue_dev.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Sample data
TITLES = {
    "design": [
        "Mobile App UI/UX Review Needed",
        "Website Redesign Feedback",
        "Landing Page Design Critique",
        "Dashboard Interface Review",
        "E-commerce Product Page Design",
        "Logo and Brand Identity Review",
        "Design System Audit Required",
        "Responsive Web Design Check",
        "App Icon Design Feedback",
        "Typography and Color Scheme Review"
    ],
    "code": [
        "React Application Architecture Review",
        "Python Backend Code Audit",
        "Database Schema Design Review",
        "API Security Assessment",
        "Performance Optimization Review",
        "TypeScript Migration Feedback",
        "Microservices Architecture Review",
        "CI/CD Pipeline Review",
        "GraphQL API Design Review",
        "Node.js Backend Code Review"
    ],
    "video": [
        "Product Demo Video Feedback",
        "Tutorial Video Pacing Review",
        "Marketing Video Critique",
        "Animation Quality Check",
        "YouTube Content Strategy Review",
        "Video Editing Style Feedback",
        "Documentary Structure Review",
        "Vlog Content Improvement",
        "Educational Video Flow Review",
        "Corporate Video Polish Check"
    ],
    "writing": [
        "Blog Post Content Review",
        "Technical Documentation Audit",
        "Marketing Copy Feedback",
        "Email Campaign Review",
        "Website Content Strategy",
        "SEO Article Optimization",
        "User Guide Clarity Check",
        "Product Description Review",
        "White Paper Editing",
        "Social Media Content Review"
    ],
    "art": [
        "Digital Illustration Critique",
        "Character Design Feedback",
        "Portfolio Review and Feedback",
        "Concept Art Direction",
        "3D Model Review",
        "Game Asset Design Critique",
        "Comic Panel Layout Review",
        "Abstract Art Composition",
        "Pixel Art Animation Feedback",
        "Digital Painting Technique Review"
    ]
}

DESCRIPTIONS = {
    "design": [
        "Looking for expert feedback on the user experience and visual design. Need specific suggestions for improvement.",
        "Seeking comprehensive review of the design system, color palette, and overall aesthetic.",
        "Need professional eyes on the interface design. Focus on accessibility and modern best practices.",
        "Looking for constructive criticism on layout, spacing, and visual hierarchy.",
        "Want feedback on mobile responsiveness and cross-device consistency."
    ],
    "code": [
        "Need experienced developer to review code quality, architecture, and best practices.",
        "Looking for security audit and performance optimization suggestions.",
        "Seeking feedback on code structure, naming conventions, and maintainability.",
        "Need review of testing coverage and error handling strategies.",
        "Want expert opinion on scalability and future-proofing."
    ],
    "video": [
        "Looking for feedback on pacing, transitions, and overall storytelling.",
        "Need professional review of editing quality and visual effects.",
        "Seeking suggestions for improving engagement and retention.",
        "Want feedback on audio quality, music selection, and sound design.",
        "Looking for critique on camera work and composition."
    ],
    "writing": [
        "Need feedback on clarity, tone, and overall messaging.",
        "Looking for grammatical review and style improvements.",
        "Seeking suggestions for better structure and flow.",
        "Want expert opinion on SEO optimization and readability.",
        "Need review of technical accuracy and audience targeting."
    ],
    "art": [
        "Looking for professional critique on composition and color theory.",
        "Need feedback on character design, anatomy, and proportions.",
        "Seeking suggestions for improving technique and style.",
        "Want expert opinion on lighting, shading, and depth.",
        "Looking for portfolio feedback and career guidance."
    ]
}

SKILLS = {
    "design": ["Figma", "Sketch", "Adobe XD", "UI/UX", "Prototyping", "Design Systems", "Accessibility", "Responsive Design"],
    "code": ["React", "Python", "TypeScript", "Node.js", "PostgreSQL", "MongoDB", "AWS", "Docker", "GraphQL", "REST APIs"],
    "video": ["Adobe Premiere", "Final Cut Pro", "After Effects", "Color Grading", "Sound Design", "Motion Graphics"],
    "writing": ["SEO", "Technical Writing", "Copywriting", "Content Strategy", "Proofreading", "Grammar", "Style Guides"],
    "art": ["Digital Painting", "Character Design", "Concept Art", "3D Modeling", "Illustration", "Animation"]
}

def create_mock_reviews(count=15):
    db = SessionLocal()
    try:
        # Get existing user (arend@gmail.com with id=4)
        user = db.query(User).filter(User.id == 4).first()
        if not user:
            print("❌ User not found. Please ensure user with id=4 exists.")
            return
        
        print(f"Creating {count} mock review requests...")
        
        content_types = list(TITLES.keys())
        
        for i in range(count):
            # Random content type
            content_type = random.choice(content_types)
            
            # Random title and description for that type
            title = random.choice(TITLES[content_type])
            description = random.choice(DESCRIPTIONS[content_type])
            
            # Random review type (70% expert, 30% free)
            review_type = "expert" if random.random() < 0.7 else "free"
            
            # Random budget for expert reviews
            if review_type == "expert":
                budget = random.choice([25, 50, 75, 99, 125, 150, 200, 250])
            else:
                budget = None
            
            # Random deadline (some urgent, some flexible)
            now = datetime.now(timezone.utc)
            deadline_choice = random.choice([
                None,  # 20% no deadline
                now + timedelta(hours=random.randint(6, 24)),  # Urgent
                now + timedelta(days=random.randint(2, 7)),    # This week
                now + timedelta(days=random.randint(8, 30)),   # This month
            ])
            
            # Random skills (3-5 skills from the category)
            skill_list = random.sample(SKILLS[content_type], k=random.randint(3, 5))
            feedback_areas = ",".join(skill_list)
            
            # Create review
            review = ReviewRequest(
                user_id=user.id,
                title=title,
                description=description,
                content_type=content_type,
                review_type=review_type,
                status="pending",  # Open for claiming
                budget=budget,
                deadline=deadline_choice,
                feedback_areas=feedback_areas,
                created_at=now - timedelta(days=random.randint(0, 10))
            )
            
            db.add(review)
            print(f"  ✓ Created: {title[:50]}... ({content_type}, {review_type}, ${budget or 0})")
        
        db.commit()
        print(f"\n✅ Successfully created {count} mock review requests!")
        
        # Show summary
        total_reviews = db.query(ReviewRequest).filter(ReviewRequest.status == "pending").count()
        print(f"\n📊 Total pending reviews in database: {total_reviews}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_mock_reviews(15)
