"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Coins,
  AlertCircle,
  FileCheck2,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { SaudiRiyalIcon } from "@/components/ui/SaudiRiyalIcon";
import { raisingClaimSchema } from "@/utils/validation";
import DatePicker from "@/components/ui/DatePicker";

interface ClaimLine {
  line_id: number;
  name: string;
  price_subtotal: number;
  price_unit: number;
  product_id: number;
  product_qty: number;
}

interface InvoiceLine {
  line_id: number;
  name: string;
  price_unit: number;
  price_subtotal: number;
  product_id: number;
  quantity: number;
}

interface Attachment {
  attachment_id: number;
  name: string;
  url: string;
}

interface Invoice {
  invoice_id: number;
  ref: string;
  invoice_date: string;
  invoice_lines: InvoiceLine[];
  attachments: Attachment[];
}

interface ClaimDetail {
  purchaseOrderId: number;
  requestNumber: string;
  beneficiaryName: string;
  beneficiaryMobile: string;
  beneficiaryEmail: string;
  claimStatus: string;
  editingReason: string;
  subServiceType: string;
  requestDate: string;
  accountMoveDate: string;
  charity: { name: string };
  lines: ClaimLine[];
  invoices: Invoice[];
}

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceRef, setInvoiceRef] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; datas: string }[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<{ productId: number; priceUnit: string; name: string; qty: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedPreviewAtt, setSelectedPreviewAtt] = useState<{ url: string; name: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    const newAttachments: { name: string; datas: string }[] = [];

    for (const file of files) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(",");
            resolve(result.substring(commaIndex + 1));
          };
          reader.onerror = (error) => reject(error);
        });
        newAttachments.push({
          name: file.name,
          datas: base64,
        });
      } catch (err) {
        console.error("Error reading file:", err);
        toast.error(`فشل قراءة الملف ${file.name}`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    setUploading(false);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeLines = invoiceLines.filter(l => selectedProductIds.includes(l.productId));

    const result = raisingClaimSchema.safeParse({
      ref: invoiceRef,
      invoice_date: invoiceDate,
      attachments,
      invoice_lines: activeLines.map(l => ({
        product_id: l.productId,
        price_unit: parseFloat(l.priceUnit) || 0,
      })),
    });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    for (const line of activeLines) {
      const priceVal = parseFloat(line.priceUnit);
      const originalLine = claim?.lines.find(l => l.product_id === line.productId);
      if (originalLine && priceVal > originalLine.price_unit) {
        toast.error(`سعر البند "${line.name}" لا يمكن أن يتجاوز السعر المعتمد (${originalLine.price_unit})`);
        return;
      }
    }

    try {
      setSubmittingInvoice(true);
      const res = await fetch(`/api/claims/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: invoiceRef,
          invoice_date: invoiceDate,
          attachments,
          invoice_lines: activeLines.map(l => ({
            product_id: l.productId,
            price_unit: parseFloat(l.priceUnit),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشل رفع الفاتورة");
      }

      toast.success("تم تقديم المطالبة ورفع الفاتورة بنجاح!");
      setShowInvoiceForm(false);
      setInvoiceRef("");
      setAttachments([]);
      loadClaimDetail();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء رفع الفاتورة");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const loadClaimDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/claims/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("المطالبة المالية غير موجودة");
          router.push("/portal/claims");
          return;
        }
        throw new Error("فشل تحميل تفاصيل المطالبة المالية");
      }
      const data = await res.json();
      setClaim(data.claim);
      if (data.claim && data.claim.invoices?.[0]?.attachments?.[0]) {
        setSelectedPreviewAtt({
          url: data.claim.invoices[0].attachments[0].url,
          name: data.claim.invoices[0].attachments[0].name,
        });
      }
      if (data.claim && data.claim.lines) {
        setInvoiceLines(data.claim.lines.map((l: any) => ({
          productId: l.product_id,
          priceUnit: l.price_unit.toString(),
          name: l.name,
          qty: l.product_qty
        })));
        setSelectedProductIds(data.claim.lines.map((l: any) => l.product_id));
      }
    } catch (error) {
      console.error(error);
      toast.error("خطأ أثناء تحميل تفاصيل المطالبة");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClaimDetail();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadClaimDetail]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">جاري تحميل تفاصيل المطالبة...</span>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="text-rose-500 h-12 w-12" />
        <h3 className="text-lg font-bold text-emerald-950 dark:text-white">حدث خطأ</h3>
        <p className="text-sm text-emerald-600/70">لم نتمكن من العثور على المطالبة المالية المطلوبة.</p>
        <Link href="/portal/claims" className="mt-2 text-xs font-bold text-emerald-600 hover:underline">
          العودة لقائمة المطالبات
        </Link>
      </div>
    );
  }

  // Calculate total amount: sum invoice lines if invoices exist, otherwise sum claim lines
  const totalAmount = claim.invoices && claim.invoices.length > 0
    ? claim.invoices.reduce((sumInv, inv) => 
        sumInv + (inv.invoice_lines || []).reduce((sumLine, line) => sumLine + (line.price_subtotal || 0), 0)
      , 0)
    : claim.lines.reduce((sum, line) => sum + line.price_subtotal, 0);

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/claims"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#03251c] border border-emerald-100 dark:border-emerald-950 text-emerald-950 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors shadow-sm"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white">
                تفاصيل المطالبة المالية
              </h1>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-100/50 dark:border-emerald-900/60">
                {claim.requestNumber}
              </span>
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">مراجعة تفاصيل البنود والخدمات والفواتير المرفوعة</p>
          </div>
        </div>

        {/* Claim Status Badge */}
        <div>
          {claim.claimStatus === "raising_the_claim" && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-2 text-sm font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
              <Clock size={16} />
              <span>تم رفع المطالبة</span>
            </div>
          )}
          {claim.claimStatus === "update_the_claim" && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-2 text-sm font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
              <AlertCircle size={16} />
              <span>تحديث المطالبة</span>
            </div>
          )}
          {claim.claimStatus === "claim_accepted" && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
              <CheckCircle2 size={16} />
              <span>تم قبول المطالبة</span>
            </div>
          )}
          {!["raising_the_claim", "update_the_claim", "claim_accepted"].includes(claim.claimStatus) && (
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm font-bold text-slate-700 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-900/60">
              <Clock size={16} />
              <span>قيد الانتظار</span>
            </div>
          )}
        </div>
      </div>

      {/* Editing Reason Warning if editing is active */}
      {claim.editingReason && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-3xl p-4 flex gap-3 text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">سبب التعديل المطلوب:</h4>
            <p className="text-xs opacity-90 leading-relaxed">{claim.editingReason}</p>
          </div>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Beneficiary and Service Provider detail cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Beneficiary Card */}
          <div className="bg-white dark:bg-[#03251c] rounded-3xl p-6 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950/40 pb-3">
              <User className="text-emerald-600 h-5 w-5" />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">بيانات المستفيد</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-emerald-50/20 dark:bg-[#021b14] p-3 rounded-2xl border border-emerald-50/50 dark:border-emerald-950/20">
                <span className="text-slate-400 font-bold">الاسم بالكامل</span>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-white mt-0.5">{claim.beneficiaryName}</p>
              </div>

              {claim.beneficiaryMobile && (
                <div className="space-y-1 bg-emerald-50/20 dark:bg-[#021b14] p-3 rounded-2xl border border-emerald-50/50 dark:border-emerald-950/20">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Phone size={12} className="text-emerald-600" />
                    <span>رقم الجوال</span>
                  </span>
                  <p className="text-sm font-extrabold text-emerald-950 dark:text-white mt-0.5" dir="ltr">{claim.beneficiaryMobile}</p>
                </div>
              )}

              {claim.beneficiaryEmail && (
                <div className="space-y-1 bg-emerald-50/20 dark:bg-[#021b14] p-3 rounded-2xl border border-emerald-50/50 dark:border-emerald-950/20 md:col-span-2">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Mail size={12} className="text-emerald-600" />
                    <span>البريد الإلكتروني</span>
                  </span>
                  <p className="text-sm font-extrabold text-emerald-950 dark:text-white mt-0.5">{claim.beneficiaryEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details Card */}
          <div className="bg-white dark:bg-[#03251c] rounded-3xl p-6 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950/40 pb-3">
              <FileCheck2 className="text-emerald-600 h-5 w-5" />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">تفاصيل الخدمة المطلوبة</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold">نوع الخدمة الفرعية</span>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-white">{claim.subServiceType}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold">الجهة الخيرية الراعية</span>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-white">{claim.charity.name}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold">تاريخ الطلب</span>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-white">
                  {new Date(claim.requestDate).toLocaleDateString("ar-SA", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold">رقم أمر الشراء</span>
                <p className="text-sm font-extrabold text-emerald-950 dark:text-white">#{claim.purchaseOrderId}</p>
              </div>
            </div>

            {/* Claim Lines Details Table */}
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-extrabold text-emerald-950 dark:text-white">بنود الخدمة المعتمدة</h3>
              <div className="overflow-x-auto rounded-2xl border border-emerald-100/50 dark:border-emerald-950/40">
                <table className="w-full text-right text-xs">
                  <thead className="bg-emerald-50/50 dark:bg-[#021b14]/50 text-emerald-800 dark:text-emerald-300 font-bold">
                    <tr>
                      <th className="px-4 py-3">البند</th>
                      <th className="px-4 py-3 text-center">الكمية</th>
                      <th className="px-4 py-3 text-left">سعر الوحدة</th>
                      <th className="px-4 py-3 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 dark:divide-emerald-950/30">
                    {claim.lines.map((line) => (
                      <tr key={line.line_id} className="text-slate-700 dark:text-slate-300">
                        <td className="px-4 py-3 font-semibold">{line.name}</td>
                        <td className="px-4 py-3 text-center">{line.product_qty}</td>
                        <td className="px-4 py-3 text-left">
                          <span className="inline-flex items-center gap-1">
                            {line.price_unit.toLocaleString()}
                            <SaudiRiyalIcon size={10} />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left font-bold text-emerald-900 dark:text-emerald-200">
                          <span className="inline-flex items-center gap-1">
                            {line.price_subtotal.toLocaleString()}
                            <SaudiRiyalIcon size={10} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invoices and Attachments Card */}
          <div className="bg-white dark:bg-[#03251c] rounded-3xl p-6 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950/40 pb-3">
              <Receipt className="text-emerald-600 h-5 w-5" />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">الفواتير والمستندات المرفوعة</h2>
            </div>

            {claim.invoices.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6 text-xs text-slate-400">
                  لم يتم إرفاق أي فواتير أو مستندات مالية بعد.
                </div>
                {!showInvoiceForm ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceForm(true)}
                      className="rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn flex items-center gap-2"
                    >
                      <Receipt size={16} />
                      <span>إضافة فاتورة ومطالبة مالية جديدة</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInvoice} noValidate className="space-y-4 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">رفع تفاصيل الفاتورة والمطالبة</span>
                      <button
                        type="button"
                        onClick={() => setShowInvoiceForm(false)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        إلغاء
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">رقم الفاتورة (المرجع)</label>
                        <input
                          type="text"
                          placeholder="مثال: RS-0126"
                          value={invoiceRef}
                          onChange={(e) => setInvoiceRef(e.target.value)}
                          className="w-full text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300">تاريخ الفاتورة</label>
                        <DatePicker
                          value={invoiceDate}
                          onChange={setInvoiceDate}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    </div>

                    {/* Invoice lines based on claim lines */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">بنود الفاتورة وقيمة كل بند:</label>
                      <div className="space-y-3">
                        {invoiceLines.map((line, index) => {
                          const originalLine = claim.lines.find(l => l.product_id === line.productId);
                          const isChecked = selectedProductIds.includes(line.productId);
                          return (
                            <div key={line.productId} className="flex flex-col p-4 rounded-xl bg-white dark:bg-[#021b14] border border-emerald-50 dark:border-emerald-950/40 space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`prod-${line.productId}`}
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedProductIds(prev => prev.filter(id => id !== line.productId));
                                    } else {
                                      setSelectedProductIds(prev => [...prev, line.productId]);
                                    }
                                  }}
                                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                                <label htmlFor={`prod-${line.productId}`} className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                  تضمين البند: {line.name} (×{line.qty})
                                </label>
                              </div>

                              {isChecked && (
                                <div className="input-group">
                                  <label className="text-[10px] flex items-center gap-0.5">
                                    سعر الوحدة (بحد أقصى: {originalLine?.price_unit}
                                    <SaudiRiyalIcon size={8} />)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={originalLine?.price_unit}
                                    required
                                    value={line.priceUnit}
                                    onChange={(e) => {
                                      const updated = [...invoiceLines];
                                      updated[index].priceUnit = e.target.value;
                                      setInvoiceLines(updated);
                                    }}
                                    className="w-full text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* File attachments */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">مرفقات الفاتورة (PDF أو صور):</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 transition">
                          <span>اختر ملفات...</span>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {uploading && <span className="text-xs text-slate-400">جاري قراءة الملفات...</span>}
                      </div>

                      {attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#021b14] border border-emerald-50 dark:border-emerald-950/40 text-xs">
                              <span className="truncate max-w-[150px] font-semibold text-[11px]">{att.name}</span>
                              <button
                                type="button"
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 font-bold shrink-0 ml-1 text-xs"
                              >
                                حذف
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingInvoice}
                      className="w-full rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn mt-4"
                    >
                      {submittingInvoice ? "جاري رفع تفاصيل المطالبة..." : "إرسال المطالبة المالية ورفع الفاتورة"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {claim.invoices.map((inv, idx) => (
                  <div key={inv.invoice_id} className="border border-emerald-50 dark:border-emerald-950/40 rounded-2xl p-4 bg-emerald-50/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-emerald-50 dark:border-emerald-950/20 pb-2">
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                        فاتورة رقم #{inv.ref || inv.invoice_id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        <span>تاريخ الفاتورة: {inv.invoice_date}</span>
                      </span>
                    </div>

                    {/* Invoice Lines */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-emerald-950 dark:text-white opacity-85">تفاصيل الفاتورة:</h4>
                      <div className="space-y-1.5">
                        {inv.invoice_lines.map((line) => (
                          <div key={line.line_id} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                            <span>{line.name} (×{line.quantity})</span>
                            <span className="inline-flex items-center gap-1">
                              {line.price_subtotal.toLocaleString()}
                              <SaudiRiyalIcon size={10} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Invoice Attachments */}
                    {inv.attachments && inv.attachments.length > 0 && (
                      <div className="pt-2 border-t border-emerald-50 dark:border-emerald-950/25">
                        <h4 className="text-[11px] font-bold text-emerald-950 dark:text-white opacity-85 mb-2">المرفقات:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {inv.attachments.map((att) => {
                            const isSelected = selectedPreviewAtt?.url === att.url;
                            return (
                              <button
                                key={att.attachment_id}
                                type="button"
                                onClick={() => setSelectedPreviewAtt({ url: att.url, name: att.name })}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all group w-full text-right ${
                                  isSelected
                                    ? "bg-emerald-550/15 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold"
                                    : "bg-white dark:bg-[#021b14] border-emerald-50 dark:border-emerald-950/40 text-emerald-950 dark:text-emerald-100 hover:border-emerald-300 dark:hover:border-emerald-800"
                                }`}
                              >
                                <span className="truncate max-w-[120px] font-semibold text-[11px]">{att.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                  <span className="text-[10px] text-emerald-600 underline opacity-0 group-hover:opacity-100 transition-opacity">معاينة</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {selectedPreviewAtt && (
                  <div className="space-y-2 pt-4 border-t border-emerald-50 dark:border-emerald-950/25 animate-fadeIn">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                      <FileCheck2 size={14} className="text-emerald-600" />
                      معاينة المستند المالي: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedPreviewAtt.name}</span>
                    </span>
                    <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 h-[600px] shadow-inner relative group">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <iframe
                        src={`${selectedPreviewAtt.url}#view=FitH`}
                        className="w-full h-full border-0 absolute inset-0 z-10 bg-transparent"
                        title="معاينة المستند"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Pricing / Summary Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#03251c] rounded-3xl p-6 border border-emerald-100/50 dark:border-emerald-950/40 shadow-sm space-y-5 sticky top-6">
            <div className="flex items-center gap-2 border-b border-emerald-50 dark:border-emerald-950/40 pb-3">
              <Coins className="text-emerald-600 h-5 w-5" />
              <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">ملخص التكاليف</h2>
            </div>

            {/* Total Cost Display */}
            <div className="bg-emerald-50/30 dark:bg-[#021b14]/50 border border-emerald-100/30 dark:border-emerald-950/40 rounded-2xl p-4 text-center space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">القيمة الإجمالية للمطالبة</span>
              <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 inline-flex items-center gap-1 justify-center w-full">
                {totalAmount.toLocaleString()}
                <SaudiRiyalIcon size={15} />
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between items-center py-2 border-b border-emerald-50/50 dark:border-emerald-950/20">
                <span>تاريخ الرفع:</span>
                <span>{new Date(claim.accountMoveDate).toLocaleDateString("ar-SA")}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>رقم أمر الشراء (PO):</span>
                <span className="font-semibold text-emerald-950 dark:text-emerald-300">#{claim.purchaseOrderId}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
