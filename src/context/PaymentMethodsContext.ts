import React, { createContext, useContext, useState } from 'react';
import { normalizePhoneE164, formatDisplayLabel } from '@/utils/payment-methods';
import { PaymentMethodType } from '@/schemas/payments';
import { getPaymentMethods, savePaymentMethod } from '@/utils/payment-methods';


type PaymentMethodsContextType = {
  paymentMethods: PaymentMethodType[];
  setDefaultPaymentMethod: (methodId: string) => void;
  addPaymentMethod: (methodObj: PaymentMethodType) => void;
  removePaymentMethod: (methodId: string) => void;
}
const PaymentMethodsContext = createContext<PaymentMethodsContextType | null>(null);


export const PaymentMethodsProvider = ({ children }: { children: React.ReactNode }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);

  React.useEffect(()=>{
    async function loadPaymentMethods() {
      const methods = await getPaymentMethods()
      setPaymentMethods(methods)
    }
    loadPaymentMethods()
  }, [])

  const setDefaultPaymentMethod = (methodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({ ...method, isDefault: method.id === methodId }))
    );
  };

  const addPaymentMethod = (methodObj: PaymentMethodType) => {
    const id = `pm-${Date.now()}`;
    const base = {
      id,
      country: 'GH',
      currency: 'GHS',
      createdAt: Date.now(),
    };

    const nextMethod = (() => {
      if (methodObj.type === 'mobile-money') {
        return {
          ...base,
          type: 'mobile-money',
          accountName: (methodObj.accountName || '').trim(),
          mobileNumberE164: normalizePhoneE164(methodObj.mobileNumber || methodObj.mobileNumberE164),
          mobileNumber: methodObj.mobileNumber || methodObj.mobileNumberE164,
          provider: methodObj.provider,
        };
      }

      if (methodObj.type === 'bank') {
        return {
          ...base,
          type: 'bank',
          accountName: (methodObj.accountName || '').trim(),
          accountNumber: (methodObj.accountNumber || '').replace(/[^0-9]/g, ''),
          bankName: methodObj.bankName,
          bankCode: methodObj.bankCode,
          branchCode: methodObj.branchCode || '',
        };
      }

      return { ...base, ...methodObj };
    })();

    nextMethod.displayLabel = formatDisplayLabel(nextMethod);
    const newPaymentMethods = [...paymentMethods, {...nextMethod, isDefault: paymentMethods.length === 0}];
    setPaymentMethods(newPaymentMethods);

    // save to storage for persistence
    savePaymentMethod(newPaymentMethods);
  };

  const removePaymentMethod = (methodId: string) => {
    const target = paymentMethods.find((method) => method.id === methodId);
    if (!target) {
      return ;
    }

    const next = paymentMethods.filter((method) => method.id !== methodId);
    if (target.isDefault && next.length > 0) {
      next[0].isDefault = true;
    }
    setPaymentMethods(next);
    // save to storage for persistence
    savePaymentMethod(next);
  };

  const value = {
    paymentMethods,
    setDefaultPaymentMethod,
    addPaymentMethod,
    removePaymentMethod,
  };

  return React.createElement(PaymentMethodsContext.Provider, { value: value as any }, children);
};

export const usePaymentMethods = () => {
  const context = useContext(PaymentMethodsContext);
  if (!context) {
    throw new Error('usePaymentMethods must be used within PaymentMethodsProvider');
  }
  return context;
};
