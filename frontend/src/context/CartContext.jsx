import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // Load cart from local storage on mount or user change
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`cart_${user.id}`);
      if (saved) setCartItems(JSON.parse(saved));
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (medicine, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === medicine.id);
      if (existing) {
        return prev.map(i => i.id === medicine.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...medicine, quantity }];
    });
  };

  const removeFromCart = (medicineId) => {
    setCartItems(prev => prev.filter(i => i.id !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === medicineId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCartItems([]);

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      itemCount: cartItems.length
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
