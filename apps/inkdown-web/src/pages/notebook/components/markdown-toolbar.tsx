import React from 'react';
import { EditorView } from '@codemirror/view';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Link, Image } from 'lucide-react';

interface MarkdownToolbarProps {
  editorRef: React.RefObject<EditorView>;
  noteContent: string;
  setNoteContent: (content: string) => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ editorRef, noteContent, setNoteContent }) => {

  const applyMarkdown = (prefix: string, suffix: string = '') => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection.main;
    const selectedText = state.doc.sliceString(from, to);

    let newContent = prefix + selectedText + suffix;
    let newCursorPos = from + prefix.length; 

    if (prefix === '[' && suffix === ']()') {
      if (selectedText.length === 0) {
        newCursorPos = from + prefix.length;
      } else {
        newCursorPos = from + prefix.length + selectedText.length + 2;
      }
    } else if (selectedText.length === 0 && suffix !== '') {
      newCursorPos = from + prefix.length;
    } else if (selectedText.length > 0 && suffix !== '') {
      newCursorPos = from + prefix.length + selectedText.length;
    } else if (suffix === '') {
      newCursorPos = from + prefix.length;
    }

    dispatch(state.update({
      changes: {
        from,
        to,
        insert: newContent,
      },
      selection: { anchor: newCursorPos, head: newCursorPos },
    }));
  };

  const applyHeading = (level: number) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection.main;
    const selectedText = state.doc.sliceString(from, to);
    const prefix = '#'.repeat(level) + ' ';

    dispatch(state.update({
      changes: {
        from,
        to,
        insert: prefix + selectedText,
      },
      selection: { anchor: from + prefix.length, head: from + prefix.length },
    }));
  };

  const applyList = (ordered: boolean) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection.main;
    const selectedText = state.doc.sliceString(from, to);
    const lines = selectedText.split('\n');

    let newList = '';
    let newCursorPos = from;

    if (selectedText.length === 0) {
      const prefix = ordered ? '1. ' : '- ';
      newList = prefix;
      newCursorPos = from + prefix.length;
    } else { 
      newList = lines.map((line, index) => {
        const prefix = ordered ? `${index + 1}. ` : '- ';
        return prefix + line;
      }).join('\n');
      newCursorPos = from + (ordered ? '1. '.length : '- '.length);
    }

    dispatch(state.update({
      changes: {
        from,
        to,
        insert: newList,
      },
      selection: { anchor: newCursorPos, head: newCursorPos },
    }));
  };

  return (
    <div className="flex space-x-2 ml-4">
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('**', '**')}><Bold size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('*', '*')}><Italic size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('~~', '~~')}><Strikethrough size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('`', '`')}><Code size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyHeading(1)}><Heading1 size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyHeading(2)}><Heading2 size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyHeading(3)}><Heading3 size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyList(false)}><List size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyList(true)}><ListOrdered size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('> ')}><Quote size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('[', ']()')}><Link size={18} /></button>
      <button className='hover:cursor-pointer hover:opacity-80' onClick={() => applyMarkdown('![', ']()')}><Image size={18} /></button>
    </div>
  );
};