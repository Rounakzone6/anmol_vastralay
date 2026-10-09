'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { Search, ShoppingBag, Plus, Minus, X, CreditCard, Printer, FileText, User } from 'lucide-react';
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

  const debouncedSearch = useDebounce(search, 300);
  const debouncedDiscount = useDebounce(discountAmount, 300);

  // We fetch products dynamically based on the debounced search term
  const { data: productData, isLoading } = trpc.product.list.useQuery({ 
    search: debouncedSearch || undefined,
    pageSize: 40 
  });
  
  const createOrder = trpc.pos.createOrder.useMutation({
    onSuccess: (data) => {
      if (data.status === 'ESTIMATE') {
        toast.success(data.message);
        // Print estimate logic could go here
      } else {
        toast.success(data.message);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscountAmount(0);
        // Show receipt modal/print
        setTimeout(() => window.print(), 500);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create order');
    }
  });

  const products = useMemo(() => {
    if (!productData?.items) return [];
    // The backend already filters based on debouncedSearch, so we just return the items.
    // We can still do a local filter just in case the backend hasn't responded yet,
    // but returning productData.items directly is generally correct for server-side search.
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
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 bg-slate-900 text-slate-100 p-2 -mx-4 -mt-4">
      
      {/* Left Pane - Products */}
      <div className="flex-1 flex flex-col bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or barcode (F3)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-200 placeholder:text-slate-500 text-lg"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10"><div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>
          ) : products.map(product => (
            <div key={product.id} className="bg-slate-700/30 rounded-2xl p-4 hover:bg-slate-700/60 transition cursor-pointer border border-slate-600/50 flex flex-col justify-between group">
              <div>
                <div className="aspect-square bg-slate-800 rounded-xl mb-3 overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><ShoppingBag size={32} /></div>
                  )}
                </div>
                <h4 className="font-semibold text-slate-200 line-clamp-2 text-sm">{product.name}</h4>
                <p className="text-violet-400 font-bold mt-1">₹{product.netPrice}</p>
              </div>
              
              <div className="mt-3">
                {product.variants && product.variants.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {product.variants.map((v: any) => (
                      <button 
                        key={v.id} 
                        onClick={() => addToCart(product, v)}
                        disabled={v.stockQty <= 0}
                        className="text-xs px-2 py-1 bg-slate-600 hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-slate-600 rounded text-slate-200 transition"
                      >
                        {v.color} {v.size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full py-2 bg-slate-600 hover:bg-violet-600 rounded-xl text-sm font-semibold transition"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane - Cart & Checkout */}
      <div className="w-full md:w-96 lg:w-[400px] flex flex-col bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-700/50 h-full">
        <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-2">
          <ShoppingBag className="text-violet-500" /> Current Bill
        </h2>

        {/* Customer Details */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold mb-1">
            <User size={16} /> Customer Details (Optional)
          </div>
          <input 
            type="text" 
            placeholder="Phone Number" 
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-violet-500 outline-none"
          />
          <input 
            type="text" 
            placeholder="Customer Name" 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-violet-500 outline-none"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/30">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    {(item.color || item.size) && (
                      <p className="text-xs text-slate-400 truncate">{item.color} {item.size}</p>
                    )}
                    <p className="text-violet-400 font-medium mt-0.5">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
                    <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-slate-600 rounded text-slate-300"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-slate-600 rounded text-slate-300"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700">
          <div className="flex justify-between text-slate-400 mb-2">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Discount (₹)</span>
            <input 
              type="number" 
              value={discountAmount || ''} 
              onChange={e => setDiscountAmount(Number(e.target.value))}
              className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-right text-sm outline-none focus:border-violet-500"
              min="0"
            />
          </div>
          <div className="flex justify-between text-xl font-black text-white mb-6 pt-4 border-t border-slate-700">
            <span>Total</span>
            <span className="text-emerald-400">₹{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button 
              onClick={() => setPaymentMethod('CASH')}
              className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <CreditCard size={16} /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('OFFLINE_UPI')}
              className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === 'OFFLINE_UPI' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <CreditCard size={16} /> QR/UPI
            </button>
            <button 
              onClick={() => setPaymentMethod('CARD_SWIPE')}
              className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === 'CARD_SWIPE' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <CreditCard size={16} /> Swipe
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              disabled={createOrder.isPending || cart.length === 0}
              onClick={() => handleCheckout(true)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <FileText size={18} /> Kaccha Bill
            </button>
            <button 
              disabled={createOrder.isPending || cart.length === 0}
              onClick={() => handleCheckout(false)}
              className="flex-[2] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 rounded-xl font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {createOrder.isPending ? 'Processing...' : (
                <><Printer size={18} /> Checkout & Print</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Hide printable receipt area by default, visible only on print */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-4 text-sm font-mono w-[80mm]">
        <div className="text-center font-bold text-lg mb-2">ANMOL VASTRALAY</div>
        <div className="text-center text-xs mb-4">Offline POS Receipt</div>
        {customerName && <div className="mb-2 text-xs">Customer: {customerName}</div>}
        <div className="border-t border-b border-dashed border-black py-2 mb-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between mb-1">
              <div>
                <div className="font-semibold">{item.name.substring(0, 20)}</div>
                <div className="text-xs">{item.quantity} x ₹{item.price}</div>
              </div>
              <div>₹{item.quantity * item.price}</div>
            </div>
          ))}
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between mb-1">
            <span>Discount:</span>
            <span>-₹{discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-b border-dashed border-black pb-2 mb-2">
          <span>Total:</span>
          <span>₹{total}</span>
        </div>
        <div className="text-center text-xs">Paid via {paymentMethod}</div>
        <div className="text-center text-xs mt-4">Thank you for visiting!</div>
      </div>
    </div>
  );
}
