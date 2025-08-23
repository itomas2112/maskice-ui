"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import API from "@/lib/api";
import { Header } from "@/components/layout/Header";

type Status = "PENDING" | "COMPLETED" | "CANCELED" | "FAILED" | "LOADING";

function SuccessContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("order_id");
  const [status, setStatus] = useState<Status>("LOADING");

  // works in both browser & Node type defs
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const asStatus = (val: unknown): Exclude<Status, "LOADING"> | null => {
      const s = String(val ?? "").toUpperCase();
      return ["PENDING", "COMPLETED", "CANCELED", "FAILED"].includes(s)
        ? (s as Exclude<Status, "LOADING">)
        : null;
    };

    const fetchStatus = async () => {
      try {
        const r = await API.get(`/orders/${orderId}`);
        const s = asStatus(r?.data?.status);
        setStatus(s ?? "FAILED");
        if (s === "PENDING") {
          pollRef.current = setTimeout(fetchStatus, 1500);
        }
      } catch {
        setStatus("FAILED");
      }
    };

    fetchStatus();

    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [orderId]);

  const niceCode = orderId ? orderId.split("-")[0].toUpperCase() : "—";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showBasket={false} cartCount={0} />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Hvala na kupnji! 🎉</h1>

          <p className="text-gray-600 mb-2">
            Broj narudžbe: <span className="font-mono">{niceCode}</span>
          </p>

          <p className="text-gray-600 mb-6">
            Status: <b>{status === "LOADING" ? "Provjera..." : status}</b>
          </p>

          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition"
          >
            Natrag u trgovinu
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main className="max-w-2xl mx-auto p-6">Učitavanje…</main>}>
      <SuccessContent />
    </Suspense>
  );
}
