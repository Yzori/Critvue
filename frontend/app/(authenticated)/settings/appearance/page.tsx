"use client";

import * as React from "react";
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Appearance Settings Page
 *
 * Allows users to customize the visual appearance:
 * - Theme (light/dark/system)
 * - Font size
 * - Color accent (future)
 */

type Theme = "light" | "dark" | "system";
type FontSize = "small" | "default" | "large";

interface AppearanceSettings {
  theme: Theme;
  font_size: FontSize;
}

const themeOptions: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function AppearanceSettingsPage() {
  const [settings, setSettings] = React.useState<AppearanceSettings>({
    theme: "system",
    font_size: "default",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalSettings, setOriginalSettings] = React.useState<AppearanceSettings>({
    theme: "system",
    font_size: "default",
  });

  // Load saved settings from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedFontSize = localStorage.getItem("fontSize") as FontSize | null;

    const loadedSettings: AppearanceSettings = {
      theme: savedTheme || "system",
      font_size: savedFontSize || "default",
    };

    setSettings(loadedSettings);
    setOriginalSettings(loadedSettings);

    // Apply theme immediately
    applyTheme(loadedSettings.theme);
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemPrefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
    setHasChanges(true);
    // Apply theme preview immediately
    applyTheme(theme);
  };

  const handleFontSizeChange = (font_size: FontSize) => {
    setSettings((prev) => ({ ...prev, font_size }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Save to localStorage
      localStorage.setItem("theme", settings.theme);
      localStorage.setItem("fontSize", settings.font_size);

      // Apply settings
      applyTheme(settings.theme);

      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success("Appearance settings saved");
    } catch (error) {
      console.error("Failed to save appearance settings:", error);
      toast.error("Failed to save appearance settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setHasChanges(false);
    // Revert theme preview
    applyTheme(originalSettings.theme);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold lg:text-xl">Appearance</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Customize how Critvue looks on your device
        </p>
      </div>

      {/* Theme Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="size-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Select your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) => handleThemeChange(value as Theme)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = settings.theme === option.value;

              return (
                <Label
                  key={option.value}
                  htmlFor={`theme-${option.value}`}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:border-accent-blue/50",
                    isSelected
                      ? "border-accent-blue bg-accent-blue/5"
                      : "border-border"
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`theme-${option.value}`}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "size-12 rounded-full flex items-center justify-center",
                      option.value === "light" && "bg-amber-100",
                      option.value === "dark" && "bg-slate-800",
                      option.value === "system" && "bg-gradient-to-br from-amber-100 to-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-6",
                        option.value === "light" && "text-amber-600",
                        option.value === "dark" && "text-slate-200",
                        option.value === "system" && "text-slate-600"
                      )}
                    />
                  </div>
                  <span className={cn("font-medium", isSelected && "text-accent-blue")}>
                    {option.label}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Size Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="size-5" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust the text size for better readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={settings.font_size}
              onValueChange={(value) => handleFontSizeChange(value as FontSize)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  <span className="text-sm">Small</span>
                </SelectItem>
                <SelectItem value="default">
                  <span className="text-base">Default</span>
                </SelectItem>
                <SelectItem value="large">
                  <span className="text-lg">Large</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Preview */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-muted-foreground text-xs mb-2">Preview</p>
              <p
                className={cn(
                  settings.font_size === "small" && "text-sm",
                  settings.font_size === "default" && "text-base",
                  settings.font_size === "large" && "text-lg"
                )}
              >
                This is how text will appear across the application. Adjust the
                font size to find what works best for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accent Color Card (Future Feature) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="size-5" />
            Accent Color
            <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded">Coming Soon</span>
          </CardTitle>
          <CardDescription>
            Personalize the interface with your favorite color
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {["#4CC9F0", "#F97316", "#4ADE80", "#A855F7", "#EC4899"].map((color) => (
              <button
                key={color}
                disabled
                className={cn(
                  "size-10 rounded-full border-2 cursor-not-allowed",
                  color === "#4CC9F0" ? "border-accent-blue ring-2 ring-accent-blue/30" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color} accent color`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 flex items-center justify-end gap-3 p-4 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-lg">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "bg-accent-blue text-white font-semibold",
              "hover:opacity-90"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
