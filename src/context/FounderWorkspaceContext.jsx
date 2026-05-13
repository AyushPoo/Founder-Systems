/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  confirmClientCheckout,
  createCreditPackCheckout,
  createProductCheckout,
  createWorkspaceMemory,
  getAuthSession,
  getFounderEntitlements,
  getFounderPurchases,
  getGoogleAuthStartUrl,
  getWalletLedger,
  getWalletSummary,
  getWalletUsageEvents,
  getWorkspaceBootstrap,
  listWorkspaceMemory,
  listWorkspacePreferences,
  promoteWorkspaceMemory,
  signOutFounderSession,
  startMagicLink,
  unlockProductWithCredits,
  updateWorkspaceMemory,
  updateWorkspacePreference,
  getWorkspaceRecommendations,
} from '../utils/founderApi';
import { openBackendRazorpayCheckout } from '../utils/checkout';

const FounderWorkspaceContext = createContext(null);

export function FounderWorkspaceProvider({ children }) {
  const [session, setSession] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [membership, setMembership] = useState(null);
  const [memoryItems, setMemoryItems] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [creditPacks, setCreditPacks] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [usageEvents, setUsageEvents] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [error, setError] = useState('');

  const authenticated = Boolean(session?.authenticated);
  const user = session?.user || null;

  const refreshSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const nextSession = await getAuthSession();
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (sessionError) {
      setSession(null);
      setError(sessionError.message || 'Could not reach the Founder Systems account service.');
      return null;
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const currentSession = session || (await refreshSession());
    if (!currentSession?.authenticated) {
      setWorkspace(null);
      setMembership(null);
      setMemoryItems([]);
      setPreferences([]);
      setWallet(null);
      setCreditPacks([]);
      setLedger([]);
      setUsageEvents([]);
      setEntitlements([]);
      setPurchases([]);
      return null;
    }

    setLoadingAccount(true);
    try {
      const [workspacePayload, memoryPayload, preferencePayload, walletPayload, ledgerPayload, usagePayload, entitlementsPayload, purchasesPayload] =
        await Promise.all([
          getWorkspaceBootstrap(),
          listWorkspaceMemory(),
          listWorkspacePreferences(),
          getWalletSummary(),
          getWalletLedger(),
          getWalletUsageEvents(),
          getFounderEntitlements(),
          getFounderPurchases(),
        ]);

      setWorkspace(workspacePayload.workspace);
      setMembership(workspacePayload.membership);
      setMemoryItems(memoryPayload.items || []);
      setPreferences(preferencePayload || []);
      setWallet(walletPayload.wallet || null);
      setCreditPacks(walletPayload.packs || []);
      setLedger(ledgerPayload.entries || []);
      setUsageEvents(usagePayload || []);
      setEntitlements(entitlementsPayload || []);
      setPurchases(purchasesPayload || []);
      setError('');
      return workspacePayload;
    } catch (accountError) {
      setError(accountError.message || 'Could not load workspace data.');
      return null;
    } finally {
      setLoadingAccount(false);
    }
  }, [refreshSession, session]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (authenticated) {
      refreshAccount();
    }
  }, [authenticated, refreshAccount]);

  const sendMagicLink = useCallback(async ({ email, name, nextPath = '/account' }) => {
    const nextUrl = `${window.location.origin}${nextPath}`;
    return startMagicLink({
      email,
      name,
      next_url: nextUrl,
      remember_me: true,
    });
  }, []);

  const startGoogleSignIn = useCallback((nextPath = '/account') => {
    window.location.assign(getGoogleAuthStartUrl(nextPath));
  }, []);

  const signOut = useCallback(async () => {
    await signOutFounderSession();
    setSession(null);
    setWorkspace(null);
    setMembership(null);
    setMemoryItems([]);
    setPreferences([]);
    setWallet(null);
    setCreditPacks([]);
    setLedger([]);
    setUsageEvents([]);
    setEntitlements([]);
    setPurchases([]);
  }, []);

  const saveMemoryItem = useCallback(async (itemId, payload) => {
    const saved = itemId
      ? await updateWorkspaceMemory(itemId, payload)
      : await createWorkspaceMemory(payload);
    await refreshAccount();
    return saved;
  }, [refreshAccount]);

  const promoteMemoryItem = useCallback(async (itemId, payload) => {
    const promoted = await promoteWorkspaceMemory(itemId, payload);
    await refreshAccount();
    return promoted;
  }, [refreshAccount]);

  const savePreference = useCallback(async (productSlug, payload) => {
    const saved = await updateWorkspacePreference(productSlug, payload);
    await refreshAccount();
    return saved;
  }, [refreshAccount]);

  const getPreferenceForProduct = useCallback((productSlug) => {
    return preferences.find((item) => item.product_slug === productSlug) || null;
  }, [preferences]);

  const fetchRecommendations = useCallback(async (productSlug) => {
    if (!authenticated) {
      return { workspace_id: '', recommendations: [] };
    }
    return getWorkspaceRecommendations(productSlug);
  }, [authenticated]);

  const launchCreditPackCheckout = useCallback(async (packSlug) => {
    if (!authenticated || !user) {
      throw new Error('Please sign in before you buy credits.');
    }
    const order = await createCreditPackCheckout({ pack_slug: packSlug, currency: 'INR' });
    return new Promise((resolve, reject) => {
      const opened = openBackendRazorpayCheckout({
        key: order.key_id,
        amount: order.amount_minor,
        currency: order.currency,
        orderId: order.razorpay_order_id,
        description: `${order.pack_name} credit pack`,
        customerEmail: user.email,
        customerName: user.name,
        notes: {
          pack_slug: order.pack_slug,
          purchase_id: order.purchase_id,
        },
        onSuccess: async (response) => {
          try {
            await confirmClientCheckout({
              purchase_id: order.purchase_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              metadata: { pack_slug: order.pack_slug },
            });
          } catch {
            // Client confirmation is a helpful breadcrumb; webhook remains the source of truth.
          }
          window.setTimeout(() => {
            refreshAccount();
          }, 1200);
          resolve(response);
        },
        onFailure: reject,
      });
      if (!opened) {
        reject(new Error('Could not open the payment window.'));
      }
    });
  }, [authenticated, refreshAccount, user]);

  const launchProductCheckout = useCallback(async ({ productSlug, currency = 'INR', productName = 'Founder Systems product' }) => {
    if (!authenticated || !user) {
      throw new Error('Please sign in before you buy a product.');
    }
    const order = await createProductCheckout({ product_slug: productSlug, currency });
    return new Promise((resolve, reject) => {
      const opened = openBackendRazorpayCheckout({
        key: order.key_id,
        amount: order.amount_minor,
        currency: order.currency,
        orderId: order.razorpay_order_id,
        description: productName,
        customerEmail: user.email,
        customerName: user.name,
        notes: {
          product: productSlug,
          purchase_id: order.purchase_id,
        },
        onSuccess: async (response) => {
          try {
            await confirmClientCheckout({
              purchase_id: order.purchase_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              metadata: { product_slug: productSlug },
            });
          } catch {
            // Webhook will still complete the purchase on the backend.
          }
          window.setTimeout(() => {
            refreshAccount();
          }, 1200);
          resolve(response);
        },
        onFailure: reject,
      });
      if (!opened) {
        reject(new Error('Could not open the payment window.'));
      }
    });
  }, [authenticated, refreshAccount, user]);

  const redeemCreditsForProduct = useCallback(async (productSlug) => {
    const response = await unlockProductWithCredits(productSlug);
    await refreshAccount();
    return response;
  }, [refreshAccount]);

  const value = useMemo(() => ({
    session,
    authenticated,
    user,
    workspace,
    membership,
    memoryItems,
    preferences,
    wallet,
    creditPacks,
    ledger,
    usageEvents,
    entitlements,
    purchases,
    loadingSession,
    loadingAccount,
    error,
    refreshSession,
    refreshAccount,
    sendMagicLink,
    startGoogleSignIn,
    signOut,
    saveMemoryItem,
    promoteMemoryItem,
    savePreference,
    getPreferenceForProduct,
    fetchRecommendations,
    launchCreditPackCheckout,
    launchProductCheckout,
    redeemCreditsForProduct,
  }), [
    session,
    authenticated,
    user,
    workspace,
    membership,
    memoryItems,
    preferences,
    wallet,
    creditPacks,
    ledger,
    usageEvents,
    entitlements,
    purchases,
    loadingSession,
    loadingAccount,
    error,
    refreshSession,
    refreshAccount,
    sendMagicLink,
    startGoogleSignIn,
    signOut,
    saveMemoryItem,
    promoteMemoryItem,
    savePreference,
    getPreferenceForProduct,
    fetchRecommendations,
    launchCreditPackCheckout,
    launchProductCheckout,
    redeemCreditsForProduct,
  ]);

  return (
    <FounderWorkspaceContext.Provider value={value}>
      {children}
    </FounderWorkspaceContext.Provider>
  );
}

export function useFounderWorkspace() {
  const context = useContext(FounderWorkspaceContext);
  if (!context) {
    throw new Error('useFounderWorkspace must be used within FounderWorkspaceProvider');
  }
  return context;
}
