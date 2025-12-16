"""Expert Review Enums for Review Slot schemas"""

from enum import Enum


class PrincipleCategory(str, Enum):
    """Categories for design/development principles"""
    UX_HEURISTIC = "ux-heuristic"  # Nielsen's heuristics, etc.
    DESIGN_PRINCIPLE = "design-principle"  # Gestalt, color theory, typography
    CODING_STANDARD = "coding-standard"  # SOLID, DRY, clean code
    ACCESSIBILITY = "accessibility"  # WCAG, a11y guidelines
    PERFORMANCE = "performance"  # Core Web Vitals, optimization
    SECURITY = "security"  # OWASP, security best practices
    SEO = "seo"  # Search engine guidelines
    CONTENT = "content"  # Writing frameworks, clarity
    OTHER = "other"


class ImpactType(str, Enum):
    """Types of impact for explaining consequences"""
    CONVERSION = "conversion"  # Affects sales/signups
    USABILITY = "usability"  # Makes harder to use
    TRUST = "trust"  # Reduces credibility
    PERFORMANCE = "performance"  # Slows down experience
    MAINTAINABILITY = "maintainability"  # Creates tech debt
    ACCESSIBILITY = "accessibility"  # Excludes users
    SEO = "seo"  # Hurts discoverability
    BRAND = "brand"  # Damages perception
    OTHER = "other"


class EffortEstimate(str, Enum):
    """Effort estimate for implementing a fix"""
    QUICK_FIX = "quick-fix"
    MODERATE = "moderate"
    MAJOR_REFACTOR = "major-refactor"


class ConfidenceLevel(str, Enum):
    """Confidence level for suggestions"""
    CERTAIN = "certain"
    LIKELY = "likely"
    SUGGESTION = "suggestion"


class ImprovementCategory(str, Enum):
    """Categories for improvements"""
    PERFORMANCE = "performance"
    UX = "ux"
    SECURITY = "security"
    ACCESSIBILITY = "accessibility"
    MAINTAINABILITY = "maintainability"
    DESIGN = "design"
    CONTENT = "content"
    OTHER = "other"
