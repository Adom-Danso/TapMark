export type OrderVerificationMethod = 'otp' | 'qr';
export type OrderVerificationAction = 'pickup' | 'complete';

export type VerifyOrderActionRequest = {
  orderId: string;
  action: OrderVerificationAction;
  method: OrderVerificationMethod;
  value: string;
};

export type VerifyOrderActionResponse = {
  orderId: string;
  action: OrderVerificationAction;
  method: OrderVerificationMethod;
  verifiedValue: string;
};

const VERIFICATION_DELAY_MS = 1800;

export async function verifyOrderAction({
  orderId,
  action,
  method,
  value,
}: VerifyOrderActionRequest): Promise<VerifyOrderActionResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const trimmedValue = value.trim();

      if (method === 'otp' && !/^\d{6}$/.test(trimmedValue)) {
        reject(new Error('Enter a valid 6-digit OTP code.'));
        return;
      }

      if (method === 'qr' && !trimmedValue) {
        reject(new Error('Scan a valid QR code.'));
        return;
      }

      resolve({
        orderId,
        action,
        method,
        verifiedValue: trimmedValue,
      });
    }, VERIFICATION_DELAY_MS);
  });
}