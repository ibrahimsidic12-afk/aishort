"use client";

import { useState, useEffect } from "react";
import type { Subscription } from "@/types";

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setSubscription(data.user?.subscription ?? null);
      } catch {
        // No subscription
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, []);

  const isActive = subscription?.status === "ACTIVE";
  const isPro = isActive && subscription?.stripePriceId?.includes("pro");
  const isBusiness = isActive && subscription?.stripePriceId?.includes("business");

  return { subscription, loading, isActive, isPro, isBusiness };
}
