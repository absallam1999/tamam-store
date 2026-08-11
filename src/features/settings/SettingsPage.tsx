import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useToast } from "@shared/components/Toaster";
import {
  useTheme,
  type AccentColor,
  type ThemeMode,
} from "@app/providers/ThemeProvider";
import {
  useStoreProfile,
  useUpdateStoreProfile,
  useUpdateLogo,
  useUpdateCover,
} from "@shared/hooks/useStoreProfile";
import {
  useStoreTypes,
  useAvailableStoreTypes,
  useAddStoreType,
  useRemoveStoreType,
} from "@shared/hooks/useStoreTypes";
import { cn } from "@shared/utils/cn";
import type { UpdateStoreProfileDto } from "@shared/types";
import { useStore } from "@/app/providers/StoreProvider";

// ============================================
// Types
// ============================================

interface StoreProfileForm {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  email: string;
  streetAr: string;
  streetEn: string;
  cityId: string;
  city: string;
  latitude: number;
  longitude: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedPreparationMinutes: number;
  cancelBeforeMinutes: number;
}

interface WorkingHourForm {
  id?: string;
  dayOfWeek: string;
  dayAr: string;
  dayEn: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

// ============================================
// Translations
// ============================================

const t = {
  title: { ar: "الإعدادات", en: "Settings" },
  subtitle: {
    ar: "إدارة إعدادات متجرك وتفضيلاته",
    en: "Manage your store settings and preferences",
  },
  tabProfile: { ar: "الملف التعريفي", en: "Profile" },
  tabHours: { ar: "ساعات العمل", en: "Working Hours" },
  tabAppearance: { ar: "المظهر", en: "Appearance" },
  tabImages: { ar: "الصور", en: "Images" },
  profileTitle: { ar: "الملف التعريفي للمتجر", en: "Store Profile" },
  profileDesc: {
    ar: "تحديث معلومات متجرك الأساسية وبيانات الاتصال",
    en: "Update your store information and contact details",
  },
  hoursTitle: { ar: "ساعات العمل", en: "Working Hours" },
  hoursDesc: {
    ar: "حدد أوقات عمل متجرك لكل يوم من أيام الأسبوع",
    en: "Set your store operating hours for each day",
  },
  appearanceTitle: { ar: "المظهر", en: "Appearance" },
  appearanceDesc: {
    ar: "تخصيص مظهر لوحة التحكم حسب تفضيلاتك",
    en: "Customize your dashboard appearance",
  },
  imagesTitle: { ar: "صور المتجر", en: "Store Images" },
  imagesDesc: {
    ar: "تحديث شعار وصورة غلاف متجرك",
    en: "Update your store logo and cover image",
  },
  storeNameAr: { ar: "اسم المتجر (عربي)", en: "Store Name (Arabic)" },
  storeNameEn: { ar: "اسم المتجر (إنجليزي)", en: "Store Name (English)" },
  email: { ar: "البريد الإلكتروني", en: "Email Address" },
  descriptionAr: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
  descriptionEn: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
  streetAr: { ar: "الشارع (عربي)", en: "Street (Arabic)" },
  streetEn: { ar: "الشارع (إنجليزي)", en: "Street (English)" },
  city: { ar: "المدينة", en: "City" },
  latitude: { ar: "خط العرض", en: "Latitude" },
  longitude: { ar: "خط الطول", en: "Longitude" },
  minimumOrderAmount: { ar: "الحد الأدنى للطلب", en: "Minimum Order Amount" },
  deliveryFee: { ar: "رسوم التوصيل", en: "Delivery Fee" },
  estimatedPreparationMinutes: {
    ar: "وقت التحضير (دقيقة)",
    en: "Preparation Time (min)",
  },
  cancelBeforeMinutes: { ar: "الإلغاء قبل (دقيقة)", en: "Cancel Before (min)" },
  closed: { ar: "مغلق", en: "Closed" },
  to: { ar: "إلى", en: "to" },
  openingTime: { ar: "وقت الفتح", en: "Opening Time" },
  closingTime: { ar: "وقت الإغلاق", en: "Closing Time" },
  themeSection: { ar: "المظهر", en: "Theme" },
  themeLight: { ar: "فاتح", en: "Light" },
  themeDark: { ar: "داكن", en: "Dark" },
  themeSystem: { ar: "النظام", en: "System" },
  accentSection: { ar: "لون التمييز", en: "Accent Color" },
  changeAccent: { ar: "تغيير اللون إلى", en: "Change color to" },
  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes" },
  saving: { ar: "جاري الحفظ...", en: "Saving..." },
  saveSuccess: {
    ar: "تم حفظ الإعدادات بنجاح",
    en: "Settings saved successfully",
  },
  saveError: { ar: "فشل حفظ الإعدادات", en: "Failed to save settings" },
  logo: { ar: "شعار المتجر", en: "Store Logo" },
  cover: { ar: "صورة الغلاف", en: "Cover Image" },
  uploadLogo: { ar: "رفع شعار", en: "Upload Logo" },
  uploadCover: { ar: "رفع غلاف", en: "Upload Cover" },
  changeLogo: { ar: "تغيير الشعار", en: "Change Logo" },
  changeCover: { ar: "تغيير الغلاف", en: "Change Cover" },
  uploadSuccess: {
    ar: "تم رفع الصورة بنجاح",
    en: "Image uploaded successfully",
  },
  uploadError: { ar: "فشل رفع الصورة", en: "Failed to upload image" },
  imageTypeError: {
    ar: "يرجى اختيار صورة بصيغة JPEG, PNG, WebP أو GIF",
    en: "Please select a JPEG, PNG, WebP or GIF image",
  },
  imageSizeError: {
    ar: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
    en: "Image size must be less than 5MB",
  },
  optional: { ar: "اختياري", en: "Optional" },
  phone: { ar: "رقم الهاتف", en: "Phone Number" },
  days: {
    sunday: { ar: "الأحد", en: "Sunday" },
    monday: { ar: "الإثنين", en: "Monday" },
    tuesday: { ar: "الثلاثاء", en: "Tuesday" },
    wednesday: { ar: "الأربعاء", en: "Wednesday" },
    thursday: { ar: "الخميس", en: "Thursday" },
    friday: { ar: "الجمعة", en: "Friday" },
    saturday: { ar: "السبت", en: "Saturday" },
  },
  tabStoreTypes: { ar: "أنواع المتجر", en: "Store Types" },
  storeTypesTitle: { ar: "أنواع المتجر", en: "Store Types" },
  storeTypesDesc: {
    ar: "إدارة أنواع المتجر المعتمدة لمتجرك",
    en: "Manage your store's approved types",
  },
  approvedTypes: { ar: "الأنواع المعتمدة", en: "Approved Types" },
  pendingTypes: { ar: "الأنواع قيد المراجعة", en: "Pending Types" },
  noApprovedTypes: {
    ar: "لا توجد أنواع معتمدة للمتجر",
    en: "No approved store types",
  },
  noPendingTypes: {
    ar: "لا توجد أنواع قيد المراجعة",
    en: "No pending store types",
  },
  addStoreType: { ar: "إضافة نوع", en: "Add Type" },
  removeStoreType: { ar: "إزالة", en: "Remove" },
  typeAdded: {
    ar: "تم إضافة نوع المتجر بنجاح",
    en: "Store type added successfully",
  },
  typeRemoved: {
    ar: "تم إزالة نوع المتجر بنجاح",
    en: "Store type removed successfully",
  },
  selectStoreType: { ar: "اختر نوع المتجر", en: "Select store type" },
  approving: { ar: "قيد الموافقة", en: "Approving..." },
};

// ============================================
// Default Working Hours
// ============================================

const dayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const defaultWorkingHours: WorkingHourForm[] = dayKeys.map((day) => ({
  dayOfWeek: day,
  dayAr: t.days[day as keyof typeof t.days]?.ar || day,
  dayEn: t.days[day as keyof typeof t.days]?.en || day,
  openingTime: day === "friday" ? "14:00" : "08:00",
  closingTime: "23:00",
  isActive: true,
}));

// ============================================
// Toggle Switch Component
// ============================================

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0",
      checked
        ? "bg-primary-600 dark:bg-primary-500"
        : "bg-surface-300 dark:bg-surface-600",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
        checked
          ? "ltr:translate-x-6 rtl:-translate-x-6"
          : "ltr:translate-x-1 rtl:-translate-x-1",
      )}
    />
  </button>
);

