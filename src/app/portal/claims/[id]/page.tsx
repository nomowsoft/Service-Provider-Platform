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
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

interface ClaimLine {
  line_id: number;
  name: string;
  price_total: number;
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
  claimStatus: boolean;
  editingReason: string;
  subServiceType: string;
  requestDate: string;
  charity: { name: string };
  lines: ClaimLine[];
  invoices: Invoice[];
}

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Calculate total amount from claim lines
  const totalAmount = claim.lines.reduce((sum, line) => sum + line.price_total, 0);

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
          {claim.claimStatus ? (
            <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
              <CheckCircle2 size={16} />
              <span>مطالبة مدفوعة</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-2 text-sm font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
              <Clock size={16} />
              <span>قيد المراجعة / غير مدفوعة</span>
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
                        <td className="px-4 py-3 text-left font-mono">{line.price_unit.toLocaleString()} ر.س</td>
                        <td className="px-4 py-3 text-left font-bold text-emerald-900 dark:text-emerald-200 font-mono">
                          {line.price_total.toLocaleString()} ر.س
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
              <div className="text-center py-6 text-xs text-slate-400">
                لم يتم إرفاق أي فواتير أو مستندات مالية بعد.
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
                            <span className="font-mono">{line.price_subtotal.toLocaleString()} ر.س</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Invoice Attachments */}
                    {inv.attachments && inv.attachments.length > 0 && (
                      <div className="pt-2 border-t border-emerald-50 dark:border-emerald-950/25">
                        <h4 className="text-[11px] font-bold text-emerald-950 dark:text-white opacity-85 mb-2">المرفقات:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {inv.attachments.map((att) => (
                            <a
                              key={att.attachment_id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#021b14] border border-emerald-50 dark:border-emerald-950/40 text-xs text-emerald-950 dark:text-emerald-100 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group"
                            >
                              <span className="truncate max-w-[150px] font-semibold text-[11px]">{att.name}</span>
                              <Download size={14} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
              <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono">
                {totalAmount.toLocaleString()} <span className="text-sm font-extrabold">ر.س</span>
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex justify-between items-center py-2 border-b border-emerald-50/50 dark:border-emerald-950/20">
                <span>الحالة المالية للطلب:</span>
                <span className={`font-extrabold ${claim.claimStatus ? "text-emerald-600" : "text-amber-600"}`}>
                  {claim.claimStatus ? "مدفوعة" : "قيد المراجعة"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-emerald-50/50 dark:border-emerald-950/20">
                <span>تاريخ الرفع:</span>
                <span>{new Date(claim.requestDate).toLocaleDateString("ar-SA")}</span>
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
