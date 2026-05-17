"use client";

import { useState, useCallback } from "react";

export function useBilling() {
  const [loading, setLoading] = useState(false);

  const createCheckout = useCallback(async (priceId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  }, []);

  const openPortal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, createCheckout, openPortal };
}
