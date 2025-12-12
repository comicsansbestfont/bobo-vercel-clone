/**
 * BlockNoteMarkdownEditor
 *
 * Notion-style block editor wrapper that loads/saves markdown.
 * Used for editing advisory/project .md files in the sidebar.
 */
 
'use client';
 
import { useEffect } from 'react';
import { BlockNoteViewRaw, useCreateBlockNote, useEditorChange } from '@blocknote/react';
import { blocksToMarkdown, markdownToBlocks } from '@blocknote/core';
import { useTheme } from 'next-themes';
 
import '@blocknote/react/style.css';
 
interface BlockNoteMarkdownEditorProps {
  initialMarkdown: string;
  onMarkdownChange: (markdown: string) => void;
  editable?: boolean;
}
 
export function BlockNoteMarkdownEditor({
  initialMarkdown,
  onMarkdownChange,
  editable = true,
}: BlockNoteMarkdownEditorProps) {
  const editor = useCreateBlockNote();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
 
  // Load initial markdown into blocks when mounting / file changes.
  useEffect(() => {
    try {
      const blocks = markdownToBlocks(initialMarkdown || '', editor.pmSchema);
      const existingIds = editor.document.map((block) => block.id);
      // markdownToBlocks returns concrete Blocks, but replaceBlocks expects PartialBlocks.
      // The shapes are compatible for default schemas, so we cast narrowly here.
      editor.replaceBlocks(
        existingIds,
        blocks as unknown as Parameters<typeof editor.replaceBlocks>[1]
      );
    } catch (error) {
      console.error('Failed to parse markdown into blocks', error);
    }
  }, [initialMarkdown, editor]);
 
  // Serialize blocks back to markdown on change.
  useEditorChange(() => {
    try {
      const markdown = blocksToMarkdown(editor.document, editor.pmSchema, editor, {
        document,
      });
      onMarkdownChange(markdown);
    } catch (error) {
      console.error('Failed to export blocks to markdown', error);
    }
  }, editor);
 
  return (
    <div className="w-full">
      <BlockNoteViewRaw
        editor={editor}
        theme={theme}
        editable={editable}
        formattingToolbar={false}
        linkToolbar={false}
        slashMenu={false}
        emojiPicker={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        comments={false}
        className="min-h-[50vh] max-w-none"
      />
    </div>
  );
}
