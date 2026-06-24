"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Coins,
  ChevronLeft,
  Activity
} from "lucide-react";
import toast from "react-hot-toast";
import { SaudiRiyalIcon } from "@/components/ui/SaudiRiyalIcon";

interface StatMetrics {
  rfqCount: number;
  claimCount: number;
  completedCount: number;
  pendingCount: number;
  totalCount: number;
}

interface ClaimMetrics {
  newCount: number;
  raisingCount: number;
  updateCount: number;
  acceptedCount: number;
  totalCount: number;
}

interface RecentRequest {
  id: number;
  name: string;
  beneficiaryName: string;
  charityName: string;
  providerName: string;
  status: string;
  cost: number;
  date: string;
}

interface RecentClaim {
  id: string;
  purchaseOrderId: number;
  requestNumber: string;
  providerName: string;
  serviceCost: number;
  subServiceType: string;
  claimStatus: string;
  date: string;
  charityName: string;
}

export default function PortalDashboard() {
  const [activeTab, setActiveTab] = useState<"requests" | "claims">("requests");
  const [stats, setStats] = useState<StatMetrics | null>(null);
  const [claimStats, setClaimStats] = useState<ClaimMetrics | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch current user role
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.user.role);
        }

        const statsRes = await fetch("/api/stats");
        if (!statsRes.ok) throw new Error("فشل تحميل البيانات");

        const data = await statsRes.json();
        setStats(data.stats);
        setClaimStats(data.claimStats);
        setRecentRequests(data.recentRequests);
        setRecentClaims(data.recentClaims);
      } catch (error) {
        console.error("Dashboard load error:", error);
        toast.error("خطأ أثناء تحميل بيانات لوحة التحكم");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">جاري تحميل بيانات لوحة التحكم...</span>
      </div>
    );
  }

  // Fallbacks if null
  const s = stats || { rfqCount: 0, claimCount: 0, completedCount: 0, pendingCount: 0, totalCount: 0 };
  const cStats = claimStats || { newCount: 0, raisingCount: 0, updateCount: 0, acceptedCount: 0, totalCount: 0 };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    switch (s) {
      case "draft":
        return <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-900/60 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">مسودة عرض تسعير</span>;
      case "to approve":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">في انتظار الموافقة</span>;
      case "purchase":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">أمر شراء</span>;
      case "cancel":
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">ملغي</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{status}</span>;
    }
  };

  const getClaimStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    switch (s) {
      case "new":
      case "":
        return <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-950/60 px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">جديدة</span>;
      case "raising_the_claim":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">تم رفع المطالبة</span>;
      case "update_the_claim":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">طلب تعديل</span>;
      case "claim_accepted":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">تم قبول المطالبة</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{status}</span>;
    }
  };

  // Percentages for rings
  const rfqPct = s.totalCount > 0 ? (s.rfqCount / s.totalCount) * 100 : 0;
  const claimPct = s.totalCount > 0 ? (s.claimCount / s.totalCount) * 100 : 0;
  const completedPct = s.totalCount > 0 ? (s.completedCount / s.totalCount) * 100 : 0;
  const pendingPct = s.totalCount > 0 ? (s.pendingCount / s.totalCount) * 100 : 0;

  const newClaimsPct = cStats.totalCount > 0 ? (cStats.newCount / cStats.totalCount) * 100 : 0;
  const raisingClaimsPct = cStats.totalCount > 0 ? (cStats.raisingCount / cStats.totalCount) * 100 : 0;
  const updateClaimsPct = cStats.totalCount > 0 ? (cStats.updateCount / cStats.totalCount) * 100 : 0;
  const acceptedClaimsPct = cStats.totalCount > 0 ? (cStats.acceptedCount / cStats.totalCount) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header for mobile (shown on mobile, hidden on lg header) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between lg:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white">لوحة المعلومات</h1>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">نظام المتابعة الموحد للجمعيات ومزودي الخدمة</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-emerald-100/50 dark:border-emerald-950/40 pb-px">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-4 px-6 text-sm font-extrabold transition-all border-b-2 -mb-px ${
            activeTab === "requests"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          عروض الأسعار والطلبات ({s.totalCount})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`pb-4 px-6 text-sm font-extrabold transition-all border-b-2 -mb-px ${
            activeTab === "claims"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          المطالبات المالية ({cStats.totalCount})
        </button>
      </div>

      {/* Grid of Metric Cards */}
      {activeTab === "requests" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: RFQ */}
          <Link
            href="/portal/requests?status=draft"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600/90 dark:text-emerald-400">طلبات عروض الأسعار</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{s.rfqCount}</h3>
              <p className="text-[10px] text-emerald-500 font-medium">طلبات نشطة بحاجة لتسعير</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-emerald-100 dark:text-emerald-950" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-emerald-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - rfqPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <FileText className="absolute text-emerald-600 dark:text-emerald-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 2: Financial Claims */}
          <Link
            href="/portal/requests?status=to approve"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-teal-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-teal-600/90 dark:text-teal-400">في انتظار الموافقة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{s.claimCount}</h3>
              <p className="text-[10px] text-teal-500 font-medium">عروض أسعار بانتظار الاعتماد</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-teal-100 dark:text-teal-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-teal-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - claimPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <Coins className="absolute text-teal-600 dark:text-teal-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 3: Completed Requests */}
          <Link
            href="/portal/requests?status=purchase"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-green-600/90 dark:text-green-400">الطلبات المعتمدة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{s.completedCount}</h3>
              <p className="text-[10px] text-green-500 font-medium">الطلبات المعتمدة كأوامر شراء</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-green-100 dark:text-green-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-green-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - completedPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <CheckCircle2 className="absolute text-green-600 dark:text-green-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 4: Other Pending Requests */}
          <Link
            href="/portal/requests?status=cancel"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-slate-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الطلبات الملغاة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{s.pendingCount}</h3>
              <p className="text-[10px] text-slate-500 font-medium">الطلبات التي تم إلغاؤها</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-slate-200 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-slate-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - pendingPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <Clock className="absolute text-slate-600 dark:text-slate-400 h-5 w-5" />
            </div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: New Claims */}
          <Link
            href="/portal/claims?status=new"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-gray-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-600/90 dark:text-gray-400">مطالبات جديدة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{cStats.newCount}</h3>
              <p className="text-[10px] text-gray-500 font-medium">مطالبات جديدة بانتظار الرفع</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-gray-100 dark:text-gray-950" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-gray-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - newClaimsPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <FileText className="absolute text-gray-600 dark:text-gray-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 2: Raising the Claim */}
          <Link
            href="/portal/claims?status=raising_the_claim"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600/90 dark:text-emerald-400">تم رفع المطالبة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{cStats.raisingCount}</h3>
              <p className="text-[10px] text-emerald-500 font-medium">مطالبات مرفوعة للمراجعة والتدقيق</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-emerald-100 dark:text-emerald-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-emerald-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - raisingClaimsPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <Clock className="absolute text-emerald-600 dark:text-emerald-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 3: Update the Claim */}
          <Link
            href="/portal/claims?status=update_the_claim"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-amber-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600/90 dark:text-amber-400">طلب تعديل</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{cStats.updateCount}</h3>
              <p className="text-[10px] text-amber-500 font-medium">مطالبات بحاجة لتعديل وتحديث</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-amber-100 dark:text-amber-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-amber-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - updateClaimsPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <Activity className="absolute text-amber-600 dark:text-amber-400 h-5 w-5" />
            </div>
          </Link>

          {/* Card 4: Claim Accepted */}
          <Link
            href="/portal/claims?status=claim_accepted"
            className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600/90 dark:text-emerald-400">تم قبول المطالبة</span>
              <h3 className="text-3xl font-extrabold text-emerald-955 dark:text-white">{cStats.acceptedCount}</h3>
              <p className="text-[10px] text-emerald-500 font-medium">مطالبات معتمدة ومقبولة للدفع</p>
            </div>
            <div className="relative flex items-center justify-center h-14 w-14">
              <svg className="circular-progress h-14 w-14">
                <circle className="text-emerald-100 dark:text-emerald-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
                <circle className="text-emerald-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - acceptedClaimsPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              </svg>
              <CheckCircle2 className="absolute text-emerald-600 dark:text-emerald-400 h-5 w-5" />
            </div>
          </Link>
        </div>
      )}

      {/* Main Grid for lists and Sidebars */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Lists */}
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-white">
                {activeTab === "requests" ? "آخر طلبات عروض الأسعار" : "آخر المطالبات المالية"}
              </h2>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400">
                آخر 5 عناصر تم تحديثها في النظام
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={activeTab === "requests" ? "/portal/requests" : "/portal/claims"}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 transition"
              >
                <span>عرض الكل</span>
                <ChevronLeft size={14} />
              </Link>
            </div>
          </div>

          {activeTab === "requests" ? (
            recentRequests.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 rounded-2xl p-6">
                <FileText className="text-emerald-300 dark:text-emerald-700 h-10 w-10" />
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400">لا توجد طلبات مسجلة حالياً</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm whitespace-nowrap md:whitespace-normal">
                  <thead>
                    <tr className="border-b border-emerald-50 dark:border-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <th className="pb-3 px-2">رقم الطلب</th>
                      <th className="pb-3 px-2">المستفيد</th>
                      <th className="pb-3 px-2">الجمعية الأهلية</th>
                      <th className="pb-3 px-2">مزود الخدمة</th>
                      <th className="pb-3 px-2">الحالة</th>
                      <th className="pb-3 px-2 text-left">التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/50 dark:divide-emerald-950/40">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors">
                        <td className="py-4 px-2 font-semibold text-emerald-800 dark:text-emerald-300">
                          <Link href={`/portal/requests/${req.id}`} className="hover:underline">
                            {req.name}
                          </Link>
                        </td>
                        <td className="py-4 px-2 text-emerald-950 dark:text-white font-medium">{req.beneficiaryName}</td>
                        <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">{req.charityName}</td>
                        <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">{req.providerName}</td>
                        <td className="py-4 px-2">{getStatusBadge(req.status)}</td>
                        <td className="py-4 px-2 text-left font-bold text-emerald-950 dark:text-emerald-100">
                          {req.cost > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              {req.cost.toLocaleString()}
                              <SaudiRiyalIcon size={10} />
                            </span>
                          ) : (
                            "لم تسعر بعد"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            recentClaims.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 rounded-2xl p-6">
                <Coins className="text-emerald-300 dark:text-emerald-700 h-10 w-10" />
                <span className="text-xs text-emerald-600/70 dark:text-emerald-400">لا توجد مطالبات مالية مسجلة حالياً</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm whitespace-nowrap md:whitespace-normal">
                  <thead>
                    <tr className="border-b border-emerald-50 dark:border-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <th className="pb-3 px-2">رقم المطالبة</th>
                      <th className="pb-3 px-2">الخدمة الفرعية</th>
                      <th className="pb-3 px-2">الجمعية الأهلية</th>
                      <th className="pb-3 px-2">مزود الخدمة</th>
                      <th className="pb-3 px-2">الحالة</th>
                      <th className="pb-3 px-2 text-left">التكلفة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/50 dark:divide-emerald-950/40">
                    {recentClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors">
                        <td className="py-4 px-2 font-semibold text-emerald-800 dark:text-emerald-300">
                          <Link href={`/portal/claims/${claim.purchaseOrderId}`} className="hover:underline">
                            {claim.requestNumber}
                          </Link>
                        </td>
                        <td className="py-4 px-2 text-emerald-950 dark:text-white font-medium">{claim.subServiceType}</td>
                        <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">{claim.charityName}</td>
                        <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">{claim.providerName}</td>
                        <td className="py-4 px-2">{getClaimStatusBadge(claim.claimStatus)}</td>
                        <td className="py-4 px-2 text-left font-bold text-emerald-950 dark:text-emerald-100">
                          {claim.serviceCost > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              {claim.serviceCost.toLocaleString()}
                              <SaudiRiyalIcon size={10} />
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Right Column: Circular Summary indicator & Legends */}
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-white">
              {activeTab === "requests" ? "ملخص توزيع عروض الأسعار" : "ملخص توزيع المطالبات"}
            </h2>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400">
              {activeTab === "requests" ? "نسبة توزيع الطلبات عبر المراحل المختلفة" : "نسبة توزيع المطالبات بحسب حالتها"}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            {activeTab === "requests" ? (
              <>
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.totalCount}</span>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400 font-bold">إجمالي الطلبات</span>
                  </div>
                  <svg className="circular-progress h-32 w-32">
                    <circle className="text-slate-100 dark:text-slate-900" strokeWidth="8" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    {s.totalCount > 0 && (
                      <circle className="text-emerald-500" strokeWidth="8" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - rfqPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    )}
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>عروض أسعار ({rfqPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-teal-500" />
                    <span>المطالبات ({claimPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-green-500" />
                    <span>مكتملة ({completedPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-slate-400" />
                    <span>أخرى المعلقة ({pendingPct.toFixed(0)}%)</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative h-32 w-32 flex items-center justify-center">
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-3xl font-extrabold text-emerald-950 dark:text-white">{cStats.totalCount}</span>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400 font-bold">إجمالي المطالبات</span>
                  </div>
                  <svg className="circular-progress h-32 w-32">
                    <circle className="text-slate-100 dark:text-slate-900" strokeWidth="8" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    {cStats.totalCount > 0 && (
                      <circle className="text-emerald-500" strokeWidth="8" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - newClaimsPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    )}
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-gray-500" />
                    <span>جديدة ({newClaimsPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>مرفوعة ({raisingClaimsPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-amber-500" />
                    <span>طلب تعديل ({updateClaimsPct.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>مقبولة ({acceptedClaimsPct.toFixed(0)}%)</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Info Alerts */}
          <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 p-4 border border-emerald-100/30 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            {activeTab === "requests" ? (
              <>
                <span className="font-bold block mb-1">دليل دورة حياة الطلب:</span>
                تبدأ الدورة بإنشاء الطلب في مرحلة <strong className="text-emerald-600 dark:text-emerald-400">طلب عروض أسعار (RFQ)</strong> ليقوم المزودون بالتسعير، ومن ثم تقوم الجمعية باعتماد العرض المناسب ليتحول للتشغيل و <strong className="text-emerald-600 dark:text-emerald-400">رفع المطالبة المالية</strong> فور تقديم الخدمة.
              </>
            ) : (
              <>
                <span className="font-bold block mb-1">دليل دورة حياة المطالبة:</span>
                تبدأ المطالبة بمجرد صدور أمر الشراء كحالة <strong className="text-emerald-600 dark:text-emerald-400">جديدة</strong>، ليقوم مزود الخدمة برفعها للجمعية للمراجعة، وتتحول لحالة <strong className="text-emerald-600 dark:text-emerald-400">تم قبول المطالبة</strong> للدفع بعد موافقة الجمعية.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
