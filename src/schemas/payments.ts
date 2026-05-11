import { User } from "./user";

export type MobileMoneyPaymentMethod = {
  id: string;
  type: 'mobile-money';
  accountName: string;
  mobileNumber: string;
  mobileNumberE164: string;
  provider: string;
  country: string;
  currency: string;
  createdAt: number;
  displayLabel: string;
  isDefault: boolean;
};

export type BankPaymentMethod = {
  id: string;
  type: 'bank';
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  branchCode: string;
  country: string;
  currency: string;
  createdAt: number;
  displayLabel: string;
  isDefault: boolean;
};

export type Bank = {
    name: string;
    slug: string;
    code: string;
    longcode: string;
    country: string;
    currency: string;
    type: string;
}
export type PaymentMethodType = MobileMoneyPaymentMethod | BankPaymentMethod;


export type Payment = {
  id: string;
  amount: number;
  transactoinId: string;
  reference: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: string;
  isRefunded: string;
  user: User;
}

type PaymentMetadata = {
  tempOrderId: string;
  userId: string;
  paymentId: string;
}

type PaystackResponseData = {
  id: number;
  reference: string;
  status: string;
  metadata: PaymentMetadata
}

export type PaystackResponse = {
  event: string;
  status: boolean;
  message: string;
  data: PaystackResponseData;
}