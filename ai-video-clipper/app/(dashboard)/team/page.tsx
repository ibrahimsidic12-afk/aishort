export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and roles.
          </p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Invite Member
        </button>
      </div>

      <div className="rounded-lg border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            Team features are available on the Business plan.
          </p>
        </div>
      </div>
    </div>
  );
}
