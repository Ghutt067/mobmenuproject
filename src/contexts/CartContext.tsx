import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  getItemQuantity: (productId: string) => number;
  hasItems: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((productId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === productId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { productId, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === productId);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          // Reduz a quantidade em 1
          return prevItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          // Remove o item completamente quando a quantidade chega a 0
          return prevItems.filter((item) => item.productId !== productId);
        }
      }
      return prevItems;
    });
  }, []);

  // Memoizar getItemQuantity para evitar recriação
  const getItemQuantity = useCallback((productId: string): number => {
    const item = cartItems.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  }, [cartItems]);

  // Memoizar hasItems
  const hasItems = useCallback((): boolean => {
    return cartItems.length > 0;
  }, [cartItems]);

  // Memoizar o valor do context para evitar re-renders desnecessários
  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    getItemQuantity,
    hasItems,
  }), [cartItems, addToCart, removeFromCart, getItemQuantity, hasItems]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

