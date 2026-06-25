import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { placeOrder } from "../api/endpoints";
import toast from "react-hot-toast";

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    
    // Check if any prescription medicine is in cart
    const hasPrescriptionMed = cartItems.some(i => i.requires_prescription);
    if (hasPrescriptionMed) {
      if (!window.confirm("Some items in your cart require a prescription. You will need to present it upon delivery. Do you agree?")) {
        return;
      }
    }

    setLoading(true);
    try {
      const orderData = {
        shipping_address: shippingAddress,
        items: cartItems.map(i => ({ medicine_id: i.id, quantity: i.quantity }))
      };
      await placeOrder(orderData);
      toast.success("Order placed successfully!");
      clearCart();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                  src={item.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80"} 
                  alt={item.name} 
                  className="w-20 h-20 object-cover rounded-xl bg-white"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-800">{item.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-primary-600 font-bold mt-1">₹{item.price.toFixed(2)}</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="space-y-4 mb-6">
              <label className="block text-sm font-medium text-slate-700">Shipping Address</label>
              <textarea 
                className="input-field min-h-[80px]" 
                placeholder="Enter your full delivery address..."
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between text-lg font-bold text-slate-800 mb-6">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
