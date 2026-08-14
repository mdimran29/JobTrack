import { useState } from 'react';
import { Note } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { NoteForm } from './NoteForm';
import { formatDateTime } from '../../lib/utils';
import { NoteFormValues } from '../../lib/schemas';

interface NoteListProps {
  notes: Note[];
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export const NoteList = ({ notes, onUpdate, onDelete, isUpdating }: NoteListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (notes.length === 0) {
    return <EmptyState title="No notes yet" description="Jot down interview prep, feedback, or reminders." />;
  }

  const sorted = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((note) => (
        <li key={note.id} className="rounded-[var(--radius-control)] border border-border bg-canvas/60 px-3.5 py-3">
          {editingId === note.id ? (
            <NoteForm
              initialContent={note.content}
              submitLabel="Save"
              isSubmitting={isUpdating}
              onCancel={() => setEditingId(null)}
              onSubmit={async (values: NoteFormValues) => {
                await onUpdate(note.id, values.content);
                setEditingId(null);
              }}
            />
          ) : (
            <>
              <p className="whitespace-pre-wrap text-[13px] text-text-primary">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[11px] text-text-tertiary">{formatDateTime(note.createdAt)}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingId(note.id)}
                    className="text-xs font-medium text-text-tertiary hover:text-text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(note.id)}
                    className="text-xs font-medium text-text-tertiary hover:text-status-rejected-text"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
};
