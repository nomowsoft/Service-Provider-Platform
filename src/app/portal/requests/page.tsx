"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Calendar,
  Building,
  Activity,
  ChevronRight,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "@/components/ui/DatePicker";


interface RequestItem {
  id: number;
  name: string;
  beneficiaryName: string;
  beneficiaryNationalId: string;
  status: string;
  serviceCost: number;
  charityContributionPercentage: number;
  charityContributionValue: number;
  beneficiaryContributionValue: number;
  description: string;
  createdAt: string;
  charity: { name: string };
  serviceProvider?: { name: string } | null;
}

export default function RequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sync statusFilter with URL status param
  useEffect(() => {
    const statusParam = searchParams?.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter("ALL");
    }
  }, [searchParams]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams(window.location.search);
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.replace(`/portal/requests?${params.toString()}`);
  };



  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserRole(userData.user.role);
      }

      // Fetch requests
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("فشل تحميل الطلبات");
      const data = await res.json();
      setRequests(data.requests);
    } catch (error) {
      toast.error("خطأ أثناء تحميل قائمة الطلبات");
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

  // Filter requests during render to avoid useEffect state triggers
  const filteredRequests = requests.filter((r) => {
    // Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        r.name.toLowerCase().includes(term) ||
        r.beneficiaryName.toLowerCase().includes(term) ||
        r.beneficiaryNationalId.includes(term);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== "ALL") {
      if (r.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // Date range filter - From Date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const reqDate = new Date(r.createdAt);
      if (reqDate < start) return false;
    }

    // Date range filter - To Date
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const reqDate = new Date(r.createdAt);
      if (reqDate > end) return false;
    }

    return true;
  });



  const getStatusLabelAndStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "draft":
        return { label: "مسودة عرض تسعير", bg: "bg-slate-50 text-slate-700 border-slate-200" };
      case "sent":
        return { label: "طلب تسعير مرسل", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "to_approve":
        return { label: "في انتظار الموافقة", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "purchase":
        return { label: "أمر شراء", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "approved":
        return { label: "معتمد من الجمعية", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "done":
        return { label: "مكتمل / منتهي", bg: "bg-green-50 text-green-700 border-green-200" };
      case "cancel":
      case "cancel_done":
        return { label: "ملغي", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      case "rfq":
        return { label: "طلب تسعير", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "beneficiary_contribution":
        return { label: "مساهمة المستفيد", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "raising_claim":
        return { label: "رفع المطالبة", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "claim_review":
        return { label: "مراجعة المطالبة", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "completed":
        return { label: "مكتمل", bg: "bg-green-50 text-green-700 border-green-200" };
      case "cancelled":
        return { label: "ملغي", bg: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: status, bg: "bg-gray-50 text-gray-700 border-gray-200" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white">إدارة الطلبات والخدمات</h1>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">متابعة كافة طلبات عروض الأسعار والمطالبات المالية</p>
        </div>


      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#03251c] rounded-3xl p-5 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end animate-fadeIn">
          {/* Search Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">البحث</label>
            <div className="relative">
              <input
                type="text"
                placeholder="البحث برقم الطلب أو اسم المستفيد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] pl-10 pr-4 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder-emerald-600/40 dark:placeholder-emerald-400/40"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600/60 dark:text-emerald-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">الحالة</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] px-4 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 cursor-pointer transition-all"
              >
                <option value="ALL" className="bg-white dark:bg-[#03251c]">جميع الحالات</option>
                <option value="draft" className="bg-white dark:bg-[#03251c]">مسودة عرض تسعير</option>
                <option value="sent" className="bg-white dark:bg-[#03251c]">طلب تسعير مرسل</option>
                <option value="to_approve" className="bg-white dark:bg-[#03251c]">في انتظار الموافقة</option>
                <option value="purchase" className="bg-white dark:bg-[#03251c]">أمر شراء</option>
                <option value="approved" className="bg-white dark:bg-[#03251c]">معتمد</option>
                <option value="done" className="bg-white dark:bg-[#03251c]">مكتمل / منتهي</option>
                <option value="cancel" className="bg-white dark:bg-[#03251c]">ملغي</option>
              </select>
            </div>
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

        {/* Clear Filters Button (Shows only if any filter is active) */}
        {(searchTerm || statusFilter !== "ALL" || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setStartDate("");
                setEndDate("");
                const params = new URLSearchParams(window.location.search);
                params.delete("status");
                router.replace(`/portal/requests?${params.toString()}`);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5"
            >
              <X size={14} />
              <span>إعادة تعيين الفلاتر</span>
            </button>
          </div>
        )}
      </div>

      {/* Requests Listings Grid */}
      {loading ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-emerald-800 dark:text-emerald-300">جاري تحميل قائمة الطلبات...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 dark:border-emerald-950/40 rounded-3xl p-8 text-center bg-white dark:bg-[#03251c]/25">
          <FileText className="text-emerald-300 dark:text-emerald-800 h-12 w-12" />
          <h3 className="text-sm font-bold text-emerald-950 dark:text-white">لم يتم العثور على طلبات</h3>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400 max-w-xs">جرب تغيير تبويب التصفية أو البحث عن مصطلح آخر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRequests.map((req) => {
            const statusInfo = getStatusLabelAndStyle(req.status);
            return (
              <div 
                key={req.id} 
                className="glass-card hover-card rounded-3xl p-6 border border-emerald-100/50 shadow-sm flex flex-col justify-between space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                      {req.name}
                    </span>
                    <h3 className="text-base font-extrabold text-emerald-950 dark:text-white">
                      {req.beneficiaryName}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {req.description}
                </p>

                {/* Info Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-emerald-50/50 dark:border-emerald-950/40 py-3 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building size={14} className="text-emerald-600" />
                    <span className="truncate">{req.charity.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-600" />
                    <span>{new Date(req.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Activity size={14} className="text-emerald-600" />
                    <span className="truncate">
                      المزود المعين: <strong className="text-emerald-950 dark:text-emerald-300 font-semibold">{req.serviceProvider?.name || "في انتظار التسعير"}</strong>
                    </span>
                  </div>
                </div>

                {/* Split Calculations */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400 font-bold">التكلفة الإجمالية</span>
                    <span className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                      {req.serviceCost > 0 ? `${req.serviceCost.toLocaleString()} ر.س` : "بانتظار العروض"}
                    </span>
                  </div>
                  <Link
                    href={`/portal/requests/${req.id}`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#064e3b] hover:bg-[#043e2f] px-4 py-2.5 text-xs font-bold text-white transition"
                  >
                    <span>عرض التفاصيل</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
