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
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  charity?: {
    id: number;
    name: string;
    licenseNumber: string;
    description: string;
    phone: string;
  } | null;
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

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  // API Config (Mock keys for beautiful visual UX)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    if (!currentPassword || !newPassword) {
      toast.error("يرجى ملء جميع حقول كلمة المرور");
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
    ? (user.role === "CHARITY_STAFF"
      ? `pub_charity_live_9a87d623${user.charity?.id || 1}eb21`
      : `pub_provider_live_8f3d2e1c${user.provider?.id || 1}ab90`)
    : "";

  const mockSecretKey = user
    ? (user.role === "CHARITY_STAFF"
      ? `sec_charity_live_3d21f8a7${user.charity?.id || 1}ee55`
      : (user.provider?.apiCode || `code_9b4e1a2f${user.provider?.id || 1}dd44`))
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

          {(user?.role === "CHARITY_STAFF" || user?.role === "SERVICE_PROVIDER") && (
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
                  <p className="text-[10px] text-slate-500 mt-1">يرجى اختيار كلمة مرور قوية وغير مكررة لحماية حسابك</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="input-group">
                      <label>كلمة المرور الحالية</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>كلمة المرور الجديدة</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-emerald-50/50">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto rounded-xl py-3 px-6 text-xs font-bold text-white gradient-btn"
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
                      {user?.role === "CHARITY_STAFF" ? (
                        <>
                          <Building className="text-emerald-700" size={20} />
                          <div>
                            <span className="text-sm font-bold text-emerald-950 dark:text-white block">{user?.charity?.name}</span>
                            <span className="text-[10px] text-slate-400">معرف الجهة: {user?.charity?.id}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Wrench className="text-amber-600" size={20} />
                          <div>
                            <span className="text-sm font-bold text-emerald-950 dark:text-white block">{user?.provider?.name}</span>
                            <span className="text-[10px] text-slate-400">معرف مزود الخدمة: {user?.provider?.id}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Secret Key field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-white flex items-center gap-1.5">
                      <Lock size={12} className="text-rose-500" />
                      {user?.role === "SERVICE_PROVIDER" ? "كود الربط لمزود الخدمة (apiCode)" : "المفتاح السري للربط (Secret API Key)"}
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-950 rounded-xl px-4 py-3">
                      <code className="text-xs font-mono flex-1 text-slate-700 dark:text-slate-300 overflow-x-auto select-all">{mockSecretKey}</code>
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
                    <table className="w-full border-collapse text-right text-xs">
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
                              <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-300">{item.code}</td>
                              <td className="p-4 font-bold text-emerald-950 dark:text-white">{item.name}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-emerald-950/15 border border-slate-100 dark:border-emerald-950/40 px-2.5 py-1.5 rounded-lg w-fit">
                                  <code className="font-mono text-[10px] text-slate-600 dark:text-slate-300 max-w-[150px] truncate select-all">{item.token}</code>
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
                                <div className="flex items-center justify-center gap-2">
                                  {item.status === "REQUESTED" && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedRequest(item)}
                                      className="bg-emerald-950 hover:bg-emerald-900 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                    >
                                      عرض طلب الارتباط
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCharity(item.id)}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-2 rounded-lg transition inline-flex items-center justify-center"
                                    title="حذف الربط"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
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
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedRequest.pendingPhone || "لا يوجد"}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">الدومين (domain)</label>
                  <div className="p-3 bg-slate-50 dark:bg-emerald-950/20 rounded-xl border border-slate-100 dark:border-emerald-950/40 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
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
    </div>
  );
}
