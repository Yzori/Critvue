/**
 * Content Type Selection Step
 * Visual icon grid for selecting the type of content to be reviewed
 */

import { ContentType } from "@/lib/api/reviews";
import { Palette, Code, Video, Mic, FileText, Image } from "lucide-react";

interface ContentTypeStepProps {
  selectedType: ContentType | null;
  onSelect: (type: ContentType) => void;
}

interface ContentTypeOption {
  type: ContentType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const contentTypes: ContentTypeOption[] = [
  {
    type: "design",
    icon: <Palette className="size-6" />,
    label: "Design",
    description: "UI/UX, Graphics",
    color: "text-accent-blue",
    bgColor: "bg-accent-blue/10",
  },
  {
    type: "code",
    icon: <Code className="size-6" />,
    label: "Code",
    description: "Web, Mobile, Backend",
    color: "text-accent-peach",
    bgColor: "bg-accent-peach/10",
  },
  {
    type: "video",
    icon: <Video className="size-6" />,
    label: "Video",
    description: "Streams, Edits",
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  {
    type: "audio",
    icon: <Mic className="size-6" />,
    label: "Audio",
    description: "Podcasts, Music",
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  {
    type: "writing",
    icon: <FileText className="size-6" />,
    label: "Writing",
    description: "Articles, Scripts",
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  {
    type: "art",
    icon: <Image className="size-6" />,
    label: "Art",
    description: "Illustrations, 3D",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
];

export function ContentTypeStep({ selectedType, onSelect }: ContentTypeStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          What would you like feedback on?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Choose the type of work you'd like to share
        </p>
      </div>

      {/* Content Type Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {contentTypes.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            className={`
              group relative overflow-hidden rounded-2xl bg-card
              border-2 transition-all duration-200
              p-6 min-h-[140px] flex flex-col items-center justify-center text-center
              hover:shadow-lg active:scale-[0.98]
              ${
                selectedType === option.type
                  ? "border-accent-blue shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                  : "border-border hover:border-accent-blue/30"
              }
            `}
          >
            {/* Icon */}
            <div
              className={`
                size-14 rounded-xl ${option.bgColor}
                flex items-center justify-center mb-3
                group-hover:scale-110 transition-transform duration-200
                ${selectedType === option.type ? "scale-110" : ""}
              `}
            >
              <div className={option.color}>{option.icon}</div>
            </div>

            {/* Label */}
            <h3 className="font-semibold text-base text-foreground mb-1">
              {option.label}
            </h3>

            {/* Description */}
            <p className="text-xs text-muted-foreground">
              {option.description}
            </p>

            {/* Selected indicator - Enhanced touch target */}
            {selectedType === option.type && (
              <div className="absolute top-2 right-2 size-6 rounded-full bg-accent-blue flex items-center justify-center">
                <svg
                  className="size-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
