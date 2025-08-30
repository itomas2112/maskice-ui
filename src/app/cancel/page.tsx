"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CancelContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    (async () => {
      try {
        const orderId = params.get("order_id");
        const exp = params.get("exp");
        const ct = params.get("ct");

        // Call backend cancel ONLY if we have a signed token set
        if (orderId && exp && ct) {
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
          const url = `${API_BASE}/orders/${encodeURIComponent(
            orderId
          )}/cancel?exp=${encodeURIComponent(exp)}&ct=${encodeURIComponent(ct)}`;

          await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
          }).catch(() => {
            /* ignore network error, still redirect */
          });
        }
      } finally {
        if (!aborted) {
          // redirect immediately after attempting cancel
          router.replace("/");
        }
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [params, router]);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <p className="text-gray-600">Preusmjeravam natrag na početnu…</p>
    </main>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={<main className="max-w-2xl mx-auto p-6">Učitavanje…</main>}>
      <CancelContent />
    </Suspense>
  );
}
