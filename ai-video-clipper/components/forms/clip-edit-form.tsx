"use client";

import { useState } from "react";

interface ClipEditFormProps {
  clipId: string;
  initialTitle?: string;
  initialDescription?: string;
  initialTags?: string[];
  onSave?: (data: { title: string; description: string; tags: string[] }) => void;
}

export function ClipEditForm({
  clipId,
  initialTitle = "",
  initialDescription = "",
  initialTags = [],
  onSave,
}: ClipEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState(initialTags.join(", "));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({
      title,
      description,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tags (comma-separated)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Save Changes
      </button>
    </form>
  );
}
