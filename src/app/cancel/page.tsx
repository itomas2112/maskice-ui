"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function CancelContent() {
  const router = useRouter();

  useEffect(() => {
    // redirect immediately
    router.replace("/");
  }, [router]);

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
