"use client";

import { ProjectHeader } from "./project-header";
import { ChatCard } from "./chat-card";
import { ProjectEmptyState } from "./empty-state";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { GlobeIcon } from "lucide-react";
import { useState } from "react";

interface Chat {
  id: string;
  title: string;
  preview?: string;
  timestamp: Date;
  projectId: string;
}

interface ProjectViewProps {
  projectId: string;
  projectName: string;
  chats: Chat[];
  onNameChange?: (newName: string) => void;
  onSubmit?: (message: PromptInputMessage) => void;
}

const models = [
  { name: "GPT 4o", value: "openai/gpt-4o" },
  { name: "GPT 5 Pro", value: "openai/gpt-5-pro" },
  { name: "GPT 5 Mini", value: "openai/gpt-5-mini" },
  { name: "Claude Sonnet 4.5", value: "anthropic/claude-sonnet-4.5" },
  { name: "Claude Opus 4", value: "anthropic/claude-opus-4" },
];

export function ProjectView({
  projectId,
  projectName,
  chats,
  onNameChange,
  onSubmit,
}: ProjectViewProps) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }

    onSubmit?.(message);
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-neutral-900">
      {/* Project Header */}
      <ProjectHeader
        projectId={projectId}
        projectName={projectName}
        onNameChange={onNameChange}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat Cards or Empty State */}
        <div className="flex-1 overflow-y-auto px-6 py-4 pb-6">
          {chats.length === 0 ? (
            <ProjectEmptyState />
          ) : (
            <div className="mx-auto grid max-w-5xl gap-4">
              {chats.map((chat) => (
                <ChatCard
                  key={chat.id}
                  id={chat.id}
                  title={chat.title}
                  preview={chat.preview}
                  timestamp={chat.timestamp}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input Section - Fixed at Bottom */}
        <div className="border-t border-neutral-200 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mx-auto max-w-5xl">
            <PromptInput
              onSubmit={handleSubmit}
              globalDrop
              multiple
            >
              <PromptInputHeader>
                <PromptInputAttachments>
                  {(attachment) => <PromptInputAttachment data={attachment} />}
                </PromptInputAttachments>
              </PromptInputHeader>

              <PromptInputBody>
                <PromptInputTextarea
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  placeholder={`Ask about ${projectName}...`}
                />
              </PromptInputBody>

              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <PromptInputButton
                    variant={webSearch ? "default" : "ghost"}
                    onClick={() => setWebSearch(!webSearch)}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>
                  <PromptInputSelect
                    onValueChange={(value) => {
                      setModel(value);
                    }}
                    value={model}
                  >
                    <PromptInputSelectTrigger>
                      <PromptInputSelectValue />
                    </PromptInputSelectTrigger>
                    <PromptInputSelectContent>
                      {models.map((model) => (
                        <PromptInputSelectItem
                          key={model.value}
                          value={model.value}
                        >
                          {model.name}
                        </PromptInputSelectItem>
                      ))}
                    </PromptInputSelectContent>
                  </PromptInputSelect>
                </PromptInputTools>
                <PromptInputSubmit disabled={!input} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
