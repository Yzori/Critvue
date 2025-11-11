/**
 * Feedback Areas Step
 * Allow users to specify what aspects they want feedback on
 * Content-type specific options with multi-select checkboxes
 */

import { ContentType } from "@/lib/api/reviews";
import {
  CheckSquare,
  Square,
  Palette,
  Eye,
  Type,
  Layout,
  Users,
  Shield,
  Code2,
  Zap,
  Lock,
  BookOpen,
  TestTube2,
  Scissors,
  Clock,
  Headphones,
  Film,
  Music,
  Sparkles,
  AlignLeft,
  MessageSquare,
  Wand2,
  Heart,
  Lightbulb,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FeedbackAreasStepProps {
  contentType: ContentType;
  selectedAreas: string[];
  customArea: string;
  onAreasChange: (areas: string[]) => void;
  onCustomAreaChange: (value: string) => void;
}

interface FeedbackAreaOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// Content-type specific feedback areas
const feedbackAreasByType: Record<ContentType, FeedbackAreaOption[]> = {
  design: [
    {
      id: "composition",
      label: "Composition",
      description: "Layout balance and visual hierarchy",
      icon: <Layout className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "color-theory",
      label: "Color Theory",
      description: "Color palette and harmony",
      icon: <Palette className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "typography",
      label: "Typography",
      description: "Font choices and readability",
      icon: <Type className="size-5" />,
      color: "text-pink-600",
    },
    {
      id: "layout",
      label: "Layout",
      description: "Grid system and spacing",
      icon: <Layout className="size-5" />,
      color: "text-indigo-600",
    },
    {
      id: "user-flow",
      label: "User Flow",
      description: "Navigation and interactions",
      icon: <Users className="size-5" />,
      color: "text-cyan-600",
    },
    {
      id: "accessibility",
      label: "Accessibility",
      description: "WCAG compliance and usability",
      icon: <Shield className="size-5" />,
      color: "text-green-600",
    },
  ],
  code: [
    {
      id: "architecture",
      label: "Architecture",
      description: "Structure and organization",
      icon: <Layout className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "performance",
      label: "Performance",
      description: "Speed and optimization",
      icon: <Zap className="size-5" />,
      color: "text-yellow-600",
    },
    {
      id: "security",
      label: "Security",
      description: "Vulnerabilities and best practices",
      icon: <Lock className="size-5" />,
      color: "text-red-600",
    },
    {
      id: "code-style",
      label: "Code Style",
      description: "Formatting and conventions",
      icon: <Code2 className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "documentation",
      label: "Documentation",
      description: "Comments and readme",
      icon: <BookOpen className="size-5" />,
      color: "text-green-600",
    },
    {
      id: "testing",
      label: "Testing",
      description: "Test coverage and quality",
      icon: <TestTube2 className="size-5" />,
      color: "text-pink-600",
    },
  ],
  video: [
    {
      id: "editing",
      label: "Editing",
      description: "Cuts and transitions",
      icon: <Scissors className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "pacing",
      label: "Pacing",
      description: "Rhythm and flow",
      icon: <Clock className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "audio",
      label: "Audio",
      description: "Sound quality and mixing",
      icon: <Headphones className="size-5" />,
      color: "text-pink-600",
    },
    {
      id: "visuals",
      label: "Visuals",
      description: "Cinematography and effects",
      icon: <Film className="size-5" />,
      color: "text-indigo-600",
    },
    {
      id: "story",
      label: "Story",
      description: "Narrative and structure",
      icon: <BookOpen className="size-5" />,
      color: "text-amber-600",
    },
    {
      id: "engagement",
      label: "Engagement",
      description: "Hook and retention",
      icon: <Eye className="size-5" />,
      color: "text-green-600",
    },
  ],
  audio: [
    {
      id: "quality",
      label: "Quality",
      description: "Recording clarity",
      icon: <Sparkles className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "mixing",
      label: "Mixing",
      description: "Balance and levels",
      icon: <Headphones className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "clarity",
      label: "Clarity",
      description: "Voice and presence",
      icon: <MessageSquare className="size-5" />,
      color: "text-green-600",
    },
    {
      id: "pacing",
      label: "Pacing",
      description: "Tempo and rhythm",
      icon: <Clock className="size-5" />,
      color: "text-pink-600",
    },
    {
      id: "music",
      label: "Music",
      description: "Composition and harmony",
      icon: <Music className="size-5" />,
      color: "text-indigo-600",
    },
    {
      id: "effects",
      label: "Effects",
      description: "Processing and polish",
      icon: <Wand2 className="size-5" />,
      color: "text-amber-600",
    },
  ],
  writing: [
    {
      id: "grammar",
      label: "Grammar",
      description: "Spelling and syntax",
      icon: <CheckSquare className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "structure",
      label: "Structure",
      description: "Organization and flow",
      icon: <Layout className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "clarity",
      label: "Clarity",
      description: "Clear communication",
      icon: <Eye className="size-5" />,
      color: "text-green-600",
    },
    {
      id: "tone",
      label: "Tone",
      description: "Voice and style",
      icon: <MessageSquare className="size-5" />,
      color: "text-pink-600",
    },
    {
      id: "flow",
      label: "Flow",
      description: "Readability and pacing",
      icon: <AlignLeft className="size-5" />,
      color: "text-indigo-600",
    },
    {
      id: "engagement",
      label: "Engagement",
      description: "Hook and interest",
      icon: <Heart className="size-5" />,
      color: "text-red-600",
    },
  ],
  art: [
    {
      id: "composition",
      label: "Composition",
      description: "Visual balance",
      icon: <Layout className="size-5" />,
      color: "text-blue-600",
    },
    {
      id: "color",
      label: "Color",
      description: "Palette and harmony",
      icon: <Palette className="size-5" />,
      color: "text-purple-600",
    },
    {
      id: "technique",
      label: "Technique",
      description: "Skill and execution",
      icon: <Wand2 className="size-5" />,
      color: "text-green-600",
    },
    {
      id: "style",
      label: "Style",
      description: "Artistic voice",
      icon: <Sparkles className="size-5" />,
      color: "text-pink-600",
    },
    {
      id: "emotion",
      label: "Emotion",
      description: "Mood and feeling",
      icon: <Heart className="size-5" />,
      color: "text-red-600",
    },
    {
      id: "originality",
      label: "Originality",
      description: "Uniqueness and creativity",
      icon: <Lightbulb className="size-5" />,
      color: "text-amber-600",
    },
  ],
};

export function FeedbackAreasStep({
  contentType,
  selectedAreas,
  customArea,
  onAreasChange,
  onCustomAreaChange,
}: FeedbackAreasStepProps) {
  const options = feedbackAreasByType[contentType];

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      onAreasChange(selectedAreas.filter((id) => id !== areaId));
    } else {
      onAreasChange([...selectedAreas, areaId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          What feedback are you looking for?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Select all the areas you want reviewers to focus on
        </p>
      </div>

      {/* Feedback Areas Grid */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Selection indicator */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {selectedAreas.length === 0
              ? "No areas selected"
              : `${selectedAreas.length} ${selectedAreas.length === 1 ? "area" : "areas"} selected`}
          </p>
          {selectedAreas.length > 0 && (
            <button
              onClick={() => onAreasChange([])}
              className="text-sm font-medium text-accent-blue hover:text-accent-blue/80 transition-colors min-h-[44px] px-3 -mr-3 touch-manipulation active:scale-95"
              aria-label="Clear all selections"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((option) => {
            const isSelected = selectedAreas.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleArea(option.id)}
                className={`
                  group relative overflow-hidden rounded-xl bg-card
                  border-2 transition-all duration-200
                  p-4 flex items-start gap-3 text-left
                  hover:shadow-md active:scale-[0.98]
                  ${
                    isSelected
                      ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)] bg-accent-blue/5"
                      : "border-border hover:border-accent-blue/30"
                  }
                `}
              >
                {/* Checkbox Icon - Enhanced for touch */}
                <div className="flex-shrink-0 pt-0.5">
                  {isSelected ? (
                    <CheckSquare className="size-6 text-accent-blue" />
                  ) : (
                    <Square className="size-6 text-muted-foreground group-hover:text-accent-blue/50 transition-colors" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`${option.color} flex-shrink-0`}>
                      {option.icon}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {option.label}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Feedback Area */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="custom-area" className="text-sm font-medium text-foreground">
            Other feedback area (optional)
          </Label>
          <Input
            id="custom-area"
            type="text"
            placeholder="e.g., Brand consistency, Mobile responsiveness..."
            value={customArea}
            onChange={(e) => onCustomAreaChange(e.target.value)}
            autoComplete="off"
            className="text-base sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Describe any specific feedback areas not listed above
          </p>
        </div>

        {/* Helpful tip */}
        <div className="rounded-xl bg-accent-blue/5 border border-accent-blue/20 p-4">
          <div className="flex items-start gap-3">
            <div className="size-5 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="size-3 text-accent-blue" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Pro tip:</span> Selecting fewer, more specific areas helps reviewers provide more focused and actionable feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
