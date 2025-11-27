import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SelectedOptions } from '../types/productOptions';

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions?: SelectedOptions; // Opções selecionadas para este item
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, selectedOptions?: SelectedOptions) => void;
  removeFromCart: (productId: string) => void;
  getItemQuantity: (productId: string) => number;
  hasItems: () => boolean;
  updateCartItemOptions: (productId: string, selectedOptions: SelectedOptions) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função auxiliar para comparar opções
function compareOptions(options1?: SelectedOptions, options2?: SelectedOptions): boolean {
  const opts1 = options1 || {};
  const opts2 = options2 || {};
  
  const keys1 = Object.keys(opts1).sort();
  const keys2 = Object.keys(opts2).sort();
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every((key) => {
    const values1 = (opts1[key] || []).sort();
    const values2 = (opts2[key] || []).sort();
    return values1.length === values2.length &&
           values1.every((val, idx) => val === values2[idx]);
  });
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((productId: string, selectedOptions?: SelectedOptions) => {
    setCartItems((prevItems) => {
      // Verificar se já existe um item com o mesmo produto e as mesmas opções
      const existingItemIndex = prevItems.findIndex((item) => {
        if (item.productId !== productId) return false;
        return compareOptions(item.selectedOptions, selectedOptions);
      });

      if (existingItemIndex !== -1) {
        // Se já existe com as mesmas opções, aumenta a quantidade
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Adiciona novo item com as opções
        return [...prevItems, { productId, quantity: 1, selectedOptions }];
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

  const updateCartItemOptions = useCallback((productId: string, selectedOptions: SelectedOptions) => {
    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item.productId === productId
          ? { ...item, selectedOptions }
          : item
      );
    });
  }, []);

  // Memoizar o valor do context para evitar re-renders desnecessários
  const contextValue = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    getItemQuantity,
    hasItems,
    updateCartItemOptions,
  }), [cartItems, addToCart, removeFromCart, getItemQuantity, hasItems, updateCartItemOptions]);

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

