'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Printer,
  FileText,
  User,
  ScanBarcode,
  ArrowRight,
  Sparkles,
  Crown,
  Pause,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
  RefreshCw,
  QrCode,
  IndianRupee,
  Receipt,
  Layers,
  ChevronRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// ─── Data Types ─────────────────────────────────────────────────────────────
type POSCartItem = {
  productId: string;
  variantId?: string;
  name: string;
  color?: string;
  size?: string;
  sku?: string;
  price: number;
  originalPrice: number;
  quantity: number;
  stockQty: number;
  image?: string;
};

type HeldCart = {
  id: string;
  customerName: string;
  customerPhone: string;
  items: POSCartItem[];
  discountAmount: number;
  discountType: 'FLAT' | 'PERCENT';
  taxRate: number;
  paymentMethod: 'CASH' | 'OFFLINE_UPI' | 'CARD_SWIPE' | 'SPLIT';
  heldAt: Date;
};

type CompletedReceipt = {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  cashTendered: number;
  changeDue: number;
  customerName: string;
  customerPhone: string;
  items: any[];
  paymentMethod: string;
  createdAt: Date;
};

export default function POSPage() {
  // ─── Terminal States ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerIsMember, setCustomerIsMember] = useState(false);
  
  // Barcode Gun state
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Financial States
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0 = Inclusive, 5 = 5% GST
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'OFFLINE_UPI' | 'CARD_SWIPE' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitUPI, setSplitUPI] = useState<number>(0);
  const [sendWhatsApp, setSendWhatsApp] = useState<boolean>(true);
  const [cashierNotes, setCashierNotes] = useState<string>('');

  // Held Carts (parked tabs)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Recent Bills Modal & Drawer
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Receipt Modal (stores completed receipt data to prevent blank print bug)
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Active Variant Selector Dialog
  const [variantSelectorProduct, setVariantSelectorProduct] = useState<any | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  // ─── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: productData, isLoading: isProductsLoading } = trpc.product.list.useQuery({
    search: debouncedSearch || undefined,
    categorySlug: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    pageSize: 40,
  });

  const { data: categoriesData } = trpc.category.list.useQuery({ includeInactive: false });
  const { data: registerStats, refetch: refetchStats } = trpc.pos.getRegisterSummary.useQuery();
  const { data: recentBills, refetch: refetchBills } = trpc.pos.getRecentBills.useQuery(
    { limit: 20 },
    { enabled: showRecentModal }
  );

  const barcodeLookup = trpc.pos.barcodeLookup.useMutation();

  const createOrder = trpc.pos.createOrder.useMutation({
    onSuccess: (data: any) => {
      if (data.status === 'ESTIMATE') {
        toast.info(`Estimate ${data.invoiceNumber} generated!`);
      } else {
        toast.success(`Bill #${data.invoiceNumber} created successfully!`);
        refetchStats();
        if (showRecentModal) refetchBills();
      }

      // Store in dedicated receipt state so receipt never prints blank!
      setCompletedReceipt(data);
      setShowReceiptModal(true);

      // Reset cart and customer inputs for next customer
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setCustomerIsMember(false);
      setDiscountVal(0);
      setCashTendered(0);
      setSplitCash(0);
      setSplitUPI(0);
      setCashierNotes('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to complete checkout');
    },
  });

  // Customer phone live search
  const { data: customerSearchResults } = trpc.pos.customerLookup.useQuery(
    { query: customerPhone },
    { enabled: customerPhone.trim().length >= 4 }
  );

  // Auto-fill customer if exact 10-digit match exists
  useEffect(() => {
    if (customerSearchResults && customerSearchResults.length > 0) {
      const exact = customerSearchResults.find((c) => c.phone === customerPhone.trim());
      if (exact) {
        setCustomerName(exact.name);
        setCustomerIsMember(exact.isMember);
      }
    }
  }, [customerSearchResults, customerPhone]);

  // ─── Calculations ──────────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round(((subtotal * discountVal) / 100) * 100) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountVal));
  }, [subtotal, discountType, discountVal]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    return Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  }, [taxableAmount, taxRate]);

  const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const changeDue = useMemo(() => {
    if (paymentMethod === 'CASH') {
      return Math.max(0, Math.round((cashTendered - grandTotal) * 100) / 100);
    }
    return 0;
  }, [paymentMethod, cashTendered, grandTotal]);

  // Default cash tendered to grand total when total updates
  useEffect(() => {
    if (paymentMethod === 'CASH' && cashTendered === 0 && grandTotal > 0) {
      setCashTendered(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  // ─── Cart Helpers ──────────────────────────────────────────────────────────
  const addItemToCart = useCallback((product: any, variant?: any) => {
    const variantId = variant?.id || undefined;
    const stockQty = variant?.stockQty ?? (product.variants?.[0]?.stockQty ?? 999);
    const unitPrice = variant?.price ? Number(variant.price) : Number(product.netPrice);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.productId === product.id && it.variantId === variantId
      );

      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        if (item.quantity + 1 > stockQty) {
          toast.warning(`Maximum available stock reached (${stockQty} units)`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...item, quantity: item.quantity + 1 };
        return updated;
      }

      if (stockQty <= 0) {
        toast.error('Selected item is currently Out of Stock');
        return prev;
      }

      toast.success(`Added ${product.name} to bill`, { duration: 1500 });
      return [
        ...prev,
        {
          productId: product.id,
          variantId,
          name: product.name,
          color: variant?.color,
          size: variant?.size,
          sku: variant?.sku,
          price: unitPrice,
          originalPrice: unitPrice,
          quantity: 1,
          stockQty,
          image: product.images?.[0]?.url || null,
        },
      ];
    });
  }, []);

  const updateQuantity = (idx: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const item = next[idx];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        next.splice(idx, 1);
        return next;
      }

      if (newQty > item.stockQty) {
        toast.warning(`Only ${item.stockQty} in stock`);
        return prev;
      }

      next[idx] = { ...item, quantity: newQty };
      return next;
    });
  };

  const updateItemPrice = (idx: number, newPrice: number) => {
    setCart((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], price: Math.max(0, newPrice) };
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Barcode Gun Handler ───────────────────────────────────────────────────
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    try {
      const result = await barcodeLookup.mutateAsync({ code });
      if (result.found && result.product) {
        addItemToCart(result.product, result.variant);
        setBarcodeInput('');
        barcodeRef.current?.focus();
      } else {
        toast.error(`Barcode/SKU "${code}" not found in catalog`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error scanning barcode');
    }
  };

  // ─── Hold & Resume Cart System ─────────────────────────────────────────────
  const holdCurrentCart = () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty, nothing to hold');
      return;
    }

    const newHold: HeldCart = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      customerName: customerName || 'Guest Customer',
      customerPhone,
      items: [...cart],
      discountAmount: discountVal,
      discountType,
      taxRate,
      paymentMethod,
      heldAt: new Date(),
    };

    setHeldCarts((prev) => [newHold, ...prev]);
    setCart([]);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerIsMember(false);
    setDiscountVal(0);
    toast.info(`Cart parked as ${newHold.id}! Ready for next customer.`);
  };

  const resumeHeldCart = (held: HeldCart) => {
    if (cart.length > 0) {
      // Auto-hold current cart before loading selected one
      holdCurrentCart();
    }

    setCart(held.items);
    setCustomerName(held.customerName === 'Guest Customer' ? '' : held.customerName);
    setCustomerPhone(held.customerPhone);
    setDiscountVal(held.discountAmount);
    setDiscountType(held.discountType);
    setTaxRate(held.taxRate);
    setPaymentMethod(held.paymentMethod);

    setHeldCarts((prev) => prev.filter((c) => c.id !== held.id));
    setShowHeldModal(false);
    toast.success(`Resumed held cart ${held.id}`);
  };

  // ─── Checkout Execution ────────────────────────────────────────────────────
  const handleCheckout = (isEstimate: boolean = false) => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const splitPaymentsPayload =
      paymentMethod === 'SPLIT'
        ? [
            { method: 'CASH' as const, amount: Number(splitCash) },
            { method: 'OFFLINE_UPI' as const, amount: Number(splitUPI) },
          ]
        : undefined;

    createOrder.mutate({
      items: cart.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        price: it.price,
        name: it.name,
        color: it.color,
        size: it.size,
      })),
      paymentMethod,
      splitPayments: splitPaymentsPayload,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      discountAmount,
      taxRate,
      isEstimate,
      cashTendered: paymentMethod === 'CASH' ? Number(cashTendered) : undefined,
      sendWhatsApp: sendWhatsApp && Boolean(customerPhone.trim()),
      notes: cashierNotes || undefined,
    });
  };

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 -> New Bill / Focus Barcode
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeRef.current?.focus();
      }
      // F3 -> Focus barcode input
      if (e.key === 'F3') {
        e.preventDefault();
        barcodeRef.current?.focus();
      }
      // F4 -> Hold Cart
      if (e.key === 'F4') {
        e.preventDefault();
        holdCurrentCart();
      }
      // Escape -> close open modals
      if (e.key === 'Escape') {
        setShowReceiptModal(false);
        setShowHeldModal(false);
        setShowRecentModal(false);
        setShowRegisterModal(false);
        setVariantSelectorProduct(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerName, customerPhone, discountVal]);

  const products = useMemo(() => productData?.items || [], [productData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // UPI payment QR string
  const upiQrString = useMemo(() => {
    const pa = 'anmolvastralay@upi';
    const pn = encodeURIComponent('Anmol Vastralay');
    return `upi://pay?pa=${pa}&pn=${pn}&am=${grandTotal}&cu=INR&tn=POS-BILL`;
  }, [grandTotal]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/30 -m-4 sm:-m-6">
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-[#85142b] flex items-center justify-center shadow-md border border-amber-400/30 font-bold text-white text-base">
            AV
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Anmol Vastralay POS</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                Counter 1 Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Fast Retail Billing Engine • Press <kbd className="px-1 py-0.2 bg-slate-800 rounded text-slate-300">F2</kbd> for Barcode
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Register Summary Pill */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            <IndianRupee size={14} className="text-amber-400" />
            <span className="hidden md:inline">Today:</span>
            <span className="font-bold text-emerald-400">
              ₹{(registerStats?.totalSales ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-slate-400 text-[11px]">({registerStats?.billsCount ?? 0} bills)</span>
          </button>

          {/* Held Carts Button */}
          <button
            onClick={() => setShowHeldModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            <Pause size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Held Carts</span>
            {heldCarts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* Recent Bills Button */}
          <button
            onClick={() => setShowRecentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
          >
            <Receipt size={14} className="text-violet-400" />
            <span className="hidden sm:inline">Recent Bills</span>
          </button>
        </div>
      </header>

      {/* ── Main POS Workspace ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden print:hidden">
        
        {/* ── Left Pane: Barcode Scanner & Product Catalog ───────────────────── */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-800 bg-slate-950/60">
          
          {/* Barcode & Search Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 shrink-0">
            {/* Barcode Gun Fast Input */}
            <form onSubmit={handleBarcodeSubmit} className="md:col-span-5 relative">
              <ScanBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Scan Barcode / SKU + Enter (F2)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-amber-500/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner font-mono"
              />
              {barcodeLookup.isPending && (
                <RefreshCw size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-amber-400" />
              )}
            </form>

            {/* Keyword Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search Sarees, Kurtis, Suits, Brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-[#85142b] focus:ring-2 focus:ring-[#85142b]/20 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 shrink-0 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              All Items
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.slug
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid Catalog */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {isProductsLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
                <RefreshCw size={28} className="animate-spin text-amber-500" />
                <p className="text-xs uppercase tracking-wider font-semibold">Loading Catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
                <ShoppingBag size={40} className="opacity-30" />
                <p className="text-sm">No products found matching &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {products.map((product: any) => {
                  const hasVariants = product.variants && product.variants.length > 0;
                  const totalStock = hasVariants
                    ? product.variants.reduce((s: number, v: any) => s + v.stockQty, 0)
                    : 999;
                  const isOutOfStock = totalStock <= 0;

                  return (
                    <div
                      key={product.id}
                      className={`group relative flex flex-col justify-between p-3 rounded-2xl bg-slate-900/90 border transition-all duration-200 overflow-hidden ${
                        isOutOfStock
                          ? 'border-red-900/30 opacity-60'
                          : 'border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-850 hover:shadow-xl hover:shadow-amber-500/5'
                      }`}
                    >
                      <div>
                        {/* Image & Stock Badge */}
                        <div className="aspect-square rounded-xl bg-slate-950 overflow-hidden relative mb-2.5">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                              <ShoppingBag size={32} />
                            </div>
                          )}

                          {/* Stock Pill */}
                          <div
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                              isOutOfStock
                                ? 'bg-red-500/80 text-white'
                                : totalStock <= 5
                                ? 'bg-amber-500/80 text-slate-950'
                                : 'bg-emerald-500/80 text-white'
                            }`}
                          >
                            {isOutOfStock ? 'Sold Out' : `${totalStock} Left`}
                          </div>
                        </div>

                        {/* Title & Brand */}
                        <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {product.category?.name || product.brand || 'Apparel'}
                        </p>
                      </div>

                      {/* Pricing & Add Trigger */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-amber-400">
                            ₹{Number(product.netPrice).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {hasVariants && product.variants.length > 1 ? (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setVariantSelectorProduct(product)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition-all border border-slate-700"
                          >
                            Variants ({product.variants.length})
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => addItemToCart(product, product.variants?.[0])}
                            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-30 disabled:hover:bg-slate-800"
                            title="Add to cart"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Pane: Billing Terminal & Checkout Controls ──────────────── */}
        <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col bg-slate-900 border-l border-slate-800 h-full overflow-hidden shrink-0">
          
          {/* Customer Intelligence Header */}
          <div className="p-3.5 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-amber-400" /> Customer Info
              </span>
              {customerIsMember && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  <Crown size={11} /> VIP Royal Club
                </span>
              )}
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 relative">
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none font-mono"
                />
              </div>
              <div className="col-span-7 relative">
                <input
                  type="text"
                  placeholder="Customer Name (Walk-in)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 py-12">
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                  <ShoppingBag size={24} className="opacity-40" />
                </div>
                <p className="text-xs font-medium text-slate-400">Cart is empty</p>
                <p className="text-[11px] text-slate-600 text-center max-w-[200px]">
                  Scan a barcode or tap products from the catalog to add items.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.variantId || idx}`}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">
                          AV
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        {(item.color || item.size) && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {item.color} {item.size}
                          </span>
                        )}
                        <span>@ ₹{item.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="w-16 text-right font-mono font-bold text-xs text-amber-400">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Action Buttons */}
          {cart.length > 0 && (
            <div className="px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-400 font-medium">
                {cart.reduce((s, it) => s + it.quantity, 0)} Items in Cart
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={holdCurrentCart}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Pause size={12} /> Hold Cart (F4)
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 text-[11px] font-semibold transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Bill Summary & Payment Box ──────────────────────────────────── */}
          <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 space-y-3 shrink-0">
            {/* Financial Rows */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input & Type Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Discount:</span>
                  <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDiscountType('FLAT')}
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        discountType === 'FLAT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        discountType === 'PERCENT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountVal || ''}
                    onChange={(e) => setDiscountVal(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-right font-mono text-xs text-white outline-none focus:border-amber-400"
                  />
                  {discountAmount > 0 && (
                    <span className="text-red-400 font-mono text-[11px]">
                      (-₹{discountAmount.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Tax / GST Rate Picker */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GST Tax:</span>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 12].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRate(rate)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        taxRate === rate
                          ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate === 0 ? 'Inclusive' : `${rate}%`}
                    </button>
                  ))}
                  {taxAmount > 0 && (
                    <span className="text-emerald-400 font-mono text-[11px]">
                      +₹{taxAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Grand Total Display */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                <span className="text-white text-base">Grand Total:</span>
                <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { id: 'CASH', label: 'Cash', icon: IndianRupee },
                { id: 'OFFLINE_UPI', label: 'UPI QR', icon: QrCode },
                { id: 'CARD_SWIPE', label: 'Card', icon: CreditCard },
                { id: 'SPLIT', label: 'Split', icon: Layers },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all border ${
                    paymentMethod === m.id
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  <m.icon size={15} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Specific Payment Inputs */}
            {paymentMethod === 'CASH' && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Cash Given:</span>
                  <input
                    type="number"
                    min="0"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono font-bold text-white text-sm focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Quick Cash Presets */}
                <div className="flex items-center justify-end gap-1.5">
                  {[500, 1000, 2000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCashTendered((prev) => (prev || 0) + preset)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                    >
                      +{preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-amber-400"
                  >
                    Exact
                  </button>
                </div>

                {changeDue > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-bold text-emerald-400">
                    <span>Return Change (वापसी):</span>
                    <span className="text-base font-mono">₹{changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'OFFLINE_UPI' && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg shrink-0">
                  <QRCodeSVG value={upiQrString} size={68} />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <QrCode size={14} className="text-amber-400" /> Scan to Pay
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Customer scans via GPay, PhonePe, or Paytm for exact ₹{grandTotal}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                    VPA: anmolvastralay@upi
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'SPLIT' && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cash Amount:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={splitCash || ''}
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-white outline-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">UPI/Card Amount:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={splitUPI || ''}
                    onChange={(e) => setSplitUPI(Number(e.target.value))}
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-right font-mono text-white outline-none"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Split Total: ₹{(Number(splitCash) + Number(splitUPI)).toFixed(2)}</span>
                  <span>Required: ₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* WhatsApp Digital Receipt Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700 w-4 h-4"
                />
                <span>Send WhatsApp Receipt 📲</span>
              </label>
            </div>

            {/* Final Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={createOrder.isPending || cart.length === 0}
                onClick={() => handleCheckout(true)}
                className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
              >
                <FileText size={14} /> Estimate
              </button>

              <button
                type="button"
                disabled={createOrder.isPending || cart.length === 0}
                onClick={() => handleCheckout(false)}
                className="flex-[2.5] py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-[#85142b] hover:from-amber-400 hover:to-[#9c1833] text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {createOrder.isPending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Bill...</span>
                  </>
                ) : (
                  <>
                    <Printer size={16} />
                    <span>Checkout & Print Receipt (F9)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal 1: Variant Quick Selector ──────────────────────────────────── */}
      {variantSelectorProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base leading-snug">
                  {variantSelectorProduct.name}
                </h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">
                  ₹{Number(variantSelectorProduct.netPrice).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setVariantSelectorProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold">
              Select Color & Size:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {variantSelectorProduct.variants.map((v: any) => {
                const isOutOfStock = v.stockQty <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      addItemToCart(variantSelectorProduct, v);
                      setVariantSelectorProduct(null);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between text-xs transition-all border ${
                      isOutOfStock
                        ? 'border-slate-800 bg-slate-950/40 text-slate-600 cursor-not-allowed'
                        : 'border-slate-800 bg-slate-950 hover:border-amber-400 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <span className="font-semibold">{v.color}</span>
                      {v.size && <span className="text-slate-400">({v.size})</span>}
                      {v.sku && <span className="font-mono text-[10px] text-slate-500">[{v.sku}]</span>}
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${v.stockQty} in stock`}
                      </span>
                      <Plus size={14} className={isOutOfStock ? 'opacity-0' : 'text-amber-400'} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Held Carts Drawer ───────────────────────────────────────── */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Pause size={16} className="text-amber-400" /> Parked & Held Carts
              </h3>
              <button
                onClick={() => setShowHeldModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {heldCarts.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No held carts currently parked.</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
                {heldCarts.map((h) => {
                  const heldTotal = h.items.reduce((s, it) => s + it.price * it.quantity, 0);
                  return (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">{h.id}</span>
                          <span className="text-xs font-semibold text-white">{h.customerName}</span>
                          {h.customerPhone && (
                            <span className="text-[11px] text-slate-500">({h.customerPhone})</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {h.items.length} item(s) • Total: ₹{heldTotal.toLocaleString('en-IN')} •{' '}
                          {new Date(h.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => resumeHeldCart(h)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Play size={12} /> Resume
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 3: Recent Bills History ────────────────────────────────────── */}
      {showRecentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt size={16} className="text-violet-400" /> Recent POS Invoices
              </h3>
              <button
                onClick={() => setShowRecentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {recentBills?.map((b: any) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">#{b.invoiceNumber}</span>
                      <span className="text-xs text-slate-300 font-medium">{b.customerName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {b.itemCount} item(s) • Paid via {b.paymentMethod} •{' '}
                      {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCompletedReceipt({
                          id: b.id,
                          invoiceNumber: b.invoiceNumber,
                          status: 'DELIVERED',
                          subtotal: b.totalAmount,
                          discountAmount: 0,
                          taxAmount: 0,
                          totalAmount: b.totalAmount,
                          cashTendered: b.totalAmount,
                          changeDue: 0,
                          customerName: b.customerName,
                          customerPhone: b.customerPhone,
                          items: b.items,
                          paymentMethod: b.paymentMethod,
                          createdAt: b.createdAt,
                        });
                        setShowRecentModal(false);
                        setShowReceiptModal(true);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                    >
                      <Printer size={12} /> Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 4: Register Shift Summary ─────────────────────────────────── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <IndianRupee size={16} className="text-amber-400" /> Today&apos;s Register Summary
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Total POS Sales Today
                </p>
                <p className="text-3xl font-black text-emerald-400 font-mono mt-1">
                  ₹{(registerStats?.totalSales ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {registerStats?.billsCount ?? 0} Invoices Generated (Avg ₹{registerStats?.averageBill ?? 0}/bill)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">Cash</p>
                  <p className="font-bold text-white font-mono mt-0.5">
                    ₹{(registerStats?.cashTotal ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">UPI/QR</p>
                  <p className="font-bold text-white font-mono mt-0.5">
                    ₹{(registerStats?.upiTotal ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <p className="text-slate-400">Card</p>
                  <p className="font-bold text-white font-mono mt-0.5">
                    ₹{(registerStats?.cardTotal ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 5: Finalized Receipt & Thermal Print Preview ───────────────── */}
      {showReceiptModal && completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  {completedReceipt.status === 'ESTIMATE' ? 'Estimate Generated' : 'Bill Created Successfully!'}
                </span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Preview Box */}
            <div className="my-4 p-4 rounded-xl bg-white text-black font-mono text-xs overflow-y-auto max-h-[360px] shadow-inner">
              <div className="text-center font-bold text-base tracking-tight">ANMOL VASTRALAY</div>
              <div className="text-center text-[10px] text-gray-600 mb-1">
                Main Market, Bihar • GSTIN: 10AAAAA0000A1Z5
              </div>
              <div className="text-center text-[10px] text-gray-500 mb-3">
                Ph: +91 98765 43210
              </div>

              <div className="border-t border-b border-dashed border-gray-400 py-1.5 mb-2 text-[11px]">
                <div className="flex justify-between">
                  <span>Inv: #{completedReceipt.invoiceNumber}</span>
                  <span>{new Date(completedReceipt.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cust: {completedReceipt.customerName}</span>
                  <span>{completedReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 mb-2">
                {completedReceipt.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="pr-2 flex-1">
                      <div className="font-semibold truncate">{it.name}</div>
                      <div className="text-[10px] text-gray-500">
                        {it.quantity} × ₹{it.price} {(it.color || it.size) ? `(${it.color || ''} ${it.size || ''})` : ''}
                      </div>
                    </div>
                    <div className="font-bold text-right shrink-0">
                      ₹{(it.quantity * it.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t border-dashed border-gray-400 pt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedReceipt.subtotal?.toFixed(2)}</span>
                </div>
                {completedReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-₹{completedReceipt.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {completedReceipt.taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>GST:</span>
                    <span>+₹{completedReceipt.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
                  <span>TOTAL:</span>
                  <span>₹{completedReceipt.totalAmount?.toFixed(2)}</span>
                </div>
                {completedReceipt.paymentMethod === 'CASH' && completedReceipt.changeDue > 0 && (
                  <div className="flex justify-between text-[10px] text-gray-600">
                    <span>Change Returned:</span>
                    <span>₹{completedReceipt.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-gray-500 mt-4">
                Thank you for shopping at Anmol Vastralay!
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Printer size={15} /> Print Thermal (80mm)
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  barcodeRef.current?.focus();
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
              >
                Next Bill ↵
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Thermal 80mm Receipt Component (Print only) ─────────────── */}
      {completedReceipt && (
        <div id="printable-pos-receipt" className="hidden print:block font-mono text-black text-xs p-2 w-[76mm]">
          <div className="text-center font-bold text-sm">ANMOL VASTRALAY</div>
          <div className="text-center text-[9px] text-gray-600">
            Traditional & Designer Wear • GSTIN: 10AAAAA0000A1Z5
          </div>
          <div className="text-center text-[9px] mb-2">Ph: +91 98765 43210</div>

          <div className="border-t border-b border-dashed border-black py-1 my-1 text-[10px]">
            <div className="flex justify-between">
              <span>Bill: #{completedReceipt.invoiceNumber}</span>
              <span>{new Date(completedReceipt.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer: {completedReceipt.customerName}</span>
              <span>{new Date(completedReceipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="py-1 border-b border-dashed border-black space-y-1 text-[10px]">
            {completedReceipt.items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <div className="pr-1 flex-1 truncate">
                  {it.name} {(it.color || it.size) ? `(${it.color || ''} ${it.size || ''})` : ''}
                  <div className="text-[9px] text-gray-500">
                    {it.quantity} x {it.price}
                  </div>
                </div>
                <div className="font-bold shrink-0">
                  ₹{(it.quantity * it.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="py-1 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{completedReceipt.subtotal?.toFixed(2)}</span>
            </div>
            {completedReceipt.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{completedReceipt.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {completedReceipt.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>GST:</span>
                <span>+₹{completedReceipt.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs border-t border-black pt-1">
              <span>NET TOTAL:</span>
              <span>₹{completedReceipt.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span>Paid Mode:</span>
              <span>{completedReceipt.paymentMethod}</span>
            </div>
            {completedReceipt.paymentMethod === 'CASH' && completedReceipt.changeDue > 0 && (
              <div className="flex justify-between text-[9px]">
                <span>Change Returned:</span>
                <span>₹{completedReceipt.changeDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[9px] border-t border-dashed border-black pt-2 mt-2">
            🙏 Thank You! Visit Again 🙏
          </div>
        </div>
      )}
    </div>
  );
}
