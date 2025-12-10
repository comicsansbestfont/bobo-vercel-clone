/**
 * Chat Redirect Route
 *
 * Redirects /chat/[id] to /?chatId=[id]
 * This ensures backwards compatibility with any existing links
 */

import { redirect } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  redirect(`/?chatId=${id}`);
}
