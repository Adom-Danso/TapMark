import { PaymentMethodType } from "@/schemas/payments"
import * as SecureStore from "expo-secure-store"

export async function savePaymentMethod(paymentMethods: PaymentMethodType[]) {
    await SecureStore.setItemAsync("payment_methods", JSON.stringify(paymentMethods)) 
}

export async function getPaymentMethods() {
    const data = await SecureStore.getItemAsync("payment_methods")
    return data ? JSON.parse(data) as PaymentMethodType[] : []
}


export const normalizePhoneE164 = (raw: string) => {
  if (!raw) return '';
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return `+233${digits.slice(1)}`;
  }
  if (digits.startsWith('233')) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    // assume local without leading zero
    return `+233${digits}`;
  }
  // fallback: prepend plus
  return `+${digits}`;
};

export const formatDisplayLabel = (method: PaymentMethodType) => {
  if (!method || !method.type) return '';

  if (method.type === 'mobile-money') {
    const provider = method.provider || 'MoMo';
    const num = method.mobileNumberE164 || '';
    const last = num.replace(/[^0-9]/g, '').slice(-4);
    return `${provider} •••• ${last}`;
  }

  if (method.type === 'bank') {
    const bank = method.bankName || 'Bank';
    const acc = (method.accountNumber || '').slice(-4);
    return `${bank} •••• ${acc}`;
  }

  return method.displayLabel || '';
};


// Map canonical method -> Paystack-ready fragments (for backend use reference)
export const toPaystackMobileMoneyFragment = (method: PaymentMethodType) => ({
  type: 'mobile_money',
  phone: method.mobileNumberE164,
  provider: method.provider,
});

export const toPaystackBankFragment = (method: PaymentMethodType) => ({
  type: 'bank',
  account_number: method.accountNumber,
  code: method.bankCode,
});

export default {
  normalizePhoneE164,
  formatDisplayLabel,
  toPaystackMobileMoneyFragment,
  toPaystackBankFragment,
};
