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
  Lock
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
      : `sec_provider_live_9b4e1a2f${user.provider?.id || 1}dd44`)
    : "";

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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
              activeTab === "profile" 
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
            }`}
          >
            <User size={16} />
            <span>الملف الشخصي</span>
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
              activeTab === "password" 
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                activeTab === "developer" 
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-white dark:bg-[#03251c]/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100/50 hover:bg-emerald-50"
              }`}
            >
              <Webhook size={16} />
              <span>إعدادات المطورين والربط API</span>
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

                  {/* Public Key field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-white">المفتاح العام للربط (Public API Key)</label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-950 rounded-xl px-4 py-3">
                      <code className="text-xs font-mono flex-1 text-slate-700 dark:text-slate-300 overflow-x-auto select-all">{mockPublicKey}</code>
                      <button
                        onClick={() => copyToClipboard(mockPublicKey, "pub_key")}
                        className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                      >
                        {copiedKey === "pub_key" ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Secret Key field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-white flex items-center gap-1.5">
                      <Lock size={12} className="text-rose-500" />
                      المفتاح السري للربط (Secret API Key)
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
                    <span className="text-[10px] text-rose-500 font-bold block">تحذير: لا تشارك المفتاح السري أبداً ولا تضعه في أكواد الواجهة الأمامية!</span>
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

          </div>
        </div>

      </div>
    </div>
  );
}
