/**
 * Voice Memo Recorder Component
 *
 * Allows reviewers to record voice notes as part of their feedback.
 * Supports recording, playback, and basic editing.
 *
 * Features:
 * - One-tap recording with visual feedback
 * - Waveform visualization during recording
 * - Playback with progress bar
 * - Duration limits (max 2 minutes)
 * - Delete and re-record options
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_DURATION = 120; // 2 minutes max

interface VoiceMemoRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onDelete?: () => void;
  existingAudioUrl?: string;
  existingDuration?: number;
  className?: string;
  disabled?: boolean;
}

type RecorderState = "idle" | "recording" | "recorded" | "playing";

export function VoiceMemoRecorder({
  onRecordingComplete,
  onDelete,
  existingAudioUrl,
  existingDuration,
  className,
  disabled = false,
}: VoiceMemoRecorderProps) {
  const [state, setState] = React.useState<RecorderState>(
    existingAudioUrl ? "recorded" : "idle"
  );
  const [duration, setDuration] = React.useState(existingDuration || 0);
  const [playbackProgress, setPlaybackProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(
    existingAudioUrl || null
  );
  const [volumeLevel, setVolumeLevel] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl && !existingAudioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, existingAudioUrl]);

  // Update audio URL when existing changes
  React.useEffect(() => {
    if (existingAudioUrl) {
      setAudioUrl(existingAudioUrl);
      setState("recorded");
      setDuration(existingDuration || 0);
    }
  }, [existingAudioUrl, existingDuration]);

  // Analyze audio volume during recording
  const analyzeVolume = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      if (state !== "recording") return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setVolumeLevel(average / 255);

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  };

  // Start recording
  const startRecording = async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for volume analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);

        if (audioUrl && !existingAudioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioUrl(url);
        setState("recorded");

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, duration);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setState("recording");
      setDuration(0);

      // Start volume analysis
      analyzeVolume(analyser);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError("Microphone access denied. Please enable microphone permissions.");
      console.error("Recording error:", err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setVolumeLevel(0);
  };

  // Play recording
  const playRecording = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setState("recorded");
        setPlaybackProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setPlaybackProgress(
            (audioRef.current.currentTime / (duration || 1)) * 100
          );
        }
      };
    }

    audioRef.current.play();
    setState("playing");
  };

  // Pause playback
  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState("recorded");
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setPlaybackProgress(0);
    setState("idle");

    if (onDelete) {
      onDelete();
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render waveform bars
  const renderWaveform = () => {
    const bars = 20;
    return (
      <div className="flex items-center justify-center gap-0.5 h-8">
        {Array.from({ length: bars }).map((_, i) => {
          // Create wave-like pattern based on volume
          const baseHeight = state === "recording" ? volumeLevel * 100 : 20;
          const variance = Math.sin((i / bars) * Math.PI * 2 + Date.now() / 200) * 30;
          const height = Math.max(10, Math.min(100, baseHeight + variance));

          return (
            <motion.div
              key={i}
              className={cn(
                "w-1 rounded-full",
                state === "recording" ? "bg-red-500" : "bg-accent-blue/40"
              )}
              animate={{
                height: state === "recording" ? `${height}%` : "20%",
              }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
        <Volume2 className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Voice Note</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {state === "recording" && "Recording..."}
          {state === "recorded" && "Ready to play"}
          {state === "playing" && "Playing..."}
          {state === "idle" && "Optional"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
            >
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle State */}
        {state === "idle" && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Add a voice note to give more context to your feedback
            </p>
            <Button
              onClick={startRecording}
              variant="outline"
              className="gap-2 border-accent-blue/30 hover:bg-accent-blue/10"
            >
              <Mic className="size-4 text-accent-blue" />
              <span>Start Recording</span>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Max {MAX_DURATION / 60} minutes
            </p>
          </div>
        )}

        {/* Recording State */}
        {state === "recording" && (
          <div className="space-y-4">
            {/* Waveform */}
            <div className="h-12 bg-red-50/50 rounded-lg px-2 flex items-center">
              {renderWaveform()}
            </div>

            {/* Duration & Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="size-3 rounded-full bg-red-500"
                />
                <span className="text-lg font-mono font-medium text-foreground">
                  {formatDuration(duration)}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {formatDuration(MAX_DURATION)}
                </span>
              </div>
              <Button
                onClick={stopRecording}
                size="sm"
                variant="destructive"
                className="gap-2"
              >
                <Square className="size-4" />
                <span>Stop</span>
              </Button>
            </div>

            {/* Progress bar to max duration */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                style={{ width: `${(duration / MAX_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Recorded/Playing State */}
        {(state === "recorded" || state === "playing") && audioUrl && (
          <div className="space-y-3">
            {/* Playback Progress */}
            <div className="relative h-12 bg-accent-blue/5 rounded-lg px-2 flex items-center">
              {/* Progress overlay */}
              <div
                className="absolute inset-y-0 left-0 bg-accent-blue/10 rounded-l-lg transition-all"
                style={{ width: `${playbackProgress}%` }}
              />

              {/* Static waveform visualization */}
              <div className="relative z-10 flex items-center justify-center gap-0.5 w-full h-8">
                {Array.from({ length: 40 }).map((_, i) => {
                  const height = 20 + Math.sin((i / 40) * Math.PI * 4) * 60;
                  return (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-accent-blue/40"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">
                  {formatDuration(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {state === "recorded" ? (
                  <Button
                    onClick={playRecording}
                    size="sm"
                    variant="default"
                    className="gap-2 bg-accent-blue hover:bg-accent-blue/90"
                  >
                    <Play className="size-4" />
                    <span>Play</span>
                  </Button>
                ) : (
                  <Button
                    onClick={pausePlayback}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Pause className="size-4" />
                    <span>Pause</span>
                  </Button>
                )}
                <Button
                  onClick={deleteRecording}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
