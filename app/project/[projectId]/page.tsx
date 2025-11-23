"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import { BoboSidebarOptionA } from "@/components/ui/bobo-sidebar-option-a";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Project, ChatWithProject } from "@/lib/db/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectHeader } from "@/components/project/project-header";
import { ProjectEmptyState } from "@/components/project/empty-state";
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
  type ColumnDef,
} from "@/components/kibo-ui/table";

type ChatTableRow = {
  id: string;
  title: string;
  updated_at: Date;
  model: string;
};

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const chatId = searchParams?.get("chatId");

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

  // Show chat list when no chat is selected
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const columns: ColumnDef<ChatTableRow>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Chat Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="font-medium">{row.getValue("title")}</div>
        );
      },
    },
    {
      accessorKey: "model",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Model" />
      ),
      cell: ({ row }) => {
        const model = row.getValue("model") as string;
        const modelName = model.split("/")[1] || model;
        return <div className="text-sm text-muted-foreground">{modelName}</div>;
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Last Updated" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {formatRelativeDate(date)}
          </div>
        );
      },
    },
  ];

  const tableData: ChatTableRow[] = chats.map((chat) => ({
    id: chat.id,
    title: chat.title,
    updated_at: new Date(chat.updated_at),
    model: chat.model,
  }));

  const shellHidden = Boolean(chatId);

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
    <BoboSidebarOptionA>
      <div className="m-2 flex min-h-[calc(100vh-1rem)] flex-1 flex-col rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {!shellHidden && (
          <ProjectHeader
            projectId={projectId}
            projectName={project?.name || ""}
            onNameChange={handleNameChange}
          />
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {!shellHidden && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingOrError ? (
                loadingOrError
              ) : chats.length === 0 ? (
                <ProjectEmptyState />
              ) : (
                <div className="cursor-pointer">
                  <TableProvider columns={columns} data={tableData}>
                    <TableHeader>
                      {({ headerGroup }) => (
                        <TableHeaderGroup headerGroup={headerGroup}>
                          {({ header }) => <TableHead header={header} />}
                        </TableHeaderGroup>
                      )}
                    </TableHeader>
                    <TableBody>
                      {({ row }) => (
                        <TableRow
                          row={row}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {({ cell }) => (
                            <TableCell
                              cell={cell}
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(`/project/${projectId}?chatId=${row.original.id}`)
                              }
                            />
                          )}
                        </TableRow>
                      )}
                    </TableBody>
                  </TableProvider>
                </div>
              )}
            </div>
          )}

          <div
            className={
              shellHidden
                ? "flex-1"
                : "border-t border-neutral-200 dark:border-neutral-700"
            }
          >
            <ChatInterface
              projectId={projectId}
              className={shellHidden ? "h-full" : "h-auto p-4"}
            />
          </div>
        </div>
      </div>
    </BoboSidebarOptionA>
  );
}
