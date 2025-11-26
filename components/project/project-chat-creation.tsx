'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    type PromptInputMessage,
    PromptInputSelect,
    PromptInputSelectContent,
    PromptInputSelectItem,
    PromptInputSelectTrigger,
    PromptInputSelectValue,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
    PromptInputHeader,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const models = [
    {
        name: 'Claude Sonnet 4.5',
        value: 'anthropic/claude-sonnet-4-5-20250929',
    },
    {
        name: 'Claude Opus 4.5',
        value: 'anthropic/claude-opus-4-5-20251101',
    },
    {
        name: 'Claude Haiku 4.5',
        value: 'anthropic/claude-haiku-4-5-20251001',
    },
];

interface ProjectChatCreationProps {
    projectId: string;
    projectName?: string;
    className?: string;
}

export function ProjectChatCreation({
    projectId,
    projectName,
    className,
}: ProjectChatCreationProps) {
    const router = useRouter();
    const [input, setInput] = useState('');
    const [model, setModel] = useState<string>(models[0].value);
    const [webSearch, setWebSearch] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (message: PromptInputMessage) => {
        const text = message.text || input;

        if (!text.trim() && message.files.length === 0) return;

        try {
            setIsLoading(true);

            // Create the chat first
            const response = await fetch(`/api/projects/${projectId}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: text.slice(0, 50) || 'New Chat',
                    model: model,
                    web_search_enabled: webSearch,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create chat');
            }

            const data = await response.json();
            const chatId = data.chat.id;

            // Build URL with chatId and message params, then hard navigate
            const params = new URLSearchParams();
            params.set('chatId', chatId);

            if (text) {
                params.set('message', encodeURIComponent(text));
            }

            const targetUrl = `/project/${projectId}?${params.toString()}`;
            window.location.href = targetUrl;
        } catch (error) {
            toast.error('Failed to start chat', {
                description: 'Please try again.',
            });
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("w-full", className)}>
            <PromptInput
                onSubmit={handleSubmit}
                className="mt-2 md:mt-4"
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
                        placeholder={projectName ? `New chat in ${projectName}...` : "What's on your mind?"}
                        disabled={isLoading}
                    />
                </PromptInputBody>

                <PromptInputFooter className="flex items-center justify-between gap-2">
                    {/* Left group: Action buttons */}
                    <PromptInputTools className="gap-1">
                        <PromptInputActionMenu>
                            <PromptInputActionMenuTrigger />
                            <PromptInputActionMenuContent>
                                <PromptInputActionAddAttachments />
                            </PromptInputActionMenuContent>
                        </PromptInputActionMenu>
                        <PromptInputButton
                            variant={webSearch ? 'default' : 'ghost'}
                            onClick={() => setWebSearch(!webSearch)}
                            title={webSearch ? "Web search enabled" : "Enable web search"}
                        >
                            <GlobeIcon size={16} />
                        </PromptInputButton>
                    </PromptInputTools>

                    {/* Right group: Model selector + Submit */}
                    <div className="flex items-center gap-1">
                        <PromptInputSelect
                            onValueChange={setModel}
                            value={model}
                        >
                            <PromptInputSelectTrigger>
                                <PromptInputSelectValue />
                            </PromptInputSelectTrigger>
                            <PromptInputSelectContent>
                                {models.map((model) => (
                                    <PromptInputSelectItem key={model.value} value={model.value}>
                                        {model.name}
                                    </PromptInputSelectItem>
                                ))}
                            </PromptInputSelectContent>
                        </PromptInputSelect>
                        <PromptInputSubmit
                            disabled={!input || isLoading}
                            status={isLoading ? 'submitted' : 'ready'}
                        />
                    </div>
                </PromptInputFooter>
            </PromptInput>
        </div>
    );
}
