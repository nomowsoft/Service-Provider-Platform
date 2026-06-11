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
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [activeTab, setActiveTab] = useState("ALL");

  // Sync activeTab with URL tab param
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "RFQ" || tabParam === "CLAIMS" || tabParam === "COMPLETED" || tabParam === "PENDING") {
      setActiveTab(tabParam);
    } else {
      setActiveTab("ALL");
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    if (tabId === "ALL") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
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

    // Tab filter
    if (activeTab === "RFQ") {
      return r.status === "RFQ";
    } else if (activeTab === "CLAIMS") {
      return r.status === "RAISING_CLAIM" || r.status === "CLAIM_REVIEW";
    } else if (activeTab === "COMPLETED") {
      return r.status === "COMPLETED";
    } else if (activeTab === "PENDING") {
      return r.status !== "RFQ" && r.status !== "RAISING_CLAIM" && r.status !== "CLAIM_REVIEW" && r.status !== "COMPLETED";
    }

    return true;
  });



  const getStatusLabelAndStyle = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { label: "مسودة", bg: "bg-slate-50 text-slate-700 border-slate-200" };
      case "RFQ":
        return { label: "طلب تسعير", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "BENEFICIARY_CONTRIBUTION":
        return { label: "مساهمة المستفيد", bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "RAISING_CLAIM":
        return { label: "رفع المطالبة", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "CLAIM_REVIEW":
        return { label: "مراجعة المطالبة", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "COMPLETED":
        return { label: "مكتمل", bg: "bg-green-50 text-green-700 border-green-200" };
      case "CANCELLED":
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

      {/* Tabs and Search Grid */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-emerald-100 dark:border-emerald-950 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "ALL", label: "جميع الطلبات" },
            { id: "RFQ", label: "طلب عروض الأسعار (RFQ)" },
            { id: "CLAIMS", label: "المطالبات المالية" },
            { id: "COMPLETED", label: "الطلبات المكتملة" },
            { id: "PENDING", label: "الطلبات الأخرى المعلقة" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-[#064e3b] text-white shadow-sm"
                  : "bg-white dark:bg-[#03251c] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input group */}
        <div className="relative w-full lg:max-w-xs">
          <input
            type="text"
            placeholder="البحث برقم الطلب أو اسم المستفيد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-emerald-100 dark:border-emerald-950 bg-white dark:bg-[#03251c] pl-10 pr-4 py-2.5 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500"
          />
          <Search className="absolute left-3.5 top-3 text-emerald-600/60 dark:text-emerald-400 h-4 w-4" />
        </div>
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
