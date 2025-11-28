'use client';

import { Streamdown } from 'streamdown';

interface FileContentProps {
  content: string;
}

export function FileContent({ content }: FileContentProps) {
  return <Streamdown>{content}</Streamdown>;
}

