"use client";

import { useState, useCallback, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

interface ClipEditFormProps {
  clipId: string;
  initialTitle?: string;
  initialDescription?: string;
  initialTags?: string[];
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_TAGS = 10;

export function ClipEditForm({
  clipId,
  initialTitle = "",
  initialDescription = "",
  initialTags = [],
}: ClipEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Validation
  const titleError = title.trim().length === 0 ? "Title is required" : title.length > MAX_TITLE_LENGTH ? `Max ${MAX_TITLE_LENGTH} characters` : null;
  const descError = description.length > MAX_DESCRIPTION_LENGTH ? `Max ${MAX_DESCRIPTION_LENGTH} characters` : null;
  const isValid = !titleError && !descError;

  const addTag = useCallback((value: string) => {
    const tag = value.trim().toLowerCase();
    if (!tag) return;
    if (tags.includes(tag)) return;
    if (tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tags, addTag]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/clips/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          title: title.trim(),
          description: description.trim(),
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      setSuccess(true);
      router.refresh();

      // Clear success message after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    title !== initialTitle ||
    description !== initialDescription ||
    JSON.stringify(tags) !== JSON.stringify(initialTags);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="clip-title" className="text-sm font-medium">
            Title
          </label>
          <span
            className={`text-xs ${
              title.length > MAX_TITLE_LENGTH ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {title.length}/{MAX_TITLE_LENGTH}
          </span>
        </div>
        <input
          id="clip-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter clip title..."
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            titleError && title.length > 0 ? "border-destructive" : ""
          }`}
        />
        {titleError && title.length > 0 && (
          <p className="mt-1 text-xs text-destructive">{titleError}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="clip-description" className="text-sm font-medium">
            Description
          </label>
          <span
            className={`text-xs ${
              description.length > MAX_DESCRIPTION_LENGTH ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          id="clip-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe your clip..."
          className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
            descError ? "border-destructive" : ""
          }`}
        />
        {descError && <p className="mt-1 text-xs text-destructive">{descError}</p>}
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="clip-tags" className="text-sm font-medium">
            Tags
          </label>
          <span className="text-xs text-muted-foreground">
            {tags.length}/{MAX_TAGS}
          </span>
        </div>
        <div
          className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/20"
          onClick={() => tagInputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
          {tags.length < MAX_TAGS && (
            <input
              ref={tagInputRef}
              id="clip-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.replace(",", ""))}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
              placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
              className="flex-1 min-w-[100px] border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Press Enter or comma to add a tag. Backspace to remove the last one.
        </p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/10 dark:text-green-400">
          Changes saved successfully!
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !isValid || !hasChanges}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {hasChanges && !saving && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </form>
  );
}
