"use client";

import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Auth pages handle their own layout
  const isAuthPage = pathname.startsWith("/login") ||
                     pathname.startsWith("/register") ||
                     pathname.startsWith("/password-reset");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <main className="pt-16 md:pt-20 pb-24 lg:pb-0">
      {children}
    </main>
  );
}
