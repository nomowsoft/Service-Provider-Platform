"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Calendar,
  Building,
  Activity,
  X,
  Coins,
  User, 
  Phone, 
  IdCard
} from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "@/components/ui/DatePicker";
import { SaudiRiyalIcon } from "@/components/ui/SaudiRiyalIcon";
import SearchBar, { SearchFieldOption, SearchTag } from "@/components/ui/SearchBar";

interface ClaimItem {
  id: string;
  purchaseOrderId: number;
  requestNumber: string;
  providerName: string;
  beneficiaryName?: string;
  beneficiaryMobile?: string;
  beneficiaryID?: string;
  serviceCost: number;
  subServiceType: string;
  requestDate: string;
  charity: { name: string };
  claimStatus?: string;
}

const CLAIM_SEARCH_FIELDS: SearchFieldOption[] = [
  { key: "requestNumber", label: "رقم الطلب" },
  { key: "beneficiaryName", label: "اسم المستفيد" },
  { key: "beneficiaryMobile", label: "رقم الجوال" },
  { key: "beneficiaryID", label: "رقم الهوية" },
  { key: "charity", label: "الجمعية" },
  { key: "all", label: "عام" },
];

export default function ClaimsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchTags, setSearchTags] = useState<SearchTag[]>([]);
  const [rawQuery, setRawQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Sync selectedStatus with URL status param
  useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (statusParam) {
      setSelectedStatus(statusParam);
    } else {
      setSelectedStatus("all");
    }
  }, [searchParams]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    const params = new URLSearchParams(window.location.search);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.replace(`/portal/claims?${params.toString()}`);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("فشل تحميل المطالبات المالية");
      const data = await res.json();
      setClaims(data.claims);
    } catch (error) {
      toast.error("خطأ أثناء تحميل قائمة المطالبات المالية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Filter claims during render (search logic)
  const filteredClaims = claims.filter((c) => {
    // Status Filter
    if (selectedStatus !== "all") {
      if (selectedStatus === "new") {
        if (c.claimStatus) return false;
      } else {
        if (c.claimStatus !== selectedStatus) return false;
      }
    }

    // Search Tags & Raw query matching
    if (searchTags.length > 0 || rawQuery.trim() !== "") {
      // 1) All committed search tags
      for (const tag of searchTags) {
        const val = tag.value.toLowerCase();
        if (tag.fieldKey === "beneficiaryName") {
          if (!c.beneficiaryName?.toLowerCase().includes(val)) return false;
        } else if (tag.fieldKey === "beneficiaryID") {
          if (!c.beneficiaryID?.toLowerCase().includes(val)) return false;
        } else if (tag.fieldKey === "beneficiaryMobile") {
          if (!c.beneficiaryMobile?.toLowerCase().includes(val)) return false;
        } else if (tag.fieldKey === "requestNumber") {
          if (!c.requestNumber.toLowerCase().includes(val)) return false;
        } else if (tag.fieldKey === "charity") {
          if (!c.charity?.name?.toLowerCase().includes(val)) return false;
        } else if (tag.fieldKey === "providerName") {
          if (!c.providerName?.toLowerCase().includes(val)) return false;
        } else {
          // "all"
          const matches =
            c.requestNumber.toLowerCase().includes(val) ||
            c.providerName.toLowerCase().includes(val) ||
            c.subServiceType.toLowerCase().includes(val) ||
            (c.beneficiaryName && c.beneficiaryName.toLowerCase().includes(val)) ||
            (c.beneficiaryMobile && c.beneficiaryMobile.toLowerCase().includes(val)) ||
            (c.beneficiaryID && c.beneficiaryID.toLowerCase().includes(val)) ||
            (c.charity?.name && c.charity.name.toLowerCase().includes(val));
          if (!matches) return false;
        }
      }

      // 2) Active uncommitted input query
      if (rawQuery.trim() !== "") {
        const val = rawQuery.trim().toLowerCase();
        const matchesRaw =
          c.requestNumber.toLowerCase().includes(val) ||
          c.providerName.toLowerCase().includes(val) ||
          c.subServiceType.toLowerCase().includes(val) ||
          (c.beneficiaryName && c.beneficiaryName.toLowerCase().includes(val)) ||
          (c.beneficiaryMobile && c.beneficiaryMobile.toLowerCase().includes(val)) ||
          (c.beneficiaryID && c.beneficiaryID.toLowerCase().includes(val)) ||
          (c.charity?.name && c.charity.name.toLowerCase().includes(val));
        if (!matchesRaw) return false;
      }
    }

    // Date range filter - From Date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const reqDate = new Date(c.requestDate);
      if (reqDate < start) return false;
    }

    // Date range filter - To Date
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const reqDate = new Date(c.requestDate);
      if (reqDate > end) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white flex items-center gap-2">
            <Coins className="text-emerald-600 dark:text-emerald-400 h-7 w-7" />
            <span>طلبات المطالبة المالية</span>
          </h1>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">متابعة كافة طلبات المطالبات المالية المرفوعة لمزودي الخدمة</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#03251c] rounded-3xl p-5 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end animate-fadeIn">
          {/* Style Search Bar */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">البحث</label>
            <SearchBar
              placeholder="البحث برقم الطلب، اسم المستفيد، الهوية، الجوال، الجمعية..."
              searchFields={CLAIM_SEARCH_FIELDS}
              tags={searchTags}
              onTagsChange={setSearchTags}
              rawQuery={rawQuery}
              onRawQueryChange={setRawQuery}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">الحالة</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] px-4 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 cursor-pointer transition-all"
            >
              <option value="all" className="bg-white dark:bg-[#03251c]">جميع الحالات ({claims.length})</option>
              <option value="new" className="bg-white dark:bg-[#03251c]">جديدة ({claims.filter(c => !c.claimStatus).length})</option>
              <option value="raising_the_claim" className="bg-white dark:bg-[#03251c]">تم رفع المطالبة ({claims.filter(c => c.claimStatus === "raising_the_claim").length})</option>
              <option value="update_the_claim" className="bg-white dark:bg-[#03251c]">طلب تعديل ({claims.filter(c => c.claimStatus === "update_the_claim").length})</option>
              <option value="claim_accepted" className="bg-white dark:bg-[#03251c]">تم قبول المطالبة ({claims.filter(c => c.claimStatus === "claim_accepted").length})</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">من تاريخ</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="اختر تاريخ البداية"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">إلى تاريخ</label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="اختر تاريخ النهاية"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTags.length > 0 || rawQuery !== "" || startDate || endDate || selectedStatus !== "all") && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTags([]);
                setRawQuery("");
                setStartDate("");
                setEndDate("");
                setSelectedStatus("all");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          </div>
        )}
      </div>

      {/* Claims Listings Grid */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-emerald-800 dark:text-emerald-300">جاري تحميل قائمة المطالبات...</span>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 dark:border-emerald-950/40 rounded-3xl p-8 text-center bg-white dark:bg-[#03251c]/25">
          <FileText className="text-emerald-300 dark:text-emerald-800 h-12 w-12" />
          <h3 className="text-sm font-bold text-emerald-950 dark:text-white">لم يتم العثور على مطالبات مالية</h3>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400 max-w-xs">جرب تغيير مصطلح البحث أو تصفية التواريخ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClaims.map((claim) => (
            <Link 
              key={claim.id} 
              href={`/portal/claims/${claim.purchaseOrderId}`}
              className="glass-card hover-card rounded-3xl p-6 border border-emerald-100/50 shadow-sm flex flex-col justify-between space-y-4 hover:no-underline block cursor-pointer transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                    {claim.requestNumber}
                  </span>
                  <h3 className="text-base font-extrabold text-emerald-950 dark:text-white">
                    {claim.subServiceType}
                  </h3>
                </div>
                {renderStatusBadge(claim.claimStatus)}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                طلب مطالبة مالية مرفوع بخصوص تقديم الخدمة الصحية المستحقة للمستفيدين.
              </p>

              {/* Info Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs border-t border-b border-emerald-50/50 dark:border-emerald-950/40 py-3 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-emerald-600" />
                  <span className="truncate">{claim.charity.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-600" />
                  <span className="truncate">
                    المزود المعين: <strong className="text-emerald-950 dark:text-emerald-300 font-semibold">{claim.providerName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>{new Date(claim.requestDate).toLocaleDateString("ar-SA")}</span>
                </div>
                {claim.beneficiaryName && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-emerald-600" />
                    <span className="truncate">
                      <strong className="text-emerald-950 dark:text-emerald-300 font-semibold">{claim.beneficiaryName}</strong>
                    </span>
                  </div>
                )}
                {claim.beneficiaryMobile && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-600" />
                    <span className="truncate">
                      <strong className="text-emerald-950 dark:text-emerald-300 font-semibold">{claim.beneficiaryMobile}</strong>
                    </span>
                  </div>
                )}
                {claim.beneficiaryID && (
                  <div className="flex items-center gap-1.5">
                    <IdCard size={14} className="text-emerald-600" />
                    <span className="truncate">
                      <strong className="text-emerald-950 dark:text-emerald-300 font-semibold">{claim.beneficiaryID}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing / Cost */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400 font-bold">التكلفة الإجمالية</span>
                  <span className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100 inline-flex items-center gap-1">
                    {claim.serviceCost.toLocaleString()}
                    <SaudiRiyalIcon size={10} />
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/40">
                  رقم أمر الشراء: #{claim.purchaseOrderId}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function renderStatusBadge(status?: string) {
  switch (status) {
    case "raising_the_claim":
      return (
        <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
          تم رفع المطالبة
        </span>
      );
    case "update_the_claim":
      return (
        <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-550/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
          طلب تعديل
        </span>
      );
    case "claim_accepted":
      return (
        <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
          تم قبول المطالبة
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-[#021b14] dark:text-slate-400 dark:border-slate-800">
          جديدة
        </span>
      );
  }
}