const StoreTypesSection: React.FC<{
  store: any;
  isAr: boolean;
  lang: (obj: { ar: string; en: string }) => string;
}> = ({ store, isAr, lang }) => {
  const toast = useToast();
  const { data: storeTypes = [], refetch: refetchStoreTypes } = useStoreTypes();
  const { data: availableTypes = [], isLoading: typesLoading } =
    useAvailableStoreTypes();
  const addStoreType = useAddStoreType();
  const removeStoreType = useRemoveStoreType();
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Get approved and pending types from store profile
  const approvedTypes = (store as any)?.approvedTypes || [];
  const pendingTypes = (store as any)?.pendingTypes || [];

  const handleAddType = async () => {
    if (!selectedTypeId) {
      toast.error(
        isAr ? "يرجى اختيار نوع المتجر" : "Please select a store type",
      );
      return;
    }

    setIsAdding(true);
    try {
      await addStoreType.mutateAsync(selectedTypeId);
      toast.success(lang(t.typeAdded));
      setSelectedTypeId("");
      // Refetch store types and profile
      refetchStoreTypes();
    } catch (error) {
      toast.error(lang(t.saveError));
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveType = async (mappingId: string) => {
    setRemovingId(mappingId);
    try {
      await removeStoreType.mutateAsync(mappingId);
      toast.success(lang(t.typeRemoved));
      refetchStoreTypes();
    } catch (error) {
      toast.error(lang(t.saveError));
    } finally {
      setRemovingId(null);
    }
  };

  const getTypeName = (type: any) => {
    return isAr ? type.nameAr || type.nameEn : type.nameEn || type.nameAr;
  };

  const getTypeDescription = (type: any) => {
    return isAr ? type.descriptionAr : type.descriptionEn;
  };

  return (
    <div className="space-y-6">
      {/* Approved Types */}
      <div>
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
          {lang(t.approvedTypes)}
          <span className="text-xs font-normal text-surface-400 ml-2">
            ({approvedTypes.length})
          </span>
        </h4>
        {approvedTypes.length === 0 ? (
          <div className="text-center py-8 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-dashed border-surface-200 dark:border-surface-700">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {lang(t.noApprovedTypes)}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {approvedTypes.map((type: any) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700"
              >
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {getTypeName(type)}
                  </p>
                  {getTypeDescription(type) && (
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {getTypeDescription(type)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveType(type.mappingId || type.id)}
                  disabled={removingId === (type.mappingId || type.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
                >
                  {removingId === (type.mappingId || type.id) ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    lang(t.removeStoreType)
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Types */}
      {pendingTypes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
            {lang(t.pendingTypes)}
            <span className="text-xs font-normal text-surface-400 ml-2">
              ({pendingTypes.length})
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingTypes.map((type: any) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 rounded-xl bg-warning-50 dark:bg-warning-500/5 border border-warning-200 dark:border-warning-500/20"
              >
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {getTypeName(type)}
                  </p>
                  <p className="text-xs text-warning-600 dark:text-warning-400">
                    {isAr ? "قيد المراجعة" : "Pending approval"}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
                  {isAr ? "مراجعة" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Type */}
      <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
          {lang(t.addStoreType)}
        </h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm transition-all duration-200",
              "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white",
              "placeholder:text-surface-400 dark:placeholder:text-surface-500",
              "border-2 border-transparent",
              "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
            )}
            disabled={typesLoading || isAdding}
          >
            <option value="">{lang(t.selectStoreType)}</option>
            {availableTypes.map((type) => {
              // Check if type is already approved or pending
              const isAlreadyAdded =
                approvedTypes.some(
                  (t: any) => t.storeTypeId === type.id || t.id === type.id,
                ) ||
                pendingTypes.some(
                  (t: any) => t.storeTypeId === type.id || t.id === type.id,
                );

              return (
                <option key={type.id} value={type.id} disabled={isAlreadyAdded}>
                  {isAr
                    ? type.nameAr || type.nameEn
                    : type.nameEn || type.nameAr}
                  {isAlreadyAdded ? ` (${isAr ? "مضاف" : "Added"})` : ""}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleAddType}
            disabled={!selectedTypeId || isAdding || typesLoading}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]",
              "dark:bg-primary-500 dark:hover:bg-primary-600",
              "shadow-sm hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {isAdding ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isAr ? "جاري الإضافة..." : "Adding..."}
              </>
            ) : (
              lang(t.addStoreType)
            )}
          </button>
        </div>
        {typesLoading && (
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-2">
            {isAr ? "جاري تحميل الأنواع..." : "Loading types..."}
          </p>
        )}
      </div>
    </div>
  );
};

const getFixedImageUrl = (
  url: string | undefined,
  storeId: string | undefined,
  type: "logo" | "cover",
): string => {
  if (!url || !storeId) return "";

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  let cleanUrl = url;

  // Remove /uploads/ from anywhere in the URL
  cleanUrl = cleanUrl.replace(/\/uploads\//g, "/");

  // Fix /Store/ to /stores/
  cleanUrl = cleanUrl.replace(/\/Store\//g, "/stores/");

  // If it's already a full URL, return it after cleaning
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  // If it starts with /, prepend base URL
  if (cleanUrl.startsWith("/")) {
    return `${baseUrl}${cleanUrl}`;
  }

  // If it's just a filename, construct the full URL
  const fileName = cleanUrl.split("/").pop() || cleanUrl;
  return `${baseUrl}/stores/${storeId}/${type}/${fileName}`;
};

// ============================================
// SettingsPage — Main Component
// ============================================

export const SettingsPage: React.FC = () => {
  const { data: store, isLoading } = useStoreProfile();
  const updateProfile = useUpdateStoreProfile();
  const {
    theme: themeMode,
    setTheme,
    accent,
    setAccent,
    availableAccents,
  } = useTheme();
  const { currentLanguage } = useLanguage();
  const toast = useToast();
  const { refreshStore } = useStore();

  const uploadLogo = useUpdateLogo();
  const uploadCover = useUpdateCover();

  const isAr = currentLanguage === "ar";
  const lang = (obj: { ar: string; en: string }) => (isAr ? obj.ar : obj.en);

  type TabKey = "profile" | "hours" | "storeTypes" | "images" | "appearance";
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [profile, setProfile] = useState<StoreProfileForm>({
    nameAr: "",
    nameEn: "",
    descriptionAr: "",
    descriptionEn: "",
    email: "",
    streetAr: "",
    streetEn: "",
    cityId: "",
    city: "",
    latitude: 0,
    longitude: 0,
    minimumOrderAmount: 0,
    deliveryFee: 0,
    estimatedPreparationMinutes: 15,
    cancelBeforeMinutes: 30,
  });

  const [workingHours, setWorkingHours] =
    useState<WorkingHourForm[]>(defaultWorkingHours);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      const dto: UpdateStoreProfileDto = {
        nameAr: profile.nameAr,
        nameEn: profile.nameEn,
        descriptionAr: profile.descriptionAr || undefined,
        descriptionEn: profile.descriptionEn || undefined,
        email: profile.email || undefined,
        latitude: profile.latitude,
        longitude: profile.longitude,
        streetAr: profile.streetAr || undefined,
        streetEn: profile.streetEn || undefined,
        cityId: profile.cityId || undefined,
        city: profile.city || undefined,
        minimumOrderAmount: profile.minimumOrderAmount,
        deliveryFee: profile.deliveryFee,
        estimatedPreparationMinutes: profile.estimatedPreparationMinutes,
        cancelBeforeMinutes: profile.cancelBeforeMinutes,
      };
      await updateProfile.mutateAsync(dto);
      toast.success(lang(t.saveSuccess));
    } catch {
      toast.error(lang(t.saveError));
    } finally {
      setIsSaving(false);
    }
  }, [profile, updateProfile, toast, isAr, lang]);

  const handleImageUpload = async (file: File, type: "logo" | "cover") => {
    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang(t.imageTypeError));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang(t.imageSizeError));
      return;
    }

    // Set uploading state
    if (type === "logo") {
      setIsUploadingLogo(true);
    } else {
      setIsUploadingCover(true);
    }

    try {
      let imageUrl: string | undefined;

      if (type === "logo") {
        const result = await uploadLogo.mutateAsync(file);
        imageUrl = result?.url || result?.data?.url || result?.imageUrl;
      } else {
        const result = await uploadCover.mutateAsync(file);
        imageUrl = result?.url || result?.data?.url || result?.imageUrl;
      }

      if (imageUrl) {
        // Extract filename from the URL
        const fileName = imageUrl.split("/").pop() || "";

        // Refresh store data to show the new image
        if (refreshStore) {
          await refreshStore();
        }

        toast.success(lang(t.uploadSuccess));
      } else {
        throw new Error("No image URL returned from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : lang(t.uploadError));
    } finally {
      if (type === "logo") {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingCover(false);
      }
    }
  };

  // Fetch the full list of opening hours from API, and merge missing days as inactive
  const fetchWorkingHours = useCallback(async () => {
    if (!store?.id) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token = localStorage.getItem("store-access-token");

      const response = await fetch(`${baseUrl}/api/store/opening-hours`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch working hours");

      const result = await response.json();
      const hoursData: any[] = result.data || result || [];

      // Start with all 7 days inactive (using defaults for times)
      const merged = dayKeys.map((day) => ({
        dayOfWeek: day,
        dayAr: t.days[day as keyof typeof t.days]?.ar || day,
        dayEn: t.days[day as keyof typeof t.days]?.en || day,
        openingTime: day === "friday" ? "14:00" : "08:00",
        closingTime: "23:00",
        isActive: false, // inactive by default
        id: undefined, // no id yet
      }));

      // Override with actual API data for days that exist
      for (const wh of hoursData) {
        const dayLower = wh.dayOfWeek.toLowerCase();
        const index = merged.findIndex((d) => d.dayOfWeek === dayLower);
        if (index !== -1) {
          merged[index] = {
            ...merged[index],
            id: wh.id,
            openingTime: wh.openingTime,
            closingTime: wh.closingTime,
            isActive: wh.isActive,
          };
        }
      }

      setWorkingHours(merged);
    } catch (error) {
      console.error("Failed to fetch working hours:", error);
      // Keep current state (or fallback to defaults) – no update on error
    }
  }, [store?.id]);

  // Save individual working hour to API
  const saveWorkingHour = useCallback(
    async (hour: WorkingHourForm) => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const token = localStorage.getItem("store-access-token");

        if (!token) throw new Error("No auth token found");

        const capitalizedDay =
          hour.dayOfWeek.charAt(0).toUpperCase() +
          hour.dayOfWeek.slice(1).toLowerCase();

        const method = hour.id ? "PUT" : "POST";
        const endpoint = hour.id
          ? `${baseUrl}/api/store/opening-hours/${hour.id}`
          : `${baseUrl}/api/store/opening-hours`;

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dayOfWeek: capitalizedDay,
            openingTime: hour.openingTime,
            closingTime: hour.closingTime,
            isActive: hour.isActive,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText ||
              `Failed to update working hour: ${response.statusText}`,
          );
        }

        // Parse the response to get the new ID (for POST)
        const savedData = await response.json();
        const newHour = savedData.data || savedData;

        // If the hour didn't have an ID before and now has one, update it locally
        if (
          !hour.id &&
          newHour.id &&
          newHour.id !== "00000000-0000-0000-0000-000000000000"
        ) {
          setWorkingHours((prev) =>
            prev.map((h) =>
              h.dayOfWeek === hour.dayOfWeek ? { ...h, id: newHour.id } : h,
            ),
          );
        }

        // Refresh the full list from the server
        await fetchWorkingHours();

        toast.success(lang(t.saveSuccess));
      } catch (error) {
        console.error("Failed to update working hour:", error);
        toast.error(lang(t.saveError));

        // Revert to server state on error
        await fetchWorkingHours();
      }
    },
    [toast, lang, fetchWorkingHours],
  );

  useEffect(() => {
    if (store) {
      setProfile({
        nameAr: store.nameAr || "",
        nameEn: store.nameEn || "",
        descriptionAr: store.descriptionAr || "",
        descriptionEn: store.descriptionEn || "",
        email: store.email || "",
        streetAr: store.streetAr || "",
        streetEn: store.streetEn || "",
        cityId: store.cityId || "",
        city: store.city || "",
        latitude: store.latitude || 0,
        longitude: store.longitude || 0,
        minimumOrderAmount: store.minimumOrderAmount || 0,
        deliveryFee: store.deliveryFee || 0,
        estimatedPreparationMinutes: store.estimatedPreparationMinutes || 15,
        cancelBeforeMinutes: store.cancelBeforeMinutes ?? 30,
      });

      // Fetch working hours from the separate endpoint
      fetchWorkingHours();
    }
  }, [store, fetchWorkingHours]);

  const inputClasses = cn(
    "w-full px-4 py-3 rounded-xl text-sm transition-all duration-200",
    "bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white",
    "placeholder:text-surface-400 dark:placeholder:text-surface-500",
    "border-2 border-transparent",
    "focus:outline-none focus:border-primary-500/50 focus:bg-surface-50 dark:focus:bg-surface-800/50",
  );

  const tabs = [
    {
      key: "profile" as TabKey,
      labelAr: t.tabProfile.ar,
      labelEn: t.tabProfile.en,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
          />
        </svg>
      ),
    },
    {
      key: "hours" as TabKey,
      labelAr: t.tabHours.ar,
      labelEn: t.tabHours.en,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      key: "images" as TabKey,
      labelAr: t.tabImages.ar,
      labelEn: t.tabImages.en,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
      ),
    },
    {
      key: "storeTypes" as TabKey,
      labelAr: t.tabStoreTypes.ar,
      labelEn: t.tabStoreTypes.en,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      ),
    },
    {
      key: "appearance" as TabKey,
      labelAr: t.tabAppearance.ar,
      labelEn: t.tabAppearance.en,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
          />
        </svg>
      ),
    },
  ];

  const themeOptions: {
    key: ThemeMode;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "light",
      labelAr: t.themeLight.ar,
      labelEn: t.themeLight.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ),
    },
    {
      key: "dark",
      labelAr: t.themeDark.ar,
      labelEn: t.themeDark.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      ),
    },
    {
      key: "system",
      labelAr: t.themeSystem.ar,
      labelEn: t.themeSystem.en,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
          />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header */}
        <div>
          <div className="skeleton h-8 w-48 rounded-lg mb-2" />
          <div className="skeleton h-4 w-64 rounded-lg" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3">
              <div className="skeleton w-5 h-5 rounded" />
              <div className="skeleton h-4 w-16 rounded hidden sm:block" />
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div>
              <div className="skeleton h-5 w-40 rounded-lg mb-1" />
              <div className="skeleton h-3 w-56 rounded-lg" />
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-28 rounded-lg" />
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>

          {/* Number Inputs Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3 w-24 rounded-lg" />
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
            <div className="skeleton h-12 w-36 rounded-xl" />
            <div className="skeleton h-12 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-6 animate-fade-in pb-12",
        isAr ? "text-right" : "text-left",
      )}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {lang(t.title)}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang(t.subtitle)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-surface-200 dark:border-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all",
              activeTab === tab.key
                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                : "border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300",
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">
              {isAr ? tab.labelAr : tab.labelEn}
            </span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.profileTitle)}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.profileDesc)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.storeNameAr)}
              </label>
              <input
                value={profile.nameAr}
                onChange={(e) =>
                  setProfile({ ...profile, nameAr: e.target.value })
                }
                className={cn(inputClasses, "text-right")}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.storeNameEn)}
              </label>
              <input
                value={profile.nameEn}
                onChange={(e) =>
                  setProfile({ ...profile, nameEn: e.target.value })
                }
                className={cn(inputClasses, "text-left")}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.phone)}
              </label>
              <input
                value={store?.phoneNumber || ""}
                className={cn(inputClasses, "opacity-60 cursor-not-allowed")}
                dir="ltr"
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.email)}
              </label>
              <input
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className={inputClasses}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.descriptionAr)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <textarea
                value={profile.descriptionAr}
                onChange={(e) =>
                  setProfile({ ...profile, descriptionAr: e.target.value })
                }
                rows={2}
                className={cn(inputClasses, "resize-none text-right")}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.descriptionEn)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <textarea
                value={profile.descriptionEn}
                onChange={(e) =>
                  setProfile({ ...profile, descriptionEn: e.target.value })
                }
                rows={2}
                className={cn(inputClasses, "resize-none text-left")}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.streetAr)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={profile.streetAr}
                onChange={(e) =>
                  setProfile({ ...profile, streetAr: e.target.value })
                }
                className={cn(inputClasses, "text-right")}
                dir="rtl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.streetEn)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={profile.streetEn}
                onChange={(e) =>
                  setProfile({ ...profile, streetEn: e.target.value })
                }
                className={cn(inputClasses, "text-left")}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.city)}{" "}
                <span className="font-normal text-surface-400">
                  ({lang(t.optional)})
                </span>
              </label>
              <input
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                className={inputClasses}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.minimumOrderAmount)}
              </label>
              <input
                type="number"
                value={profile.minimumOrderAmount}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    minimumOrderAmount: Number(e.target.value),
                  })
                }
                min="0"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.deliveryFee)}
              </label>
              <input
                type="number"
                value={profile.deliveryFee}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    deliveryFee: Number(e.target.value),
                  })
                }
                min="0"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.estimatedPreparationMinutes)}
              </label>
              <input
                type="number"
                value={profile.estimatedPreparationMinutes}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    estimatedPreparationMinutes: Number(e.target.value),
                  })
                }
                min="1"
                className={inputClasses}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                {lang(t.cancelBeforeMinutes)}
              </label>
              <input
                type="number"
                value={profile.cancelBeforeMinutes}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    cancelBeforeMinutes: Number(e.target.value),
                  })
                }
                min="0"
                className={inputClasses}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] dark:bg-primary-500 dark:hover:bg-primary-600 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2",
              )}
            >
              {isSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {lang(t.saving)}
                </>
              ) : (
                lang(t.saveChanges)
              )}
            </button>
          </div>
        </div>
      )}

      {/* Working Hours Tab */}
      {activeTab === "hours" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/10 flex items-center justify-center text-success-600 dark:text-success-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.hoursTitle)}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.hoursDesc)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {workingHours.map((hour, index) => (
              <div
                key={hour.dayOfWeek}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl",
                  hour.isActive
                    ? "bg-surface-50 dark:bg-surface-800/50"
                    : "bg-surface-50/50 dark:bg-surface-900/50 opacity-60",
                )}
              >
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={hour.isActive}
                    onChange={async (checked) => {
                      // Update local state immediately for responsive UI
                      const updated = { ...hour, isActive: checked };
                      const u = [...workingHours];
                      u[index] = updated;
                      setWorkingHours(u);

                      // Save individual working hour to API
                      await saveWorkingHour(updated);
                    }}
                  />
                  <span className="w-24 sm:w-28 text-sm font-medium text-surface-700 dark:text-surface-300">
                    {isAr ? hour.dayAr : hour.dayEn}
                  </span>
                </div>
                {hour.isActive ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={hour.openingTime}
                      onChange={async (e) => {
                        const updated = {
                          ...hour,
                          openingTime: e.target.value,
                        };
                        const u = [...workingHours];
                        u[index] = updated;
                        setWorkingHours(u);

                        await saveWorkingHour(updated);
                      }}
                      className="rounded-xl py-2 px-3 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-white border-2 border-transparent focus:outline-none focus:border-primary-500/50"
                    />
                    <span className="text-surface-400 text-sm">
                      {lang(t.to)}
                    </span>
                    <input
                      type="time"
                      value={hour.closingTime}
                      onChange={async (e) => {
                        const updated = {
                          ...hour,
                          closingTime: e.target.value,
                        };
                        const u = [...workingHours];
                        u[index] = updated;
                        setWorkingHours(u);

                        await saveWorkingHour(updated);
                      }}
                      className="rounded-xl py-2 px-3 bg-surface-100 dark:bg-surface-800 text-sm text-surface-900 dark:text-white border-2 border-transparent focus:outline-none focus:border-primary-500/50"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-surface-400 flex-1">
                    {lang(t.closed)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === "images" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-info-100 dark:bg-info-500/10 flex items-center justify-center text-info-600 dark:text-info-400 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.imagesTitle)}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.imagesDesc)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-2">
                {lang(t.logo)}
              </label>
              <div className="relative aspect-square rounded-2xl bg-surface-100 dark:bg-surface-800 overflow-hidden group">
                {store?.logoUrl ? (
                  <>
                    <img
                      src={getFixedImageUrl(store.logoUrl, store?.id, "logo")}
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <label className="p-3 rounded-xl bg-white/90 text-surface-700 hover:bg-white transition-colors cursor-pointer">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], "logo");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                    {isUploadingLogo ? (
                      <svg
                        className="w-8 h-8 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    )}
                    <span className="text-xs font-medium">
                      {isUploadingLogo ? lang(t.saving) : lang(t.uploadLogo)}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0], "logo");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-2">
                {lang(t.cover)}
              </label>
              <div className="relative aspect-video rounded-2xl bg-surface-100 dark:bg-surface-800 overflow-hidden group">
                {/* Use coverImageUrl from the store response */}
                {store?.coverImageUrl ? (
                  <>
                    <img
                      src={(() => {
                        const url = store.coverImageUrl;
                        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
                        // Remove /uploads/ and construct the correct URL
                        const cleanUrl = url
                          .replace(/^\/uploads\//, "/")
                          .replace(/\/uploads\//g, "/")
                          .replace(/\/Store\//g, "/stores/");
                        // If it starts with /, prepend base URL
                        if (cleanUrl.startsWith("/")) {
                          return `${baseUrl}${cleanUrl}`;
                        }
                        return cleanUrl;
                      })()}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                        const parent = img.parentElement;
                        if (parent) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800";
                          fallback.innerHTML = `
                  <svg class="w-12 h-12 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                `;
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <label className="p-3 rounded-xl bg-white/90 text-surface-700 hover:bg-white transition-colors cursor-pointer">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], "cover");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer">
                    {isUploadingCover ? (
                      <svg
                        className="w-8 h-8 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                    )}
                    <span className="text-xs font-medium">
                      {isUploadingCover ? lang(t.saving) : lang(t.uploadCover)}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0], "cover");
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Types Tab */}
      {activeTab === "storeTypes" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-start">
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.storeTypesTitle)}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.storeTypesDesc)}
              </p>
            </div>
          </div>

          <StoreTypesSection store={store} isAr={isAr} lang={lang} />
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 dark:border-surface-800">
            <div className="w-10 h-10 rounded-xl bg-warning-100 dark:bg-warning-500/10 flex items-center justify-center text-warning-600 dark:text-warning-400">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                {lang(t.appearanceTitle)}
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {lang(t.appearanceDesc)}
              </p>
            </div>
          </div>
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
              {lang(t.themeSection)}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setTheme(mode.key)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    themeMode === mode.key
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                      : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600",
                  )}
                >
                  {mode.icon}
                  <span className="text-sm font-medium">
                    {isAr ? mode.labelAr : mode.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">
              {lang(t.accentSection)}
            </h4>
            <div className="flex gap-3 flex-wrap">
              {availableAccents.map((config) => (
                <button
                  key={config.name}
                  onClick={() => setAccent(config.name as AccentColor)}
                  className={cn(
                    "w-10 h-10 rounded-full transition-all duration-200 hover:scale-110",
                    accent === config.name &&
                      "ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-surface-950 scale-110",
                  )}
                  style={{ backgroundColor: config.primary }}
                  title={isAr ? config.nameAr : config.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
