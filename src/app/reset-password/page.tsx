"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordSchema } from "@/utils/validation";
import toast from "react-hot-toast";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!token) {
      setError("رمز إعادة التعيين (Token) مفقود في رابط الصفحة");
      setLoading(false);
      return;
    }

    // Validate using Zod client-side
    const result = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "فشل تحديث كلمة المرور");
        toast.error(data.message || "حدث خطأ أثناء التحديث");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success(data.message || "تم تغيير كلمة المرور وتسجيل الدخول بنجاح!");
      
      // Auto-redirect to portal after short delay
      setTimeout(() => {
        router.push("/portal");
        router.refresh();
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "فشل الاتصال بالخادم");
      toast.error(error.message || "فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg z-10 animate-float-in my-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#022c22] text-xl font-bold text-white">
            S
          </div>
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          تعيين كلمة مرور جديدة
        </h2>
        <p className="mt-1 text-xs text-emerald-300/80">
          أدخل كلمة المرور الجديدة لحسابك واحرص على تطابق كافة المعايير الأمنية
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 border border-emerald-500/10">
        {success ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">تم تغيير كلمة المرور بنجاح!</h3>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                تم تسجيل دخولك تلقائياً وبأمان. جاري توجيهك إلى لوحة التحكم...
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/portal"
                className="relative flex w-full justify-center rounded-xl py-3 px-4 text-xs font-semibold text-white gradient-btn"
              >
                الانتقال إلى لوحة التحكم
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-500 text-center font-medium animate-shake">
                {error}
              </div>
            )}

            {!token && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 text-center font-medium">
                تنبيه: لا يوجد رمز إعادة تعيين في الرابط. يرجى الطلب عبر صفحة "نسيت كلمة المرور".
              </div>
            )}

            {/* Password */}
            <div className="input-group">
              <label htmlFor="password">كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="" htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-3.5 text-emerald-600/50 hover:text-emerald-500 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Strength indicator matching registration */}
            <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-900" />
                <span>اشتراطات قوة كلمة المرور:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                <div className={`flex items-center gap-1.5 ${password.length >= 8 ? "text-emerald-600 font-bold" : "text-emerald-800"}`}>
                  <span>{password.length >= 8 ? "✓" : "○"}</span>
                  <span>8 أحرف على الأقل</span>
                </div>
                <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? "text-emerald-600 font-bold" : "text-emerald-800"}`}>
                  <span>{/[A-Z]/.test(password) ? "✓" : "○"}</span>
                  <span>حرف كبير واحد (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? "text-emerald-600 font-bold" : "text-emerald-800"}`}>
                  <span>{/[a-z]/.test(password) ? "✓" : "○"}</span>
                  <span>حرف صغير واحد (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${/\d/.test(password) ? "text-emerald-600 font-bold" : "text-emerald-800"}`}>
                  <span>{/\d/.test(password) ? "✓" : "○"}</span>
                  <span>رقم واحد (0-9)</span>
                </div>
                <div className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${/[^A-Za-z0-9]/.test(password) ? "text-emerald-600 font-bold" : "text-emerald-800"}`}>
                  <span>{/[^A-Za-z0-9]/.test(password) ? "✓" : "○"}</span>
                  <span>رمز خاص واحد على الأقل (مثل @$!%*?&)</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !token}
                className="relative flex w-full justify-center rounded-xl py-3.5 px-4 text-xs font-semibold text-white gradient-btn focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "جاري التحديث وتسجيل الدخول..." : "حفظ كلمة المرور الجديدة وتحديث الحساب"}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>العودة لشاشة تسجيل الدخول</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#022c22] via-[#043e2f] to-[#064e3b] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
      <Suspense fallback={<div className="text-white text-xs">جاري التحميل...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
