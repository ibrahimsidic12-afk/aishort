export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and integrations.
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" disabled />
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm font-medium">YouTube</span>
            <button className="rounded-md border px-3 py-1 text-xs">
              Connect
            </button>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm font-medium">TikTok</span>
            <button className="rounded-md border px-3 py-1 text-xs">
              Connect
            </button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Default caption style</span>
            <select className="rounded-md border px-3 py-1 text-sm">
              <option>Pop</option>
              <option>Fade</option>
              <option>Highlight</option>
              <option>None</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Default resolution</span>
            <select className="rounded-md border px-3 py-1 text-sm">
              <option>1080p</option>
              <option>720p</option>
              <option>4K</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
