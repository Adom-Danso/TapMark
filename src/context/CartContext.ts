import { addOneCartItem } from '@/functions/cart-items/add-one-cart-item';
import { deleteOneCartItem } from '@/functions/cart-items/delete-one-cart-item';
import { getOneCartItemById } from '@/functions/cart-items/get-one-cart-item-by-id';
import { addOneCart } from '@/functions/cart/add-one-cart';
import { getOneCartById } from '@/functions/cart/get-one-cart-by-id';
import { CartItem, CartItemAddition } from '@/schemas/cart-items';
import { StoreItemExtra } from '@/schemas/store-item-extras';
import { getActiveCartId, saveActiveCartId } from '@/utils/cart';
import { showToast } from '@/utils/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { set } from 'zod';

type CartContextType = {
  cartLines: any[];
  subtotal: number;
  activeCartId: string | null;
  totalItems: number;
  addCartLine: (payload: any) => void;
  updateCartLineQty: (cartLineId: string, delta: number) => void;
  updateCartLine: (cartLineId: string, patch?: any) => void;
  updateCartLineExtras: (cartLineId: string, newSelectedExtras?: any[], newNote?: string) => void;
  removeCartLine: (cartLineId: string) => void;
  clearCart: () => void;
  parseMoney: (value: any) => number;
  isAdding: boolean;
  isRemoving: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

const parseMoney = (value: any) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clampInt = (value: any, min = 1) => {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return min;
  }
  return Math.max(min, parsed);
};

const normalizeNote = (note: string) => (typeof note === 'string' ? note.trim().slice(0, 160) : '');



const calculateExtrasTotal = (selectedExtras: CartItemAddition[]) =>
  selectedExtras.reduce(
    (sum, extra) =>
      sum + (extra.pricingMode === 'open_amount' ? parseMoney(extra.amount) : parseMoney(extra.unitPrice) * extra.quantity!),
    0
  );

const buildCartLine = (payload: CartItem) => {
  const qty = clampInt(payload.quantity, 1);
  const basePrice = parseMoney(payload.storeItem.isSoldPerUnit ? payload.itemAmount : payload.storeItem.price * payload.quantity);
  const extrasTotal = calculateExtrasTotal(payload.additions || []);
  const lineUnitPrice = basePrice + extrasTotal;

  return {
    cartLineId: payload.id,
    itemId: payload.storeItem.id || 'item',
    storeId: payload.storeItem.storeId || 'store',
    title: payload.storeItem.name || 'Item',
    imageUri: `${process.env.EXPO_PUBLIC_BACKEND_URL}${payload.storeItem.photo?.fileStoragePath || ''}`,
    basePrice,
    selectedExtras: payload.additions || [],
    note: normalizeNote(payload.note as string),
    qty,
    lineUnitPrice,
    lineTotal: lineUnitPrice * qty,
    createdAt: payload.createdAt,
  };
};

