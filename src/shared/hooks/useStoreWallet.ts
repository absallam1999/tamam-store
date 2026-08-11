import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/config/api";
import type { StoreWalletDto, CreateWithdrawalDto } from "@shared/types";

// ============================================
// Query Keys
// ============================================

export const STORE_WALLET_KEY = "store-wallet";
export const WALLET_REQUESTS_KEY = "wallet-requests";
export const PAYMENT_NUMBERS_KEY = "payment-numbers";

// ============================================
// Types
// ============================================

export interface WalletRequestDto {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  phoneFrom?: string;
  paymentMethod?: string;
  screenshotUrl?: string;
  adminNotes?: string | null;
  processedAt?: string | null;
}

export interface PaymentNumberDto {
  id: string;
  phoneNumber: string;
  paymentMethod: string;
  label: string;
  isActive: boolean;
}

// ============================================
// Helpers
// ============================================

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object") {
    const resp = response as Record<string, unknown>;
    if ("data" in resp) {
      const inner = resp.data as Record<string, unknown>;
      if ("data" in inner) return inner.data as T;
      if ("Data" in inner) return inner.Data as T;
      return inner as T;
    }
    if ("Data" in resp) return resp.Data as T;
  }
  return response as T;
}

function checkApiError(response: any): void {
  const responseData = response?.data || response;
  const isSuccess = responseData?.Success ?? responseData?.success;
  if (isSuccess === false) {
    const message =
      responseData?.Message ||
      responseData?.message ||
      (responseData?.Errors?.[0]) ||
      (responseData?.errors?.[0]) ||
      "An error occurred";
    throw new Error(message);
  }
}

// ============================================
// Hooks
// ============================================

export const useWallet = () => {
  return useQuery<StoreWalletDto>({
    queryKey: [STORE_WALLET_KEY],
    queryFn: async () => {
      const response = await apiClient.get(ENDPOINTS.STORE.WALLET);
      const data = unwrap<any>(response);
      return {
        balance: data?.balance ?? data?.availableBalance ?? data?.walletBalance ?? 0,
        currency: data?.currency ?? "EGP",
        transactions: data?.transactions ?? data?.recentTransactions ?? [],
        pendingWithdrawals: data?.pendingWithdrawals ?? [],
        totalEarnings: data?.totalEarnings ?? data?.balance ?? 0,
      } as StoreWalletDto;
    },
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });
};

export const useWalletRequests = () => {
  return useQuery<WalletRequestDto[]>({
    queryKey: [WALLET_REQUESTS_KEY],
    queryFn: async () => {
      const response = await apiClient.get("/api/wallet/my-requests");
      const data = unwrap<any>(response);
      let requests: any[] = [];
      if (Array.isArray(data)) requests = data;
      else if (data?.items) requests = data.items;
      else if (data?.requests) requests = data.requests;
      return requests.map((r: any) => ({
        id: r.id || "",
        amount: Number(r.amount) || 0,
        status: r.status || "Pending",
        type: "Deposit",
        createdAt: r.createdAt || "",
        phoneFrom: r.phoneFrom || undefined,
        paymentMethod: r.paymentMethod || undefined,
        screenshotUrl: r.screenshotUrl || undefined,
        adminNotes: r.adminNotes || null,
        processedAt: r.processedAt || null,
      })) as WalletRequestDto[];
    },
    staleTime: 30_000,
    refetchOnMount: true,
  });
};

export const usePaymentNumbers = () => {
  return useQuery<PaymentNumberDto[]>({
    queryKey: [PAYMENT_NUMBERS_KEY],
    queryFn: async () => {
      const response = await apiClient.get("/api/wallet/payment-numbers");
      const data = unwrap<any>(response);
      let numbers: any[] = [];
      if (Array.isArray(data)) numbers = data;
      else if (data?.items) numbers = data.items;
      else if (data?.data) numbers = data.data;
      return numbers
        .filter((n: any) => n.isActive === true)
        .map((n: any) => ({
          id: n.id || "",
          phoneNumber: n.phoneNumber || "",
          paymentMethod: n.paymentMethod || "",
          label: n.label || "",
          isActive: n.isActive ?? true,
        })) as PaymentNumberDto[];
    },
    staleTime: 60_000,
    refetchOnMount: true,
  });
};

export const useWithdrawFromWallet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateWithdrawalDto) => {
      const response: any = await apiClient.post(ENDPOINTS.STORE.WALLET_WITHDRAW, dto);
      checkApiError(response);
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_WALLET_KEY] });
      qc.invalidateQueries({ queryKey: [WALLET_REQUESTS_KEY] });
      qc.refetchQueries({ queryKey: [STORE_WALLET_KEY] });
    },
    onError: (error: Error) => {
      console.error("❌ Withdraw failed:", error.message);
    },
  });
};