"use client";

import { useSearchParams } from "next/navigation";

export default function CancelPage() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Plaćanje otkazano</h1>
      <p className="text-gray-700">ID narudžbe: {orderId ?? "—"}</p>
    </main>
  );
}
