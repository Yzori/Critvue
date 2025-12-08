/**
 * Review Applications Redirect Page
 *
 * Redirects to the main review page with the applications section highlighted.
 * This route exists to support notification links like /review/53/applications
 */

import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewApplicationsPage({ params }: PageProps) {
  const { id } = await params;

  // Redirect to the main review page with hash to scroll to applications
  redirect(`/review/${id}#applications`);
}
