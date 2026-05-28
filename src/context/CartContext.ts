import { addOneCartItem } from '@/functions/cart-items/add-one-cart-item';
import { deleteOneCartItem } from '@/functions/cart-items/delete-one-cart-item';
import { getOneCartItemById } from '@/functions/cart-items/get-one-cart-item-by-id';
import { updateOneCartItem } from '@/functions/cart-items/update-cart-item-by-id';
import { addOneCart } from '@/functions/cart/add-one-cart';
import { getOneCartById } from '@/functions/cart/get-one-cart-by-id';
import { CartItem, CartItemAddition } from '@/schemas/cart-items';
import { getActiveCartId, saveActiveCartId } from '@/utils/cart';
import { showToast } from '@/utils/notifications';
import { generateImageUrl } from '@/utils/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useMemo, useState } from 'react';



export type CartLineType = {
  cartLineId: string,
  qty: number,
  itemId: string,
  title: string,
  lineUnitPrice: number,
  lineTotal: number,
  note: string,
  isSoldPerUnit: boolean,
  imageUri: string,
  storeId: string,
  selectedExtras: CartItemAddition[],
  basePrice: number,
  itemAmount: number,
  createdAt: string
}

type CartContextType = {
  cartLines: CartLineType[];
  subtotal: number;
  activeCartId: string | null;
  totalItems: number;
  addCartLine: (payload: any) => void;
  updateCartLineQty: (cartLineId: string, delta: number) => void;
  updateCartLine: (cartLineId: string, patch?: any) => void;
  updateCartLineExtras: (cartLineId: string, newSelectedExtras?: any[], newNote?: string) => void;
  removeCartLine: (cartLineId: string) => void;
  updateCartLineItemAmount: (cartLineId: string, amount: number) => void;
  clearCart: () => void;
  parseMoney: (value: any) => number;
  refreshCart: ()=>void;
  isLoading: boolean;
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

const buildCartLine = (payload: CartItem): CartLineType => {
  const qty = clampInt(payload.quantity, 1);
  const basePrice = parseMoney(!payload.storeItem.isSoldPerUnit ? payload.itemAmount : payload.storeItem.price * payload.quantity);
  const extrasTotal = calculateExtrasTotal(payload.additions || []);
  const lineUnitPrice = basePrice + extrasTotal;

  return {
    cartLineId: payload.id,
    itemId: payload.storeItem.id || 'item',
    storeId: payload.storeItem.storeId || 'store',
    title: payload.storeItem.name || 'Item',
    imageUri: generateImageUrl(payload.storeItem.photo?.fileStoragePath || ''),
    basePrice,
    selectedExtras: payload.additions || [],
    note: normalizeNote(payload.note as string),
    isSoldPerUnit: payload.storeItem.isSoldPerUnit,
    qty,
    lineUnitPrice,
    itemAmount: payload.itemAmount,
    lineTotal: lineUnitPrice,
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
  const [cartLines, setCartLines] = useState<CartLineType[]>([]);
  const [activeCartId, setActiveCartId] = useState<string | null>(null);

  async function fetchActiveCart() {
    const _activeCartId = await getActiveCartId();

    if (!_activeCartId || _activeCartId === 'undefined' || _activeCartId === 'null') {
      const newCartResponse = await addOneCart();
      await saveActiveCartId(newCartResponse.data.id);
      setActiveCartId(newCartResponse.data.id);
      return (await getOneCartById(newCartResponse.data.id));
    }

    try {
      const response = await getOneCartById(_activeCartId as string);

      if (response.data.isOrderCompleted) {
        const newCartResponse = await addOneCart();
        await saveActiveCartId(newCartResponse.data.id);
        setActiveCartId(newCartResponse.data.id);
        return (await getOneCartById(newCartResponse.data.id))
      }

      setActiveCartId(_activeCartId);
      return response.data;
    } catch (error: any) {

      if (error.statusCode === 404) {
        const newCartResponse = await addOneCart();
        await saveActiveCartId(newCartResponse.data.id);
        setActiveCartId(newCartResponse.data.id);
        return (await getOneCartById(newCartResponse.data.id));
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

  // Aggregate all cart operation loading states
  const updateCartItemMutation = useMutation({
    mutationKey: ['updateCartItem'],
    mutationFn: async (payload: { id: string, updates: Partial<CartItem> }) => {
      const response = await updateOneCartItem(payload.id, payload.updates);
      return response.data;
    },
    onSuccess: (data) => {
      try {
        fetchCartQuery.refetch()
      } catch (err) {
        // fallback: show success toast anyway
      }
      showToast('success', 'Item updated', 'Your cart item has been updated successfully.');
    },
    onError: (error) => {
      showToast("error", "Update Failed", error.message || "An error occurred while updating your cart item. Please try again.");
    }
  })

  const refreshCart = () => {
    fetchCartQuery.refetch()
  }

  const isAdding = addCartItemMutation.isPending || false;
  const isRemoving = removeCartItemMutation.isPending || false;
  const isLoading = fetchCartQuery.isLoading || updateCartItemMutation.isPending || isAdding || isRemoving;

  const addCartLine = (payload: any) => {
    if (!activeCartId) {
      refreshCart();
    }

    for (let i = 0; i < (payload.packageQty || 1); i++) {
      addCartItemMutation.mutate(payload);
    }
  };

  const updateCartLineQty = (cartLineId: string, delta: number) => {
    const lineToUpdate = cartLines.find(value => value.cartLineId == cartLineId)
    if (lineToUpdate) {
      updateCartItemMutation.mutate({ id: cartLineId, updates: { quantity: lineToUpdate.qty + delta } })
    }
    // setCartLines((prev) =>
    //   prev.map((line) =>
    //     line.cartLineId === cartLineId ? recalcLine({ ...line, qty: line.qty + delta }) : line
    //   )
    // );
  };
  const updateCartLineItemAmount = (cartLineId: string, amount: number) => {
    const lineToUpdate = cartLines.find(value => value.cartLineId == cartLineId)
    if (lineToUpdate) {
      updateCartItemMutation.mutate({ id: cartLineId, updates: { itemAmount: amount } })
    }

    // setCartLines((prev) =>
    //   prev.map((line) =>
    //     line.cartLineId === cartLineId ? recalcLine({ ...line, qty: line.qty + delta }) : line
    //   )
    // );
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
      updateCartLineItemAmount,
      updateCartLine,
      updateCartLineExtras,
      removeCartLine,
      clearCart,
      parseMoney,
      isLoading,
      refreshCart,
    }),
    [cartLines, subtotal, totalItems, isAdding, isLoading]
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
