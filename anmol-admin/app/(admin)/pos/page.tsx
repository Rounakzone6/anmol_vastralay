'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, ShoppingBag, Plus, Minus, CreditCard, Printer, FileText, User, ScanBarcode, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type POSItem = {
  productId: string;
  variantId?: string;
  name: string;
  color?: string;
  size?: string;
  price: number;
  quantity: number;
};

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<POSItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'OFFLINE_UPI' | 'CARD_SWIPE'>('CASH');

  // Debouncing for the search term
  const debouncedSearch = useDebounce(search, 300);
  const debouncedDiscount = useDebounce(discountAmount, 300);

  // Using the updated backend logic which uses indexing to search across name, description, brand, category, and SKU
  const { data: productData, isLoading } = trpc.product.list.useQuery({ 
    search: debouncedSearch || undefined,
    pageSize: 40 
  });
  
  const createOrder = trpc.pos.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.status === 'ESTIMATE') {
        toast.success(data.message);
      } else {
        toast.success(data.message);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscountAmount(0);
        setTimeout(() => window.print(), 500);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create order');
    }
  });

  const products = useMemo(() => {
    if (!productData?.items) return [];
    return productData.items;
  }, [productData]);

  const addToCart = (product: any, variant?: any) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.productId === product.id && 
        item.variantId === variant?.id
      );
      if (existing) {
        return prev.map(item => 
          item.productId === product.id && item.variantId === variant?.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        color: variant?.color,
        size: variant?.size,
        price: Number(product.netPrice),
        quantity: 1
      }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].quantity += delta;
      if (newCart[index].quantity <= 0) {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - (debouncedDiscount || 0));

  const handleCheckout = (isEstimate: boolean = false) => {
    if (cart.length === 0) return toast.error('Cart is empty');
    
    createOrder.mutate({
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price
      })),
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      discountAmount: Number(discountAmount),
      isEstimate
    });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 bg-gradient-to-br from-gray-950 via-[#0a0a0f] to-black text-slate-100 p-4 -mx-4 -mt-4 font-sans selection:bg-violet-500/30">
      
      {/* Left Pane - Products */}
      <div className="flex-1 flex flex-col bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border border-white/[0.05] overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl transition-opacity opacity-0 group-focus-within:opacity-100 pointer-events-none" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-400 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search silk saris, brands, or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="relative w-full pl-14 pr-16 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 text-slate-100 placeholder:text-slate-500/80 text-lg shadow-inner transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-400 tooltip" title="Scan Barcode (F3)">
                <ScanBarcode size={18} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 relative z-10">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping" />
                <div className="animate-spin h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full relative z-10" />
              </div>
              <p className="animate-pulse">Loading amazing products...</p>
            </div>
          ) : products.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
               <ShoppingBag size={48} className="opacity-20" />
               <p className="text-lg">No products found matching "{search}"</p>
             </div>
          ) : products.map((product: any) => (
            <div key={product.id} className="bg-white/[0.03] rounded-3xl p-4 hover:bg-white/[0.06] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border border-white/[0.05] hover:border-violet-500/30 flex flex-col justify-between group shadow-lg hover:shadow-violet-500/10 relative overflow-hidden">
              {/* Card Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-colors duration-500" />
              
              <div className="relative z-10">
                <div className="aspect-[4/5] bg-black/40 rounded-2xl mb-4 overflow-hidden relative shadow-inner">
                  {product.images?.[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600"><ShoppingBag size={40} strokeWidth={1} /></div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-400/20">
                    ₹{product.netPrice}
                  </div>
                </div>
                <h4 className="font-medium text-slate-200 line-clamp-2 text-sm leading-snug group-hover:text-violet-200 transition-colors">{product.name}</h4>
                <p className="text-xs text-slate-500 mt-1 capitalize">{product.brand || product.category?.name || 'Standard'}</p>
              </div>
              
              <div className="mt-4 relative z-10">
                {product.variants && product.variants.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.map((v: any) => (
                      <button 
                        key={v.id} 
                        onClick={() => addToCart(product, v)}
                        disabled={v.stockQty <= 0}
                        className="text-[11px] px-3 py-1.5 bg-white/5 hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl text-slate-300 hover:text-white transition-all font-medium border border-white/5 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95"
                      >
                        {v.color} {v.size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full py-2.5 bg-white/5 hover:bg-violet-600 border border-white/5 hover:border-violet-500 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Cart & Checkout */}
      <div className="w-full md:w-96 lg:w-[420px] flex flex-col bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-2xl border border-white/[0.05] h-full relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3 relative z-10 tracking-tight">
          <div className="p-2.5 bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/20">
            <ShoppingBag size={20} />
          </div>
          Current Bill
        </h2>

        {/* Customer Details */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-black/20 rounded-2xl border border-white/[0.03] relative z-10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">
            <User size={14} /> Customer Info
          </div>
          <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="Phone" 
               value={customerPhone}
               onChange={e => setCustomerPhone(e.target.value)}
               className="w-1/3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-600"
             />
             <input 
               type="text" 
               placeholder="Full Name" 
               value={customerName}
               onChange={e => setCustomerName(e.target.value)}
               className="w-2/3 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder:text-slate-600"
             />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar relative z-10">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="opacity-50" />
              </div>
              <p className="text-sm font-medium">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors rounded-2xl border border-white/[0.05] group">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-sm truncate text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {(item.color || item.size) && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-black/30 rounded-md text-slate-400 border border-white/5">{item.color} {item.size}</span>
                      )}
                      <span className="text-violet-400 font-semibold text-sm">₹{item.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/5">
                    <button onClick={() => updateQuantity(idx, -1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors active:scale-90"><Minus size={14} /></button>
                    <span className="text-sm font-semibold w-5 text-center text-slate-200">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors active:scale-90"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="bg-gradient-to-br from-white/[0.05] to-transparent rounded-3xl p-6 border border-white/[0.05] relative z-10 backdrop-blur-xl">
          <div className="flex justify-between text-slate-400 mb-3 text-sm font-medium">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-5">
            <span className="text-slate-400 text-sm font-medium">Discount (₹)</span>
            <input 
              type="number" 
              value={discountAmount || ''} 
              onChange={e => setDiscountAmount(Number(e.target.value))}
              placeholder="0.00"
              className="w-24 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-right text-sm outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
              min="0"
            />
          </div>
          <div className="flex justify-between items-end mb-6 pt-5 border-t border-white/10">
            <span className="text-slate-300 font-medium">Total Amount</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 tracking-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {[
              { id: 'CASH', label: 'Cash', icon: FileText },
              { id: 'OFFLINE_UPI', label: 'UPI/QR', icon: ScanBarcode },
              { id: 'CARD_SWIPE', label: 'Card', icon: CreditCard }
            ].map(method => (
              <button 
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`py-3 rounded-2xl text-[11px] uppercase tracking-wider font-bold transition-all flex flex-col items-center gap-1.5 border ${
                  paymentMethod === method.id 
                    ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                    : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <method.icon size={18} className={paymentMethod === method.id ? 'text-violet-400' : 'opacity-70'} /> 
                {method.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              disabled={createOrder.isPending || cart.length === 0}
              onClick={() => handleCheckout(true)}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <FileText size={18} /> Est.
            </button>
            <button 
              disabled={createOrder.isPending || cart.length === 0}
              onClick={() => handleCheckout(false)}
              className="flex-[2.5] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] border border-white/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] group"
            >
              {createOrder.isPending ? 'Processing...' : (
                <>Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Hide printable receipt area by default, visible only on print */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-4 text-sm font-mono w-[80mm]">
        <div className="text-center font-bold text-xl mb-1">ANMOL VASTRALAY</div>
        <div className="text-center text-xs mb-4 text-gray-500">Premium Traditional Wear</div>
        {customerName && <div className="mb-2 text-xs">Customer: {customerName}</div>}
        {customerPhone && <div className="mb-2 text-xs">Contact: {customerPhone}</div>}
        
        <div className="border-t border-b border-dashed border-black py-3 mb-3">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between mb-2">
              <div className="pr-2">
                <div className="font-semibold">{item.name}</div>
                <div className="text-[10px] text-gray-600">{item.quantity} x ₹{item.price} {(item.color || item.size) ? `(${item.color} ${item.size})` : ''}</div>
              </div>
              <div className="font-semibold">₹{item.quantity * item.price}</div>
            </div>
          ))}
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between mb-1 text-sm">
            <span>Discount:</span>
            <span>-₹{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-b border-black pb-3 mb-3 pt-2">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
        <div className="text-center text-xs font-semibold mb-1">Paid via {paymentMethod}</div>
        <div className="text-center text-[10px] text-gray-500 mt-4">Thank you for visiting!</div>
        <div className="text-center text-[10px] text-gray-500">Please visit again.</div>
      </div>
    </div>
  );
}
