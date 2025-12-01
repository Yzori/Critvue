"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChallenges,
  getChallengePrompts,
  createChallenge,
  createChallengePrompt,
  updateChallenge,
  inviteCreator,
  activateChallenge,
  openChallenge,
  closeSubmissions,
  completeChallenge,
  Challenge,
  ChallengePrompt,
  ContentType,
  ChallengeType,
  ChallengeStatus,
  getContentTypeInfo,
  getChallengeStatusInfo,
  getChallengeTypeInfo,
} from "@/lib/api/challenges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Settings,
  Users,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Palette,
  Code,
  Video,
  FileText,
  Brush,
  Headphones,
  Radio,
  Send,
  Eye,
  Award,
  Sparkles,
  Target,
  Shield,
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
const challengeTypes: ChallengeType[] = ["one_on_one", "category"];

/**
 * Admin Challenges Management Page
 *
 * Features:
 * - Create challenges (1v1 and category)
 * - Manage prompts
 * - Invite creators to 1v1 challenges
 * - Control challenge lifecycle
 */
export default function AdminChallengesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // State
  const [challenges, setChallenges] = React.useState<Challenge[]>([]);
  const [prompts, setPrompts] = React.useState<ChallengePrompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("challenges");

  // Dialog states
  const [showCreateChallenge, setShowCreateChallenge] = React.useState(false);
  const [showCreatePrompt, setShowCreatePrompt] = React.useState(false);
  const [showInviteDialog, setShowInviteDialog] = React.useState(false);
  const [selectedChallenge, setSelectedChallenge] = React.useState<Challenge | null>(null);

  // Form states
  const [challengeTitle, setChallengeTitle] = React.useState("");
  const [challengeDescription, setChallengeDescription] = React.useState("");
  const [challengeType, setChallengeType] = React.useState<ChallengeType>("one_on_one");
  const [contentType, setContentType] = React.useState<ContentType>("design");
  const [selectedPromptId, setSelectedPromptId] = React.useState<number | null>(null);
  const [submissionHours, setSubmissionHours] = React.useState("72");
  const [votingHours, setVotingHours] = React.useState("48");
  const [maxWinners, setMaxWinners] = React.useState("1");
  const [prizeDescription, setPrizeDescription] = React.useState("");

  const [promptTitle, setPromptTitle] = React.useState("");
  const [promptDescription, setPromptDescription] = React.useState("");
  const [promptContentType, setPromptContentType] = React.useState<ContentType>("design");
  const [promptDifficulty, setPromptDifficulty] = React.useState<"beginner" | "intermediate" | "advanced">("intermediate");

  const [inviteUserId, setInviteUserId] = React.useState("");
  const [inviteSlot, setInviteSlot] = React.useState<1 | 2>(1);
  const [inviteMessage, setInviteMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  // Check admin access
  const isAdmin = user?.role === "admin";

  // Fetch data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all challenges
        const challengesResponse = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
        setChallenges(challengesResponse.items);

        // Fetch all prompts
        const promptsResponse = await getChallengePrompts(undefined, 100);
        setPrompts(promptsResponse.items);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [isAdmin, authLoading]);

  // Handle create challenge
  const handleCreateChallenge = async () => {
    try {
      setSubmitting(true);
      await createChallenge({
        title: challengeTitle,
        description: challengeDescription || undefined,
        contentType,
        challengeType,
        promptId: selectedPromptId || undefined,
        submissionHours: Number(submissionHours),
        votingHours: Number(votingHours),
        maxWinners: Number(maxWinners),
        prizeDescription: prizeDescription || undefined,
      });

      // Refresh challenges
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);

      // Reset form
      setChallengeTitle("");
      setChallengeDescription("");
      setSelectedPromptId(null);
      setPrizeDescription("");
      setShowCreateChallenge(false);
    } catch (err: any) {
      setError(err.message || "Failed to create challenge");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle create prompt
  const handleCreatePrompt = async () => {
    try {
      setSubmitting(true);
      await createChallengePrompt({
        title: promptTitle,
        description: promptDescription,
        contentType: promptContentType,
        difficulty: promptDifficulty,
      });

      // Refresh prompts
      const response = await getChallengePrompts(undefined, 100);
      setPrompts(response.items);

      // Reset form
      setPromptTitle("");
      setPromptDescription("");
      setShowCreatePrompt(false);
    } catch (err: any) {
      setError(err.message || "Failed to create prompt");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle invite creator
  const handleInvite = async () => {
    if (!selectedChallenge) return;

    try {
      setSubmitting(true);
      await inviteCreator(selectedChallenge.id, {
        userId: Number(inviteUserId),
        slot: inviteSlot,
        message: inviteMessage || undefined,
      });

      // Refresh challenges
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);

      // Reset form
      setInviteUserId("");
      setInviteMessage("");
      setShowInviteDialog(false);
      setSelectedChallenge(null);
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle lifecycle actions
  const handleActivate = async (challengeId: number) => {
    try {
      await activateChallenge(challengeId);
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to activate challenge");
    }
  };

  const handleOpen = async (challengeId: number) => {
    try {
      await openChallenge(challengeId);
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to open challenge");
    }
  };

  const handleCloseSubmissions = async (challengeId: number) => {
    try {
      await closeSubmissions(challengeId);
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to close submissions");
    }
  };

  const handleComplete = async (challengeId: number) => {
    try {
      await completeChallenge(challengeId);
      const response = await getChallenges(undefined, undefined, undefined, undefined, 0, 100);
      setChallenges(response.items);
    } catch (err: any) {
      setError(err.message || "Failed to complete challenge");
    }
  };

  // Not admin - show access denied
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
            <Button onClick={() => router.push("/challenges")}>
              Back to Challenges
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-7xl p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Challenge Management</h1>
            <p className="text-gray-400">Create and manage platform challenges</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setShowCreatePrompt(true)}
            >
              <Target className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={() => setShowCreateChallenge(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Challenge
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/20 mb-6">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-red-400"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 mb-6">
            <TabsTrigger value="challenges" className="data-[state=active]:bg-purple-500">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="prompts" className="data-[state=active]:bg-purple-500">
              Prompts
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-400">Challenge</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Entries</TableHead>
                      <TableHead className="text-gray-400">Created</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challenges.map((challenge) => {
                      const contentInfo = getContentTypeInfo(challenge.contentType);
                      const statusInfo = getChallengeStatusInfo(challenge.status);
                      const typeInfo = getChallengeTypeInfo(challenge.challengeType);
                      const Icon = contentTypeIcons[challenge.contentType];

                      return (
                        <TableRow key={challenge.id} className="border-white/10">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg bg-white/5")}>
                                <Icon className={cn("w-4 h-4", contentInfo.color)} />
                              </div>
                              <div>
                                <div className="font-medium text-white">{challenge.title}</div>
                                <div className="text-xs text-gray-500">{contentInfo.label}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn(statusInfo.color, statusInfo.bgColor)}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {challenge.totalEntries}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {new Date(challenge.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {/* View */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/challenges/${challenge.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {/* Invite (1v1 only, draft/inviting status) */}
                              {challenge.challengeType === "one_on_one" &&
                                ["draft", "inviting"].includes(challenge.status) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedChallenge(challenge);
                                      setShowInviteDialog(true);
                                    }}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}

                              {/* Activate (1v1 only, inviting status with both accepted) */}
                              {challenge.challengeType === "one_on_one" &&
                                challenge.status === "inviting" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-400"
                                    onClick={() => handleActivate(challenge.id)}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}

                              {/* Open (category only, draft status) */}
                              {challenge.challengeType === "category" &&
                                challenge.status === "draft" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400"
                                    onClick={() => handleOpen(challenge.id)}
                                  >
                                    <Users className="w-4 h-4" />
                                  </Button>
                                )}

                              {/* Close Submissions */}
                              {["open", "active"].includes(challenge.status) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-400"
                                  onClick={() => handleCloseSubmissions(challenge.id)}
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Complete */}
                              {challenge.status === "voting" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-400"
                                  onClick={() => handleComplete(challenge.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt) => {
                  const contentInfo = getContentTypeInfo(prompt.contentType);
                  const Icon = contentTypeIcons[prompt.contentType];

                  return (
                    <Card key={prompt.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn("p-2 rounded-lg bg-white/5")}>
                            <Icon className={cn("w-5 h-5", contentInfo.color)} />
                          </div>
                          <Badge variant="secondary" className={cn(
                            prompt.isActive ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"
                          )}>
                            {prompt.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-white mb-1">{prompt.title}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{prompt.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{prompt.difficulty}</span>
                          <span>{prompt.timesUsed} uses</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Challenge</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up a new platform challenge for creators
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Challenge Type */}
            <div>
              <Label className="text-white">Challenge Type</Label>
              <Select value={challengeType} onValueChange={(v) => setChallengeType(v as ChallengeType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1v1 Challenge</SelectItem>
                  <SelectItem value="category">Open Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Enter challenge title"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-white">Description (optional)</Label>
              <Textarea
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Describe the challenge..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
                rows={3}
              />
            </div>

            {/* Content Type */}
            <div>
              <Label className="text-white">Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const info = getContentTypeInfo(type);
                    return (
                      <SelectItem key={type} value={type}>
                        {info.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt */}
            <div>
              <Label className="text-white">Prompt (optional)</Label>
              <Select
                value={selectedPromptId?.toString() || ""}
                onValueChange={(v) => setSelectedPromptId(v ? Number(v) : null)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select a prompt" />
                </SelectTrigger>
                <SelectContent>
                  {prompts
                    .filter((p) => p.contentType === contentType && p.isActive)
                    .map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id.toString()}>
                        {prompt.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Submission Time (hours)</Label>
                <Input
                  type="number"
                  value={submissionHours}
                  onChange={(e) => setSubmissionHours(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Voting Time (hours)</Label>
                <Input
                  type="number"
                  value={votingHours}
                  onChange={(e) => setVotingHours(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            {/* Max Winners (category only) */}
            {challengeType === "category" && (
              <div>
                <Label className="text-white">Number of Winners</Label>
                <Input
                  type="number"
                  value={maxWinners}
                  onChange={(e) => setMaxWinners(e.target.value)}
                  min="1"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            )}

            {/* Prize Description */}
            <div>
              <Label className="text-white">Prize Description (optional)</Label>
              <Input
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
                placeholder="e.g., 500 karma points"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateChallenge(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleCreateChallenge}
              disabled={submitting || !challengeTitle.trim()}
            >
              {submitting ? "Creating..." : "Create Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prompt Dialog */}
      <Dialog open={showCreatePrompt} onOpenChange={setShowCreatePrompt}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Prompt</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new challenge prompt for creators
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label className="text-white">Title</Label>
              <Input
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="Enter prompt title"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Describe what creators should create..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
                rows={4}
              />
            </div>

            {/* Content Type */}
            <div>
              <Label className="text-white">Content Type</Label>
              <Select value={promptContentType} onValueChange={(v) => setPromptContentType(v as ContentType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const info = getContentTypeInfo(type);
                    return (
                      <SelectItem key={type} value={type}>
                        {info.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div>
              <Label className="text-white">Difficulty</Label>
              <Select value={promptDifficulty} onValueChange={(v) => setPromptDifficulty(v as typeof promptDifficulty)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePrompt(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleCreatePrompt}
              disabled={submitting || !promptTitle.trim() || !promptDescription.trim()}
            >
              {submitting ? "Creating..." : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Creator Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Creator</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an invitation to a creator for this 1v1 challenge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User ID */}
            <div>
              <Label className="text-white">User ID</Label>
              <Input
                type="number"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder="Enter user ID"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
              />
            </div>

            {/* Slot */}
            <div>
              <Label className="text-white">Participant Slot</Label>
              <Select value={inviteSlot.toString()} onValueChange={(v) => setInviteSlot(Number(v) as 1 | 2)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Participant 1</SelectItem>
                  <SelectItem value="2">Participant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label className="text-white">Personal Message (optional)</Label>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-purple-500 hover:bg-purple-600"
              onClick={handleInvite}
              disabled={submitting || !inviteUserId}
            >
              {submitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
