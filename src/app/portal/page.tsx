"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Coins, 
  Plus, 
  ChevronLeft
} from "lucide-react";
import toast from "react-hot-toast";

interface StatMetrics {
  rfqCount: number;
  claimCount: number;
  completedCount: number;
  pendingCount: number;
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

export default function PortalDashboard() {
  const [stats, setStats] = useState<StatMetrics | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch current user role to toggle create request button
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserRole(userData.user.role);
        }

        const statsRes = await fetch("/api/stats");
        if (!statsRes.ok) throw new Error("فشل تحميل البيانات");
        
        const data = await statsRes.json();
        setStats(data.stats);
        setRecentRequests(data.recentRequests);
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

  // Fallback if stats is null
  const s = stats || { rfqCount: 0, claimCount: 0, completedCount: 0, pendingCount: 0, totalCount: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-900/60 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">مسودة</span>;
      case "RFQ":
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-pulse">طلب تسعير</span>;
      case "BENEFICIARY_CONTRIBUTION":
        return <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 dark:bg-sky-950/60 px-2 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">مساهمة المستفيد</span>;
      case "RAISING_CLAIM":
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">رفع المطالبة</span>;
      case "CLAIM_REVIEW":
        return <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 dark:bg-teal-950/60 px-2 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">مراجعة المطالبة</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 rounded-md bg-green-100 dark:bg-green-950/60 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-300">مكتمل</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 dark:bg-rose-950/60 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">ملغي</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{status}</span>;
    }
  };

  // Percentages for rings
  const rfqPct = s.totalCount > 0 ? (s.rfqCount / s.totalCount) * 100 : 0;
  const claimPct = s.totalCount > 0 ? (s.claimCount / s.totalCount) * 100 : 0;
  const completedPct = s.totalCount > 0 ? (s.completedCount / s.totalCount) * 100 : 0;
  const pendingPct = s.totalCount > 0 ? (s.pendingCount / s.totalCount) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header for mobile (shown on mobile, hidden on lg header) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between lg:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white">لوحة المعلومات</h1>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">نظام المتابعة الموحد للجمعيات ومزودي الخدمة</p>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: RFQ */}
        <div className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600/90 dark:text-emerald-400">طلبات عروض الأسعار</span>
            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.rfqCount}</h3>
            <p className="text-[10px] text-emerald-500 font-medium">طلبات نشطة بحاجة لتسعير</p>
          </div>
          <div className="relative flex items-center justify-center h-14 w-14">
            <svg className="circular-progress h-14 w-14">
              <circle className="text-emerald-100 dark:text-emerald-950" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              <circle className="text-emerald-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - rfqPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
            </svg>
            <FileText className="absolute text-emerald-600 dark:text-emerald-400 h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Financial Claims */}
        <div className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-teal-100/50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-teal-600/90 dark:text-teal-400">المطالبات المالية</span>
            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.claimCount}</h3>
            <p className="text-[10px] text-teal-500 font-medium">مطالبات قيد المراجعة والدفع</p>
          </div>
          <div className="relative flex items-center justify-center h-14 w-14">
            <svg className="circular-progress h-14 w-14">
              <circle className="text-teal-100 dark:text-teal-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              <circle className="text-teal-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - claimPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
            </svg>
            <Coins className="absolute text-teal-600 dark:text-teal-400 h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Completed Requests */}
        <div className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-green-600/90 dark:text-green-400">الطلبات المكتملة</span>
            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.completedCount}</h3>
            <p className="text-[10px] text-green-500 font-medium">الخدمات التي تم إغلاقها بنجاح</p>
          </div>
          <div className="relative flex items-center justify-center h-14 w-14">
            <svg className="circular-progress h-14 w-14">
              <circle className="text-green-100 dark:text-green-950/60" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              <circle className="text-green-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - completedPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
            </svg>
            <CheckCircle2 className="absolute text-green-600 dark:text-green-400 h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Other Pending Requests */}
        <div className="glass-card hover-card rounded-3xl p-6 shadow-sm border border-slate-100/50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">الطلبات الأخرى المعلقة</span>
            <h3 className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.pendingCount}</h3>
            <p className="text-[10px] text-slate-500 font-medium">طلبات مسودة أو قيد سداد المستفيد</p>
          </div>
          <div className="relative flex items-center justify-center h-14 w-14">
            <svg className="circular-progress h-14 w-14">
              <circle className="text-slate-200 dark:text-slate-800" strokeWidth="4" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
              <circle className="text-slate-500" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - pendingPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="22" cx="28" cy="28" />
            </svg>
            <Clock className="absolute text-slate-600 dark:text-slate-400 h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Requests Table */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-950 dark:text-white">آخر الطلبات والأنشطة</h2>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400">آخر 5 طلبات تم تحديثها في النظام</p>
            </div>
            
            <div className="flex gap-2">
              <Link
                href="/portal/requests"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 transition"
              >
                <span>عرض الكل</span>
                <ChevronLeft size={14} />
              </Link>

              {(userRole === "CHARITY_STAFF" || userRole === "SUPER_ADMIN") && (
                <Link
                  href="/portal/requests?create=true"
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/10 transition"
                >
                  <Plus size={14} />
                  <span>طلب جديد</span>
                </Link>
              )}
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 rounded-2xl p-6">
              <FileText className="text-emerald-300 dark:text-emerald-700 h-10 w-10" />
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400">لا توجد طلبات مسجلة حالياً</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-emerald-50 dark:border-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <th className="pb-3 pr-2">رقم الطلب</th>
                    <th className="pb-3">المستفيد</th>
                    <th className="pb-3">الجمعية الأهلية</th>
                    <th className="pb-3">مزود الخدمة</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3 pl-2 text-left">التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50 dark:divide-emerald-950/40">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors">
                      <td className="py-4 pr-2 font-semibold text-emerald-800 dark:text-emerald-300">
                        <Link href={`/portal/requests/${req.id}`} className="hover:underline">
                          {req.name}
                        </Link>
                      </td>
                      <td className="py-4 text-emerald-950 dark:text-white font-medium">{req.beneficiaryName}</td>
                      <td className="py-4 text-slate-600 dark:text-slate-300 text-xs">{req.charityName}</td>
                      <td className="py-4 text-slate-600 dark:text-slate-300 text-xs">{req.providerName}</td>
                      <td className="py-4">{getStatusBadge(req.status)}</td>
                      <td className="py-4 pl-2 text-left font-bold text-emerald-950 dark:text-emerald-100">
                        {req.cost > 0 ? `${req.cost.toLocaleString()} ر.س` : "لم تسعر بعد"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Circular Summary indicator & Shortcuts */}
        <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-emerald-950 dark:text-white">ملخص توزيع الحالات</h2>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400">نسبة توزيع الطلبات عبر المراحل المختلفة</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="relative h-32 w-32 flex items-center justify-center">
              {/* Outer Layer: Total number of requests in the middle */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-3xl font-extrabold text-emerald-950 dark:text-white">{s.totalCount}</span>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400 font-bold">إجمالي الطلبات</span>
              </div>
              <svg className="circular-progress h-32 w-32">
                <circle className="text-slate-100 dark:text-slate-900" strokeWidth="8" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                {s.totalCount > 0 && (
                  <>
                    {/* Ring for RFQ */}
                    <circle className="text-emerald-500" strokeWidth="8" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - rfqPct / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="54" cx="64" cy="64" />
                    {/* Inner elements represent summary splits */}
                  </>
                )}
              </svg>
            </div>

            {/* Legends */}
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
          </div>

          {/* Quick Info Alerts */}
          <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 p-4 border border-emerald-100/30 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            <span className="font-bold block mb-1">دليل دورة حياة الطلب (Odoo-Inspired):</span>
            تبدأ الدورة بإنشاء الطلب في مرحلة <strong className="text-emerald-600 dark:text-emerald-400">طلب عروض أسعار (RFQ)</strong> ليقوم المزودون بالتسعير، ومن ثم تقوم الجمعية باعتماد العرض المناسب ليتحول للتشغيل و <strong className="text-emerald-600 dark:text-emerald-400">رفع المطالبة المالية</strong> فور تقديم الخدمة.
          </div>
        </div>
      </div>
    </div>
  );
}
