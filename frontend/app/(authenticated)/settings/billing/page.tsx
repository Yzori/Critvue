"use client";

/**
 * Billing Settings Page
 *
 * Unified billing page that includes:
 * - Subscription management (Pro subscription)
 * - Payment history (expert review payments)
 * - Payout settings (for reviewers to receive payments)
 */

import { useState, useEffect, Suspense } from "react";
import { useToggle } from "@/hooks";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wallet,
  Clock,
  TrendingUp,
  CreditCard,
  Crown,
  Receipt,
  RefreshCw,
} from "lucide-react";
import {
  getConnectStatus,
  startConnectOnboarding,
  getConnectDashboardLink,
  getAvailableBalance,
  getPayoutHistory,
  ConnectStatusResponse,
  AvailableBalanceResponse,
  PayoutHistoryResponse,
} from "@/lib/api/payments";
import {
  getSubscriptionStatus,
  createPortalSession,
  syncSubscription,
  SubscriptionStatus,
} from "@/lib/api/subscriptions";

function BillingSettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "subscription";
  const subscriptionSuccess = searchParams.get("subscription") === "success";

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data states
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatusResponse | null>(null);
  const [balance, setBalance] = useState<AvailableBalanceResponse | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryResponse | null>(null);

  // Loading states using useToggle
  const loadingState = useToggle(true);
  const actionLoadingState = useToggle();
  const syncLoadingState = useToggle();

  // Convenient aliases
  const loading = loadingState.value;
  const actionLoading = actionLoadingState.value;
  const syncLoading = syncLoadingState.value;

  useEffect(() => {
    // If returning from successful checkout, sync subscription first
    if (subscriptionSuccess) {
      handleSyncSubscription().then(() => fetchData());
    } else {
      fetchData();
    }
  }, [subscriptionSuccess]);

  async function handleSyncSubscription() {
    syncLoadingState.setTrue();
    setError(null);
    try {
      const synced = await syncSubscription();
      setSubscription(synced);
      if (synced.tier === "pro") {
        setSuccessMessage("Your Pro subscription is now active!");
      }
    } catch {
      // Silent fail for sync
    } finally {
      syncLoadingState.setFalse();
    }
  }

  async function fetchData() {
    loadingState.setTrue();
    setError(null);
    try {
      const [subRes, statusRes, balanceRes, historyRes] = await Promise.allSettled([
        getSubscriptionStatus(),
        getConnectStatus(),
        getAvailableBalance(),
        getPayoutHistory(5),
      ]);

      if (subRes.status === "fulfilled") setSubscription(subRes.value);
      if (statusRes.status === "fulfilled") setConnectStatus(statusRes.value);
      if (balanceRes.status === "fulfilled") setBalance(balanceRes.value);
      if (historyRes.status === "fulfilled") setPayoutHistory(historyRes.value);
    } catch {
      setError("Failed to load billing settings. Please try again.");
    } finally {
      loadingState.setFalse();
    }
  }

  async function handleManageSubscription() {
    actionLoadingState.setTrue();
    try {
      const response = await createPortalSession(`${window.location.origin}/settings/billing`);
      window.location.href = response.portal_url;
    } catch {
      setError("Failed to open subscription portal. Please try again.");
      actionLoadingState.setFalse();
    }
  }

  async function handleSetupConnect() {
    actionLoadingState.setTrue();
    try {
      const response = await startConnectOnboarding({
        return_url: `${window.location.origin}/settings/billing?tab=payouts&onboarding=complete`,
        refresh_url: `${window.location.origin}/settings/billing?tab=payouts&onboarding=refresh`,
      });
      window.location.href = response.onboarding_url;
    } catch (err: unknown) {
      // Check for service unavailable (Connect not enabled)
      const status = (err as { status?: number })?.status;
      if (status === 503) {
        setError("Payout setup is not yet available. Please check back later.");
      } else {
        setError("Failed to start payout setup. Please try again.");
      }
      actionLoadingState.setFalse();
    }
  }

  async function handleOpenDashboard() {
    actionLoadingState.setTrue();
    try {
      const response = await getConnectDashboardLink();
      window.open(response.dashboard_url, "_blank");
    } catch {
      setError("Failed to open Stripe dashboard. Please try again.");
    } finally {
      actionLoadingState.setFalse();
    }
  }

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Billing</h2>
          <p className="text-muted-foreground">
            Manage your subscription, payments, and payouts
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription, payments, and payouts
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-2 py-4 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription" className="gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Payouts</span>
          </TabsTrigger>
        </TabsList>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Plan</span>
                {subscription?.tier === "pro" ? (
                  <Badge className="bg-gradient-to-r from-accent-blue to-accent-peach text-white">
                    Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {subscription?.tier === "pro"
                  ? "You have access to all Pro features"
                  : "Upgrade to Pro for unlimited reviews and more"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.tier === "pro" ? (
                <>
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium capitalize">{subscription.status}</span>
                    </div>
                    {subscription.current_period_end && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next billing date</span>
                        <span className="font-medium">
                          {formatDate(subscription.current_period_end)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium">Pro includes:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Unlimited community reviews
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        15% off expert reviews
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Priority matching with reviewers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Advanced analytics
                      </li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <a href="/pricing">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSyncSubscription}
                      disabled={syncLoading}
                      title="Sync subscription status"
                    >
                      {syncLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Just subscribed? Click refresh to sync your status.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab (what creator has paid) */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Your payments for expert reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Payment history coming soon</p>
                <p className="text-sm">
                  You'll be able to view all your expert review payments here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab (reviewer earnings) */}
        <TabsContent value="payouts" className="space-y-4">
          {/* Connect Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Payout Account</span>
                {connectStatus?.payouts_enabled ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : connectStatus?.details_submitted ? (
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                ) : (
                  <Badge variant="secondary">Not Set Up</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your bank account to receive payments for expert reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectStatus?.payouts_enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Your account is ready to receive payments</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleOpenDashboard}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Open Stripe Dashboard
                  </Button>
                </div>
              ) : connectStatus?.details_submitted ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Your account is being reviewed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Stripe is verifying your information. This usually takes 1-2 business days.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSetupConnect}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Complete Setup
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Set up your payout account to receive earnings from expert reviews.
                    You'll earn 75% of each review's budget.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm">What you'll need:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>- Valid government ID</li>
                      <li>- Bank account information</li>
                      <li>- Tax information (for US residents)</li>
                    </ul>
                  </div>
                  <Button onClick={handleSetupConnect} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wallet className="h-4 w-4 mr-2" />
                    )}
                    Set Up Payouts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Balance Card - Only show if Connect is set up */}
          {connectStatus?.payouts_enabled && balance && (
            <Card>
              <CardHeader>
                <CardTitle>Available Balance</CardTitle>
                <CardDescription>
                  Funds available for payout to your bank account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(balance.available_balance)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {formatCurrency(balance.pending_balance)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Pending funds become available after the review is accepted.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payout History - Only show if Connect is set up */}
          {connectStatus?.payouts_enabled && payoutHistory && payoutHistory.payouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Payouts
                </CardTitle>
                <CardDescription>
                  Total paid out: {formatCurrency(payoutHistory.total_paid)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payoutHistory.payouts.map((payout) => (
                    <div
                      key={payout.payout_id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium">{formatCurrency(payout.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payout.created_at)}
                        </p>
                      </div>
                      <Badge variant={payout.status === "paid" ? "default" : "secondary"}>
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                {payoutHistory.has_more && (
                  <Button variant="link" className="mt-4 w-full" onClick={handleOpenDashboard}>
                    View all in Stripe Dashboard
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Billing</h2>
            <p className="text-muted-foreground">
              Manage your subscription, payments, and payouts
            </p>
          </div>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <BillingSettingsContent />
    </Suspense>
  );
}
