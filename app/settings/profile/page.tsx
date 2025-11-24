"use client";

import { Suspense, useEffect, useState } from "react";
import { BoboSidebarOptionA } from "@/components/ui/bobo-sidebar-option-a";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconUser } from "@tabler/icons-react";

type UserProfile = {
  bio: string;
  background: string;
  preferences: string;
  technical_context: string;
};

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    bio: "",
    background: "",
    preferences: "",
    technical_context: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile({
            bio: data.bio || "",
            background: data.background || "",
            preferences: data.preferences || "",
            technical_context: data.technical_context || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (key: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Profile updated", {
        description: "Your personal context has been saved.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading profile...</div>}>
      <BoboSidebarOptionA>
        <div className="m-2 flex flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
              <div className="flex items-center gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconUser className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Personal Profile</h1>
                  <p className="text-muted-foreground">
                    Manage the context Bobo knows about you.
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>About You</CardTitle>
                  <CardDescription>
                    This information is injected into every chat to help Bobo understand who you are.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Short summary (e.g. 'Senior Frontend Engineer at TechCorp')"
                      value={profile.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      className="min-h-[80px]"
                      disabled={loading}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profile.bio.length}/500
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="background">Professional Background</Label>
                    <Textarea
                      id="background"
                      placeholder="Your experience, roles, and expertise..."
                      value={profile.background}
                      onChange={(e) => handleChange("background", e.target.value)}
                      className="min-h-[120px]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferences">Work Preferences</Label>
                    <Textarea
                      id="preferences"
                      placeholder="Communication style, coding patterns (e.g. 'Prefer functional programming', 'Explain like I'm 5')..."
                      value={profile.preferences}
                      onChange={(e) => handleChange("preferences", e.target.value)}
                      className="min-h-[120px]"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technical_context">Technical Context</Label>
                    <Textarea
                      id="technical_context"
                      placeholder="Languages, frameworks, and tools you use (e.g. 'TypeScript, Next.js, Postgres')..."
                      value={profile.technical_context}
                      onChange={(e) => handleChange("technical_context", e.target.value)}
                      className="min-h-[120px]"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={loading || saving}>
                      {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </BoboSidebarOptionA>
    </Suspense>
  );
}
