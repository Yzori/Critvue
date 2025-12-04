"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getChallenges,
  getChallengePrompts,
  createChallenge,
  createChallengePrompt,
  inviteCreator,
  activateChallenge,
  openChallenge,
  closeSubmissions,
  completeChallenge,
  openChallengeSlots,
  Challenge,
  ChallengePrompt,
  ContentType,
  ChallengeType,
  InvitationMode,
  getContentTypeInfo,
  getChallengeStatusInfo,
  getChallengeTypeInfo,
} from "@/lib/api/challenges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Target,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

export default function AdminChallengesPage() {
  const router = useRouter();
  const { user } = useAuth();

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
  const [invitationMode, setInvitationMode] = React.useState<InvitationMode>("admin_curated");

  // Open slots dialog
  const [showOpenSlotsDialog, setShowOpenSlotsDialog] = React.useState(false);
  const [openSlotsDuration, setOpenSlotsDuration] = React.useState("24");

  const [promptTitle, setPromptTitle] = React.useState("");
  const [promptDescription, setPromptDescription] = React.useState("");
  const [promptContentType, setPromptContentType] = React.useState<ContentType>("design");
  const [promptDifficulty, setPromptDifficulty] = React.useState<"beginner" | "intermediate" | "advanced">("intermediate");

  const [inviteUserId, setInviteUserId] = React.useState("");
  const [inviteSlot, setInviteSlot] = React.useState<1 | 2>(1);
  const [inviteMessage, setInviteMessage] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [challengesResponse, promptsResponse] = await Promise.all([
        getChallenges(undefined, undefined, undefined, undefined, 0, 100),
        getChallengePrompts(undefined, 100),
      ]);

      setChallenges(challengesResponse.items);
      setPrompts(promptsResponse.items);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, fetchData]);

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
        invitationMode: challengeType === "one_on_one" ? invitationMode : undefined,
        prizeDescription: prizeDescription || undefined,
      });

      await fetchData();
      setChallengeTitle("");
      setChallengeDescription("");
      setSelectedPromptId(null);
      setPrizeDescription("");
      setInvitationMode("admin_curated");
      setShowCreateChallenge(false);
      toast.success("Challenge created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create challenge");
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

      await fetchData();
      setPromptTitle("");
      setPromptDescription("");
      setShowCreatePrompt(false);
      toast.success("Prompt created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create prompt");
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

      await fetchData();
      setInviteUserId("");
      setInviteMessage("");
      setShowInviteDialog(false);
      setSelectedChallenge(null);
      toast.success("Invitation sent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle lifecycle actions
  const handleActivate = async (challengeId: number) => {
    try {
      await activateChallenge(challengeId);
      await fetchData();
      toast.success("Challenge activated");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate challenge");
    }
  };

  const handleOpen = async (challengeId: number) => {
    try {
      await openChallenge(challengeId);
      await fetchData();
      toast.success("Challenge opened for submissions");
    } catch (err: any) {
      toast.error(err.message || "Failed to open challenge");
    }
  };

  const handleCloseSubmissions = async (challengeId: number) => {
    try {
      await closeSubmissions(challengeId);
      await fetchData();
      toast.success("Submissions closed, voting started");
    } catch (err: any) {
      toast.error(err.message || "Failed to close submissions");
    }
  };

  const handleComplete = async (challengeId: number) => {
    try {
      await completeChallenge(challengeId);
      await fetchData();
      toast.success("Challenge completed");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete challenge");
    }
  };

  const handleOpenSlots = async () => {
    if (!selectedChallenge) return;

    try {
      setSubmitting(true);
      await openChallengeSlots(selectedChallenge.id, Number(openSlotsDuration));
      await fetchData();
      setOpenSlotsDuration("24");
      setShowOpenSlotsDialog(false);
      setSelectedChallenge(null);
      toast.success("Slots opened for claiming");
    } catch (err: any) {
      toast.error(err.message || "Failed to open slots");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Challenge Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage platform challenges</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCreatePrompt(true)}
          >
            <Target className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
          <Button
            className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
            onClick={() => setShowCreateChallenge(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Challenge
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-red-500 hover:text-red-600"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="challenges" className="data-[state=active]:bg-[#4CC9F0] data-[state=active]:text-white">
            Challenges ({challenges.length})
          </TabsTrigger>
          <TabsTrigger value="prompts" className="data-[state=active]:bg-[#4CC9F0] data-[state=active]:text-white">
            Prompts ({prompts.length})
          </TabsTrigger>
        </TabsList>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <Card className="bg-background border-border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Challenge</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Mode</TableHead>
                    <TableHead className="text-muted-foreground">Entries</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => {
                    const contentInfo = getContentTypeInfo(challenge.contentType);
                    const statusInfo = getChallengeStatusInfo(challenge.status);
                    const typeInfo = getChallengeTypeInfo(challenge.challengeType);
                    const Icon = contentTypeIcons[challenge.contentType];

                    return (
                      <TableRow key={challenge.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg bg-muted")}>
                              <Icon className={cn("w-4 h-4", contentInfo.color)} />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{challenge.title}</div>
                              <div className="text-xs text-muted-foreground">{contentInfo.label}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-[#4CC9F0]/10 text-[#4CC9F0]">
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(statusInfo.color, statusInfo.bgColor)}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {challenge.challengeType === "one_on_one" && (
                            <Badge variant="outline" className={cn(
                              challenge.invitationMode === "open_slots"
                                ? "border-[#4ADE80] text-[#4ADE80]"
                                : "border-border text-muted-foreground"
                            )}>
                              {challenge.invitationMode === "open_slots" ? "Open Slots" : "Curated"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {challenge.totalEntries}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(challenge.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => router.push(`/challenges/${challenge.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {challenge.challengeType === "one_on_one" &&
                              challenge.invitationMode === "admin_curated" &&
                              ["draft", "inviting"].includes(challenge.status) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#4CC9F0] hover:text-[#3DB8DF]"
                                  onClick={() => {
                                    setSelectedChallenge(challenge);
                                    setShowInviteDialog(true);
                                  }}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}

                            {challenge.challengeType === "one_on_one" &&
                              challenge.invitationMode === "open_slots" &&
                              challenge.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#4ADE80] hover:text-[#3FCF70]"
                                  onClick={() => {
                                    setSelectedChallenge(challenge);
                                    setShowOpenSlotsDialog(true);
                                  }}
                                >
                                  <Unlock className="w-4 h-4" />
                                </Button>
                              )}

                            {challenge.challengeType === "one_on_one" &&
                              challenge.status === "inviting" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#4ADE80] hover:text-[#3FCF70]"
                                  onClick={() => handleActivate(challenge.id)}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}

                            {challenge.challengeType === "category" &&
                              challenge.status === "draft" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#4CC9F0] hover:text-[#3DB8DF]"
                                  onClick={() => handleOpen(challenge.id)}
                                >
                                  <Users className="w-4 h-4" />
                                </Button>
                              )}

                            {["open", "active"].includes(challenge.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#F97316] hover:text-[#E86205]"
                                onClick={() => handleCloseSubmissions(challenge.id)}
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            )}

                            {challenge.status === "voting" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#4ADE80] hover:text-[#3FCF70]"
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
        <TabsContent value="prompts" className="mt-6">
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
                  <Card key={prompt.id} className="bg-background border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2 rounded-lg bg-muted")}>
                          <Icon className={cn("w-5 h-5", contentInfo.color)} />
                        </div>
                        <Badge variant="secondary" className={cn(
                          prompt.isActive ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-muted text-muted-foreground"
                        )}>
                          {prompt.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-foreground mb-1">{prompt.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{prompt.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{prompt.difficulty}</span>
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

      {/* Create Challenge Dialog */}
      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="bg-background border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Challenge</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set up a new platform challenge for creators
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Challenge Type</Label>
              <Select value={challengeType} onValueChange={(v) => setChallengeType(v as ChallengeType)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1v1 Challenge</SelectItem>
                  <SelectItem value="category">Open Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {challengeType === "one_on_one" && (
              <div>
                <Label className="text-foreground">Participant Selection</Label>
                <Select value={invitationMode} onValueChange={(v) => setInvitationMode(v as InvitationMode)}>
                  <SelectTrigger className="bg-background border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_curated">Admin Curated</SelectItem>
                    <SelectItem value="open_slots">Open Slots</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-foreground">Title</Label>
              <Input
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Enter challenge title"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Description (optional)</Label>
              <Textarea
                value={challengeDescription}
                onChange={(e) => setChallengeDescription(e.target.value)}
                placeholder="Describe the challenge..."
                className="bg-background border-border text-foreground mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-foreground">Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const info = getContentTypeInfo(type);
                    return (
                      <SelectItem key={type} value={type}>{info.label}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Prompt (optional)</Label>
              <Select
                value={selectedPromptId?.toString() || ""}
                onValueChange={(v) => setSelectedPromptId(v ? Number(v) : null)}
              >
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Submission Time (hours)</Label>
                <Input
                  type="number"
                  value={submissionHours}
                  onChange={(e) => setSubmissionHours(e.target.value)}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Voting Time (hours)</Label>
                <Input
                  type="number"
                  value={votingHours}
                  onChange={(e) => setVotingHours(e.target.value)}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
            </div>

            {challengeType === "category" && (
              <div>
                <Label className="text-foreground">Number of Winners</Label>
                <Input
                  type="number"
                  value={maxWinners}
                  onChange={(e) => setMaxWinners(e.target.value)}
                  min="1"
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-foreground">Prize Description (optional)</Label>
              <Input
                value={prizeDescription}
                onChange={(e) => setPrizeDescription(e.target.value)}
                placeholder="e.g., 500 karma points"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateChallenge(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
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
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Prompt</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new challenge prompt for creators
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Title</Label>
              <Input
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="Enter prompt title"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Describe what creators should create..."
                className="bg-background border-border text-foreground mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-foreground">Content Type</Label>
              <Select value={promptContentType} onValueChange={(v) => setPromptContentType(v as ContentType)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const info = getContentTypeInfo(type);
                    return (
                      <SelectItem key={type} value={type}>{info.label}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Difficulty</Label>
              <Select value={promptDifficulty} onValueChange={(v) => setPromptDifficulty(v as typeof promptDifficulty)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
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
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
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
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invite Creator</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an invitation to a creator for this 1v1 challenge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">User ID</Label>
              <Input
                type="number"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder="Enter user ID"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Participant Slot</Label>
              <Select value={inviteSlot.toString()} onValueChange={(v) => setInviteSlot(Number(v) as 1 | 2)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Participant 1</SelectItem>
                  <SelectItem value="2">Participant 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Personal Message (optional)</Label>
              <Textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to the invitation..."
                className="bg-background border-border text-foreground mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
              onClick={handleInvite}
              disabled={submitting || !inviteUserId}
            >
              {submitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Slots Dialog */}
      <Dialog open={showOpenSlotsDialog} onOpenChange={setShowOpenSlotsDialog}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Open Challenge Slots</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Allow users to claim slots on a first-come, first-served basis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedChallenge && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{selectedChallenge.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once opened, anyone can claim a slot. The challenge will automatically
                  activate when both slots are filled.
                </p>
              </div>
            )}

            <div>
              <Label className="text-foreground">Slot Claiming Duration (hours)</Label>
              <Input
                type="number"
                value={openSlotsDuration}
                onChange={(e) => setOpenSlotsDuration(e.target.value)}
                min="1"
                max="168"
                className="bg-background border-border text-foreground mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How long users have to claim slots (1-168 hours)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOpenSlotsDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#4ADE80] hover:bg-[#3FCF70] text-white"
              onClick={handleOpenSlots}
              disabled={submitting}
            >
              {submitting ? "Opening..." : "Open Slots"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
