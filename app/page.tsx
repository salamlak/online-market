'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, ShoppingCart, MessageSquare, ChevronRight, User, Star, 
  ShieldCheck, X, Check, Heart, Send, ZoomIn, Trash2, Plus, Minus, CreditCard,
  Camera, Sparkles, Upload, Loader2
} from 'lucide-react';
import { CATEGORIES, PRODUCTS, Product } from '../mockData';

interface SKUOption {
  color: string;
  storage: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: string;
  product: Product;
  color: string;
  storage: string;
  price: number;
  quantity: number;
}

const SAMPLE_VARIANTS: SKUOption[] = [
  { color: 'Space Black', storage: '512GB', price: 1299.00, stock: 12 },
  { color: 'Space Black', storage: '1TB', price: 1499.00, stock: 5 },
  { color: 'Silver', storage: '512GB', price: 1299.00, stock: 0 },
  { color: 'Silver', storage: '1TB', price: 1499.00, stock: 8 },
];

export default function SalamaMarketHomepage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // AI Search States
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDP Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState('Space Black');
  const [selectedStorage, setSelectedStorage] = useState('512GB');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);

  // Seller Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'seller'; text: string }>>([
    { sender: 'seller', text: 'Hello! Welcome to Official Store. How can I help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Hydrate Cart
  useEffect(() => {
    const savedCart = localStorage.getItem('salama_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('salama_cart', JSON.stringify(cart));
  }, [cart]);

  // Derived Values
  const displayedProducts = aiMatchedIds !== null
    ? PRODUCTS.filter(p => aiMatchedIds.includes(p.id))
    : PRODUCTS;

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const currentVariant = SAMPLE_VARIANTS.find(
    v => v.color === selectedColor && v.storage === selectedStorage
  ) || SAMPLE_VARIANTS[0];

  // Cart Operations
  const addToCart = (product: Product) => {
    const cartItemId = `${product.id}-${selectedColor}-${selectedStorage}`;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === cartItemId);
      if (existing) {
        return prevCart.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, {
        id: cartItemId,
        product,
        color: selectedColor,
        storage: selectedStorage,
        price: currentVariant.price,
        quantity: 1
      }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: newMessage }]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'seller', text: 'Thanks for reaching out! A representative will respond shortly.' }]);
    }, 1000);
  };

  // AI Search Execution
  const triggerAiSearch = async (queryText?: string, base64Img?: string) => {
    const q = queryText !== undefined ? queryText : searchQuery;
    const img = base64Img !== undefined ? base64Img : uploadedImageBase64;

    if (!q.trim() && !img) {
      setAiMatchedIds(null);
      setAiReasoning(null);
      setAiConfidence(null);
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          imageBase64: img,
          products: PRODUCTS,
        }),
      });

      const data = await res.json();
      if (data.matchedIds) {
        setAiMatchedIds(data.matchedIds);
        setAiReasoning(data.reasoning || null);
        setAiConfidence(typeof data.confidence === 'number' ? data.confidence : null);
      } else {
        setAiMatchedIds(null);
        setAiReasoning(null);
        setAiConfidence(null);
      }
    } catch (err) {
      console.error('AI search failed:', err);
      setAiMatchedIds(null);
      setAiReasoning(null);
      setAiConfidence(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setUploadedImageBase64(null);
    setAiMatchedIds(null);
    setAiReasoning(null);
    setAiConfidence(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans pb-10 text-slate-800">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              setUploadedImageBase64(base64);
              triggerAiSearch(searchQuery, base64);
            };
            reader.readAsDataURL(file);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      {/* HEADER */}
      <header className="bg-white/95 py-5 border-b border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-2">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetSearch}>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-2xl px-3 py-1.5 rounded-lg tracking-[0.12em] shadow-sm">
              SALAMA
            </div>
            <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold flex items-center gap-1 border border-orange-200">
              <Sparkles size={11} /> AI Shopping
            </span>
          </div>

          <div className="w-[52%] relative">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                triggerAiSearch();
              }}
              className="flex border-2 border-orange-500 rounded-xl overflow-hidden bg-white shadow-[0_4px_12px_rgba(255,102,0,0.12)] items-center pr-1.5"
            >
              {uploadedImageBase64 && (
                <div className="ml-2 flex items-center gap-1 bg-orange-100 border border-orange-300 text-orange-700 px-2 py-1 rounded text-xs shrink-0">
                  <img src={uploadedImageBase64} alt="Preview" className="w-5 h-5 object-cover rounded" />
                  <span className="font-semibold text-[11px]">Image</span>
                  <button type="button" onClick={() => { setUploadedImageBase64(null); triggerAiSearch(searchQuery, ''); }} className="hover:text-red-500 ml-0.5">
                    <X size={12} />
                  </button>
                </div>
              )}

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe what you want or upload a product image..."
                className="w-full px-4 py-3 text-sm outline-none text-gray-800 placeholder:text-gray-400"
              />

              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="px-2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image to search"
                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg mr-1 transition flex items-center justify-center shrink-0"
              >
                <Camera size={18} />
              </button>

              <button 
                type="submit" 
                disabled={isAiLoading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-105 text-white px-5 py-2.5 font-bold text-sm flex items-center gap-1.5 transition rounded-lg shrink-0 disabled:opacity-50 shadow-sm"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
            </form>

            <div className="flex gap-2 text-xs text-gray-400 mt-1.5 px-1 items-center overflow-hidden">
              <span className="text-gray-500 font-semibold flex items-center gap-0.5 shrink-0">
                <Sparkles size={11} className="text-orange-500" /> Hot:
              </span>
              {[
                'Desk setup essentials',
                'Quiet gaming keyboard',
                'Travel headphones'
              ].map((prompt, idx) => (
                <span 
                  key={idx} 
                  onClick={() => {
                    setSearchQuery(prompt);
                    triggerAiSearch(prompt);
                  }} 
                  className="hover:text-orange-600 text-gray-500 underline cursor-pointer truncate max-w-[180px]"
                >
                  "{prompt}"
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-100 transition shadow-sm"
            >
              <ShoppingCart size={20} />
              {totalCartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            <div 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-2 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition shadow-sm"
            >
              <MessageSquare size={18} className="text-orange-500" />
              <div>
                <p className="font-semibold text-gray-700">Seller Chat</p>
                <p className="text-orange-600 text-[10px] font-bold">Online</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1240px] mx-auto mt-4 px-2">
        <div className="grid grid-cols-12 gap-3">
          
          {/* CATEGORIES */}
          <div className="col-span-3 bg-white rounded-xl p-2 border border-orange-100 relative shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <h3 className="font-bold text-sm px-3 py-2.5 text-gray-700 border-b border-gray-100 flex items-center justify-between">
              <span>Categories</span>
              <span className="text-[10px] text-orange-500 font-bold">Hot</span>
            </h3>
            <div className="mt-1">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  onMouseEnter={() => setActiveCategory(cat.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-orange-50 rounded-lg text-xs text-gray-700 hover:text-orange-600 cursor-pointer transition"
                >
                  <span className="font-medium">{cat.name}</span>
                  <ChevronRight size={14} className="text-gray-400" />

                  {activeCategory === cat.id && (
                    <div className="absolute top-0 left-full ml-1 w-[380px] min-h-full bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                      <h4 className="font-bold text-sm text-orange-600 border-b pb-2 mb-3">{cat.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {cat.subcategories.map((sub, idx) => (
                          <span 
                            key={idx} 
                            onClick={() => {
                              setSearchQuery(sub);
                              triggerAiSearch(sub);
                            }}
                            className="text-xs text-gray-600 hover:text-orange-500 cursor-pointer bg-gray-50 p-2 rounded-lg hover:bg-orange-50 transition"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BANNER */}
          <div className="col-span-6 bg-gradient-to-r from-[#ff7a00] via-[#ff5a00] to-[#ef3a3a] rounded-xl p-6 text-white flex flex-col justify-between shadow-[0_10px_20px_rgba(255,100,0,0.18)]">
            <div>
              <span className="bg-white/20 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 w-max border border-white/30">
                <Sparkles size={12} /> Gemini Vision AI Engine Active
              </span>
              <h1 className="text-3xl font-extrabold mt-3 leading-tight">
                Discover Smart Products in Seconds
              </h1>
              <p className="text-xs opacity-90 mt-2 max-w-md">Upload a photo or describe your needs and let the AI match the best deals from the catalog.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-orange-600 font-bold px-5 py-2.5 rounded-lg text-xs w-max hover:bg-orange-50 transition shadow-md flex items-center gap-1.5"
            >
              <Upload size={15} /> Upload Photo to Search
            </button>
          </div>

          {/* USER CARD */}
          <div className="col-span-3 bg-white rounded-xl p-4 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center text-orange-500 mb-2">
              <User size={24} />
            </div>
            <p className="text-xs font-bold text-gray-800">Hi, Guest User!</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Welcome back to Salama Market</p>
            
            <div className="flex gap-2 w-full mt-3">
              <button className="w-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs py-1.5 rounded-lg font-bold hover:brightness-105">Login</button>
              <button className="w-1/2 border border-gray-300 text-xs py-1.5 rounded-lg font-semibold text-gray-600 hover:border-gray-400">Register</button>
            </div>

            <div className="w-full border-t border-gray-100 mt-4 pt-3 text-left">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-500" /> Buyer Protection
              </p>
              <p className="text-[10px] text-gray-400 mt-1">100% guaranteed delivery and quick refund support.</p>
            </div>
          </div>

        </div>

        {/* RESULTS GRID */}
        <div className="mt-8 mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Star className="text-orange-500 fill-orange-500" size={18} /> 
              {aiMatchedIds !== null ? 'AI Matched Results' : 'Recommended For You'}
            </h2>

            {aiMatchedIds !== null && (
              <button onClick={resetSearch} className="text-xs text-orange-600 hover:underline font-semibold">
                Reset Search
              </button>
            )}
          </div>

          {aiReasoning && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500 shrink-0" />
                <span><strong>AI Insight:</strong> {aiReasoning}</span>
              </div>
              {aiConfidence !== null && (
                <span className="bg-white border border-orange-200 text-orange-700 px-2 py-1 rounded-full font-bold shrink-0">
                  {aiConfidence}% match
                </span>
              )}
            </div>
          )}

          {isAiLoading ? (
            <div className="bg-white p-16 text-center rounded-xl border border-gray-200 shadow-sm">
              <Loader2 size={36} className="mx-auto text-orange-500 animate-spin mb-3" />
              <p className="text-sm font-bold text-gray-800">Gemini AI is analyzing your input...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm">No products matched your AI search.</p>
              <button onClick={resetSearch} className="mt-3 bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3.5">
              {displayedProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white border border-gray-200 rounded-xl p-2.5 hover:border-orange-300 hover:shadow-[0_8px_18px_rgba(255,112,0,0.12)] transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                      <img 
                        src={product.image} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                        <ZoomIn size={14} />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{product.badge}</span>
                    </div>
                    
                    <div className="mt-2 flex items-baseline gap-1 text-orange-600">
                      <span className="text-xs font-bold">$</span>
                      <span className="text-xl font-extrabold">{product.price.toFixed(2)}</span>
                      <span className="text-[11px] text-gray-400 line-through font-normal">${product.originalPrice.toFixed(2)}</span>
                    </div>

                    <h3 className="text-xs text-gray-800 font-medium line-clamp-2 mt-1 group-hover:text-orange-600 transition leading-snug">
                      {product.title}
                    </h3>
                  </div>

                  <div className="mt-3 border-t border-gray-100 pt-2 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="text-orange-600 font-bold">{product.location}</span>
                    <span>{product.salesCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-orange-500" /> My Shopping Cart ({totalCartCount})
              </h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Your shopping cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-3 flex gap-3 items-center">
                    <img src={item.product.image} alt={item.product.title} className="w-14 h-14 object-cover rounded border border-gray-200" />
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">{item.product.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.color} | {item.storage}</p>
                      <p className="text-xs font-bold text-orange-600 mt-1">${item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center border border-gray-200 rounded">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100 text-gray-600">
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-700">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100 text-gray-600">
                        <Plus size={12} />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 ml-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-600">Total Order Amount:</span>
                  <span className="text-xl font-black text-orange-600">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => {
                    setCart([]);
                    setIsCheckoutSuccess(true);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <CreditCard size={16} /> Complete Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT SUCCESS MODAL */}
      {isCheckoutSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 text-center max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={28} />
            </div>
            <h3 className="font-bold text-base text-gray-800">Order Placed Successfully!</h3>
            <p className="text-xs text-gray-500 mt-1">Your order tracking number is #TB-{Math.floor(Math.random() * 899999 + 100000)}.</p>
            <button 
              onClick={() => {
                setIsCheckoutSuccess(false);
                setIsCartOpen(false);
              }}
              className="mt-5 w-full bg-orange-500 text-white text-xs py-2.5 rounded-lg font-bold"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 relative shadow-2xl">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full text-gray-600">
              <X size={18} />
            </button>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-5">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative group">
                  <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover group-hover:scale-125 transition duration-300 cursor-zoom-in" />
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                    Hover to Zoom
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Heart size={14} className="text-red-500" /> 1.4k Favorites
                  <span className="ml-auto text-[11px]">{selectedProduct.location}</span>
                </div>
              </div>

              <div className="col-span-7 flex flex-col justify-between">
                <div>
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">
                    {selectedProduct.badge}
                  </span>
                  <h2 className="text-base font-bold text-gray-800 mt-2 leading-snug">
                    {selectedProduct.title}
                  </h2>

                  <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                    {selectedProduct.description}
                  </p>

                  <div className="bg-orange-50 p-3 rounded-lg mt-3 flex items-baseline gap-2">
                    <span className="text-xs text-orange-600 font-bold">$</span>
                    <span className="text-3xl font-black text-orange-600">{currentVariant.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 line-through">${selectedProduct.originalPrice.toFixed(2)}</span>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Select Color: <span className="text-orange-600 font-normal">{selectedColor}</span></label>
                    <div className="flex gap-2">
                      {['Space Black', 'Silver'].map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`text-xs px-3 py-1.5 rounded border transition ${selectedColor === color ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-200 hover:border-gray-400'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-xs font-bold text-gray-700 block mb-1.5">Select Storage: <span className="text-orange-600 font-normal">{selectedStorage}</span></label>
                    <div className="flex gap-2">
                      {['512GB', '1TB'].map(storage => (
                        <button
                          key={storage}
                          onClick={() => setSelectedStorage(storage)}
                          className={`text-xs px-3 py-1.5 rounded border transition ${selectedStorage === storage ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold' : 'border-gray-200 hover:border-gray-400'}`}
                        >
                          {storage}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                      setIsCartOpen(true);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELLER CHAT WIDGET */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col h-96">
          <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="text-xs font-bold">Official Store Support</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:opacity-75">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] text-xs p-2.5 rounded-lg ${msg.sender === 'user' ? 'bg-orange-500 text-white' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-200 bg-white flex gap-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-orange-500"
            />
            <button type="submit" className="bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600 transition">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}