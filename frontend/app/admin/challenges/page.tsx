"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useModal, useFormState, useAsync } from "@/hooks";
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
  Camera,
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
  photography: Camera,
  video: Video,
  stream: Radio,
  audio: Headphones,
  writing: FileText,
  art: Brush,
};

const contentTypes: ContentType[] = ["design", "photography", "video", "stream", "audio", "writing", "art"];

export default function AdminChallengesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = React.useState("challenges");

  // Async data fetching
  const fetchDataFn = React.useCallback(async () => {
    const [challengesResponse, promptsResponse] = await Promise.all([
      getChallenges(undefined, undefined, undefined, undefined, 0, 100),
      getChallengePrompts(undefined, 100),
    ]);
    return { challenges: challengesResponse.items, prompts: promptsResponse.items };
  }, []);

  const {
    data,
    isLoading: loading,
    error,
    refetch: fetchData,
  } = useAsync(fetchDataFn, { immediate: false });

  const challenges = data?.challenges ?? [];
  const prompts = data?.prompts ?? [];

  React.useEffect(() => {
    if (user?.role === "admin") {
      fetchData();
    }
  }, [user, fetchData]);

  // Dialog modals
  const createChallengeModal = useModal();
  const createPromptModal = useModal();
  const inviteModal = useModal<Challenge>();
  const openSlotsModal = useModal<Challenge>();

  // Challenge form
  const challengeForm = useFormState({
    title: "",
    description: "",
    challengeType: "one_on_one" as ChallengeType,
    contentType: "design" as ContentType,
    selectedPromptId: null as number | null,
    submissionHours: "72",
    votingHours: "48",
    maxWinners: "1",
    prizeDescription: "",
    invitationMode: "admin_curated" as InvitationMode,
  });

  // Prompt form
  const promptForm = useFormState({
    title: "",
    description: "",
    contentType: "design" as ContentType,
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
  });

  // Invite form
  const inviteForm = useFormState({
    userId: "",
    slot: 1 as 1 | 2,
    message: "",
  });

  // Open slots form
  const openSlotsForm = useFormState({
    duration: "24",
  });

  // Submitting state
  const [submitting, setSubmitting] = React.useState(false);

  // Handle create challenge
  const handleCreateChallenge = async () => {
    try {
      setSubmitting(true);
      const { values } = challengeForm;
      await createChallenge({
        title: values.title,
        description: values.description || undefined,
        contentType: values.contentType,
        challengeType: values.challengeType,
        promptId: values.selectedPromptId || undefined,
        submissionHours: Number(values.submissionHours),
        votingHours: Number(values.votingHours),
        maxWinners: Number(values.maxWinners),
        invitationMode: values.challengeType === "one_on_one" ? values.invitationMode : undefined,
        prizeDescription: values.prizeDescription || undefined,
      });

      await fetchData();
      challengeForm.reset();
      createChallengeModal.close();
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
      const { values } = promptForm;
      await createChallengePrompt({
        title: values.title,
        description: values.description,
        contentType: values.contentType,
        difficulty: values.difficulty,
      });

      await fetchData();
      promptForm.reset();
      createPromptModal.close();
      toast.success("Prompt created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create prompt");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle invite creator
  const handleInvite = async () => {
    if (!inviteModal.data) return;

    try {
      setSubmitting(true);
      const { values } = inviteForm;
      await inviteCreator(inviteModal.data.id, {
        userId: Number(values.userId),
        slot: values.slot,
        message: values.message || undefined,
      });

      await fetchData();
      inviteForm.reset();
      inviteModal.close();
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
    if (!openSlotsModal.data) return;

    try {
      setSubmitting(true);
      await openChallengeSlots(openSlotsModal.data.id, Number(openSlotsForm.values.duration));
      await fetchData();
      openSlotsForm.reset();
      openSlotsModal.close();
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
            onClick={() => createPromptModal.open()}
          >
            <Target className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
          <Button
            className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
            onClick={() => createChallengeModal.open()}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Challenge
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-600 dark:text-red-400">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-red-500 hover:text-red-600"
              onClick={() => fetchData()}
            >
              Retry
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
                                  onClick={() => inviteModal.open(challenge)}
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
                                  onClick={() => openSlotsModal.open(challenge)}
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
      <Dialog open={createChallengeModal.isOpen} onOpenChange={(open) => !open && createChallengeModal.close()}>
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
              <Select value={challengeForm.values.challengeType} onValueChange={(v) => challengeForm.setValue("challengeType", v as ChallengeType)}>
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1v1 Challenge</SelectItem>
                  <SelectItem value="category">Open Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {challengeForm.values.challengeType === "one_on_one" && (
              <div>
                <Label className="text-foreground">Participant Selection</Label>
                <Select value={challengeForm.values.invitationMode} onValueChange={(v) => challengeForm.setValue("invitationMode", v as InvitationMode)}>
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
                value={challengeForm.values.title}
                onChange={(e) => challengeForm.setValue("title", e.target.value)}
                placeholder="Enter challenge title"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Description (optional)</Label>
              <Textarea
                value={challengeForm.values.description}
                onChange={(e) => challengeForm.setValue("description", e.target.value)}
                placeholder="Describe the challenge..."
                className="bg-background border-border text-foreground mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-foreground">Content Type</Label>
              <Select value={challengeForm.values.contentType} onValueChange={(v) => challengeForm.setValue("contentType", v as ContentType)}>
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
                value={challengeForm.values.selectedPromptId?.toString() || ""}
                onValueChange={(v) => challengeForm.setValue("selectedPromptId", v ? Number(v) : null)}
              >
                <SelectTrigger className="bg-background border-border text-foreground mt-1">
                  <SelectValue placeholder="Select a prompt" />
                </SelectTrigger>
                <SelectContent>
                  {prompts
                    .filter((p) => p.contentType === challengeForm.values.contentType && p.isActive)
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
                  value={challengeForm.values.submissionHours}
                  onChange={(e) => challengeForm.setValue("submissionHours", e.target.value)}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Voting Time (hours)</Label>
                <Input
                  type="number"
                  value={challengeForm.values.votingHours}
                  onChange={(e) => challengeForm.setValue("votingHours", e.target.value)}
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
            </div>

            {challengeForm.values.challengeType === "category" && (
              <div>
                <Label className="text-foreground">Number of Winners</Label>
                <Input
                  type="number"
                  value={challengeForm.values.maxWinners}
                  onChange={(e) => challengeForm.setValue("maxWinners", e.target.value)}
                  min="1"
                  className="bg-background border-border text-foreground mt-1"
                />
              </div>
            )}

            <div>
              <Label className="text-foreground">Prize Description (optional)</Label>
              <Input
                value={challengeForm.values.prizeDescription}
                onChange={(e) => challengeForm.setValue("prizeDescription", e.target.value)}
                placeholder="e.g., 500 sparks"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => createChallengeModal.close()}>
              Cancel
            </Button>
            <Button
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
              onClick={handleCreateChallenge}
              disabled={submitting || !challengeForm.values.title.trim()}
            >
              {submitting ? "Creating..." : "Create Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prompt Dialog */}
      <Dialog open={createPromptModal.isOpen} onOpenChange={(open) => !open && createPromptModal.close()}>
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
                value={promptForm.values.title}
                onChange={(e) => promptForm.setValue("title", e.target.value)}
                placeholder="Enter prompt title"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={promptForm.values.description}
                onChange={(e) => promptForm.setValue("description", e.target.value)}
                placeholder="Describe what creators should create..."
                className="bg-background border-border text-foreground mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-foreground">Content Type</Label>
              <Select value={promptForm.values.contentType} onValueChange={(v) => promptForm.setValue("contentType", v as ContentType)}>
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
              <Select value={promptForm.values.difficulty} onValueChange={(v) => promptForm.setValue("difficulty", v as "beginner" | "intermediate" | "advanced")}>
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
            <Button variant="outline" onClick={() => createPromptModal.close()}>
              Cancel
            </Button>
            <Button
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
              onClick={handleCreatePrompt}
              disabled={submitting || !promptForm.values.title.trim() || !promptForm.values.description.trim()}
            >
              {submitting ? "Creating..." : "Create Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Creator Dialog */}
      <Dialog open={inviteModal.isOpen} onOpenChange={(open) => !open && inviteModal.close()}>
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
                value={inviteForm.values.userId}
                onChange={(e) => inviteForm.setValue("userId", e.target.value)}
                placeholder="Enter user ID"
                className="bg-background border-border text-foreground mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Participant Slot</Label>
              <Select value={inviteForm.values.slot.toString()} onValueChange={(v) => inviteForm.setValue("slot", Number(v) as 1 | 2)}>
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
                value={inviteForm.values.message}
                onChange={(e) => inviteForm.setValue("message", e.target.value)}
                placeholder="Add a personal message to the invitation..."
                className="bg-background border-border text-foreground mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => inviteModal.close()}>
              Cancel
            </Button>
            <Button
              className="bg-[#4CC9F0] hover:bg-[#3DB8DF] text-white"
              onClick={handleInvite}
              disabled={submitting || !inviteForm.values.userId}
            >
              {submitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Slots Dialog */}
      <Dialog open={openSlotsModal.isOpen} onOpenChange={(open) => !open && openSlotsModal.close()}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Open Challenge Slots</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Allow users to claim slots on a first-come, first-served basis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {openSlotsModal.data && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{openSlotsModal.data.title}</p>
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
                value={openSlotsForm.values.duration}
                onChange={(e) => openSlotsForm.setValue("duration", e.target.value)}
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
            <Button variant="outline" onClick={() => openSlotsModal.close()}>
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
