"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { ProjectChatCreation } from "@/components/project/project-chat-creation";
import { AppSidebar, MobileHeader } from "@/components/ui/app-sidebar";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project, ChatWithProject, ProjectWithStats } from "@/lib/db/types";
import { ProjectChatList } from "@/components/project/project-chat-list";
import { ProjectContext } from "@/components/project/project-context";
import { Folder } from "lucide-react";
import Link from "next/link";

// Extended chat type with preview
interface ChatWithPreview extends ChatWithProject {
  preview?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const chatId = searchParams?.get("chatId");

  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<ChatWithPreview[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project, chats, and all projects (for move dialog)
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectRes, chatsRes, projectsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/chats`),
        fetch(`/api/projects`),
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
      const projectsData = projectsRes.ok ? await projectsRes.json() : { projects: [] };

      setProject(projectData.project);
      setChats(chatsData.chats || []);
      setProjects(projectsData.projects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load project";
      setError(errorMessage);
      toast.error("Failed to load project", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Show chat view when chatId is present
  const isInChatView = Boolean(chatId);

  const renderLoadingOrError = () => {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </div>
      );
    }

    if (error === "not_found" || !project) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Project not found
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              The project you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Error loading project
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{error}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const loadingOrError = renderLoadingOrError();

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading project...</div>}>
      <AppSidebar>
        <div className="flex min-h-svh flex-1 flex-col">
          {/* Mobile Header */}
          {!isInChatView && (
            <MobileHeader title={project?.name} />
          )}

          {/* Main Content */}
          <div className="m-2 flex flex-1 flex-col rounded-2xl border border-border bg-background md:m-2">
            <div className="flex flex-1 flex-col overflow-hidden">
              {isInChatView ? (
                // Active chat view - full height chat interface
                <ChatInterface
                  projectId={projectId}
                  className="h-full"
                  projectName={project?.name}
                />
              ) : (
                // Project overview - ChatGPT-style folder view
                <div className="flex flex-1 flex-col overflow-y-auto">
                  {loadingOrError || (
                    <>
                      {/* Header Section: Title Left, Action Right */}
                      <div className="px-4 py-6 md:px-6 md:py-8">
                        <div className="mx-auto flex max-w-3xl items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Folder className="h-6 w-6 text-muted-foreground" />
                            <h1 className="text-xl md:text-2xl font-semibold">
                              {project?.name}
                            </h1>
                          </div>
                          <Link
                            href={`/project/${projectId}/settings`}
                            className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                          >
                            Add files
                          </Link>
                        </div>
                      </div>

                      {/* Project Context Section */}
                      <div className="px-4 pb-4 md:px-6">
                        <div className="mx-auto max-w-3xl">
                          <ProjectContext
                            project={project!}
                            onUpdate={(updatedProject) => setProject(updatedProject)}
                          />
                        </div>
                      </div>

                      {/* Chat Input Section */}
                      <div className="px-4 pb-4 md:px-6 md:pb-6">
                        <div className="mx-auto max-w-3xl">
                          <ProjectChatCreation
                            projectId={projectId}
                            className="h-auto"
                            projectName={project?.name}
                          />
                        </div>
                      </div>

                      {/* Chat List Section */}
                      <div className="flex-1 px-4 md:px-6">
                        {chats.length === 0 ? (
                          <div className="mt-8 text-center text-sm text-muted-foreground">
                            Start a conversation to work on this project
                          </div>
                        ) : (
                          <div className="mx-auto max-w-3xl">
                            <ProjectChatList
                              chats={chats}
                              projectId={projectId}
                              projects={projects}
                              onUpdate={fetchData}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppSidebar>
    </Suspense>
  );
}
