"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  ShieldAlert,
  CheckCircle2,
  Coins,
  AlertCircle,
  FileCheck2,
  Wrench,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Download,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { SaudiRiyalIcon } from "@/components/ui/SaudiRiyalIcon";
import Select from "@/components/ui/Select";
import AttachmentPreview from "@/components/ui/AttachmentPreview";

interface PriceOffer {
  id: number;
  amountTotal: number;
  status: string;
  notes: string | null;
  createdAt: string;
  provider: {
    id: number;
    name: string;
    code: string;
    apiCode?: string;
  };
}

interface RequestDetail {
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
  charityId: number;
  charity: {
    name: string;
    token?: string;
  };
  serviceProviderId: number | null;
  serviceProvider?: { name: string } | null;
  priceOffers: PriceOffer[];
  agreedProducts?: any[];
  offerLines?: { id: number; name: string; price_subtotal: number; price_unit: number; product_id: number; product_qty: number }[];
  offerNotes?: string | null;
  providerNote?: string | null;
  requestReportAttachment?: { attachment_id: number; name: string; url: string; mimetype: string } | null;
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  charity?: {
    id: number;
    name: string;
    token?: string;
  } | null;
  provider?: {
    id: number;
    name: string;
    apiCode?: string;
  } | null;
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; mimetype: string } | null>(null);

  // Form states: Price Offer
  const [providerNote, setProviderNote] = useState("");
  const [offerLines, setOfferLines] = useState<{
    id: string;
    productId: number | "";
    price: string;
    productName: string;
    productCode: string;
    discount?: string;
    tax?: string;
    qty?: string;
  }[]>([
    { id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "", discount: "", tax: "", qty: "1" }
  ]);
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Form states: Financial Claim
  const [claimType, setClaimType] = useState("full_claim");
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Action states: Approve/Reject Claims or Offers
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequestAndUser = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch session details
      let sessionData: { user: SessionUser } | null = null;
      const sessionRes = await fetch("/api/auth/me");
      if (sessionRes.ok) {
        sessionData = await sessionRes.json();
        if (sessionData) {
          setSession(sessionData.user);
        }
      }

      // Fetch request detail
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("غير مصرح لك باستعراض هذا الطلب");
          router.push("/portal/requests");
          return;
        }
        throw new Error("فشل تحميل تفاصيل الطلب");
      }
      const data = await res.json();
      setRequest(data.request);

      // Prepopulate with existing offer lines from Odoo
      if (sessionData?.user?.role === "SERVICE_PROVIDER" && data.request.offerLines && data.request.offerLines.length > 0) {
        const agreedProds = data.request.agreedProducts || [];
        setOfferLines(data.request.offerLines.map((l: any) => {
          const matchedProd = agreedProds.find((p: any) => p.product_id === l.product_id);
          return {
            id: Date.now().toString() + Math.random().toString(),
            productId: l.product_id,
            price: l.price_unit.toString(),
            productName: l.name || matchedProd?.provider_product_name || "",
            productCode: matchedProd?.provider_product_code || "",
            discount: matchedProd?.discount_percentage?.toString() || "0",
            tax: matchedProd?.tax?.toString() || "0",
            qty: (l.product_qty || 1).toString(),
          };
        }));
        setProviderNote(data.request.providerNote || "");
      } else if (sessionData?.user?.role === "SERVICE_PROVIDER") {
        // No existing lines, start with empty form
        setOfferLines([{ id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "", discount: "", tax: "", qty: "1" }]);
      }
    } catch (error) {
      console.error(error);
      toast.error("خطأ أثناء تحميل تفاصيل الطلب");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequestAndUser();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRequestAndUser]);

  // Submit Price Offer
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferSubmitting(true);

    if (offerLines.length === 0) {
      toast.error("يرجى إضافة بند واحد على الأقل");
      setOfferSubmitting(false);
      return;
    }

    for (const line of offerLines) {
      if (!line.productId) {
        toast.error("يرجى اختيار المنتج لجميع البنود المضافة");
        setOfferSubmitting(false);
        return;
      }
      const priceVal = parseFloat(line.price);
      if (isNaN(priceVal) || priceVal <= 0) {
        const matchedProd = request?.agreedProducts?.find((p: any) => p.product_id === Number(line.productId));
        const lineForProduct = request?.offerLines?.find((ol: any) => ol.product_id === Number(line.productId));
        const displayName = lineForProduct?.name || matchedProd?.provider_product_name || `البند المختار`;
        toast.error(`يرجى إدخال سعر صحيح أكبر من الصفر للبند "${displayName}"`);
        setOfferSubmitting(false);
        return;
      }
      const qtyVal = parseFloat(line.qty || "1");
      if (isNaN(qtyVal) || qtyVal <= 0) {
        const matchedProd = request?.agreedProducts?.find((p: any) => p.product_id === Number(line.productId));
        const lineForProduct = request?.offerLines?.find((ol: any) => ol.product_id === Number(line.productId));
        const displayName = lineForProduct?.name || matchedProd?.provider_product_name || `البند المختار`;
        toast.error(`يرجى إدخال كمية صحيحة أكبر من الصفر للبند "${displayName}"`);
        setOfferSubmitting(false);
        return;
      }
      const matchedProduct = request?.agreedProducts?.find((p: any) => p.product_id === Number(line.productId));
      if (matchedProduct && priceVal > matchedProduct.cost_price) {
        const lineForProduct = request?.offerLines?.find((ol: any) => ol.product_id === matchedProduct.product_id);
        const displayName = lineForProduct?.name || matchedProduct.provider_product_name || `منتج ${matchedProduct.product_id}`;
        toast.error(`سعر البند "${displayName}" لا يمكن أن يتجاوز السعر المعتمد (${matchedProduct.cost_price})`);
        setOfferSubmitting(false);
        return;
      }
    }

    try {
      const formattedLines = offerLines.map(l => ({
        productId: Number(l.productId),
        price: parseFloat(l.price),
        qty: parseFloat(l.qty || "1") || 1,
        discount: parseFloat(l.discount || "0") || 0,
      }));

      const res = await fetch(`/api/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: formattedLines,
          provider_note: providerNote
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تقديم عرض السعر");

      toast.success("تم إرسال عرض السعر الخاص بك بنجاح!");
      loadRequestAndUser();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء تقديم العرض");
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Select / Approve Price Offer
  const handleApproveOffer = async (offerId: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في الموافقة على عرض السعر هذا وترسية الطلب عليه؟")) return;

    if (!request) return;
    const selectedOffer = request.priceOffers.find((o) => o.id === offerId);
    if (!selectedOffer) {
      toast.error("عرض السعر غير موجود");
      return;
    }

    const code = selectedOffer.provider?.apiCode || "";
    const token = session?.charity?.token || request.charity?.token || "";

    setActionLoading(true);
    try {
      // 1. Approve offer on external ERP API
      const resOffer = await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          code,
          token,
        }),
      });

      const dataOffer = await resOffer.json();
      if (!resOffer.ok) throw new Error(dataOffer.message || "فشل الموافقة على عرض السعر في النظام الخارجي");

      // 2. Calculate contributions
      const offerAmount = selectedOffer.amountTotal;
      const initialBeneficiary = request.beneficiaryContributionValue || 0;
      const charityPercentage = request.charityContributionPercentage || 100;

      const remaining = Math.max(0, offerAmount - initialBeneficiary);
      const charityVal = remaining * (charityPercentage / 100);
      const finalBeneficiaryVal = initialBeneficiary + (remaining - charityVal);

      // 3. Update the local request status and values in our database
      const resRequest = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RAISING_CLAIM",
          serviceCost: offerAmount,
          charityContributionValue: charityVal,
          beneficiaryContributionValue: finalBeneficiaryVal,
          serviceProviderId: selectedOffer.provider.id,
        }),
      });

      const dataRequest = await resRequest.json();
      if (!resRequest.ok) throw new Error(dataRequest.message || "فشل تحديث حالة الطلب في قاعدة البيانات");

      toast.success("تم اعتماد عرض السعر بنجاح وترسية الخدمة!");
      loadRequestAndUser();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء معالجة الطلب");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Financial Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimSubmitting(true);

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLAIM_REVIEW" }), // transition to CLAIM_REVIEW
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تقديم المطالبة المالية");

      toast.success("تم تقديم المطالبة المالية بنجاح وهي قيد المراجعة حالياً!");
      loadRequestAndUser();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء تقديم المطالبة");
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Process Claim (Approve/Reject)
  const handleProcessClaim = async (approve: boolean) => {
    const actionText = approve ? "اعتماد الصرف وتأكيد الإغلاق؟" : "رفض المطالبة وإعادة الطلب لمرحلة الرفع؟";
    if (!confirm(`هل أنت متأكد من رغبتك في ${actionText}`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: approve ? "COMPLETED" : "RAISING_CLAIM"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل معالجة المطالبة المالية");

      toast.success(approve ? "تم اعتماد الصرف بنجاح وإكمال الطلب!" : "تم رفض المطالبة وإعادتها لمزود الخدمة للتعديل");
      loadRequestAndUser();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء معالجة المطالبة");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-emerald-800 dark:text-emerald-300">جاري تحميل تفاصيل الطلب...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12 space-y-4">
        <ShieldAlert className="mx-auto text-rose-500 h-12 w-12" />
        <h3 className="text-lg font-bold text-emerald-950">الطلب غير موجود</h3>
        <button onClick={() => router.push("/portal/requests")} className="text-xs text-emerald-600 underline">
          العودة لقائمة الطلبات
        </button>
      </div>
    );
  }

  const { role, provider } = session || {};
  const isOwnerProvider = request.serviceProviderId === provider?.id;

  // Odoo status helper mapping
  const getOdooStatusLabelAndStyle = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "draft":
        return { label: "مسودة عرض تسعير", bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-350 dark:border-slate-800" };
      case "sent":
        return { label: "طلب تسعير مرسل", bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-450 dark:border-blue-900/50" };
      case "to approve":
        return { label: "في انتظار الموافقة", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900/50" };
      case "purchase":
        return { label: "أمر شراء", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50" };
      case "approved":
        return { label: "معتمد من الجمعية", bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-450 dark:border-teal-900/50" };
      case "done":
        return { label: "مكتمل / منتهي", bg: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-450 dark:border-green-900/50" };
      case "cancel":
      case "cancel_done":
        return { label: "ملغي", bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50" };
      case "rfq":
        return { label: "طلب تسعير", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/50" };
      case "beneficiary_contribution":
        return { label: "مساهمة المستفيد", bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900/50" };
      case "raising_claim":
        return { label: "رفع المطالبة", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" };
      case "claim_review":
        return { label: "مراجعة المطالبة", bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50" };
      case "completed":
        return { label: "مكتمل", bg: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" };
      case "cancelled":
        return { label: "ملغي", bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50" };
      default:
        return { label: status, bg: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50" };
    }
  };

  const normalizeStatus = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "draft" || s === "sent" || s === "to_approve" || s === "rfq") {
      return "RFQ";
    }
    if (s === "approved" || s === "raising_claim") {
      return "RAISING_CLAIM";
    }
    if (s === "purchase" || s === "claim_review") {
      return "CLAIM_REVIEW";
    }
    if (s === "done" || s === "completed") {
      return "COMPLETED";
    }
    if (s === "cancel" || s === "cancel_done" || s === "cancelled") {
      return "CANCELLED";
    }
    return "RFQ";
  };

  const localStatus = normalizeStatus(request.status);

  // Stages array for visual Odoo timeline
  const stages = [
    { key: "RFQ", label: "عرض السعر" },
    { key: "RAISING_CLAIM", label: "رفع المطالبة" },
    { key: "CLAIM_REVIEW", label: "مراجعة المطالبة" },
    { key: "COMPLETED", label: "مكتمل" }
  ];

  const getStageIndex = (status: string) => {
    return stages.findIndex(s => s.key === status);
  };

  const currentStageIndex = getStageIndex(localStatus);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/portal/requests")}
          className="rounded-xl border border-emerald-100 dark:border-emerald-950 p-2.5 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-emerald-950 dark:text-white">تفاصيل الطلب {request.name}</h1>
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getOdooStatusLabelAndStyle(request.status).bg}`}>
              {getOdooStatusLabelAndStyle(request.status).label}
            </span>
          </div>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400 mt-0.5 md:mt-0">متابعة ومعالجة حالة الطلب والمطالبات المالية في أودو</p>
        </div>
      </div>

      {/* Main content columns */}
      <div className="space-y-6">

        {/* Left Column: Core Request Information */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-6">
            <h2 className="text-base font-extrabold text-emerald-950 dark:text-white border-b border-emerald-50 dark:border-emerald-950 pb-3">
              البيانات العامة للطلب
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <User size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold">اسم المستفيد</span>
                  <span className="text-sm font-semibold text-emerald-950 dark:text-white">{request.beneficiaryName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold">الهوية الوطنية</span>
                  <span className="text-sm font-semibold text-emerald-950 dark:text-white">{request.beneficiaryNationalId}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Building size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold">الجمعية المانحة</span>
                  <span className="text-sm font-semibold text-emerald-950 dark:text-white">{request.charity.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold">تاريخ تقديم الطلب</span>
                  <span className="text-sm font-semibold text-emerald-950 dark:text-white">
                    {new Date(request.createdAt).toLocaleDateString("ar-SA", { dateStyle: "long" })}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-50 dark:border-emerald-950 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500">تفاصيل الخدمة الطبية المطلوبة:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#03251c]/30 rounded-2xl p-4 min-h-[80px]">
                  {request.description}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500">ملاحظات الطلب:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#03251c]/30 rounded-2xl p-4 min-h-[80px]">
                  {request.offerNotes || "لا يوجد ملاحظات للطلب"}
                </p>
              </div>
            </div>

            {request.requestReportAttachment && (
              <div className="border-t border-emerald-50 dark:border-emerald-950 pt-4">
                <span className="text-xs font-bold text-slate-500 block mb-2">مرفق تقرير الطلب:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment({ url: request.requestReportAttachment!.url, name: request.requestReportAttachment!.name, mimetype: request.requestReportAttachment!.mimetype })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-250 text-xs font-semibold hover:bg-emerald-500/10 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-sm hover:shadow cursor-pointer group"
                  >
                    <Paperclip size={13} className="text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <span className="truncate max-w-[250px]">{request.requestReportAttachment.name}</span>
                    <Eye size={13} className="text-emerald-600/70 dark:text-emerald-400/70 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Role-Based Forms Section */}
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-6">
            <h2 className="text-base font-extrabold text-emerald-950 dark:text-white border-b border-emerald-50 dark:border-emerald-950 pb-3">
              إجراءات معالجة الطلب
            </h2>

            {/* A: Form for Service Provider in RFQ stage */}
            {role === "SERVICE_PROVIDER" && localStatus === "RFQ" && (
              <form onSubmit={handleSubmitOffer} noValidate className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <AlertCircle size={16} />
                  <span>يمكنك تقديم سعر عرض لهذه الخدمة الطبية كشريك مسجل. يرجى إدخال التكلفة الإجمالية بدقة.</span>
                </div>

                <div className="input-group mt-4">
                  <label>ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="فترة التشغيل، التفاصيل، إلخ..."
                    value={providerNote}
                    onChange={(e) => setProviderNote(e.target.value)}
                  />
                </div>

                <div className="space-y-4 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">المنتجات / الخدمات (البنود)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const maxProducts = request.agreedProducts?.length || 0;
                        if (offerLines.length >= maxProducts) {
                          toast.error("لقد قمت بإضافة جميع المنتجات المتاحة في هذا الطلب");
                          return;
                        }
                        setOfferLines([...offerLines, { id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "", discount: "", tax: "", qty: "1" }]);
                      }}
                      className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
                    >
                      + إضافة بند
                    </button>
                  </div>

                  {offerLines.map((line, index) => {
                    const matchedProduct = request.agreedProducts?.find((p: any) => p.product_id === line.productId);
                    return (
                      <div key={line.id} className="bg-white dark:bg-[#03251c] p-4 rounded-xl shadow-sm border border-emerald-50 dark:border-emerald-900/30 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          {/* Row 1: Product selector */}
                          {request.agreedProducts && request.agreedProducts.length > 0 && (
                            <div className="input-group md:col-span-4">
                              <label className="text-[10px]">المنتج / الخدمة</label>
                              <Select
                                value={line.productId}
                                onChange={(val) => {
                                  const numVal = val ? Number(val) : "";
                                  const newLines = [...offerLines];
                                  newLines[index].productId = numVal;

                                  if (numVal) {
                                    const prod = request.agreedProducts?.find((p: any) => p.product_id === numVal);
                                    // Look up the product name from existing offerLines data (Odoo line name)
                                    const existingLine = request.offerLines?.find((ol: any) => ol.product_id === numVal);
                                    if (prod) {
                                      newLines[index].price = prod.cost_price.toString();
                                      newLines[index].productName = existingLine?.name || prod.provider_product_name || "";
                                      newLines[index].productCode = prod.provider_product_code || "";
                                      newLines[index].discount = (prod.discount_percentage ?? 0).toString();
                                      newLines[index].tax = (prod.tax ?? 0).toString();
                                      newLines[index].qty = "1";
                                    }
                                  } else {
                                    newLines[index].price = "";
                                    newLines[index].productName = "";
                                    newLines[index].productCode = "";
                                    newLines[index].discount = "";
                                    newLines[index].tax = "";
                                    newLines[index].qty = "1";
                                  }
                                  setOfferLines(newLines);
                                }}
                                options={request.agreedProducts.map((p: any) => {
                                  const isSelectedElsewhere = offerLines.some(l => l.id !== line.id && l.productId === p.product_id);
                                  // Get product name from existing Odoo lines first, then provider_product_name
                                  const lineForProduct = request.offerLines?.find((ol: any) => ol.product_id === p.product_id);
                                  const displayName = lineForProduct?.name || p.provider_product_name || `منتج ${p.product_id}`;
                                  return {
                                    value: p.product_id,
                                    label: `${displayName} (التكلفة: ${p.cost_price})`,
                                    disabled: isSelectedElsewhere,
                                  };
                                })}
                                placeholder="-- اختر المنتج --"
                                showEmptyOption={true}
                                emptyOptionLabel="-- اختر المنتج --"
                                className="w-full text-xs"
                              />
                            </div>
                          )}

                          <div className="input-group md:col-span-4">
                            <label className="text-[10px]">اسم المنتج</label>
                            <input
                              type="text"
                              value={line.productName}
                              onChange={(e) => {
                                const newLines = [...offerLines];
                                newLines[index].productName = e.target.value;
                                setOfferLines(newLines);
                              }}
                              placeholder="اسم المنتج"
                              className="w-full text-xs"
                              readOnly={!!matchedProduct}
                            />
                          </div>

                          <div className="input-group md:col-span-4">
                            <label className="text-[10px]">كود المنتج</label>
                            <input
                              type="text"
                              value={line.productCode}
                              onChange={(e) => {
                                const newLines = [...offerLines];
                                newLines[index].productCode = e.target.value;
                                setOfferLines(newLines);
                              }}
                              placeholder="كود المنتج"
                              className="w-full text-xs"
                              readOnly={!!matchedProduct}
                            />
                          </div>
                        </div>

                        {/* Row 2: Price, Quantity, Discount, Tax, Line Total, Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">

                          <div className="input-group md:col-span-2">
                            <label className="text-[10px] flex items-center gap-0.5">
                              السعر (بحد أقصى: {matchedProduct?.cost_price || 0}
                              <SaudiRiyalIcon size={8} />)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={matchedProduct?.cost_price}
                              required
                              value={line.price}
                              onChange={(e) => {
                                const newLines = [...offerLines];
                                newLines[index].price = e.target.value;
                                setOfferLines(newLines);
                              }}
                              placeholder="مثال: 500"
                              className="w-full text-xs"
                            />
                          </div>

                          <div className="input-group md:col-span-2">
                            <label className="text-[10px]">الكمية</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={line.qty || "1"}
                              onChange={(e) => {
                                const newLines = [...offerLines];
                                newLines[index].qty = e.target.value;
                                setOfferLines(newLines);
                              }}
                              placeholder="1"
                              className="w-full text-xs"
                            />
                          </div>

                          <div className="input-group md:col-span-2">
                            <label className="text-[10px]">الخصم (%)</label>
                            <input
                              type="text"
                              readOnly
                              value={line.discount ? `${line.discount}%` : "0%"}
                              className="w-full text-xs bg-slate-100 dark:bg-slate-900/50 cursor-default"
                            />
                          </div>

                          <div className="input-group md:col-span-2">
                            <label className="text-[10px]">الضريبة (%)</label>
                            <input
                              type="text"
                              readOnly
                              value={line.tax ? `${line.tax}%` : "0%"}
                              className="w-full text-xs bg-slate-100 dark:bg-slate-900/50 cursor-default"
                            />
                          </div>

                          <div className="input-group md:col-span-2">
                            <label className="text-[10px] flex items-center gap-0.5">
                              الإجمالي الشامل
                              <SaudiRiyalIcon size={8} />
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={(() => {
                                const price = parseFloat(line.price) || 0;
                                const qty = parseFloat(line.qty || "1") || 1;
                                const disc = parseFloat(line.discount || "0") || 0;
                                const tx = parseFloat(line.tax || "0") || 0;
                                const subtotal = price * qty;
                                const priceAfterDiscount = subtotal * (1 - disc / 100);
                                const lineTotal = priceAfterDiscount * (1 + tx / 100);
                                return lineTotal.toFixed(2);
                              })()}
                              className="w-full text-xs bg-slate-100 dark:bg-slate-900/50 font-bold text-emerald-700 dark:text-emerald-400 cursor-default"
                            />
                          </div>

                          <div className="md:col-span-2 flex justify-end">
                            {offerLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOfferLines(offerLines.filter(l => l.id !== line.id));
                                }}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors text-xs"
                                title="حذف البند"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center pt-2 px-2 text-sm">
                    <span className="font-bold text-slate-600 dark:text-slate-400">الإجمالي الشامل (شامل الخصم والضريبة):</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                      {offerLines.reduce((acc, curr) => {
                        const price = parseFloat(curr.price) || 0;
                        const qty = parseFloat(curr.qty || "1") || 1;
                        const disc = parseFloat(curr.discount || "0") || 0;
                        const tx = parseFloat(curr.tax || "0") || 0;
                        const subtotal = price * qty;
                        const afterDisc = subtotal * (1 - disc / 100);
                        const lineTot = afterDisc * (1 + tx / 100);
                        return acc + lineTot;
                      }, 0).toFixed(2)}
                      <SaudiRiyalIcon size={12} />
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn"
                >
                  {offerSubmitting ? "جاري الإرسال..." : "تقديم / تحديث عرض السعر"}
                </button>
              </form>
            )}

            {/* B: Form for Service Provider in RAISING_CLAIM stage */}
            {role === "SERVICE_PROVIDER" && localStatus === "RAISING_CLAIM" && isOwnerProvider && (
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <FileCheck2 size={18} />
                  <span>تم اعتماد عرض السعر الخاص بك! يرجى تقديم مطالبة مالية فور الانتهاء من أداء الخدمة ليتم تحويل المستحقات.</span>
                </div>

                <div className="input-group">
                  <label>نوع المطالبة</label>
                  <select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
                    <option value="full_claim">مطالبة مالية كاملة (100% من التكلفة)</option>
                    <option value="partial_claim">مطالبة مالية جزئية</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn"
                >
                  {claimSubmitting ? "جاري الإرسال..." : "تقديم المطالبة المالية للصرف"}
                </button>
              </form>
            )}

            {/* C: Form for Charity Staff / Admin to review a submitted financial claim */}
            {role === "SUPER_ADMIN" && localStatus === "CLAIM_REVIEW" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-100/30 flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
                  <Coins size={18} />
                  <span>قدم مزود الخدمة ({request.serviceProvider?.name}) مطالبة مالية لتسوية الخدمة. يرجى مراجعة التقارير واعتماد الصرف.</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleProcessClaim(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 px-5 py-3 text-xs font-bold text-white shadow transition"
                  >
                    <ThumbsUp size={14} />
                    <span>اعتماد الصرف وإغلاق الطلب</span>
                  </button>

                  <button
                    onClick={() => handleProcessClaim(false)}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 px-5 py-3 text-xs font-bold transition"
                  >
                    <ThumbsDown size={14} />
                    <span>رفض المطالبة وإعادة التعديل</span>
                  </button>
                </div>
              </div>
            )}

            {/* D: General statuses where no actions are pending */}
            {localStatus === "COMPLETED" && (
              <div className="rounded-2xl bg-green-50 dark:bg-green-950/40 p-5 border border-green-100/30 flex items-center gap-3 text-sm text-green-800 dark:text-green-300 font-semibold">
                <CheckCircle2 size={20} className="text-green-600" />
                <span>تم اكتمال هذا الطلب وإغلاقه وصرف المستحقات بنجاح!</span>
              </div>
            )}

            {role === "SERVICE_PROVIDER" && localStatus === "RAISING_CLAIM" && !isOwnerProvider && (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#03251c]/30 p-4 text-xs text-slate-500">
                تمت ترسية هذا الطلب على مزود خدمة آخر.
              </div>
            )}

            {role === "SERVICE_PROVIDER" && localStatus === "CLAIM_REVIEW" && isOwnerProvider && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                تم تقديم مطالبتك المالية بنجاح. يرجى الانتظار لحين قيام ممثلي الجمعية بمراجعة المستندات والصرف.
              </div>
            )}

            {role === "SERVICE_PROVIDER" && localStatus === "CLAIM_REVIEW" && !isOwnerProvider && (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#03251c]/30 p-4 text-xs text-slate-500">
                تمت ترسية هذا الطلب على مزود خدمة آخر وهو في مرحلة المراجعة المالية حالياً.
              </div>
            )}

            {role === "SUPER_ADMIN" && localStatus === "RAISING_CLAIM" && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-5 border border-emerald-100/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <Wrench size={18} />
                <span>الطلب قيد العمل والتشغيل حالياً من قبل مزود الخدمة ({request.serviceProvider?.name}). بانتظار قيام المزود برفع المطالبة المالية للصرف.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <AttachmentPreview
        isOpen={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
        file={previewAttachment}
      />
    </div>
  );
}
