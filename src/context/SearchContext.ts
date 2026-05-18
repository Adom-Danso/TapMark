import { getFavorites } from '@/utils/favourites';
import { SearchData } from '@/utils/search';
import React, { createContext, useContext, useMemo, useState } from 'react';


type SearchContextType = {
  addSearchData: (data: SearchData) => void;
  getSearchData: () => SearchData[] | null;
  clearSearchData: () => void;
}
const SearchContext = createContext<SearchContextType | null>(null);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchData, setSearchData] = useState<SearchData[]>([]);

  React.useEffect(()=>{
    async function loadSearchData() {
      const data = await getSearchData()
      setSearchData(data)
    }
    loadSearchData()
  }, [])

  const addSearchData = (data: SearchData) => {
    setSearchData((prev) => [data, ...prev].slice(0, 5));
  };

  const getSearchData = () => searchData;

  const clearSearchData = () => {
    clearSearchData();
    setSearchData([]);
  };
  

  const value = useMemo(
    () => ({
      addSearchData,
      getSearchData,
      clearSearchData,
    }),
    [searchData]
  );

  return React.createElement(SearchContext.Provider, { value: value as any }, children);
};



export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }

  return context;
};
