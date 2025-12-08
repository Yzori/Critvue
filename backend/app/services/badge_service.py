"""Badge Service for skill-based achievements and rewards"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badge import Badge, UserBadge, BadgeCategory, BadgeRarity
from app.models.user import User
from app.models.review_slot import ReviewSlot, ReviewSlotStatus
from app.models.sparks_transaction import SparksAction


class BadgeService:
    """
    Service for managing skill-based badges and achievements.

    Features:
    - Skill mastery badges (e.g., "React Expert" after 10 React reviews)
    - Milestone badges (100 reviews, 1000 karma, etc.)
    - Quality badges (high acceptance rate, helpful ratings)
    - Streak badges (long streaks)
    - Seasonal badges (leaderboard placements)
    """

    # Default badge definitions (seeded into database)
    # Total: 75 badges across 7 categories
    DEFAULT_BADGES = [
        # ============================================
        # SKILL BADGES - Visual Arts (16 badges)
        # ============================================

        # Photography
        {
            "code": "skill_photography_apprentice",
            "name": "Photography Apprentice",
            "description": "Completed 5 photography reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "photography",
        },
        {
            "code": "skill_photography_expert",
            "name": "Photography Expert",
            "description": "Completed 25 photography reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "photography",
        },

        # Digital Art
        {
            "code": "skill_digital_art_apprentice",
            "name": "Digital Art Apprentice",
            "description": "Completed 5 digital art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "digital_art",
        },
        {
            "code": "skill_digital_art_expert",
            "name": "Digital Art Expert",
            "description": "Completed 25 digital art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "digital_art",
        },

        # Illustration
        {
            "code": "skill_illustration_apprentice",
            "name": "Illustration Apprentice",
            "description": "Completed 5 illustration reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "illustration",
        },
        {
            "code": "skill_illustration_expert",
            "name": "Illustration Expert",
            "description": "Completed 25 illustration reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "illustration",
        },

        # Graphic Design
        {
            "code": "skill_graphic_design_apprentice",
            "name": "Graphic Design Apprentice",
            "description": "Completed 5 graphic design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "graphic_design",
        },
        {
            "code": "skill_graphic_design_expert",
            "name": "Graphic Design Expert",
            "description": "Completed 25 graphic design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "graphic_design",
        },

        # Character Design
        {
            "code": "skill_character_design_apprentice",
            "name": "Character Design Apprentice",
            "description": "Completed 5 character design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "character_design",
        },
        {
            "code": "skill_character_design_expert",
            "name": "Character Design Expert",
            "description": "Completed 25 character design reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "character_design",
        },

        # Concept Art
        {
            "code": "skill_concept_art_apprentice",
            "name": "Concept Art Apprentice",
            "description": "Completed 5 concept art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "concept_art",
        },
        {
            "code": "skill_concept_art_expert",
            "name": "Concept Art Expert",
            "description": "Completed 25 concept art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "concept_art",
        },

        # Traditional Art
        {
            "code": "skill_traditional_art_apprentice",
            "name": "Traditional Art Apprentice",
            "description": "Completed 5 traditional art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "traditional_art",
        },
        {
            "code": "skill_traditional_art_expert",
            "name": "Traditional Art Expert",
            "description": "Completed 25 traditional art reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "traditional_art",
        },

        # ============================================
        # SKILL BADGES - Video & Streaming (10 badges)
        # ============================================

        # Video Editing
        {
            "code": "skill_video_editing_apprentice",
            "name": "Video Editing Apprentice",
            "description": "Completed 5 video editing reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "video_editing",
        },
        {
            "code": "skill_video_editing_expert",
            "name": "Video Editing Expert",
            "description": "Completed 25 video editing reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "video_editing",
        },

        # YouTube Content
        {
            "code": "skill_youtube_apprentice",
            "name": "YouTube Apprentice",
            "description": "Completed 5 YouTube content reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "youtube",
        },
        {
            "code": "skill_youtube_expert",
            "name": "YouTube Expert",
            "description": "Completed 25 YouTube content reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "youtube",
        },

        # TikTok/Reels
        {
            "code": "skill_short_form_apprentice",
            "name": "Short-Form Apprentice",
            "description": "Completed 5 TikTok/Reels/Shorts reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "short_form",
        },
        {
            "code": "skill_short_form_expert",
            "name": "Short-Form Expert",
            "description": "Completed 25 TikTok/Reels/Shorts reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "short_form",
        },

        # Streaming/Live
        {
            "code": "skill_streaming_apprentice",
            "name": "Streaming Apprentice",
            "description": "Completed 5 stream/live content reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "streaming",
        },
        {
            "code": "skill_streaming_expert",
            "name": "Streaming Expert",
            "description": "Completed 25 stream/live content reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "streaming",
        },

        # Animation/Motion
        {
            "code": "skill_animation_apprentice",
            "name": "Animation Apprentice",
            "description": "Completed 5 animation/motion reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "animation",
        },
        {
            "code": "skill_animation_expert",
            "name": "Animation Expert",
            "description": "Completed 25 animation/motion reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "animation",
        },

        # ============================================
        # SKILL BADGES - Writing & Audio (10 badges)
        # ============================================

        # Creative Writing
        {
            "code": "skill_creative_writing_apprentice",
            "name": "Creative Writing Apprentice",
            "description": "Completed 5 creative writing reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "creative_writing",
        },
        {
            "code": "skill_creative_writing_expert",
            "name": "Creative Writing Expert",
            "description": "Completed 25 creative writing reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "creative_writing",
        },

        # Copywriting
        {
            "code": "skill_copywriting_apprentice",
            "name": "Copywriting Apprentice",
            "description": "Completed 5 copywriting reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "copywriting",
        },
        {
            "code": "skill_copywriting_expert",
            "name": "Copywriting Expert",
            "description": "Completed 25 copywriting reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "copywriting",
        },

        # Poetry
        {
            "code": "skill_poetry_apprentice",
            "name": "Poetry Apprentice",
            "description": "Completed 5 poetry reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "poetry",
        },
        {
            "code": "skill_poetry_expert",
            "name": "Poetry Expert",
            "description": "Completed 25 poetry reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "poetry",
        },

        # Music Production
        {
            "code": "skill_music_production_apprentice",
            "name": "Music Production Apprentice",
            "description": "Completed 5 music production reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "music_production",
        },
        {
            "code": "skill_music_production_expert",
            "name": "Music Production Expert",
            "description": "Completed 25 music production reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "music_production",
        },

        # Podcasting
        {
            "code": "skill_podcasting_apprentice",
            "name": "Podcasting Apprentice",
            "description": "Completed 5 podcast reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "content_type_reviews",
            "requirement_value": 5,
            "requirement_skill": "podcasting",
        },
        {
            "code": "skill_podcasting_expert",
            "name": "Podcasting Expert",
            "description": "Completed 25 podcast reviews",
            "category": BadgeCategory.SKILL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "content_type_reviews",
            "requirement_value": 25,
            "requirement_skill": "podcasting",
        },

        # ============================================
        # CREATOR BADGES (10 badges) - NEW CATEGORY
        # ============================================

        {
            "code": "creator_first_request",
            "name": "First Request",
            "description": "Submitted your first review request",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 5,
            "xp_reward": 5,
            "requirement_type": "total_requests",
            "requirement_value": 1,
        },
        {
            "code": "creator_feedback_seeker",
            "name": "Feedback Seeker",
            "description": "Received 5 completed reviews on your work",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "reviews_received",
            "requirement_value": 5,
        },
        {
            "code": "creator_improvement_driven",
            "name": "Improvement Driven",
            "description": "Received 25 completed reviews on your work",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "reviews_received",
            "requirement_value": 25,
        },
        {
            "code": "creator_quality_patron",
            "name": "Quality Patron",
            "description": "Paid for 5 expert reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 40,
            "xp_reward": 40,
            "requirement_type": "expert_reviews_paid",
            "requirement_value": 5,
        },
        {
            "code": "creator_generous_rater",
            "name": "Generous Rater",
            "description": "Gave 10 five-star helpful ratings to reviewers",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 20,
            "xp_reward": 20,
            "requirement_type": "five_star_ratings_given",
            "requirement_value": 10,
        },
        {
            "code": "creator_detailed_requester",
            "name": "Detailed Requester",
            "description": "Submitted 5 requests with all fields completed",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "detailed_requests",
            "requirement_value": 5,
        },
        {
            "code": "creator_quick_responder",
            "name": "Quick Responder",
            "description": "Accepted/rated 10 reviews within 24 hours",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 25,
            "xp_reward": 25,
            "requirement_type": "quick_responses",
            "requirement_value": 10,
        },
        {
            "code": "creator_revision_master",
            "name": "Revision Master",
            "description": "Successfully requested and received 3 review revisions",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 35,
            "xp_reward": 35,
            "requirement_type": "revisions_received",
            "requirement_value": 3,
        },
        {
            "code": "creator_portfolio_builder",
            "name": "Portfolio Builder",
            "description": "Added 5 items to your portfolio",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 20,
            "xp_reward": 20,
            "requirement_type": "portfolio_items",
            "requirement_value": 5,
        },
        {
            "code": "creator_critvue_champion",
            "name": "Critvue Champion",
            "description": "Received 100+ reviews with 4.5+ average rating given",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 150,
            "xp_reward": 150,
            "requirement_type": "champion_creator",
            "requirement_value": 100,
        },

        # ============================================
        # COMMUNITY BADGES (8 badges) - NEW CATEGORY
        # ============================================

        {
            "code": "community_profile_complete",
            "name": "Profile Complete",
            "description": "Filled out all profile fields including avatar",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 10,
            "xp_reward": 10,
            "requirement_type": "profile_complete",
            "requirement_value": 1,
        },
        {
            "code": "community_first_referral",
            "name": "First Referral",
            "description": "Referred a user who completed their first review",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "referrals",
            "requirement_value": 1,
        },
        {
            "code": "community_network_builder",
            "name": "Network Builder",
            "description": "Referred 5 active users to the platform",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "referrals",
            "requirement_value": 5,
        },
        {
            "code": "community_helpful_mentor",
            "name": "Helpful Mentor",
            "description": "10 of your reviews were marked as especially educational",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 60,
            "xp_reward": 60,
            "requirement_type": "educational_reviews",
            "requirement_value": 10,
        },
        {
            "code": "community_constructive_voice",
            "name": "Constructive Voice",
            "description": "Zero disputes lost in 50+ reviews",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "no_disputes_lost",
            "requirement_value": 50,
        },
        {
            "code": "community_pillar",
            "name": "Community Pillar",
            "description": "Active for 6+ months with 100+ reviews",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 150,
            "xp_reward": 150,
            "requirement_type": "community_pillar",
            "requirement_value": 100,
        },
        {
            "code": "community_trending_reviewer",
            "name": "Trending Reviewer",
            "description": "Reached top 10 on the weekly leaderboard",
            "category": BadgeCategory.SEASONAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "leaderboard_top10",
            "requirement_value": 1,
        },
        {
            "code": "community_weekly_champion",
            "name": "Weekly Champion",
            "description": "First place on the weekly leaderboard",
            "category": BadgeCategory.SEASONAL,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 200,
            "xp_reward": 200,
            "requirement_type": "leaderboard_first",
            "requirement_value": 1,
        },

        # ============================================
        # MILESTONE BADGES (10 badges)
        # ============================================

        {
            "code": "milestone_first_review",
            "name": "First Steps",
            "description": "Submitted your first review",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 5,
            "xp_reward": 5,
            "requirement_type": "total_reviews",
            "requirement_value": 1,
        },
        {
            "code": "milestone_10_reviews",
            "name": "Getting Started",
            "description": "Completed 10 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "total_reviews",
            "requirement_value": 10,
        },
        {
            "code": "milestone_25_reviews",
            "name": "Quarter Century",
            "description": "Completed 25 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 20,
            "xp_reward": 20,
            "requirement_type": "total_reviews",
            "requirement_value": 25,
        },
        {
            "code": "milestone_50_reviews",
            "name": "Dedicated Reviewer",
            "description": "Completed 50 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "total_reviews",
            "requirement_value": 50,
        },
        {
            "code": "milestone_100_reviews",
            "name": "Century Club",
            "description": "Completed 100 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "total_reviews",
            "requirement_value": 100,
        },
        {
            "code": "milestone_200_reviews",
            "name": "Double Century",
            "description": "Completed 200 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "total_reviews",
            "requirement_value": 200,
        },
        {
            "code": "milestone_500_reviews",
            "name": "Review Legend",
            "description": "Completed 500 reviews",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 200,
            "xp_reward": 200,
            "requirement_type": "total_reviews",
            "requirement_value": 500,
        },
        {
            "code": "milestone_1000_reviews",
            "name": "Thousand Club",
            "description": "Completed 1,000 reviews - true dedication!",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 500,
            "xp_reward": 500,
            "requirement_type": "total_reviews",
            "requirement_value": 1000,
        },
        {
            "code": "milestone_sparks_legend",
            "name": "Sparks Legend",
            "description": "Reached 5,000 Sparks",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "total_sparks",
            "requirement_value": 5000,
        },
        {
            "code": "milestone_xp_master",
            "name": "XP Master",
            "description": "Reached 10,000 XP - permanent progress!",
            "category": BadgeCategory.MILESTONE,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 150,
            "xp_reward": 150,
            "requirement_type": "total_xp",
            "requirement_value": 10000,
        },

        # ============================================
        # QUALITY BADGES (8 badges)
        # ============================================

        {
            "code": "quality_helpful_10",
            "name": "Helpful Hand",
            "description": "Received 10 five-star helpful ratings",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 25,
            "xp_reward": 25,
            "requirement_type": "five_star_ratings",
            "requirement_value": 10,
        },
        {
            "code": "quality_helpful_50",
            "name": "Invaluable Reviewer",
            "description": "Received 50 five-star helpful ratings",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "five_star_ratings",
            "requirement_value": 50,
        },
        {
            "code": "quality_helpful_100",
            "name": "Five-Star Legend",
            "description": "Received 100 five-star helpful ratings",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 150,
            "xp_reward": 150,
            "requirement_type": "five_star_ratings",
            "requirement_value": 100,
        },
        {
            "code": "quality_acceptance_90",
            "name": "Trusted Voice",
            "description": "Maintained 90%+ acceptance rate (min 20 reviews)",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "acceptance_rate",
            "requirement_value": 90,
        },
        {
            "code": "quality_perfectionist",
            "name": "Perfectionist",
            "description": "Maintained 95%+ acceptance rate (min 50 reviews)",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "acceptance_rate_high",
            "requirement_value": 95,
        },
        {
            "code": "quality_zero_rejections",
            "name": "Zero Rejections",
            "description": "25 consecutive accepted reviews without rejection",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 60,
            "xp_reward": 60,
            "requirement_type": "consecutive_accepted",
            "requirement_value": 25,
        },
        {
            "code": "quality_detail_master",
            "name": "Detail Master",
            "description": "20 reviews praised for thoroughness",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "thorough_reviews",
            "requirement_value": 20,
        },
        {
            "code": "quality_speed_demon",
            "name": "Speed Demon",
            "description": "Delivered 10 reviews well under the deadline",
            "category": BadgeCategory.QUALITY,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "fast_deliveries",
            "requirement_value": 10,
        },

        # ============================================
        # STREAK BADGES (6 badges)
        # ============================================

        {
            "code": "streak_7_days",
            "name": "Week Warrior",
            "description": "Maintained a 7-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.COMMON,
            "karma_reward": 15,
            "xp_reward": 15,
            "requirement_type": "streak_days",
            "requirement_value": 7,
        },
        {
            "code": "streak_14_days",
            "name": "Fortnight Fighter",
            "description": "Maintained a 14-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "streak_days",
            "requirement_value": 14,
        },
        {
            "code": "streak_30_days",
            "name": "Month Master",
            "description": "Maintained a 30-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "streak_days",
            "requirement_value": 30,
        },
        {
            "code": "streak_60_days",
            "name": "60-Day Dynamo",
            "description": "Maintained a 60-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 200,
            "xp_reward": 200,
            "requirement_type": "streak_days",
            "requirement_value": 60,
        },
        {
            "code": "streak_100_days",
            "name": "Unstoppable",
            "description": "Maintained a 100-day review streak",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 500,
            "xp_reward": 500,
            "requirement_type": "streak_days",
            "requirement_value": 100,
        },
        {
            "code": "streak_weekend_warrior",
            "name": "Weekend Warrior",
            "description": "Completed reviews on 4 consecutive weekends",
            "category": BadgeCategory.STREAK,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 25,
            "xp_reward": 25,
            "requirement_type": "weekend_streak",
            "requirement_value": 4,
        },

        # ============================================
        # SPECIAL BADGES (8 badges)
        # ============================================

        {
            "code": "special_early_adopter",
            "name": "Early Adopter",
            "description": "Joined during the beta period",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.EPIC,
            "karma_reward": 100,
            "xp_reward": 100,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_community_helper",
            "name": "Community Helper",
            "description": "Helped improve the platform through feedback",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_bug_hunter",
            "name": "Bug Hunter",
            "description": "Reported a confirmed bug that was fixed",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_feature_pioneer",
            "name": "Feature Pioneer",
            "description": "First to use a new platform feature",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 25,
            "xp_reward": 25,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_holiday_hero",
            "name": "Holiday Hero",
            "description": "Completed a review on a major holiday",
            "category": BadgeCategory.SEASONAL,
            "rarity": BadgeRarity.UNCOMMON,
            "karma_reward": 30,
            "xp_reward": 30,
            "requirement_type": "holiday_review",
            "requirement_value": 1,
        },
        {
            "code": "special_new_year_reviewer",
            "name": "New Year Reviewer",
            "description": "First review of the calendar year",
            "category": BadgeCategory.SEASONAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 50,
            "xp_reward": 50,
            "requirement_type": "manual",
            "requirement_value": 0,
        },
        {
            "code": "special_anniversary",
            "name": "Anniversary Badge",
            "description": "Celebrated 1 year on Critvue",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.RARE,
            "karma_reward": 75,
            "xp_reward": 75,
            "requirement_type": "account_age_days",
            "requirement_value": 365,
        },
        {
            "code": "special_og_status",
            "name": "OG Status",
            "description": "2+ years on platform with 500+ reviews",
            "category": BadgeCategory.SPECIAL,
            "rarity": BadgeRarity.LEGENDARY,
            "karma_reward": 300,
            "xp_reward": 300,
            "requirement_type": "og_status",
            "requirement_value": 500,
        },
    ]

    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_default_badges(self) -> int:
        """
        Seed default badges into database if they don't exist.

        Returns:
            Number of badges created
        """
        created_count = 0

        for badge_data in self.DEFAULT_BADGES:
            # Check if badge already exists
            stmt = select(Badge).where(Badge.code == badge_data["code"])
            result = await self.db.execute(stmt)
            existing = result.scalar_one_or_none()

            if not existing:
                badge = Badge(**badge_data)
                self.db.add(badge)
                created_count += 1

        await self.db.commit()
        return created_count

    async def check_and_award_badges(self, user_id: int) -> List[UserBadge]:
        """
        Check if user qualifies for any new badges and award them.

        Called after review submission, acceptance, etc.

        Args:
            user_id: User to check badges for

        Returns:
            List of newly awarded badges
        """
        user = await self.db.get(User, user_id)
        if not user:
            return []

        # Get all badges user doesn't have yet
        stmt = (
            select(Badge)
            .where(
                Badge.is_active == True,
                ~Badge.id.in_(
                    select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
                )
            )
        )
        result = await self.db.execute(stmt)
        available_badges = list(result.scalars().all())

        awarded = []

        for badge in available_badges:
            if await self._check_badge_requirements(user, badge):
                user_badge = await self._award_badge(user, badge)
                awarded.append(user_badge)

        return awarded

    async def _check_badge_requirements(self, user: User, badge: Badge) -> bool:
        """Check if user meets requirements for a specific badge."""
        req_type = badge.requirement_type
        req_value = badge.requirement_value

        # ============================================
        # REVIEWER BADGES
        # ============================================

        if req_type == "total_reviews":
            return (user.total_reviews_given or 0) >= req_value

        elif req_type == "streak_days":
            return (user.longest_streak or 0) >= req_value

        elif req_type == "acceptance_rate":
            if (user.accepted_reviews_count or 0) < 20:  # Minimum reviews required
                return False
            return user.acceptance_rate is not None and float(user.acceptance_rate) >= req_value

        elif req_type == "acceptance_rate_high":
            # For perfectionist badge - 95%+ with 50+ reviews
            if (user.accepted_reviews_count or 0) < 50:
                return False
            return user.acceptance_rate is not None and float(user.acceptance_rate) >= req_value

        elif req_type == "five_star_ratings":
            count = await self._count_five_star_ratings(user.id)
            return count >= req_value

        elif req_type == "skill_reviews":
            count = await self._count_skill_reviews(user.id, badge.requirement_skill)
            return count >= req_value

        elif req_type == "content_type_reviews":
            count = await self._count_content_type_reviews(user.id, badge.requirement_skill)
            return count >= req_value

        elif req_type == "total_sparks":
            return (user.sparks_points or 0) >= req_value

        elif req_type == "total_xp":
            return (user.xp_points or 0) >= req_value

        elif req_type == "consecutive_accepted":
            count = await self._count_consecutive_accepted(user.id)
            return count >= req_value

        elif req_type == "fast_deliveries":
            count = await self._count_fast_deliveries(user.id)
            return count >= req_value

        elif req_type == "weekend_streak":
            count = await self._count_weekend_streak(user.id)
            return count >= req_value

        # ============================================
        # CREATOR BADGES
        # ============================================

        elif req_type == "total_requests":
            count = await self._count_total_requests(user.id)
            return count >= req_value

        elif req_type == "reviews_received":
            count = await self._count_reviews_received(user.id)
            return count >= req_value

        elif req_type == "expert_reviews_paid":
            count = await self._count_expert_reviews_paid(user.id)
            return count >= req_value

        elif req_type == "five_star_ratings_given":
            count = await self._count_five_star_ratings_given(user.id)
            return count >= req_value

        elif req_type == "detailed_requests":
            count = await self._count_detailed_requests(user.id)
            return count >= req_value

        elif req_type == "quick_responses":
            count = await self._count_quick_responses(user.id)
            return count >= req_value

        elif req_type == "portfolio_items":
            count = await self._count_portfolio_items(user.id)
            return count >= req_value

        # ============================================
        # COMMUNITY BADGES
        # ============================================

        elif req_type == "profile_complete":
            return await self._is_profile_complete(user)

        elif req_type == "referrals":
            # TODO: Implement referral tracking
            return False

        elif req_type == "account_age_days":
            if user.created_at:
                from datetime import datetime
                days = (datetime.utcnow() - user.created_at).days
                return days >= req_value
            return False

        elif req_type == "community_pillar":
            # 6+ months active with 100+ reviews
            if not user.created_at:
                return False
            from datetime import datetime
            months = (datetime.utcnow() - user.created_at).days / 30
            return months >= 6 and (user.total_reviews_given or 0) >= req_value

        elif req_type == "og_status":
            # 2+ years with 500+ reviews
            if not user.created_at:
                return False
            from datetime import datetime
            years = (datetime.utcnow() - user.created_at).days / 365
            return years >= 2 and (user.total_reviews_given or 0) >= req_value

        elif req_type == "no_disputes_lost":
            # Zero disputes lost in 50+ reviews
            if (user.total_reviews_given or 0) < 50:
                return False
            lost = await self._count_disputes_lost(user.id)
            return lost == 0

        # ============================================
        # MANUAL & SEASONAL BADGES
        # ============================================

        elif req_type == "manual":
            return False  # Manual badges are awarded programmatically

        elif req_type == "holiday_review":
            return await self._has_holiday_review(user.id)

        elif req_type in ["leaderboard_top10", "leaderboard_first", "champion_creator",
                          "educational_reviews", "thorough_reviews", "revisions_received"]:
            # These require special tracking that will be implemented later
            return False

        return False

    async def _count_five_star_ratings(self, user_id: int) -> int:
        """Count number of 5-star helpful ratings received."""
        stmt = select(func.count(ReviewSlot.id)).where(
            ReviewSlot.reviewer_id == user_id,
            ReviewSlot.requester_helpful_rating == 5
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_skill_reviews(self, user_id: int, skill: str) -> int:
        """Count reviews for projects with a specific skill."""
        from app.models.review_request import ReviewRequest

        # Join ReviewSlot with ReviewRequest and check skills_needed
        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewRequest.skills_needed.ilike(f"%{skill}%")
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_content_type_reviews(self, user_id: int, content_type: str) -> int:
        """Count reviews for a specific content type."""
        from app.models.review_request import ReviewRequest

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewRequest.content_type == content_type
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    # ============================================
    # NEW HELPER METHODS FOR EXPANDED BADGES
    # ============================================

    async def _count_consecutive_accepted(self, user_id: int) -> int:
        """Count current consecutive accepted reviews without rejection."""
        stmt = (
            select(ReviewSlot.status)
            .where(ReviewSlot.reviewer_id == user_id)
            .where(ReviewSlot.status.in_([
                ReviewSlotStatus.ACCEPTED.value,
                ReviewSlotStatus.REJECTED.value
            ]))
            .order_by(ReviewSlot.submitted_at.desc())
        )
        result = await self.db.execute(stmt)
        statuses = [r[0] for r in result]

        consecutive = 0
        for status in statuses:
            if status == ReviewSlotStatus.ACCEPTED.value:
                consecutive += 1
            else:
                break
        return consecutive

    async def _count_fast_deliveries(self, user_id: int) -> int:
        """Count reviews delivered well before deadline (>24h early)."""
        from datetime import timedelta

        stmt = (
            select(func.count(ReviewSlot.id))
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewSlot.submitted_at.isnot(None),
                ReviewSlot.deadline.isnot(None),
                # Submitted at least 24 hours before deadline
                ReviewSlot.submitted_at < ReviewSlot.deadline - timedelta(hours=24)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_weekend_streak(self, user_id: int) -> int:
        """Count consecutive weekends with at least one review."""
        from datetime import datetime, timedelta

        # Get all review dates
        stmt = (
            select(ReviewSlot.submitted_at)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.ACCEPTED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ]),
                ReviewSlot.submitted_at.isnot(None)
            )
            .order_by(ReviewSlot.submitted_at.desc())
        )
        result = await self.db.execute(stmt)
        dates = [r[0] for r in result if r[0]]

        if not dates:
            return 0

        # Group by weekend (Saturday-Sunday)
        weekend_reviews = set()
        for dt in dates:
            # Get the Saturday of that week
            days_since_saturday = (dt.weekday() + 2) % 7
            saturday = dt.date() - timedelta(days=days_since_saturday)
            if dt.weekday() in [5, 6]:  # Saturday=5, Sunday=6
                weekend_reviews.add(saturday)

        if not weekend_reviews:
            return 0

        # Count consecutive weekends from most recent
        sorted_weekends = sorted(weekend_reviews, reverse=True)
        consecutive = 1
        for i in range(1, len(sorted_weekends)):
            if (sorted_weekends[i-1] - sorted_weekends[i]).days == 7:
                consecutive += 1
            else:
                break

        return consecutive

    async def _count_total_requests(self, user_id: int) -> int:
        """Count total review requests created by user."""
        from app.models.review_request import ReviewRequest

        stmt = select(func.count(ReviewRequest.id)).where(
            ReviewRequest.requester_id == user_id
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_reviews_received(self, user_id: int) -> int:
        """Count completed reviews received on user's requests."""
        from app.models.review_request import ReviewRequest

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewRequest.requester_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_expert_reviews_paid(self, user_id: int) -> int:
        """Count expert reviews paid for by user."""
        from app.models.review_request import ReviewRequest

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewRequest.requester_id == user_id,
                ReviewRequest.review_type == "expert",
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_five_star_ratings_given(self, user_id: int) -> int:
        """Count 5-star ratings given by user to reviewers."""
        from app.models.review_request import ReviewRequest

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewRequest.requester_id == user_id,
                ReviewSlot.requester_helpful_rating == 5
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_detailed_requests(self, user_id: int) -> int:
        """Count requests with all fields filled out."""
        from app.models.review_request import ReviewRequest

        stmt = select(func.count(ReviewRequest.id)).where(
            ReviewRequest.requester_id == user_id,
            ReviewRequest.title.isnot(None),
            ReviewRequest.description.isnot(None),
            ReviewRequest.skills_needed.isnot(None),
            ReviewRequest.content_type.isnot(None),
            ReviewRequest.focus_areas.isnot(None)
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_quick_responses(self, user_id: int) -> int:
        """Count reviews accepted/rated within 24 hours of submission."""
        from app.models.review_request import ReviewRequest
        from datetime import timedelta

        stmt = (
            select(func.count(ReviewSlot.id))
            .join(ReviewRequest, ReviewSlot.review_request_id == ReviewRequest.id)
            .where(
                ReviewRequest.requester_id == user_id,
                ReviewSlot.status == ReviewSlotStatus.ACCEPTED.value,
                ReviewSlot.submitted_at.isnot(None),
                ReviewSlot.reviewed_at.isnot(None),
                ReviewSlot.reviewed_at < ReviewSlot.submitted_at + timedelta(hours=24)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _count_portfolio_items(self, user_id: int) -> int:
        """Count portfolio items added by user."""
        try:
            from app.models.portfolio import PortfolioItem
            stmt = select(func.count(PortfolioItem.id)).where(
                PortfolioItem.user_id == user_id
            )
            result = await self.db.execute(stmt)
            return result.scalar() or 0
        except Exception:
            # Portfolio model may not exist yet
            return 0

    async def _is_profile_complete(self, user: User) -> bool:
        """Check if user profile is fully completed."""
        required_fields = [
            user.display_name,
            user.bio,
            user.avatar_url,
        ]
        return all(field for field in required_fields)

    async def _count_disputes_lost(self, user_id: int) -> int:
        """Count number of disputes lost by reviewer."""
        # TODO: Implement dispute tracking
        return 0

    async def _has_holiday_review(self, user_id: int) -> bool:
        """Check if user has reviewed on a major holiday."""
        from datetime import date

        # Major US holidays (simplified - can be expanded)
        holidays = [
            (1, 1),   # New Year's Day
            (7, 4),   # Independence Day
            (12, 25), # Christmas
            (12, 31), # New Year's Eve
        ]

        stmt = (
            select(ReviewSlot.submitted_at)
            .where(
                ReviewSlot.reviewer_id == user_id,
                ReviewSlot.status.in_([
                    ReviewSlotStatus.ACCEPTED.value,
                    ReviewSlotStatus.SUBMITTED.value
                ]),
                ReviewSlot.submitted_at.isnot(None)
            )
        )
        result = await self.db.execute(stmt)

        for row in result:
            dt = row[0]
            if dt and (dt.month, dt.day) in holidays:
                return True
        return False

    async def _award_badge(self, user: User, badge: Badge) -> UserBadge:
        """Award a badge to user and grant sparks/XP rewards."""
        # Create user badge record
        user_badge = UserBadge(
            user_id=user.id,
            badge_id=badge.id,
            earned_at=datetime.utcnow(),
            earning_reason=f"Earned {badge.name} badge"
        )
        self.db.add(user_badge)

        # Award sparks and XP
        if badge.karma_reward > 0:
            user.sparks_points = (user.sparks_points or 0) + badge.karma_reward
        if badge.xp_reward > 0:
            user.xp_points = (user.xp_points or 0) + badge.xp_reward

        # Create sparks transaction for tracking
        from app.models.sparks_transaction import SparksTransaction

        transaction = SparksTransaction(
            user_id=user.id,
            action=SparksAction.BADGE_EARNED,
            points=badge.karma_reward,
            balance_after=user.sparks_points,
            reason=f"Earned badge: {badge.name}",
            created_at=datetime.utcnow()
        )
        self.db.add(transaction)

        await self.db.commit()
        await self.db.refresh(user_badge)

        return user_badge

    async def get_user_badges(
        self,
        user_id: int,
        include_hidden: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get all badges earned by a user.

        Args:
            user_id: User to get badges for
            include_hidden: Include badges user has hidden

        Returns:
            List of badge details with earning info
        """
        stmt = (
            select(UserBadge, Badge)
            .join(Badge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user_id)
        )

        if not include_hidden:
            stmt = stmt.where(UserBadge.is_hidden == False)

        stmt = stmt.order_by(UserBadge.earned_at.desc())

        result = await self.db.execute(stmt)
        badges = []

        for user_badge, badge in result:
            badges.append({
                "id": user_badge.id,
                "badge_code": badge.code,
                "badge_name": badge.name,
                "badge_description": badge.description,
                "category": badge.category.value,
                "rarity": badge.rarity.value,
                "icon_url": badge.icon_url,
                "color": badge.color,
                "earned_at": user_badge.earned_at.isoformat(),
                "level": user_badge.level,
                "is_featured": user_badge.is_featured,
                "is_hidden": user_badge.is_hidden,
            })

        return badges

    async def get_available_badges(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get badges user hasn't earned yet with progress info.

        Args:
            user_id: User to get available badges for

        Returns:
            List of available badges with progress towards earning
        """
        user = await self.db.get(User, user_id)
        if not user:
            return []

        # Get badges user doesn't have
        stmt = (
            select(Badge)
            .where(
                Badge.is_active == True,
                ~Badge.id.in_(
                    select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
                )
            )
            .order_by(Badge.rarity, Badge.name)
        )

        result = await self.db.execute(stmt)
        available = []

        for badge in result.scalars():
            progress = await self._get_badge_progress(user, badge)
            available.append({
                "badge_code": badge.code,
                "badge_name": badge.name,
                "badge_description": badge.description,
                "category": badge.category.value,
                "rarity": badge.rarity.value,
                "icon_url": badge.icon_url,
                "color": badge.color,
                "karma_reward": badge.karma_reward,
                "xp_reward": badge.xp_reward,
                "progress": progress,
            })

        return available

    async def _get_badge_progress(self, user: User, badge: Badge) -> Dict[str, Any]:
        """Get user's progress towards earning a badge."""
        req_type = badge.requirement_type
        req_value = badge.requirement_value
        current = 0

        # Reviewer progress
        if req_type == "total_reviews":
            current = user.total_reviews_given or 0

        elif req_type == "streak_days":
            current = user.longest_streak or 0

        elif req_type == "acceptance_rate":
            if (user.accepted_reviews_count or 0) >= 20:
                current = float(user.acceptance_rate or 0)

        elif req_type == "acceptance_rate_high":
            if (user.accepted_reviews_count or 0) >= 50:
                current = float(user.acceptance_rate or 0)

        elif req_type == "five_star_ratings":
            current = await self._count_five_star_ratings(user.id)

        elif req_type == "skill_reviews":
            current = await self._count_skill_reviews(user.id, badge.requirement_skill)

        elif req_type == "content_type_reviews":
            current = await self._count_content_type_reviews(user.id, badge.requirement_skill)

        elif req_type == "total_sparks":
            current = user.sparks_points or 0

        elif req_type == "total_xp":
            current = user.xp_points or 0

        elif req_type == "consecutive_accepted":
            current = await self._count_consecutive_accepted(user.id)

        elif req_type == "fast_deliveries":
            current = await self._count_fast_deliveries(user.id)

        elif req_type == "weekend_streak":
            current = await self._count_weekend_streak(user.id)

        # Creator progress
        elif req_type == "total_requests":
            current = await self._count_total_requests(user.id)

        elif req_type == "reviews_received":
            current = await self._count_reviews_received(user.id)

        elif req_type == "expert_reviews_paid":
            current = await self._count_expert_reviews_paid(user.id)

        elif req_type == "five_star_ratings_given":
            current = await self._count_five_star_ratings_given(user.id)

        elif req_type == "detailed_requests":
            current = await self._count_detailed_requests(user.id)

        elif req_type == "quick_responses":
            current = await self._count_quick_responses(user.id)

        elif req_type == "portfolio_items":
            current = await self._count_portfolio_items(user.id)

        # Community progress
        elif req_type == "profile_complete":
            is_complete = await self._is_profile_complete(user)
            current = 1 if is_complete else 0

        elif req_type == "account_age_days":
            if user.created_at:
                from datetime import datetime
                current = (datetime.utcnow() - user.created_at).days

        # Manual/special badges
        elif req_type in ["manual", "leaderboard_top10", "leaderboard_first",
                          "champion_creator", "educational_reviews", "thorough_reviews",
                          "revisions_received", "referrals", "holiday_review",
                          "community_pillar", "og_status", "no_disputes_lost"]:
            return {"type": "special", "description": "Special achievement"}

        percentage = min(100, int((current / req_value) * 100)) if req_value > 0 else 0

        return {
            "type": req_type,
            "current": current,
            "required": req_value,
            "percentage": percentage,
        }

    async def toggle_badge_featured(self, user_id: int, badge_id: int) -> bool:
        """Toggle whether a badge is featured on user's profile."""
        stmt = select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge_id
        )
        result = await self.db.execute(stmt)
        user_badge = result.scalar_one_or_none()

        if not user_badge:
            return False

        user_badge.is_featured = not user_badge.is_featured
        await self.db.commit()
        return True

    async def award_special_badge(
        self,
        user_id: int,
        badge_code: str,
        reason: str
    ) -> Optional[UserBadge]:
        """
        Manually award a special badge (Early Adopter, etc.)

        Args:
            user_id: User to award badge to
            badge_code: Badge code to award
            reason: Reason for awarding

        Returns:
            UserBadge if awarded, None if already has badge
        """
        user = await self.db.get(User, user_id)
        if not user:
            return None

        # Get the badge
        stmt = select(Badge).where(Badge.code == badge_code)
        result = await self.db.execute(stmt)
        badge = result.scalar_one_or_none()

        if not badge:
            return None

        # Check if user already has this badge
        stmt = select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            return None

        # Create user badge with custom reason
        user_badge = UserBadge(
            user_id=user_id,
            badge_id=badge.id,
            earned_at=datetime.utcnow(),
            earning_reason=reason
        )
        self.db.add(user_badge)

        # Award sparks and XP
        user.sparks_points = (user.sparks_points or 0) + badge.karma_reward
        user.xp_points = (user.xp_points or 0) + badge.xp_reward

        await self.db.commit()
        await self.db.refresh(user_badge)

        return user_badge
