"use client";

import { useState } from "react";

interface SettingsFormProps {
  initialName?: string;
  initialEmail?: string;
  onSave?: (data: { name: string }) => void;
}

export function SettingsForm({
  initialName = "",
  initialEmail = "",
  onSave,
}: SettingsFormProps) {
  const [name, setName] = useState(initialName);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave?.({ name });
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium">Display Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          value={initialEmail}
          disabled
          className="mt-1 w-full rounded-md border bg-muted px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Save
      </button>
    </form>
  );
}
