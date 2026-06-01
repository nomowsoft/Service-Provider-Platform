"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Plus, 
  X, 
  Calendar,
  Building,
  Activity,
  Calculator,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceRequestSchema } from "@/lib/zodSchemas";

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

  // Create Request Modal states
  const [showModal, setShowModal] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryNationalId, setBeneficiaryNationalId] = useState("");
  const [description, setDescription] = useState("");
  const [charityPercentage, setCharityPercentage] = useState<number>(100);
  const [beneficiaryValue, setBeneficiaryValue] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch user role
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
      console.error(error);
      toast.error("خطأ أثناء تحميل قائمة الطلبات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if open modal is requested via URL query params
    if (searchParams.get("create") === "true") {
      setTimeout(() => setShowModal(true), 0);
    }
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams, loadData]);

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
    }

    return true;
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors("");

    // Validate with Zod
    const validationResult = serviceRequestSchema.safeParse({
      beneficiaryName,
      beneficiaryNationalId,
      description,
      charityContributionPercentage: charityPercentage,
      beneficiaryContributionValue: beneficiaryValue,
    });

    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues[0].message);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشل إنشاء الطلب");
      }

      toast.success("تم إنشاء طلب الخدمة بنجاح وطرحه للتسعير!");
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      const error = err as Error;
      setFormErrors(error.message || "حدث خطأ غير متوقع");
      toast.error(error.message || "فشل إنشاء الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setBeneficiaryName("");
    setBeneficiaryNationalId("");
    setDescription("");
    setCharityPercentage(100);
    setBeneficiaryValue(0);
    setFormErrors("");
  };

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

        {(userRole === "CHARITY_STAFF" || userRole === "SUPER_ADMIN") && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/10 transition"
          >
            <Plus size={18} />
            <span>طلب خدمة جديد</span>
          </button>
        )}
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
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Modal Backdrop & Sliding Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-card rounded-3xl p-6 shadow-2xl border border-emerald-500/15 max-h-[90vh] overflow-y-auto no-scrollbar animate-scale-in">
            <div className="flex items-center justify-between border-b border-emerald-50 dark:border-emerald-950 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600 h-5 w-5" />
                <h2 className="text-lg font-bold text-emerald-950 dark:text-white">تقديم طلب خدمة جديد</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  router.push("/portal/requests"); // clear query params
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              >
                <X size={20} />
              </button>
            </div>

            {formErrors && (
              <div className="my-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-300 text-center font-medium">
                {formErrors}
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 pt-4">
              <div className="input-group">
                <label>اسم المستفيد ثلاثي</label>
                <input
                  type="text"
                  placeholder="محمد أحمد عسيري"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>رقم الهوية الوطنية للمستفيد</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="10XXXXXXXX"
                  value={beneficiaryNationalId}
                  onChange={(e) => setBeneficiaryNationalId(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>تفاصيل ووصف الخدمة المطلوبة</label>
                <textarea
                  rows={3}
                  placeholder="تفاصيل التقرير الطبي أو الأجهزة التعويضية أو مستلزمات الخدمة المطلوبة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Ratios split */}
              <div className="border border-emerald-500/10 rounded-2xl p-4 bg-emerald-500/5 grid grid-cols-2 gap-4">
                <div className="col-span-2 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <Calculator size={14} strokeWidth={2.5} />
                  <span>توزيع مساهمات سداد تكاليف الخدمة</span>
                </div>
                
                <div className="input-group">
                  <label>نسبة مساهمة الجمعية (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={charityPercentage}
                    onChange={(e) => setCharityPercentage(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>قيمة مساهمة المستفيد (ر.س)</label>
                  <input
                    type="number"
                    min={0}
                    value={beneficiaryValue}
                    onChange={(e) => setBeneficiaryValue(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                
                <p className="col-span-2 text-[10px] text-slate-500 leading-normal">
                  ملاحظة: سيتم تطبيق هذا التوزيع تلقائياً بعد تلقي عروض أسعار الجهات الخدمية وتثبيت تكلفة الخدمة الإجمالية.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                    router.push("/portal/requests"); // clear query params
                  }}
                  className="rounded-xl px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn disabled:opacity-50"
                >
                  {submitting ? "جاري الإرسال..." : "إرسال وتعميم الطلب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
