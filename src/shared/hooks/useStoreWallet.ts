import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import type {
  PagedResult,
  PaymentNumberDto,
  RequestWithdrawalDto,
  SubmitTopUpRequestDto,
  TopUpFilterDto,
  TopUpRequestDto,
  WalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  WithdrawalStatus,
} from "@shared/types";

// ============================================
// Query Keys
// ============================================

export const STORE_WALLET_KEY = "store-wallet";
export const WALLET_WITHDRAWALS_KEY = "wallet-withdrawals";
export const WALLET_TRANSACTIONS_KEY = "wallet-transactions";
export const WALLET_TOPUPS_KEY = "wallet-topups";
export const WALLET_PAYMENT_NUMBERS_KEY = "wallet-payment-numbers";

// ============================================
// Filters
// ============================================

export interface WithdrawalFilters {
  status?: WithdrawalStatus | string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface TransactionFilters {
  type?: string;
  orderId?: string;
  from?: string;
  to?: string;
  pageIndex?: number;
  pageSize?: number;
}

// ============================================
// WALLET SUMMARY — GET /api/wallet
// ============================================

export function useWallet() {
  return useQuery<WalletSummaryDto>({
    queryKey: [STORE_WALLET_KEY],
    queryFn: () => storeApi.wallet.get(),
    staleTime: 30_000,
    refetchOnMount: true,
    retry: 2,
  });
}

// ============================================
// TRANSACTIONS — GET /api/wallet/transactions
// ============================================

export function useWalletTransactions(filters?: TransactionFilters) {
  return useQuery<PagedResult<WalletTransactionDto>>({
    queryKey: [WALLET_TRANSACTIONS_KEY, filters ?? {}],
    queryFn: () => storeApi.wallet.transactions(filters),
    staleTime: 30_000,
  });
}

export function useWalletTransaction(id: string) {
  return useQuery<WalletTransactionDto>({
    queryKey: [WALLET_TRANSACTIONS_KEY, "detail", id],
    queryFn: () => storeApi.wallet.transaction(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ============================================
// WITHDRAWALS — GET /api/wallet/withdrawals
// ============================================

export function useWithdrawals(filters?: WithdrawalFilters) {
  return useQuery<PagedResult<WithdrawalDto>>({
    queryKey: [WALLET_WITHDRAWALS_KEY, filters ?? {}],
    queryFn: () => storeApi.wallet.withdrawals(filters),
    staleTime: 30_000,
    refetchOnMount: true,
  });
}

export const useWalletRequests = useWithdrawals;

export function useRequestWithdrawal() {
  const qc = useQueryClient();

  return useMutation<WithdrawalDto, Error, RequestWithdrawalDto>({
    mutationFn: (dto) => storeApi.wallet.requestWithdrawal(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_WALLET_KEY] });
      qc.invalidateQueries({ queryKey: [WALLET_WITHDRAWALS_KEY] });
      qc.invalidateQueries({ queryKey: [WALLET_TRANSACTIONS_KEY] });
    },
  });
}

export const useWithdrawFromWallet = useRequestWithdrawal;

export function useCancelWithdrawal() {
  const qc = useQueryClient();

  return useMutation<WithdrawalDto, Error, string>({
    mutationFn: (id) => storeApi.wallet.cancelWithdrawal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORE_WALLET_KEY] });
      qc.invalidateQueries({ queryKey: [WALLET_WITHDRAWALS_KEY] });
    },
  });
}

// ============================================
// TOP-UP / DEPOSIT
// ============================================

export function usePaymentNumbers() {
  return useQuery<PaymentNumberDto[]>({
    queryKey: [WALLET_PAYMENT_NUMBERS_KEY],
    queryFn: () => storeApi.wallet.getPaymentNumbers(),
    staleTime: 5 * 60_000,
  });
}

export function useSubmitTopUp() {
  const qc = useQueryClient();

  return useMutation<TopUpRequestDto, Error, SubmitTopUpRequestDto>({
    mutationFn: (dto) => storeApi.wallet.submitTopUp(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [WALLET_TOPUPS_KEY] });
    },
  });
}

export function useMyTopUps(filters?: TopUpFilterDto) {
  return useQuery<PagedResult<TopUpRequestDto>>({
    queryKey: [WALLET_TOPUPS_KEY, filters ?? {}],
    queryFn: () => storeApi.wallet.getTopUps(filters),
    staleTime: 30_000,
    refetchOnMount: true,
    refetchInterval: (query) => {
      const page = query.state.data as PagedResult<TopUpRequestDto> | undefined;
      const hasPending = page?.items?.some((t) => t.status === "Pending") ?? false;
      return hasPending ? 30_000 : false;
    },
  });
}

export function useTopUpStatus(id: string | undefined) {
  return useQuery<TopUpRequestDto>({
    queryKey: [WALLET_TOPUPS_KEY, "detail", id ?? ""],
    queryFn: () => storeApi.wallet.getTopUpById(id!),
    enabled: !!id,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const data = query.state.data as TopUpRequestDto | undefined;
      return data?.status === "Pending" ? 30_000 : false;
    },
  });
}

// ============================================
// Re-exports
// ============================================

export type {
  PaymentNumberDto,
  RequestWithdrawalDto,
  SubmitTopUpRequestDto,
  TopUpFilterDto,
  TopUpRequestDto,
  WalletSummaryDto,
  WalletTransactionDto,
  WithdrawalDto,
  WithdrawalStatus,
};