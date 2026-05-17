"use client";

interface BillingFormProps {
  currentPlan: string;
  onUpgrade?: (planId: string) => void;
  onManage?: () => void;
}

export function BillingForm({ currentPlan, onUpgrade, onManage }: BillingFormProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Current Plan: {currentPlan}</p>
            <p className="text-sm text-muted-foreground">
              {currentPlan === "Free" ? "Upgrade for more features" : "Active subscription"}
            </p>
          </div>
          <button
            onClick={onManage}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {currentPlan === "Free" && (
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => onUpgrade?.("pro")}
            className="rounded-lg border p-4 text-left hover:border-primary"
          >
            <h3 className="font-semibold">Pro - $29/mo</h3>
            <p className="text-sm text-muted-foreground">50 videos, 1080p, publishing</p>
          </button>
          <button
            onClick={() => onUpgrade?.("business")}
            className="rounded-lg border p-4 text-left hover:border-primary"
          >
            <h3 className="font-semibold">Business - $99/mo</h3>
            <p className="text-sm text-muted-foreground">Unlimited, 4K, teams, API</p>
          </button>
        </div>
      )}
    </div>
  );
}
