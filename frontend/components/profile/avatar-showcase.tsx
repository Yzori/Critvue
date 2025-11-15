/**
 * Avatar Showcase Component
 * Demonstrates avatar in different contexts (nav, profile, comments, reviews)
 * Useful for testing and documenting avatar usage patterns
 * Follows Critvue brand guidelines
 */

"use client";

import { Avatar } from "./avatar-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AvatarShowcaseProps {
  avatarUrl?: string | null;
  fullName?: string;
  className?: string;
}

export function AvatarShowcase({
  avatarUrl,
  fullName = "John Doe",
  className,
}: AvatarShowcaseProps) {
  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Avatar Showcase
          </h2>
          <p className="text-sm text-muted-foreground">
            Preview how your avatar appears across different contexts in Critvue
          </p>
        </div>

        {/* Size Variants */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Size Variants
          </h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="xs" />
              <span className="text-xs text-muted-foreground">XS (24px)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="sm" />
              <span className="text-xs text-muted-foreground">SM (32px)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="md" />
              <span className="text-xs text-muted-foreground">MD (40px)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="lg" />
              <span className="text-xs text-muted-foreground">LG (48px)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="xl" />
              <span className="text-xs text-muted-foreground">XL (64px)</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="2xl" />
              <span className="text-xs text-muted-foreground">2XL (128px)</span>
            </div>
          </div>
        </Card>

        {/* Context Examples */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Navigation Bar
          </h3>
          <div className="flex items-center justify-between p-4 bg-background-subtle rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">Critvue</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {fullName}
              </span>
              <Avatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                size="md"
                verified
              />
            </div>
          </div>
        </Card>

        {/* Profile Header Context */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Profile Header
          </h3>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-accent-blue/10 to-accent-peach/10 rounded-lg border border-border">
            <Avatar
              avatarUrl={avatarUrl}
              fullName={fullName}
              size="2xl"
              verified
            />
            <div>
              <h4 className="text-xl font-bold text-foreground">{fullName}</h4>
              <p className="text-sm text-muted-foreground">
                UX Designer & Code Reviewer
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Expert
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Review Comment Context */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Review Comment
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                size="md"
                verified
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">
                    {fullName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    2 hours ago
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  Great work on the implementation! The component structure is
                  clean and follows best practices. I have a few suggestions for
                  improvement...
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Reviewer Card Context */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Reviewer Card
          </h3>
          <div className="flex items-center gap-4 p-4 bg-background-subtle rounded-lg border border-border hover:border-accent-blue transition-colors">
            <Avatar
              avatarUrl={avatarUrl}
              fullName={fullName}
              size="xl"
              verified
            />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{fullName}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                UX Designer & Frontend Specialist
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  ⭐ 4.9 (127 reviews)
                </span>
                <span className="text-muted-foreground">24h response</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Multiple Avatars (Team/Collaborators) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Collaborators Stack
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                size="md"
                className="ring-2 ring-background"
              />
              <Avatar
                avatarUrl={null}
                fullName="Sarah Chen"
                size="md"
                className="ring-2 ring-background"
              />
              <Avatar
                avatarUrl={null}
                fullName="Mike Johnson"
                size="md"
                className="ring-2 ring-background"
              />
              <Avatar
                avatarUrl={null}
                fullName="Lisa Wang"
                size="md"
                className="ring-2 ring-background"
              />
            </div>
            <span className="text-sm text-muted-foreground ml-2">
              +12 more collaborators
            </span>
          </div>
        </Card>

        {/* Notification Context */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Notification
          </h3>
          <div className="flex gap-3 p-3 rounded-lg bg-background-subtle border border-border">
            <Avatar avatarUrl={avatarUrl} fullName={fullName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{fullName}</span> completed a
                review of your project
              </p>
              <span className="text-xs text-muted-foreground">
                5 minutes ago
              </span>
            </div>
            <div className="size-2 rounded-full bg-accent-blue flex-shrink-0 mt-2" />
          </div>
        </Card>

        {/* Mobile Navigation Context */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Mobile Bottom Navigation
          </h3>
          <div className="flex items-center justify-around p-4 bg-background-subtle rounded-lg border border-border">
            <button className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">Browse</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">Reviews</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Avatar avatarUrl={avatarUrl} fullName={fullName} size="sm" />
              <span className="text-xs text-accent-blue font-medium">
                Profile
              </span>
            </button>
          </div>
        </Card>

        {/* Verified vs Unverified */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Verification Status
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                size="xl"
                verified
              />
              <span className="text-sm text-foreground font-medium">
                Verified
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={avatarUrl}
                fullName={fullName}
                size="xl"
                verified={false}
              />
              <span className="text-sm text-muted-foreground">Unverified</span>
            </div>
          </div>
        </Card>

        {/* Fallback Examples */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Fallback Gradients (No Avatar)
          </h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={null}
                fullName="John Doe"
                size="xl"
                verified
              />
              <span className="text-xs text-muted-foreground">JD</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={null}
                fullName="Sarah Chen"
                size="xl"
                verified
              />
              <span className="text-xs text-muted-foreground">SC</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={null}
                fullName="Mike Johnson"
                size="xl"
                verified
              />
              <span className="text-xs text-muted-foreground">MJ</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar
                avatarUrl={null}
                fullName="Anonymous"
                size="xl"
                verified={false}
              />
              <span className="text-xs text-muted-foreground">AN</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
