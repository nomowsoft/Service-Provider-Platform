"use client";
import { useState, useEffect, useCallback } from "react";
import {
  User,
  KeyRound,
  Webhook,
  Copy,
  Check,
  Settings as SettingsIcon,
  Building,
  Wrench,
  Lock,
  Plus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Server,
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Info,
  Wifi,
  Send
} from "lucide-react";
import toast from "react-hot-toast";
import { changePasswordSchema } from "@/utils/validation";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  provider?: {
    id: number;
    name: string;
    licenseNumber: string;
    description: string;
    phone: string;
    category: string;
    apiCode?: string;
  } | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // Profile & Password fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Charity Integration state
  const [charities, setCharities] = useState<any[]>([]);
  const [charityName, setCharityName] = useState("");
  const [isAddingCharity, setIsAddingCharity] = useState(false);
  const [charitySaving, setCharitySaving] = useState(false);
  const [charityError, setCharityError] = useState("");
  const [charityErrorField, setCharityErrorField] = useState("");
  const [charitySortField, setCharitySortField] = useState<"code" | "name" | null>(null);
  const [charitySortDirection, setCharitySortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [updatingItem, setUpdatingItem] = useState<any | null>(null);
  const [updateActionId, setUpdateActionId] = useState<number | null>(null);

  // API Config (Mock keys for beautiful visual UX)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // SMTP Settings state (Super Admin Only)
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("فريق دعم سرب");
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          password: smtpPassword,
        }),
      });
      const data = await res.json();
      const isSuccess = res.ok && Boolean(data.success);
      setTestResult({
        success: isSuccess,
        message: data.message || (isSuccess ? "تم الاتصال بنجاح" : "فشل الاتصال"),
      });

      if (isSuccess) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "فشل الاتصال بخادم البريد");
      }
    } catch (error) {
      const err = error as Error;
      setTestResult({
        success: false,
        message: err.message || "حدث خطأ أثناء اختبار الاتصال",
      });
      toast.error(err.message || "فشل الاتصال بخادم البريد");
    } finally {
      setSmtpTesting(false);
    }
  };

  const fetchSmtpSettings = useCallback(async () => {
    if (user?.role !== "SUPER_ADMIN") return;
    setSmtpLoading(true);
    try {
      const res = await fetch("/api/admin/smtp");
      if (res.ok) {
        const data = await res.json();
        if (data.smtp) {
          setSmtpHost(data.smtp.host || "");
          setSmtpPort(data.smtp.port || 587);
          setSmtpSecure(data.smtp.secure || false);
          setSmtpUser(data.smtp.user || "");
          setSmtpPassword(data.smtp.password || "");
          setSmtpFromEmail(data.smtp.fromEmail || "");
          setSmtpFromName(data.smtp.fromName || "فريق دعم سرب");
        }
      }
    } catch (error) {
      console.error("Fetch SMTP Error:", error);
    } finally {
      setSmtpLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (activeTab === "smtp" && user?.role === "SUPER_ADMIN") {
      fetchSmtpSettings();
    }
  }, [activeTab, user?.role, fetchSmtpSettings]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          password: smtpPassword,
          fromEmail: smtpFromEmail,
          fromName: smtpFromName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل حفظ إعدادات SMTP");
      toast.success("تم حفظ إعدادات خادم البريد (SMTP) بنجاح!");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSmtpSaving(false);
    }
  };

  // Email Logs State (Super Admin Only)
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED" | "MOCK">("ALL");

  const fetchEmailLogs = useCallback(async () => {
    if (user?.role !== "SUPER_ADMIN") return;
    setLogsLoading(true);
    try {
      const res = await fetch("/api/admin/email-logs");
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Fetch Email Logs Error:", error);
    } finally {
      setLogsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (activeTab === "email-logs" && user?.role === "SUPER_ADMIN") {
      fetchEmailLogs();
    }
  }, [activeTab, user?.role, fetchEmailLogs]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("فشل تحميل البيانات الشخصية");
      const data = await res.json();
      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تحديث البيانات");

      toast.success("تم تحديث البيانات الشخصية بنجاح!");
      if (user) {
        setUser({ ...user, name });
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء التحديث");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("يرجى إدخال كلمة المرور الحالية");
      return;
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة وتأكيدها غير متطابقتين");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تغيير كلمة المرور");

      toast.success("تم تغيير كلمة المرور بنجاح!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setSaving(false);
    }
  };

  const fetchCharities = useCallback(async () => {
    try {
      const res = await fetch("/api/providers/charity-tokens");
      if (!res.ok) throw new Error("فشل تحميل الجمعيات");
      const data = await res.json();
      setCharities(data.charities || []);
    } catch (error) {
      console.error("Fetch Charities Error:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "charities") {
      fetchCharities();
    }
  }, [activeTab, fetchCharities]);

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCharityError("");
    setCharityErrorField("");

    if (!charityName.trim()) {
      setCharityError("يرجى إدخال اسم الجمعية");
      setCharityErrorField("charityName");
      return;
    }

    setCharitySaving(true);
    try {
      const res = await fetch("/api/providers/charity-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: charityName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCharityErrorField("charityName");
        throw new Error(data.message || "فشل إضافة الجمعية");
      }

      toast.success("تم إضافة الجمعية بنجاح!");
      setCharityName("");
      setIsAddingCharity(false);
      fetchCharities();
    } catch (error) {
      const err = error as Error;
      setCharityError(err.message || "حدث خطأ أثناء إضافة الجمعية");
    } finally {
      setCharitySaving(false);
    }
  };

  const performDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/providers/charity-tokens/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل حذف الجمعية");
      toast.success("تم حذف الجمعية بنجاح");
      fetchCharities();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء الحذف");
    }
  };

  const handleDeleteCharity = (id: number) => {
    toast((t) => (
      <div
        className="flex items-start gap-4 p-5 bg-white dark:bg-[#021f18] border border-slate-100 dark:border-emerald-900/60 shadow-2xl rounded-2xl min-w-[320px] max-w-[380px] animate-in fade-in slide-in-from-top-4 duration-300"
        dir="rtl"
      >
        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 animate-bounce">
          <AlertTriangle size={20} className="stroke-[2.5]" />
        </div>

        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
            تأكيد حذف الجمعية
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-justify">
            هل أنت متأكد من رغبتك في حذف هذه الجمعية؟ سيتم قطع الاتصال البرمجي والربط التقني معها نهائياً.
          </p>
          <div className="flex justify-end gap-2 pt-2.5">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-emerald-950/30 rounded-xl transition duration-150 active:scale-95"
            >
              إلغاء
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await performDelete(id);
              }}
              className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white rounded-xl shadow-lg shadow-rose-500/20 transition duration-150 active:scale-95"
            >
              تأكيد الحذف
            </button>
          </div>
        </div>
      </div>
    ), {
      duration: 10000,
      position: "top-center",
      style: {
        background: "transparent",
        boxShadow: "none",
        border: "none",
        padding: 0,
      }
    });
  };

  const handleCharitySort = (field: "code" | "name") => {
    if (charitySortField === field) {
      setCharitySortDirection(charitySortDirection === "asc" ? "desc" : "asc");
    } else {
      setCharitySortField(field);
      setCharitySortDirection("asc");
    }
  };

  const handleApproveRequest = async (id: number) => {
    setApprovingId(id);
    try {
      const res = await fetch(`/api/providers/charity-tokens/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تأكيد طلب الارتباط");
      toast.success("تم تأكيد الارتباط بنجاح وإشعار الجمعية!");
      setSelectedRequest(null);
      fetchCharities();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء تأكيد الارتباط");
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveUpdate = async (id: number) => {
    setUpdateActionId(id);
    try {
      const res = await fetch(`/api/providers/charity-tokens/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل اعتماد طلب تحديث البيانات");
      toast.success("تم اعتماد طلب تحديث البيانات بنجاح!");
      setUpdatingItem(null);
      fetchCharities();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء اعتماد طلب التحديث");
    } finally {
      setUpdateActionId(null);
    }
  };

  const handleRejectUpdate = async (id: number) => {
    setUpdateActionId(id);
    try {
      const res = await fetch(`/api/providers/charity-tokens/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل رفض طلب تحديث البيانات");
      toast.success("تم رفض طلب تحديث البيانات");
      setUpdatingItem(null);
      fetchCharities();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "حدث خطأ أثناء رفض طلب التحديث");
    } finally {
      setUpdateActionId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("تم النسخ إلى الحافظة");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-emerald-800 dark:text-emerald-300">جاري تحميل الإعدادات...</span>
      </div>
    );
  }

  // Developer integration details based on role
  const mockPublicKey = user
    ? `pub_provider_live_8f3d2e1c${user.provider?.id || 1}ab90`
    : "";

  const mockSecretKey = user
    ? (user.provider?.apiCode || `code_9b4e1a2f${user.provider?.id || 1}dd44`)
    : "";

  const sortedCharities = [...charities].sort((a, b) => {
    if (!charitySortField) return 0;
    const valA = a[charitySortField] || "";
    const valB = b[charitySortField] || "";
    return charitySortDirection === "asc"
      ? valA.localeCompare(valB, "ar", { numeric: true, sensitivity: "base" })
      : valB.localeCompare(valA, "ar", { numeric: true, sensitivity: "base" });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-emerald-950 dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-emerald-600" size={24} />
          الإعدادات العامة
        </h1>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-400 mt-0.5">إدارة حسابك الشخصي وربط النظام بالمنصات والخدمات الخارجية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "profile"
              ? "bg-emerald-950 text-white shadow-sm"
              : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
              }`}
          >
            <User size={16} />
            <span>الملف الشخصي</span>
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "password"
              ? "bg-emerald-950 text-white shadow-sm"
              : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
              }`}
          >
            <KeyRound size={16} />
            <span>تغيير كلمة المرور</span>
          </button>

          {(user?.role === "SERVICE_PROVIDER" || user?.role === "SUPER_ADMIN") && (
            <button
              onClick={() => setActiveTab("developer")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "developer"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
                }`}
            >
              <Webhook size={16} />
              <span>إعدادات المطورين والربط API</span>
            </button>
          )}

          {user?.role === "SERVICE_PROVIDER" && (
            <button
              onClick={() => setActiveTab("charities")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "charities"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
                }`}
            >
              <Building size={16} />
              <span>الجمعيات</span>
            </button>
          )}

          {user?.role === "SUPER_ADMIN" && (
            <>
              <button
                onClick={() => setActiveTab("smtp")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "smtp"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
                  }`}
              >
                <Mail size={16} />
                <span>إعدادات البريد (SMTP)</span>
              </button>

              <button
                onClick={() => setActiveTab("email-logs")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === "email-logs"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
                  }`}
              >
                <History size={16} />
                <span>سجل رسائل البريد</span>
              </button>
            </>
          )}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50 min-h-[400px]">

            {/* Tab: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-3">
                  <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">تعديل الملف الشخصي</h2>
                  <p className="text-[10px] text-slate-500 mt-1">تحديث معلومات حسابك الشخصية الظاهرة للآخرين</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                      <label>الاسم الكامل</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>البريد الإلكتروني (مغلق للتعديل)</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="bg-slate-100 dark:bg-emerald-950/20 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-emerald-50/50">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn"
                    >
                      {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Change Password */}
            {activeTab === "password" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-3">
                  <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">تغيير كلمة المرور</h2>
                  <p className="text-[10px] text-slate-500 mt-1">يرجى اختيار كلمة مرور قوية تطابق معايير الأمان لحماية حسابك</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="input-group">
                      <label>كلمة المرور الحالية</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showCurrentPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div className="input-group">
                        <label>كلمة المرور الجديدة</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none cursor-pointer"
                          >
                            {showNewPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="input-group">
                        <label>تأكيد كلمة المرور الجديدة</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none cursor-pointer"
                          >
                            {showConfirmPassword ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Guidelines */}
                  <div className="bg-emerald-50/50 dark:bg-[#021b14] border border-emerald-100 dark:border-emerald-950 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span>اشتراطات قوة كلمة المرور:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <span>{newPassword.length >= 8 ? "✓" : "○"}</span>
                        <span>8 أحرف على الأقل</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <span>{/[A-Z]/.test(newPassword) ? "✓" : "○"}</span>
                        <span>حرف كبير واحد (A-Z) على الأقل</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[a-z]/.test(newPassword) ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <span>{/[a-z]/.test(newPassword) ? "✓" : "○"}</span>
                        <span>حرف صغير واحد (a-z) على الأقل</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/\d/.test(newPassword) ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <span>{/\d/.test(newPassword) ? "✓" : "○"}</span>
                        <span>رقم واحد (0-9) على الأقل</span>
                      </div>
                      <div className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600 font-bold dark:text-emerald-400" : "text-slate-400"}`}>
                        <span>{/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}</span>
                        <span>رمز خاص واحد على الأقل (مثل @$!%*?&)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-emerald-50/50">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn cursor-pointer disabled:opacity-50"
                    >
                      {saving ? "جاري التحديث..." : "تحديث كلمة المرور"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Developer Integration (Charity & Provider) */}
            {activeTab === "developer" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">إعدادات المطورين والربط API</h2>
                    <p className="text-[10px] text-slate-500 mt-1">استخدم هذه المفاتيح لربط تطبيقاتك وأنظمتك بالمنصة لتلقي وتحديث بيانات الطلبات</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] px-2.5 py-1 rounded-full font-bold">
                    نشط ومتاح للربط
                  </span>
                </div>

                <div className="space-y-5">

                  {/* Entity display */}
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100/20 space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">الجهة المعرفة للربط:</span>
                    <div className="flex items-center gap-3">
                      <>
                        <Wrench className="text-amber-600" size={20} />
                        <div>
                          <span className="text-sm font-bold text-emerald-950 dark:text-white block">{user?.provider?.name || "مزود الخدمة"}</span>
                          <span className="text-[10px] text-slate-400">معرف مزود الخدمة: {user?.provider?.id || 1}</span>
                        </div>
                      </>
                    </div>
                  </div>

                  {/* Secret Key field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-white flex items-center gap-1.5">
                      <Lock size={12} className="text-rose-500" />
                      {user?.role === "SERVICE_PROVIDER" ? "كود الربط لمزود الخدمة (apiCode)" : "المفتاح السري للربط (Secret API Key)"}
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-950 rounded-xl px-4 py-3">
                      <code className="text-xs flex-1 text-slate-700 dark:text-slate-300 overflow-x-auto select-all">{mockSecretKey}</code>
                      <button
                        onClick={() => copyToClipboard(mockSecretKey, "sec_key")}
                        className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                      >
                        {copiedKey === "sec_key" ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-rose-500 font-bold block">
                      {user?.role === "SERVICE_PROVIDER" ? "تحذير: لا تشارك كود الربط أبداً ولا تضعه في أكواد الواجهة الأمامية!" : "تحذير: لا تشارك المفتاح السري أبداً ولا تضعه في أكواد الواجهة الأمامية!"}
                    </span>
                  </div>

                  {/* Webhook Endpoint */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-white">رابط استقبال التنبيهات والأحداث (Webhook URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://yourdomain.com/api/webhooks"
                        defaultValue="https://example.org/api/webhooks/server-provider"
                        className="text-xs py-3 px-4 border rounded-xl flex-1 focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => toast.success("تم تحديث رابط الويب هوك بنجاح")}
                        className="bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl px-5 text-xs font-bold"
                      >
                        حفظ الرابط
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab: Charities (Service Provider Only) */}
            {activeTab === "charities" && user?.role === "SERVICE_PROVIDER" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-emerald-950 dark:text-white">إدارة الجمعيات المرتبطة</h2>
                    <p className="text-[10px] text-slate-500 mt-1">قم بإدارة الجمعيات الأهلية المرتبطة وتحديد توكن الربط الخاص بكل جمعية</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingCharity(!isAddingCharity);
                      setCharityError("");
                      setCharityErrorField("");
                      setCharityName("");
                    }}
                    className="bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} />
                    {isAddingCharity ? "إلغاء الإضافة" : "ربط جمعية جديدة"}
                  </button>
                </div>

                {isAddingCharity && (
                  <form
                    onSubmit={handleAddCharity}
                    noValidate
                    className="bg-slate-50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-slate-100 dark:border-emerald-950/40 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200"
                  >
                    <h3 className="text-xs font-bold text-emerald-950 dark:text-white">ربط جمعية جديدة بمزود الخدمة</h3>

                    {charityError && (
                      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-500 text-center font-medium animate-shake">
                        {charityError}
                      </div>
                    )}

                    <div className="space-y-1 max-w-md">
                      <label className="text-[10px] font-bold text-slate-500 block">اسم الجمعية</label>
                      <input
                        type="text"
                        required
                        value={charityName}
                        onChange={(e) => {
                          setCharityName(e.target.value);
                          if (charityErrorField === "charityName") {
                            setCharityError("");
                            setCharityErrorField("");
                          }
                        }}
                        placeholder="مثال: جمعية البر الأهلية"
                        className={`w-full text-xs py-2.5 px-3 border rounded-xl focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-[#03251c]/30 transition ${charityErrorField === "charityName"
                          ? "!border-rose-500/80 focus:!border-rose-500 focus:!shadow-[0_0_0_4px_rgba(244,63,94,0.15)] dark:!border-rose-500/60 dark:focus:!border-rose-400 dark:focus:!shadow-[0_0_0_4px_rgba(244,63,94,0.25)]"
                          : "border-slate-200 dark:border-emerald-950/60"
                          }`}
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">ملاحظة: سيتم توليد توكن الربط للجمعية تلقائياً بمجرد الحفظ.</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCharity(false);
                          setCharityError("");
                          setCharityErrorField("");
                          setCharityName("");
                        }}
                        className="border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold transition"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={charitySaving}
                        className="bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition"
                      >
                        {charitySaving ? "جاري الحفظ..." : "حفظ وربط"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="border border-slate-100 dark:border-emerald-950/50 rounded-2xl overflow-hidden bg-white dark:bg-[#03251c]/10">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-right text-xs whitespace-nowrap lg:whitespace-normal">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-emerald-950/20 text-slate-500 font-bold border-b border-slate-100 dark:border-emerald-950/40">
                          <th
                            className="p-4 cursor-pointer select-none hover:text-emerald-500 transition-colors"
                            onClick={() => handleCharitySort("code")}
                          >
                            <div className="flex items-center gap-1">
                              <span>كود الجمعية</span>
                              {charitySortField === "code" ? (
                                charitySortDirection === "asc" ? (
                                  <ArrowUp size={12} className="text-emerald-500" />
                                ) : (
                                  <ArrowDown size={12} className="text-emerald-500" />
                                )
                              ) : (
                                <ArrowUpDown size={12} className="text-slate-400/40 dark:text-slate-300/30" />
                              )}
                            </div>
                          </th>
                          <th
                            className="p-4 cursor-pointer select-none hover:text-emerald-500 transition-colors"
                            onClick={() => handleCharitySort("name")}
                          >
                            <div className="flex items-center gap-1">
                              <span>اسم الجمعية</span>
                              {charitySortField === "name" ? (
                                charitySortDirection === "asc" ? (
                                  <ArrowUp size={12} className="text-emerald-500" />
                                ) : (
                                  <ArrowDown size={12} className="text-emerald-500" />
                                )
                              ) : (
                                <ArrowUpDown size={12} className="text-slate-400/40 dark:text-slate-300/30" />
                              )}
                            </div>
                          </th>
                          <th className="p-4">توكن الربط</th>
                          <th className="p-4">حالة الارتباط</th>
                          <th className="p-4">تاريخ الربط</th>
                          <th></th>
                          <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCharities.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                              لا توجد جمعيات مرتبطة حالياً. اضغط على "ربط جمعية جديدة" للبدء.
                            </td>
                          </tr>
                        ) : (
                          sortedCharities.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 dark:border-emerald-950/20 last:border-0 hover:bg-slate-50/50 dark:hover:bg-emerald-950/10 transition">
                              <td className="p-4 font-bold text-slate-600 dark:text-slate-300">{item.code}</td>
                              <td className="p-4 font-bold text-emerald-950 dark:text-white">{item.name}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-emerald-950/15 border border-slate-100 dark:border-emerald-950/40 px-2.5 py-1.5 rounded-lg w-fit">
                                  <code className="text-[10px] text-slate-600 dark:text-slate-300 max-w-[150px] truncate select-all">{item.token}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.token, `tok_${item.id}`)}
                                    className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                                  >
                                    {copiedKey === `tok_${item.id}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </td>
                              <td className="p-4">
                                {item.status === "DRAFT" && (
                                  <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    مسودة
                                  </span>
                                )}
                                {item.status === "REQUESTED" && (
                                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse">
                                    طلب ارتباط
                                  </span>
                                )}
                                {item.status === "CONNECTED" && (
                                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-bold">
                                    نشط
                                  </span>
                                )}
                                {item.status === "UPDATING" && (
                                  <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse">
                                    طلب تحديث
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-slate-400 text-[10px]">
                                {item.connectedAt ? (
                                  new Date(item.connectedAt).toLocaleDateString("ar-SA", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                  })
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {item.status === "REQUESTED" && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRequest(item)}
                                    className="bg-emerald-950 hover:bg-emerald-900 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    عرض طلب الارتباط
                                  </button>
                                )}
                                {item.status === "UPDATING" && (
                                  <button
                                    type="button"
                                    onClick={() => setUpdatingItem(item)}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    عرض طلب التحديث
                                  </button>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCharity(item.id)}
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-2 rounded-lg transition inline-flex items-center justify-center"
                                  title="حذف الربط"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: SMTP Email Settings (Super Admin Only) */}
            {activeTab === "smtp" && user?.role === "SUPER_ADMIN" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-emerald-950 dark:text-white flex items-center gap-2">
                      <Mail className="text-emerald-600" size={20} />
                      إعدادات خادم البريد الإلكتروني (SMTP)
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1">تكوين بيانات الاتصال بخادم البريد لإرسال رسائل إعادة تعيين كلمة المرور والتنبيهات (خاصة بمدير النظام)</p>
                  </div>
                </div>

                {smtpLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveSmtp} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label>عنوان خادم SMTP (Host)</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="smtp.example.com"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>منفذ الخادم (Port)</label>
                        <input
                          type="number"
                          placeholder="587"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(parseInt(e.target.value, 10) || 587)}
                          className="w-full"
                        />
                      </div>

                      <div className="input-group">
                        <label>اسم المستخدم (SMTP User / Email)</label>
                        <input
                          type="text"
                          placeholder="user@example.com"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="input-group">
                        <label>كلمة المرور (SMTP Password)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="input-group">
                        <label>بريد المرسل (From Email)</label>
                        <input
                          type="email"
                          placeholder="no-reply@yourdomain.com"
                          value={smtpFromEmail}
                          onChange={(e) => setSmtpFromEmail(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="input-group">
                        <label>اسم المرسل (From Name)</label>
                        <input
                          type="text"
                          placeholder="فريق دعم سرب"
                          value={smtpFromName}
                          onChange={(e) => setSmtpFromName(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-950">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="smtpSecure" className="text-xs font-bold text-emerald-950 dark:text-emerald-200 cursor-pointer">
                        استخدام اتصال مشفر مسبقاً (SSL / TLS Secure - Port 465)
                      </label>
                    </div>

                    {testResult && (
                      <div
                        className={`rounded-2xl p-4 border text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
                          testResult.success
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                        )}
                        <span className="leading-relaxed">{testResult.message}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-emerald-50/50">
                      <button
                        type="button"
                        onClick={handleTestSmtp}
                        disabled={smtpTesting || smtpSaving}
                        className="w-full sm:w-auto bg-slate-100 dark:bg-emerald-950/40 hover:bg-emerald-50 text-slate-800 dark:text-emerald-200 border border-slate-200 dark:border-emerald-900/40 rounded-xl py-3 px-6 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                      >
                        <Wifi size={16} className={smtpTesting ? "animate-pulse text-emerald-500" : "text-emerald-600"} />
                        <span>{smtpTesting ? "جاري فحص الاتصال بالخادم..." : "اختبار الاتصال بالخادم"}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={smtpSaving || smtpTesting}
                        className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn cursor-pointer disabled:opacity-50"
                      >
                        {smtpSaving ? "جاري الحفظ..." : "حفظ إعدادات خادم البريد"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Tab: Email Logs (Super Admin Only) */}
            {activeTab === "email-logs" && user?.role === "SUPER_ADMIN" && (
              <div className="space-y-6">
                <div className="border-b border-emerald-50 dark:border-emerald-950 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-emerald-950 dark:text-white flex items-center gap-2">
                      <History className="text-emerald-600" size={20} />
                      سجل رسائل البريد الإلكتروني الصادرة
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1">متابعة حالة وتفاصيل كافة رسائل البريد الصادرة من المنصة (نجاح الإرسال، الفشل، أو وضع التطوير)</p>
                  </div>
                  <button
                    onClick={fetchEmailLogs}
                    disabled={logsLoading}
                    className="self-start sm:self-auto bg-slate-100 dark:bg-emerald-950/40 hover:bg-emerald-50 text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-900/40 rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw size={14} className={logsLoading ? "animate-spin" : ""} />
                    <span>تحديث السجل</span>
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-emerald-950/20 border border-slate-100 dark:border-emerald-950/40 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-500 block">إجمالي الرسائل</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block">{emailLogs.length}</span>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">ناجحة</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-300 mt-1 block">
                      {emailLogs.filter((l) => l.status === "SUCCESS").length}
                    </span>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block">فاشلة</span>
                    <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1 block">
                      {emailLogs.filter((l) => l.status === "FAILED").length}
                    </span>
                  </div>
                  <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-3 text-center">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block">وضع التجربة</span>
                    <span className="text-lg font-extrabold text-amber-600 dark:text-amber-300 mt-1 block">
                      {emailLogs.filter((l) => l.status === "MOCK").length}
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-[#021b14]/50 p-3 rounded-2xl border border-slate-100 dark:border-emerald-950/60">
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="بحث بالبريد الإلكتروني..."
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="w-full text-xs py-2 pr-9 pl-3 border border-slate-200 dark:border-emerald-950 rounded-xl bg-white dark:bg-[#03251c]/40"
                    />
                    <Search className="absolute right-3 top-2.5 text-slate-400" size={14} />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-white dark:bg-[#021f18] p-1 rounded-xl border border-slate-200 dark:border-emerald-950/60 text-[10px] font-bold w-full sm:w-auto justify-center">
                    <button
                      onClick={() => setEmailStatusFilter("ALL")}
                      className={`px-3 py-1.5 rounded-lg transition ${emailStatusFilter === "ALL" ? "bg-emerald-950 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setEmailStatusFilter("SUCCESS")}
                      className={`px-3 py-1.5 rounded-lg transition ${emailStatusFilter === "SUCCESS" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      ناجحة
                    </button>
                    <button
                      onClick={() => setEmailStatusFilter("FAILED")}
                      className={`px-3 py-1.5 rounded-lg transition ${emailStatusFilter === "FAILED" ? "bg-rose-600 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      فاشلة
                    </button>
                    <button
                      onClick={() => setEmailStatusFilter("MOCK")}
                      className={`px-3 py-1.5 rounded-lg transition ${emailStatusFilter === "MOCK" ? "bg-amber-600 text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      تجربة
                    </button>
                  </div>
                </div>

                {/* Table */}
                {logsLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="border border-slate-100 dark:border-emerald-950/50 rounded-2xl overflow-hidden bg-white dark:bg-[#03251c]/10">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-right text-xs whitespace-nowrap lg:whitespace-normal">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-emerald-950/20 text-slate-500 font-bold border-b border-slate-100 dark:border-emerald-950/40">
                            <th className="p-4">المستلم (To)</th>
                            <th className="p-4">الموضوع</th>
                            <th className="p-4 text-center">حالة الإرسال</th>
                            <th className="p-4">التفاصيل / ملاحظات الخطأ</th>
                            <th className="p-4 text-left">تاريخ الإرسال</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/40">
                          {emailLogs
                            .filter((log) => {
                              const matchesSearch =
                                !emailSearchTerm ||
                                log.toEmail?.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                                log.subject?.toLowerCase().includes(emailSearchTerm.toLowerCase());
                              const matchesStatus =
                                emailStatusFilter === "ALL" || log.status === emailStatusFilter;
                              return matchesSearch && matchesStatus;
                            })
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20 transition">
                                <td className="p-4 font-bold text-slate-900 dark:text-white dir-ltr text-right">
                                  {log.toEmail}
                                </td>
                                <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                                  {log.subject}
                                </td>
                                <td className="p-4 text-center">
                                  {log.status === "SUCCESS" && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle2 size={12} />
                                      تم الإرسال بنجاح
                                    </span>
                                  )}
                                  {log.status === "FAILED" && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                      <XCircle size={12} />
                                      فشل الإرسال
                                    </span>
                                  )}
                                  {log.status === "MOCK" && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      <Info size={12} />
                                      وضع التطوير (Console)
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 max-w-xs truncate text-[11px] text-slate-500 dark:text-slate-400">
                                  {log.error ? (
                                    <span className="text-rose-500 dark:text-rose-400 font-medium" title={log.error}>
                                      {log.error}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400">لا توجد أخطاء</span>
                                  )}
                                </td>
                                <td className="p-4 text-left text-[11px] text-slate-400 dark:text-slate-500 dir-ltr">
                                  {new Date(log.createdAt).toLocaleString("ar-SA", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                              </tr>
                            ))}

                          {emailLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                                لا توجد سجلات رسائل بريد صادرة حتى الآن.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-[#021f18] border border-slate-100 dark:border-emerald-900/60 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-emerald-950 dark:text-white">تفاصيل طلب الارتباط</h3>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 font-medium">
                    وصلك طلب ارتباط من الجمعية التالية. يرجى مراجعة البيانات وتأكيد الموافقة لإتمام عملية الربط بشكل رسمي.
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">اسم الجمعية (المرسل)</label>
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.pendingName || selectedRequest.name}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">البريد الإلكتروني</label>
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.pendingEmail || "لا يوجد"}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">رقم الهاتف</label>
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.pendingPhone || "لا يوجد"}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">الدومين (domain)</label>
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.pendingDomain || "لا يوجد"}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-[#03251c]/20 border-t border-slate-100 dark:border-emerald-950/60 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 dark:border-emerald-950/60 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={approvingId === selectedRequest.id}
                onClick={() => handleApproveRequest(selectedRequest.id)}
                className="bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl px-5 py-2 text-xs font-bold transition flex items-center gap-1.5"
              >
                {approvingId === selectedRequest.id ? "جاري الموافقة..." : "موافقة وتأكيد الربط"}
              </button>
            </div>
          </div>
        </div>
      )}

      {updatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-[#021f18] border border-slate-100 dark:border-emerald-900/60 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-emerald-950/60 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-emerald-950 dark:text-white">طلب تحديث بيانات الجمعية</h3>
              <button 
                onClick={() => setUpdatingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div>
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                  وصل طلب تحديث بيانات من الجمعية. يرجى مراجعة التغييرات أدناه ثم اعتماد التحديث أو رفضه.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">البيان</label>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">البيانات الحالية</label>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-600 block mb-1">البيانات الجديدة</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                  اسم الجمعية
                </div>
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs text-slate-500 dark:text-slate-400">
                  {updatingItem.name}
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                  {updatingItem.pendingName || updatingItem.name}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                  البريد الإلكتروني
                </div>
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs text-slate-500 dark:text-slate-400">
                  {updatingItem.email || "لا يوجد"}
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                  {updatingItem.pendingEmail || "لا يوجد"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                  رقم الهاتف
                </div>
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs text-slate-500 dark:text-slate-400">
                  {updatingItem.phone || "لا يوجد"}
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                  {updatingItem.pendingPhone || "لا يوجد"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200">
                  الدومين (domain)
                </div>
                <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs text-slate-500 dark:text-slate-400">
                  {updatingItem.domain || "لا يوجد"}
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs font-bold text-amber-800 dark:text-amber-300">
                  {updatingItem.pendingDomain || "لا يوجد"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-[#03251c]/20 border-t border-slate-100 dark:border-emerald-950/60 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpdatingItem(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 dark:border-emerald-950/60 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={updateActionId === updatingItem.id}
                onClick={() => handleRejectUpdate(updatingItem.id)}
                className="px-4 py-2 border border-rose-300 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {updateActionId === updatingItem.id ? "جاري الرفض..." : "رفض التحديث"}
              </button>
              <button
                type="button"
                disabled={updateActionId === updatingItem.id}
                onClick={() => handleApproveUpdate(updatingItem.id)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl px-5 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {updateActionId === updatingItem.id ? "جاري الاعتماد..." : "اعتماد التحديث"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
