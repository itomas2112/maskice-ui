"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import API from "@/lib/api";
import { Header } from "@/components/layout/Header"; // ⬅️ import your main header

export default function SuccessPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("order_id");
  const [status, setStatus] = useState<
    "PENDING" | "COMPLETED" | "CANCELED" | "FAILED" | "LOADING"
  >("LOADING");

  useEffect(() => {
    if (!orderId) return;
    let timer: any;
    const fetchStatus = async () => {
      try {
        const r = await API.get(`/orders/${orderId}`);
        setStatus(r.data.status);
        if (r.data.status === "PENDING") {
          timer = setTimeout(fetchStatus, 1500);
        }
      } catch {
        setStatus("FAILED");
      }
    };
    fetchStatus();
    return () => clearTimeout(timer);
  }, [orderId]);

  const niceCode = orderId ? orderId.split("-")[0].toUpperCase() : "—";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50"> 
      {/* ⬆️ same background class as homepage */}
      
      {/* Header without basket */}
      <Header
        showBasket={false}
        cartCount={0}
      />

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Hvala na kupnji! 🎉</h1>
          <p className="text-gray-600 mb-2">
            Broj narudžbe:{" "}
            <span className="font-mono">{niceCode}</span>
          </p>
          <p className="text-gray-600 mb-6">
            Status:{" "}
            <b>{status === "LOADING" ? "Provjera..." : status}</b>
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