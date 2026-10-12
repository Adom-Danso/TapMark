import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CartProvider, useCart } from '@/context/CartContext';
import { addOneCart } from '@/functions/cart/add-one-cart';
import { getOneCartById } from '@/functions/cart/get-one-cart-by-id';
import { addOneCartItem } from '@/functions/cart-items/add-one-cart-item';
import { getOneCartItemById } from '@/functions/cart-items/get-one-cart-item-by-id';
import { updateOneCartItem } from '@/functions/cart-items/update-cart-item-by-id';
import { deleteOneCartItem } from '@/functions/cart-items/delete-one-cart-item';
import * as SecureStore from 'expo-secure-store';

jest.mock('@/functions/cart/add-one-cart');
jest.mock('@/functions/cart/get-one-cart-by-id');
jest.mock('@/functions/cart-items/add-one-cart-item');
jest.mock('@/functions/cart-items/get-one-cart-item-by-id');
jest.mock('@/functions/cart-items/delete-one-cart-item');
jest.mock('@/functions/cart-items/update-cart-item-by-id');
jest.mock('@/utils/notifications', () => ({ showToast: jest.fn() }));

const addOneCartMock = addOneCart as jest.Mock;
const getOneCartByIdMock = getOneCartById as jest.Mock;
const addOneCartItemMock = addOneCartItem as jest.Mock;
const getOneCartItemByIdMock = getOneCartItemById as jest.Mock;
const updateOneCartItemMock = updateOneCartItem as jest.Mock;
const deleteOneCartItemMock = deleteOneCartItem as jest.Mock;

function makeCart(id: string, items: any[] = [], completed = false) {
  return {
    data: {
      id,
      userId: 'user-1',
      isDeleted: false,
      isOrderCompleted: completed,
      cartItems: items,
    },
  };
}

function makeLine(id: string, cartId: string) {
  return {
    id,
    cartId,
    quantity: 1,
    itemAmount: 5,
    additions: [],
    note: null,
    storeItem: {
      id: 'store-item-1',
      name: 'Item',
      storeId: 'store-1',
      isSoldPerUnit: true,
      price: 5,
      photo: null,
    },
  };
}

let client: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <CartProvider>{children}</CartProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (SecureStore as unknown as { __store?: Map<string, string> }).__store?.clear();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  getOneCartItemByIdMock.mockImplementation(async (id: string) => ({ data: makeLine(id, 'cart') }));
  updateOneCartItemMock.mockResolvedValue({ data: {} });
  deleteOneCartItemMock.mockResolvedValue({ data: { id: 'x' } });
});

describe('CartContext cart reset', () => {
  it('resetCart clears state and adopts a brand new cart', async () => {
    let counter = 0;
    addOneCartMock.mockImplementation(async () => {
      counter += 1;
      return makeCart(`cart-${counter}`);
    });
    getOneCartByIdMock.mockImplementation(async (id: string) => makeCart(id));

    const { result } = await renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.activeCartId).toBe('cart-1'));

    await act(async () => {
      await result.current.resetCart();
    });

    await waitFor(() => expect(result.current.activeCartId).toBe('cart-2'));
    expect(result.current.cartLines).toEqual([]);
  });

  it('addCartLine after a reset writes to the new cart id', async () => {
    let counter = 0;
    addOneCartMock.mockImplementation(async () => {
      counter += 1;
      return makeCart(`cart-${counter}`);
    });
    getOneCartByIdMock.mockImplementation(async (id: string) => makeCart(id));

    const { result } = await renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.activeCartId).toBe('cart-1'));

    await act(async () => {
      await result.current.resetCart();
    });
    await waitFor(() => expect(result.current.activeCartId).toBe('cart-2'));

    addOneCartItemMock.mockResolvedValue({ data: { id: 'line-1' } });

    await act(async () => {
      result.current.addCartLine({ storeItemId: 'store-item-1', quantity: 1, itemAmount: 5 });
    });

    await waitFor(() => expect(addOneCartItemMock).toHaveBeenCalledTimes(1));
    expect(addOneCartItemMock.mock.calls[0][0].cartId).toBe('cart-2');
  });

  it('starting from a completed cart creates a fresh one', async () => {
    addOneCartMock.mockResolvedValue(makeCart('cart-fresh'));
    getOneCartByIdMock.mockResolvedValue(makeCart('cart-old', [], true));

    const { result } = await renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.activeCartId).toBe('cart-fresh'));
    expect(result.current.cartLines).toEqual([]);
  });
});
