/**
 * Authentication Layout
 * Split-screen layout with brand panel (desktop) and form area
 * Mobile-first responsive design with Critvue branding
 */

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Star, Users, MessageSquare, Sparkles } from "lucide-react";

// Stats for social proof
const stats = [
  { icon: Users, value: "2,500+", label: "Creators" },
  { icon: MessageSquare, value: "10,000+", label: "Reviews Given" },
  { icon: Star, value: "4.9", label: "Avg Rating" },
];

// Testimonial for brand panel
const testimonial = {
  quote: "Critvue helped me level up my design work. The feedback I received was incredibly detailed and actionable.",
  author: "Sarah Chen",
  role: "UI/UX Designer",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Brand Panel - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue via-accent-blue/90 to-accent-peach/80" />

        {/* Decorative Elements */}
        <div className="absolute inset-0">
          {/* Abstract shapes */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-10 w-96 h-96 bg-accent-peach/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 text-white w-full">
          {/* Logo */}
          <div>
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <Logo size="xl" className="h-16 xl:h-20 w-auto [&_path]:fill-white [&_polygon]:fill-white" />
            </Link>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium">
                <Sparkles className="size-4" />
                <span>Get better at your craft</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Elevate your creative work with expert feedback
              </h1>
              <p className="text-lg xl:text-xl text-white/80 max-w-md">
                Join thousands of creators getting actionable feedback on their designs, photography, videos, and more.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <stat.icon className="size-5 text-white/70" />
                    <span className="text-2xl xl:text-3xl font-bold">{stat.value}</span>
                  </div>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-lg leading-relaxed">
              "{testimonial.quote}"
            </blockquote>
            <div>
              <p className="font-semibold">{testimonial.author}</p>
              <p className="text-sm text-white/70">{testimonial.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header with Logo */}
        <header className="lg:hidden w-full border-b border-border-light">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <Link
              href="/"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <Logo size="xl" className="h-14 md:h-16 w-auto" />
            </Link>
          </div>
        </header>

        {/* Main Content - Centered Card */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-border-light py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>&copy; 2025 Critvue. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/help"
                  className="hover:text-foreground transition-colors"
                >
                  Help
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
