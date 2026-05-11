import { getFavorites } from '@/utils/favourites';
import React, { createContext, useContext, useMemo, useState } from 'react';


type FavoritesContextType = {
  favoriteStores: string[];
  addFavoriteStore: (storeId: string) => void;
  removeFavoriteStore: (storeId: string) => void;
  toggleFavoriteStore: (storeId: string) => void;
  isFavoriteStore: (storeId: string) => boolean;
}
const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);

  React.useEffect(()=>{
    async function loadFavorites() {
      const favorites = await getFavorites()
      setFavoriteStores(favorites)
    }
    loadFavorites()
  }, [])

  const isFavoriteStore = (storeId: string) => favoriteStores.some((item) => item === storeId);

  const addFavoriteStore = (storeId: string) => {
    setFavoriteStores((prev) => {
      if (prev.some((item) => item === storeId)) {
        return prev;
      }

      return [storeId, ...prev];
    });
  };

  const removeFavoriteStore = (storeId: string) => {
    setFavoriteStores((prev) => prev.filter((item) => item !== storeId));
  };

  const toggleFavoriteStore = (storeId: string) => {
    setFavoriteStores((prev) => {
      const exists = prev.some((item) => item === storeId);
      if (exists) {
        return prev.filter((item) => item !== storeId);
      }

      return [storeId, ...prev];
    });
  };

  const value = useMemo(
    () => ({
      favoriteStores,
      addFavoriteStore,
      removeFavoriteStore,
      toggleFavoriteStore,
      isFavoriteStore,
    }),
    [favoriteStores]
  );

  return React.createElement(FavoritesContext.Provider, { value: value as any }, children);
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }

  return context;
};
