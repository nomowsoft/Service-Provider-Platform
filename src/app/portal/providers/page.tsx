"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wrench, 
  Search, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import toast from "react-hot-toast";

interface ProviderItem {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"code" | "name" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: "code" | "name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    async function initPage() {
      try {
        // 1. Verify user role
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/login");
          return;
        }
        const userData = await userRes.json();
        if (userData.user.role !== "SUPER_ADMIN") {
          setAuthorized(false);
          toast.error("غير مصرح لك بالوصول لهذه الصفحة");
          router.push("/portal");
          return;
        }
        setAuthorized(true);

        // 2. Fetch providers list
        const providersRes = await fetch("/api/providers");
        if (!providersRes.ok) {
          throw new Error("فشل تحميل قائمة مزودي الخدمة");
        }
        const data = await providersRes.json();
        setProviders(data.providers);
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <span className="text-xs text-emerald-800 dark:text-emerald-300">جاري تحميل قائمة مزودي الخدمة...</span>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="text-center py-12 space-y-4">
        <ShieldAlert className="mx-auto text-rose-500 h-12 w-12" />
        <h3 className="text-lg font-bold text-emerald-950 dark:text-white">دخول غير مصرح به</h3>
        <p className="text-xs text-slate-500">هذه الصفحة مخصصة لمدير النظام فقط.</p>
      </div>
    );
  }

  const filteredProviders = providers.filter((p) => {
    if (searchTerm.trim() === "") return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField] || "";
    const valB = b[sortField] || "";
    const comparison = valA.localeCompare(valB, "ar", { numeric: true, sensitivity: "base" });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Title and Description */}
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-white">دليل مزودي الخدمة</h1>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">
            عرض ومتابعة قائمة مزودي الخدمات المعتمدين في النظام وبيانات الاتصال الخاصة بهم
          </p>
        </div>

        {/* Search input group */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="البحث بالاسم، الكود، أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-emerald-100 dark:border-emerald-950 bg-white dark:bg-[#03251c] pl-10 pr-4 py-2.5 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="absolute left-3.5 top-3.5 text-emerald-600/60 dark:text-emerald-400 h-4 w-4" />
        </div>
      </div>

      {/* Providers list container */}
      <div className="glass-card rounded-3xl p-6 shadow-sm border border-emerald-100/50">
        {filteredProviders.length === 0 ? (
          <div className="flex h-[30vh] flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-100/50 dark:border-emerald-950/40 rounded-3xl p-8 text-center bg-white dark:bg-[#03251c]/25">
            <Wrench className="text-emerald-300 dark:text-emerald-800 h-12 w-12" />
            <h3 className="text-sm font-bold text-emerald-950 dark:text-white">لا يوجد مزودي خدمة</h3>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400 max-w-xs">لم يتم العثور على أي مزودي خدمة يطابقون خيارات البحث الحالية.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm whitespace-nowrap md:whitespace-normal">
              <thead>
                <tr className="border-b border-emerald-50 dark:border-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <th 
                    className="pb-3 px-4 cursor-pointer select-none hover:text-emerald-500 transition-colors"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1">
                      <span>كود الشريك</span>
                      {sortField === "code" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} className="text-emerald-500" />
                        ) : (
                          <ArrowDown size={12} className="text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-emerald-600/30 dark:text-emerald-300/30" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="pb-3 px-2 cursor-pointer select-none hover:text-emerald-500 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      <span>الاسم التجاري</span>
                      {sortField === "name" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={12} className="text-emerald-500" />
                        ) : (
                          <ArrowDown size={12} className="text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="text-emerald-600/30 dark:text-emerald-300/30" />
                      )}
                    </div>
                  </th>
                  <th className="pb-3 px-2">البريد الإلكتروني</th>
                  <th className="pb-3 px-2">رقم الهاتف</th>
                  <th className="pb-3 px-4 text-left">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 dark:divide-emerald-950/40">
                {sortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="py-4 px-4 font-bold text-emerald-800 dark:text-emerald-300">
                      {provider.code}
                    </td>
                    <td className="py-4 px-2 text-emerald-950 dark:text-white font-semibold">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-emerald-600/70" />
                        <span>{provider.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">
                      {provider.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          <span>{provider.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">غير محدد</span>
                      )}
                    </td>
                    <td className="py-4 px-2 text-slate-600 dark:text-slate-300 text-xs">
                      {provider.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{provider.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">غير محدد</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-left text-xs text-slate-500 font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {new Date(provider.createdAt).toLocaleDateString("ar-SA", {
                            dateStyle: "medium"
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
