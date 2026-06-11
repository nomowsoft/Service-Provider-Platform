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
  Calculator,
  FileSpreadsheet,
  AlertCircle,
  FileCheck2,
  Wrench,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import toast from "react-hot-toast";

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
  offerLines?: { id: number; name: string; price_total: number; price_unit: number; product_id: number; product_qty: number }[];
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

  // Form states: Price Offer
  const [offerNotes, setOfferNotes] = useState("");
  const [offerLines, setOfferLines] = useState<{ id: string; productId: number | ""; price: string; productName: string; productCode: string }[]>([
    { id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "" }
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
          };
        }));
        setOfferNotes(data.request.offerNotes || "");
      } else if (sessionData?.user?.role === "SERVICE_PROVIDER") {
        // No existing lines, start with empty form
        setOfferLines([{ id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "" }]);
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

    const validLines = offerLines.filter(l => l.productId !== "" && parseFloat(l.price) > 0);
    if (validLines.length === 0) {
      toast.error("يرجى إدخال منتج واحد وسعر صحيح على الأقل");
      setOfferSubmitting(false);
      return;
    }

    try {
      const formattedLines = validLines.map(l => ({
        productId: Number(l.productId),
        price: parseFloat(l.price)
      }));

      const res = await fetch(`/api/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lines: formattedLines, 
          notes: offerNotes
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

  const currentStageIndex = getStageIndex(request.status);

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
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 dark:text-white">تفاصيل الطلب {request.name}</h1>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400 mt-0.5">متابعة ومعالجة حالة الطلب والمطالبات المالية</p>
        </div>
      </div>

      {/* Odoo Visual Step Tracker */}
      <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          <span className="text-xs font-extrabold text-emerald-950 dark:text-white">حالة الطلب الحالية:</span>
          
          <div className="flex-1 flex flex-row items-center justify-start md:justify-end gap-1 sm:gap-2">
            {stages.map((stage, idx) => {
              const isActive = request.status === stage.key;
              const isPast = idx < currentStageIndex;
              return (
                <div key={stage.key} className="flex items-center">
                  <div 
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all border ${
                      isActive 
                        ? "bg-[#064e3b] text-white border-emerald-950 ring-4 ring-emerald-500/20"
                        : isPast 
                          ? "bg-emerald-550/20 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                          : "bg-slate-100 dark:bg-[#03251c] text-slate-400 dark:text-slate-600 border-slate-200 dark:border-emerald-950"
                    }`}
                  >
                    {stage.label}
                  </div>
                  {idx < stages.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-8 transition ${isPast ? "bg-emerald-500" : "bg-slate-200 dark:bg-emerald-950"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Core Request Information */}
        <div className="lg:col-span-2 space-y-6">
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

            <div className="border-t border-emerald-50 dark:border-emerald-950 pt-4 space-y-2">
              <span className="text-xs font-bold text-slate-500">تفاصيل الخدمة الطبية المطلوبة:</span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#03251c]/30 rounded-2xl p-4">
                {request.description}
              </p>
            </div>
          </div>

          {/* Interactive Role-Based Forms Section */}
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-6">
            <h2 className="text-base font-extrabold text-emerald-950 dark:text-white border-b border-emerald-50 dark:border-emerald-950 pb-3">
              إجراءات معالجة الطلب
            </h2>

            {/* A: Form for Service Provider in RFQ stage */}
            {role === "SERVICE_PROVIDER" && request.status === "RFQ" && (
              <form onSubmit={handleSubmitOffer} className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                  <AlertCircle size={16} />
                  <span>يمكنك تقديم سعر عرض لهذه الخدمة الطبية كشريك مسجل. يرجى إدخال التكلفة الإجمالية بدقة.</span>
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
                        setOfferLines([...offerLines, { id: Date.now().toString(), productId: "", price: "", productName: "", productCode: "" }]);
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
                      {/* Row 1: Product selector */}
                      {request.agreedProducts && request.agreedProducts.length > 0 && (
                        <div className="input-group">
                          <label className="text-[10px]">المنتج / الخدمة</label>
                          <select 
                            value={line.productId}
                            onChange={(e) => {
                              const val = e.target.value;
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
                                }
                              } else {
                                newLines[index].price = "";
                                newLines[index].productName = "";
                                newLines[index].productCode = "";
                              }
                              setOfferLines(newLines);
                            }}
                            required
                            className="w-full text-xs"
                          >
                            <option value="">-- اختر المنتج --</option>
                            {request.agreedProducts.map((p: any) => {
                              const isSelectedElsewhere = offerLines.some(l => l.id !== line.id && l.productId === p.product_id);
                              // Get product name from existing Odoo lines first, then provider_product_name
                              const lineForProduct = request.offerLines?.find((ol: any) => ol.product_id === p.product_id);
                              const displayName = lineForProduct?.name || p.provider_product_name || `منتج ${p.product_id}`;
                              return (
                                <option 
                                  key={p.product_id} 
                                  value={p.product_id}
                                  disabled={isSelectedElsewhere}
                                >
                                  {displayName} (التكلفة: {p.cost_price})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Row 2: Product Name, Product Code, Price */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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

                        <div className="input-group md:col-span-3">
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

                        <div className="input-group md:col-span-3">
                          <label className="text-[10px]">السعر (ر.س)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={
                              line.productId && request.agreedProducts
                                ? request.agreedProducts.find((p: any) => p.product_id === line.productId)?.cost_price
                                : undefined
                            }
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
                    <span className="font-bold text-slate-600 dark:text-slate-400">الإجمالي:</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {offerLines.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                <div className="input-group mt-4">
                  <label>ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="فترة التشغيل، التفاصيل، إلخ..."
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                  />
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
            {role === "SERVICE_PROVIDER" && request.status === "RAISING_CLAIM" && isOwnerProvider && (
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
            {(role === "CHARITY_STAFF" || role === "SUPER_ADMIN") && request.status === "CLAIM_REVIEW" && (
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
            {request.status === "COMPLETED" && (
              <div className="rounded-2xl bg-green-50 dark:bg-green-950/40 p-5 border border-green-100/30 flex items-center gap-3 text-sm text-green-800 dark:text-green-300 font-semibold">
                <CheckCircle2 size={20} className="text-green-600" />
                <span>تم اكتمال هذا الطلب وإغلاقه وصرف المستحقات بنجاح!</span>
              </div>
            )}

            {role === "SERVICE_PROVIDER" && request.status === "RAISING_CLAIM" && !isOwnerProvider && (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#03251c]/30 p-4 text-xs text-slate-500">
                تمت ترسية هذا الطلب على مزود خدمة آخر.
              </div>
            )}

            {role === "SERVICE_PROVIDER" && request.status === "CLAIM_REVIEW" && isOwnerProvider && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                تم تقديم مطالبتك المالية بنجاح. يرجى الانتظار لحين قيام ممثلي الجمعية بمراجعة المستندات والصرف.
              </div>
            )}

            {role === "SERVICE_PROVIDER" && request.status === "CLAIM_REVIEW" && !isOwnerProvider && (
              <div className="rounded-2xl bg-slate-50 dark:bg-[#03251c]/30 p-4 text-xs text-slate-500">
                تمت ترسية هذا الطلب على مزود خدمة آخر وهو في مرحلة المراجعة المالية حالياً.
              </div>
            )}

            {(role === "CHARITY_STAFF" || role === "SUPER_ADMIN") && request.status === "RAISING_CLAIM" && (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-5 border border-emerald-100/30 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <Wrench size={18} />
                <span>الطلب قيد العمل والتشغيل حالياً من قبل مزود الخدمة ({request.serviceProvider?.name}). بانتظار قيام المزود برفع المطالبة المالية للصرف.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Split Calculator & Offers List */}
        <div className="space-y-6">
          
          {/* Split contribution box */}
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-5">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950 pb-3">
              <Calculator className="text-emerald-700" size={18} />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">مساهمات سداد التكلفة</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>التكلفة الإجمالية:</span>
                <span className="text-sm font-extrabold text-emerald-950 dark:text-white">
                  {request.serviceCost > 0 ? `${request.serviceCost.toLocaleString()} ر.س` : "لم تسعر بعد"}
                </span>
              </div>

              <div className="border-t border-dashed border-emerald-50 dark:border-emerald-950 pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">حصة الجمعية الأهلية ({request.charityContributionPercentage}%):</span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {request.serviceCost > 0 ? `${request.charityContributionValue.toLocaleString()} ر.س` : "-"}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">مساهمة المستفيد (قيمة ثابتة):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {request.serviceCost > 0 ? `${request.beneficiaryContributionValue.toLocaleString()} ر.س` : `${request.beneficiaryContributionValue.toLocaleString()} ر.س`}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3.5 border border-emerald-100/20 text-[10px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                <span className="font-bold block mb-0.5">توضيح طريقة التوزيع:</span>
                يقوم المستفيد بدفع مساهمة مقطوعة ثابتة وقدرها ({request.beneficiaryContributionValue} ر.س)، وتتكفل الجمعية بنسبة ({request.charityContributionPercentage}%) من الجزء المتبقي من التكلفة المعتمدة.
              </div>
            </div>
          </div>

          {/* Price Offers List (visible to Charity Staff / Admin for decision, or to own provider for status check) */}
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950 pb-3">
              <FileSpreadsheet className="text-emerald-700" size={18} />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">عروض الأسعار المقدمة</h2>
            </div>

            {request.priceOffers.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-emerald-50 dark:border-emerald-950 rounded-2xl">
                لا توجد عروض أسعار مقدمة حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {request.priceOffers.map((offer) => {
                  const isOwnOffer = provider?.id === offer.provider.id;
                  
                  return (
                    <div 
                      key={offer.id} 
                      className={`border rounded-2xl p-4 space-y-3 transition ${
                        offer.status === "APPROVED"
                          ? "bg-green-500/5 border-green-500/30"
                          : offer.status === "REJECTED"
                            ? "bg-rose-500/5 border-rose-500/10 opacity-70"
                            : "bg-white dark:bg-[#03251c]/30 border-emerald-100 dark:border-emerald-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-950 dark:text-white flex items-center gap-1">
                            {offer.provider.name}
                            {isOwnOffer && (
                              <span className="bg-emerald-500 text-white rounded px-1.5 py-0.5 text-[8px]">
                                عرضك
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(offer.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                          {offer.amountTotal.toLocaleString()} ر.س
                        </span>
                      </div>

                      {offer.notes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#03251c]/50 p-2 rounded-xl">
                          {offer.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-emerald-50/50 dark:border-emerald-950/40 pt-2.5">
                        <span className={`text-[10px] font-bold ${
                          offer.status === "APPROVED" 
                            ? "text-green-600" 
                            : offer.status === "REJECTED" 
                              ? "text-rose-500" 
                              : "text-amber-500"
                        }`}>
                          الحالة: {offer.status === "APPROVED" ? "مقبول" : offer.status === "REJECTED" ? "مرفوض" : "معلق"}
                        </span>

                        {/* Decision button for Charity / Admin */}
                        {(role === "CHARITY_STAFF" || role === "SUPER_ADMIN") && request.status === "RFQ" && offer.status === "PENDING" && (
                          <button
                            onClick={() => handleApproveOffer(offer.id)}
                            disabled={actionLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl px-3 py-1.5 shadow transition"
                          >
                            اعتماد وترسية
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
