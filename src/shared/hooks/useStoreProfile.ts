import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "@/config/store.api";
import { ApiError } from "@/lib/api-client";
import type {
  CreateStoreOpeningHourDto,
  DayOfWeek,
  StoreOpeningHourDto,
  StoreProfileDto,
  UpdateStoreOpeningHourDto,
  UpdateStoreProfileDto,
} from "@shared/types";

// ═════════════════════════════════════════════════════════════════════
// Cache keys
// ═════════════════════════════════════════════════════════════════════

export const STORE_PROFILE_KEY = "storeProfile";
export const STORE_OPENING_HOURS_KEY = [
  STORE_PROFILE_KEY,
  "openingHours",
] as const;

// ═════════════════════════════════════════════════════════════════════
// Empty profile
// ═════════════════════════════════════════════════════════════════════

const EMPTY_PROFILE: StoreProfileDto = {
  id: "",
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  phoneNumber: "",
  email: "",
  logoUrl: "",
  coverImageUrl: "",
  latitude: 0,
  longitude: 0,
  streetAr: "",
  streetEn: "",
  city: "",
  isOpen: false,
  isBusy: false,
  openingTime: "00:00:00",
  closingTime: "23:59:59",
  minimumOrderAmount: 0,
  deliveryFee: 0,
  estimatedPreparationMinutes: 15,
  rating: 0,
  verificationStatus: "Pending",
  approvedTypes: [],
  pendingTypes: [],
};

export type UpdateStoreProfileInput = UpdateStoreProfileDto & {
  /** @deprecated Not in the API schema — ignored server-side. */
  cancelBeforeMinutes?: number;
};

// ═════════════════════════════════════════════════════════════════════
// PROFILE — queries & mutations
// ═════════════════════════════════════════════════════════════════════

export function useStoreProfile() {
  return useQuery<StoreProfileDto>({
    queryKey: [STORE_PROFILE_KEY],
    queryFn: async () => {
      try {
        return await storeApi.profile.get();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return EMPTY_PROFILE;
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateStoreProfile() {
  const queryClient = useQueryClient();

  return useMutation<StoreProfileDto, Error, UpdateStoreProfileInput>({
    mutationFn: (input) => {
      // Strip the legacy field so the wire payload matches the documented
      // UpdateStoreProfileDto schema exactly.
      const { cancelBeforeMinutes: _legacy, ...dto } = input;
      void _legacy;
      return storeApi.profile.update(dto);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<StoreProfileDto>([STORE_PROFILE_KEY], updated);
    },
  });
}

/** PATCH /api/store/profile/open — body { isOpen } */
export function useToggleStoreOpen() {
  const queryClient = useQueryClient();

  return useMutation<StoreProfileDto, Error, boolean>({
    mutationFn: (isOpen) => storeApi.profile.toggleOpen(isOpen),
    onSuccess: (updated) => {
      queryClient.setQueryData<StoreProfileDto>([STORE_PROFILE_KEY], updated);
    },
  });
}

/** Two-step: POST /api/files/upload?category=store-logos → PUT /api/store/profile/logo */
export function useUpdateLogo() {
  const queryClient = useQueryClient();

  return useMutation<StoreProfileDto, Error, File>({
    mutationFn: (file) => storeApi.profile.uploadLogo(file),
    onSuccess: (updated) => {
      queryClient.setQueryData<StoreProfileDto>([STORE_PROFILE_KEY], updated);
    },
  });
}

/** Two-step: POST /api/files/upload?category=store-covers → PUT /api/store/profile/cover */
export function useUpdateCover() {
  const queryClient = useQueryClient();

  return useMutation<StoreProfileDto, Error, File>({
    mutationFn: (file) => storeApi.profile.uploadCover(file),
    onSuccess: (updated) => {
      queryClient.setQueryData<StoreProfileDto>([STORE_PROFILE_KEY], updated);
    },
  });
}

// ═════════════════════════════════════════════════════════════════════
// OPENING HOURS — nested under the profile cache
// ═════════════════════════════════════════════════════════════════════

/** Lowercase day keys used by the UI. */
export const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

/** "sunday" → "Sunday" (for the API). */
export function toApiDay(day: string): DayOfWeek {
  const lower = day.toLowerCase();
  return (lower.charAt(0).toUpperCase() + lower.slice(1)) as DayOfWeek;
}

/** "Sunday" → "sunday" (for the UI). */
export function fromApiDay(day: string): DayKey {
  return day.toLowerCase() as DayKey;
}

/**
 * Normalize an `<input type="time">` value ("HH:mm") into a TimeSpan
 * string ("HH:mm:ss") that the server expects. Passes through anything
 * already in "HH:mm:ss" format.
 */
export function toTimeSpan(value: string): string {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
}

/**
 * The shape accepted by `useSaveStoreOpeningHour`
 */
export interface SaveOpeningHourInput {
  id?: string;
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

/**
 * GET /api/store/opening-hours
 */
export function useStoreOpeningHours() {
  return useQuery<StoreOpeningHourDto[]>({
    queryKey: STORE_OPENING_HOURS_KEY,
    queryFn: async () => {
      try {
        return await storeApi.openingHours.list();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Upsert one opening hour
 */
export function useSaveStoreOpeningHour() {
  const queryClient = useQueryClient();

  return useMutation<StoreOpeningHourDto, Error, SaveOpeningHourInput>({
    mutationFn: (input) => {
      const payload = {
        dayOfWeek: toApiDay(input.dayOfWeek),
        openingTime: toTimeSpan(input.openingTime),
        closingTime: toTimeSpan(input.closingTime),
        isActive: input.isActive,
      };

      return input.id
        ? storeApi.openingHours.update(
            input.id,
            payload as UpdateStoreOpeningHourDto,
          )
        : storeApi.openingHours.create(payload as CreateStoreOpeningHourDto);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<StoreOpeningHourDto[]>(
        STORE_OPENING_HOURS_KEY,
        (prev) => {
          if (!prev) return [saved];
          const idx = prev.findIndex(
            (h) => h.id === saved.id || h.dayOfWeek === saved.dayOfWeek,
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        },
      );
      // Reconcile with the server (picks up any backend-side normalization).
      queryClient.invalidateQueries({ queryKey: STORE_OPENING_HOURS_KEY });
    },
  });
}

/** DELETE /api/store/opening-hours/{id} */
export function useDeleteStoreOpeningHour() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      storeApi.openingHours.remove(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_OPENING_HOURS_KEY });
    },
  });
}