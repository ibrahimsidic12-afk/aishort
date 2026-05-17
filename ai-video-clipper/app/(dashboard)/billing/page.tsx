export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and credits.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Current Plan</h2>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">Free</p>
            <p className="text-sm text-muted-foreground">10 credits remaining</p>
          </div>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Upgrade
          </button>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Usage This Month</h2>
        <div className="mt-4 space-y-3">
          {[
            { label: "Videos Uploaded", used: 0, limit: 5 },
            { label: "Clips Generated", used: 0, limit: 15 },
            { label: "Storage Used", used: "0 MB", limit: "1 GB" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">
                {item.used} / {item.limit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
