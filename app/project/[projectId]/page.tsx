"use client";

import { ProjectView } from "@/components/project/project-view";
import { BoboSidebarOptionA } from "@/components/ui/bobo-sidebar-option-a";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Project, ChatWithProject } from "@/lib/db/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<ChatWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project and chats data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [projectRes, chatsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/chats`),
        ]);

        if (!projectRes.ok) {
          if (projectRes.status === 404) {
            setError("not_found");
            return;
          }
          throw new Error("Failed to fetch project");
        }

        if (!chatsRes.ok) {
          throw new Error("Failed to fetch chats");
        }

        const projectData = await projectRes.json();
        const chatsData = await chatsRes.json();

        setProject(projectData.project);
        setChats(chatsData.chats || []);
      } catch (err) {
        console.error("Failed to fetch project data:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load project";
        setError(errorMessage);
        toast.error("Failed to load project", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Handle loading state
  if (loading) {
    return (
      <BoboSidebarOptionA>
        <div className="flex h-screen flex-col bg-white dark:bg-neutral-900">
          {/* Header Skeleton */}
          <div className="border-b border-neutral-200 p-6 dark:border-neutral-700">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {/* Chat Item Skeletons */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-3/4" />
                  <Skeleton className="mt-3 h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BoboSidebarOptionA>
    );
  }

  // Handle project not found
  if (error === "not_found" || !project) {
    return (
      <BoboSidebarOptionA>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Project not found
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              The project you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go back home
            </button>
          </div>
        </div>
      </BoboSidebarOptionA>
    );
  }

  // Handle other errors
  if (error) {
    return (
      <BoboSidebarOptionA>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Error loading project
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </BoboSidebarOptionA>
    );
  }

  const handleNameChange = async (newName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project name");
      }

      const data = await response.json();
      setProject(data.project);

      toast.success("Project updated", {
        description: "Project name has been updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update project name:", err);
      toast.error("Failed to update project", {
        description: "Unable to update project name. Please try again.",
      });
    }
  };

  const handleSubmit = (message: any) => {
    // Navigate to main chat interface with the message
    // In real app, this would create a new chat in the project and navigate there
    router.push("/");
  };

  // Convert chats to format expected by ProjectView
  const formattedChats = chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    preview: chat.title, // Use title as preview since we don't have a preview field yet
    timestamp: new Date(chat.updated_at),
    projectId: projectId, // All chats on this page belong to this project
  }));

  return (
    <BoboSidebarOptionA>
      <ProjectView
        projectId={projectId}
        projectName={project.name}
        chats={formattedChats}
        onNameChange={handleNameChange}
        onSubmit={handleSubmit}
      />
    </BoboSidebarOptionA>
  );
}
