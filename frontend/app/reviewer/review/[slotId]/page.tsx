/**
 * Review Writing Page
 *
 * Redirects to the hub workspace for consistent review experience.
 * All review editing is now done through the ReviewStudio in the hub.
 */

"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";

export default function ReviewWritingPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = Number(params.slotId);

  // Redirect to hub mode for consistent experience with ReviewStudio
  React.useEffect(() => {
    router.replace(`/reviewer/hub?slot=${slotId}`);
  }, [slotId, router]);

  // Loading state while redirecting
  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-2xl" />
          <div className="h-96 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