const recalcLine = (line: any) => {
  const qty = clampInt(line.qty, 1);
  return {
    ...line,
    qty,
    lineTotal: line.lineUnitPrice * qty,
  };
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartLines, setCartLines] = useState<any[]>([]);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);

  async function fetchActiveCart() {
    const activeCartId = await getActiveCartId();
    if (!activeCartId || activeCartId === 'undefined' || activeCartId === 'null') {
      const newCartResponse = await addOneCart();
      await saveActiveCartId(newCartResponse.data.id);
      setActiveCartId(newCartResponse.data.id);
    }

    try {
      const response = await getOneCartById(activeCartId);
      if (response.data.isOrderCompleted) {
        const newCartResponse = await addOneCart();
        await saveActiveCartId(newCartResponse.data.id);
        setActiveCartId(newCartResponse.data.id);
        const response = await getOneCartById(activeCartId);
        return response.data
      }
      setActiveCartId(activeCartId);
      return response.data;
    } catch (error: any) {

      if (error.statusCode === 404) {
        const newCartResponse = await addOneCart();
        await saveActiveCartId(newCartResponse.data.id);
        setActiveCartId(newCartResponse.data.id);
        const response = await getOneCartById(activeCartId);
        return response.data;
      }

      showToast("error", error.message || "Failed to load cart");
    }
  }
  const fetchCartQuery = useQuery({
    queryKey: ['fetchActiveCart'],
    queryFn: fetchActiveCart,
  })
  React.useEffect(() => {
    if (fetchCartQuery.data && fetchCartQuery.status === "success") {
      const cartItems = fetchCartQuery.data.cartItems || [];
      setCartLines(cartItems.map(buildCartLine));
    }
  }, [fetchCartQuery.data, fetchCartQuery.status]);

  const addCartItemMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!activeCartId) {
        throw new Error('No active cart');
      }

      const _response = await addOneCartItem({
        cartId: activeCartId,
        storeItemId: payload.itemId || payload.storeItemId,
        quantity: payload.quantity ?? payload.qty,
        itemAmount: payload.itemAmount ?? payload.basePrice ?? undefined,
        additions: payload.selectedExtras,
      });

      const response = await getOneCartItemById(_response.data.id);
      return response.data;
    },
    onSuccess: (data) => {
      const nextLine = buildCartLine(data);
      setCartLines((prev) => [nextLine, ...prev]);
    },
    onError: (error: any) => {
      showToast('error', error.message || 'Failed to add item to cart');
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      const _response = await deleteOneCartItem(cartItemId);
      return _response.data;
    },

    onSuccess: (data) => {
      setCartLines((prev) => prev.filter((line) => line.cartLineId !== data.id));
    },

    onError: (error: any) => {
      showToast('error', error.message || 'Failed to remove item from cart');
    }
  });

  const isAdding = (addCartItemMutation as any).isLoading || false;
  const isRemoving = (removeCartItemMutation as any).isLoading || false;

  const addCartLine = (payload: any) => {
    if (!activeCartId) {
      showToast('error', 'Cart not ready. Please try again.');
      return;
    }

    addCartItemMutation.mutate(payload);
  };

  const updateCartLineQty = (cartLineId: string, delta: number) => {
    setCartLines((prev) =>
      prev.map((line) =>
        line.cartLineId === cartLineId ? recalcLine({ ...line, qty: line.qty + delta }) : line
      )
    );
  };

  const removeCartLine = (cartLineId: string) => {
    removeCartItemMutation.mutate(cartLineId);
  };

  const updateCartLine = (cartLineId: string, patch: any = {}) => {
    setCartLines((prev) =>
      prev.map((line) => {
        if (line.cartLineId !== cartLineId) return line;

        const newSelectedExtras = patch.selectedExtras !== undefined ? patch.selectedExtras : line.selectedExtras;
        const newNote = patch.note !== undefined ? normalizeNote(patch.note) : line.note;
        const newBasePrice = patch.basePrice !== undefined ? parseMoney(patch.basePrice) : line.basePrice;

        const extrasTotal = calculateExtrasTotal(newSelectedExtras);
        const lineUnitPrice = newBasePrice + extrasTotal;
        const qty = clampInt(patch.qty !== undefined ? patch.qty : line.qty, 1);

        return {
          ...line,
          selectedExtras: newSelectedExtras,
          note: newNote,
          basePrice: newBasePrice,
          lineUnitPrice,
          qty,
          lineTotal: lineUnitPrice * qty,
        };
      })
    );
  };

  const updateCartLineExtras = (cartLineId: string, newSelectedExtras = [], newNote = '') => {
    updateCartLine(cartLineId, { selectedExtras: newSelectedExtras, note: newNote });
  };

  const clearCart = () => {
    setCartLines([]);
  };

  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines]
  );

  const totalItems = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines]
  );

  const value = useMemo(
    () => ({
      cartLines,
      subtotal,
      totalItems,
      activeCartId,
      addCartLine,
      updateCartLineQty,
      updateCartLine,
      updateCartLineExtras,
      removeCartLine,
      clearCart,
      parseMoney,
      isAdding,
      isRemoving,
    }),
    [cartLines, subtotal, totalItems, isAdding, isRemoving]
  );

  return React.createElement(CartContext.Provider, { value: value as any }, children);
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
