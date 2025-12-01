"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBattlePrompts,
  createBattle,
  joinQueue,
  BattlePrompt,
  ContentType,
  getContentTypeInfo,
} from "@/lib/api/battles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Swords,
  Target,
  Users,
  ChevronLeft,
  ChevronRight,
  Palette,
  Code,
  Video,
  FileText,
  Brush,
  Headphones,
  Radio,
  Zap,
  Search,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

// Content type icons
const contentTypeIcons: Record<ContentType, React.ComponentType<{ className?: string }>> = {
  design: Palette,
  code: Code,
  video: Video,
  stream: Radio,
  audio: Headphones,
  writing: FileText,
  art: Brush,
};

const contentTypes: ContentType[] = ["design", "code", "video", "stream", "audio", "writing", "art"];

type BattleMode = "queue" | "create";

/**
 * Battle Creation Page
 *
 * Two modes:
 * 1. Quick Match (Queue) - Find an opponent automatically
 * 2. Create Battle - Set up a custom battle
 */
export default function CreateBattlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // URL params
  const preselectedPromptId = searchParams.get("prompt");

  // State
  const [step, setStep] = React.useState(1);
  const [mode, setMode] = React.useState<BattleMode>("queue");
  const [contentType, setContentType] = React.useState<ContentType | null>(null);
  const [prompts, setPrompts] = React.useState<BattlePrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = React.useState<BattlePrompt | null>(null);
  const [title, setTitle] = React.useState("");
  const [submissionHours, setSubmissionHours] = React.useState("72");
  const [votingHours, setVotingHours] = React.useState("48");
  const [loading, setLoading] = React.useState(false);
  const [promptsLoading, setPromptsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/battles/create");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch prompts when content type changes
  React.useEffect(() => {
    const fetchPrompts = async () => {
      if (!contentType) return;

      try {
        setPromptsLoading(true);
        const response = await getBattlePrompts(contentType, 20);
        setPrompts(response.items);

        // If there's a preselected prompt, find and select it
        if (preselectedPromptId) {
          const prompt = response.items.find((p) => p.id === Number(preselectedPromptId));
          if (prompt) {
            setSelectedPrompt(prompt);
            setContentType(prompt.contentType);
          }
        }
      } catch (err) {
        console.error("Error fetching prompts:", err);
      } finally {
        setPromptsLoading(false);
      }
    };

    fetchPrompts();
  }, [contentType, preselectedPromptId]);

  // Load preselected prompt on mount
  React.useEffect(() => {
    const loadPreselectedPrompt = async () => {
      if (preselectedPromptId) {
        try {
          const response = await getBattlePrompts(undefined, 50);
          const prompt = response.items.find((p) => p.id === Number(preselectedPromptId));
          if (prompt) {
            setContentType(prompt.contentType);
            setSelectedPrompt(prompt);
            setStep(2); // Skip to prompt selection
          }
        } catch (err) {
          console.error("Error loading preselected prompt:", err);
        }
      }
    };

    loadPreselectedPrompt();
  }, [preselectedPromptId]);

  // Filter prompts by search
  const filteredPrompts = prompts.filter((prompt) =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle battle creation
  const handleCreateBattle = async () => {
    if (!selectedPrompt || !contentType) return;

    try {
      setLoading(true);
      setError(null);

      if (mode === "queue") {
        // Join matchmaking queue
        const battle = await joinQueue({
          contentType,
          promptId: selectedPrompt.id,
        });

        // If matched immediately, go to battle page
        if (battle.status === "active") {
          router.push(`/battles/${battle.id}`);
        } else {
          // Waiting in queue
          router.push(`/battles/${battle.id}?waiting=true`);
        }
      } else {
        // Create custom battle
        const battleTitle = title || `Battle: ${selectedPrompt.title}`;
        const battle = await createBattle({
          title: battleTitle,
          contentType,
          promptId: selectedPrompt.id,
          battleType: "queue",
          submissionHours: Number(submissionHours),
          votingHours: Number(votingHours),
        });

        router.push(`/battles/${battle.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create battle");
    } finally {
      setLoading(false);
    }
  };

  // Step validation
  const canProceed = () => {
    switch (step) {
      case 1:
        return contentType !== null;
      case 2:
        return selectedPrompt !== null;
      case 3:
        return mode === "queue" || title.trim().length > 0;
      default:
        return false;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white mb-4"
            onClick={() => router.push("/battles")}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Battles
          </Button>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Create a Battle</h1>
          <p className="text-gray-400">Challenge other creators and prove your skills</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step >= s
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-gray-400"
                  )}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                <span className={cn("hidden sm:block text-sm", step >= s ? "text-white" : "text-gray-500")}>
                  {s === 1 ? "Category" : s === 2 ? "Prompt" : "Details"}
                </span>
              </div>
              {s < 3 && (
                <div className={cn("flex-1 h-0.5 mx-4", step > s ? "bg-orange-500" : "bg-white/10")} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Select Category */}
        {step === 1 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Choose a Category</CardTitle>
              <CardDescription className="text-gray-400">
                What type of creative work will this battle feature?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contentTypes.map((type) => {
                  const Icon = contentTypeIcons[type];
                  const info = getContentTypeInfo(type);
                  const isSelected = contentType === type;

                  return (
                    <button
                      key={type}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center",
                        isSelected
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                      onClick={() => setContentType(type)}
                    >
                      <Icon className={cn("w-8 h-8 mx-auto mb-2", info.color)} />
                      <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-300")}>
                        {info.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Prompt */}
        {step === 2 && (
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Choose a Prompt</CardTitle>
              <CardDescription className="text-gray-400">
                Select a challenge for your battle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Prompts Grid */}
              {promptsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : filteredPrompts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredPrompts.map((prompt) => {
                    const isSelected = selectedPrompt?.id === prompt.id;

                    return (
                      <button
                        key={prompt.id}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          isSelected
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        )}
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="neutral" className="text-xs border-white/20 bg-transparent">
                            {prompt.difficulty}
                          </Badge>
                          {isSelected && <CheckCircle className="w-5 h-5 text-orange-400" />}
                        </div>
                        <h4 className="font-medium text-white mb-1">{prompt.title}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2">{prompt.description}</p>
                        <div className="text-xs text-gray-500 mt-2">{prompt.timesUsed} battles</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No prompts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Battle Mode & Details */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Battle Mode */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Battle Mode</CardTitle>
                <CardDescription className="text-gray-400">
                  How would you like to find an opponent?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as BattleMode)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        mode === "queue"
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <RadioGroupItem value="queue" className="mt-1" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-5 h-5 text-orange-400" />
                          <span className="font-medium text-white">Quick Match</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Join the queue and get matched with someone automatically
                        </p>
                      </div>
                    </label>

                    <label
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        mode === "create"
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <RadioGroupItem value="create" className="mt-1" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">Create & Wait</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Create a battle with custom settings and wait for someone to join
                        </p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Custom Settings (for Create mode) */}
            {mode === "create" && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Battle Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-white mb-2 block">
                      Battle Title
                    </Label>
                    <Input
                      id="title"
                      placeholder={`Battle: ${selectedPrompt?.title || "..."}`}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Submission Time</Label>
                      <Select value={submissionHours} onValueChange={setSubmissionHours}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                          <SelectItem value="72">72 hours</SelectItem>
                          <SelectItem value="168">1 week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white mb-2 block">Voting Time</Label>
                      <Select value={votingHours} onValueChange={setVotingHours}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                          <SelectItem value="72">72 hours</SelectItem>
                          <SelectItem value="96">96 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Battle Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="text-white">{contentType && getContentTypeInfo(contentType).label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prompt</span>
                    <span className="text-white truncate ml-4">{selectedPrompt?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode</span>
                    <span className="text-white">{mode === "queue" ? "Quick Match" : "Create & Wait"}</span>
                  </div>
                  {mode === "create" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submission Time</span>
                        <span className="text-white">{submissionHours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voting Time</span>
                        <span className="text-white">{votingHours} hours</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!canProceed()}
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              disabled={loading || !canProceed()}
              onClick={handleCreateBattle}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "queue" ? "Finding Opponent..." : "Creating Battle..."}
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  {mode === "queue" ? "Find Opponent" : "Create Battle"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
