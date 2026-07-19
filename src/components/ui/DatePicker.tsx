"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  locale?: string;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  error,
  locale = "ar",
  minDate,
  maxDate,
  disabled,
  required,
  name,
  id,
  className = "",
}: DatePickerProps) {
  const isAr = locale === "ar";
  const months = isAr ? MONTHS_AR : MONTHS_EN;
  const dayLabels = isAr ? DAYS_AR : DAYS_EN;

  const today = new Date();
  const parsedValue = value ? new Date(value) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [viewYear, setViewYear] = useState(parsedValue?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedValue?.getMonth() ?? today.getMonth());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(today.getFullYear() / 20) * 20);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setView("days");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setView("days");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const minDateObj = minDate ? new Date(minDate) : null;
  const maxDateObj = maxDate ? new Date(maxDate) : null;

  const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const isDateDisabled = (year: number, month: number, day: number) => {
    const date = normalize(new Date(year, month, day));
    if (minDateObj && date < normalize(minDateObj)) return true;
    if (maxDateObj && date > normalize(maxDateObj)) return true;
    return false;
  };

  const isMonthDisabled = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    if (minDateObj && normalize(lastDay) < normalize(minDateObj)) return true;
    if (maxDateObj && normalize(firstDay) > normalize(maxDateObj)) return true;
    return false;
  };

  const isYearDisabled = (year: number) => {
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);
    if (minDateObj && normalize(lastDay) < normalize(minDateObj)) return true;
    if (maxDateObj && normalize(firstDay) > normalize(maxDateObj)) return true;
    return false;
  };

  const lastDayOfPrevMonth = new Date(viewYear, viewMonth, 0);
  const isPrevDisabled = minDateObj ? normalize(lastDayOfPrevMonth) < normalize(minDateObj) : false;
  const firstDayOfNextMonth = new Date(viewYear, viewMonth + 1, 1);
  const isNextDisabled = maxDateObj ? normalize(firstDayOfNextMonth) > normalize(maxDateObj) : false;

  const isTodayDisabled = !!(
    (minDateObj && normalize(today) < normalize(minDateObj)) ||
    (maxDateObj && normalize(today) > normalize(maxDateObj))
  );

  const isPrevNavigationDisabled = () => {
    if (view === "days") return isPrevDisabled;
    if (view === "months") return isYearDisabled(viewYear - 1);
    if (view === "years") return isYearDisabled(yearRangeStart - 1);
    return false;
  };

  const isNextNavigationDisabled = () => {
    if (view === "days") return isNextDisabled;
    if (view === "months") return isYearDisabled(viewYear + 1);
    if (view === "years") return isYearDisabled(yearRangeStart + 20);
    return false;
  };

  const handleOpenToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 340);
    }
    setIsOpen(!isOpen);
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    onChange(toDateStr(viewYear, viewMonth, day));
    setIsOpen(false);
    setView("days");
  };

  const handleSelectMonth = (month: number) => {
    if (isMonthDisabled(viewYear, month)) return;
    setViewMonth(month);
    setView("days");
  };

  const handleSelectYear = (year: number) => {
    if (isYearDisabled(year)) return;
    setViewYear(year);
    setView("months");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTodayDisabled) return;
    onChange(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
    setView("days");
  };

  const handlePrev = () => {
    if (view === "days") {
      if (isPrevDisabled) return;
      if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
      else { setViewMonth((m) => m - 1); }
    } else if (view === "months") {
      if (isYearDisabled(viewYear - 1)) return;
      setViewYear((y) => y - 1);
    } else if (view === "years") {
      if (isYearDisabled(yearRangeStart - 1)) return;
      setYearRangeStart((s) => s - 20);
    }
  };

  const handleNext = () => {
    if (view === "days") {
      if (isNextDisabled) return;
      if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
      else { setViewMonth((m) => m + 1); }
    } else if (view === "months") {
      if (isYearDisabled(viewYear + 1)) return;
      setViewYear((y) => y + 1);
    } else if (view === "years") {
      if (isYearDisabled(yearRangeStart + 20)) return;
      setYearRangeStart((s) => s + 20);
    }
  };

  const formatDisplay = () => {
    if (!parsedValue) return "";
    const d = parsedValue.getDate();
    const m = months[parsedValue.getMonth()];
    const y = parsedValue.getFullYear();
    return `${d} ${m} ${y}`;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const isSelected = (day: number) =>
    parsedValue &&
    viewYear === parsedValue.getFullYear() &&
    viewMonth === parsedValue.getMonth() &&
    day === parsedValue.getDate();

  const isTodayDay = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const years: number[] = [];
  for (let y = yearRangeStart; y < yearRangeStart + 20; y++) years.push(y);

  const headerLabel =
    view === "days" ? `${months[viewMonth]} ${viewYear}` :
    view === "months" ? `${viewYear}` :
    `${yearRangeStart} - ${yearRangeStart + 19}`;

  const displayValue = value ? value.replace(/-/g, "/") : "";

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350 mb-1.5">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder || (isAr ? "اختر التاريخ" : "Select date")}
          onClick={handleOpenToggle}
          className={`w-full min-h-10 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] !pl-10 !pr-10 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer select-none text-left ${
            error
              ? "border-red-400 ring-2 ring-red-400/20"
              : isOpen
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "hover:border-emerald-300 dark:hover:border-emerald-800"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
        />
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600/60 dark:text-emerald-400 h-4 w-4 pointer-events-none" />
        
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600/40 hover:text-emerald-600 dark:text-emerald-400/40 dark:hover:text-emerald-400 p-0.5 rounded-full hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition-all"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 w-72 bg-white dark:bg-[#03251c] rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-950 overflow-hidden text-slate-800 dark:text-emerald-50 animate-in fade-in duration-150 ${
            openUp ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
          } ${isAr ? "end-0" : "start-0"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 dark:bg-emerald-800 text-white">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isPrevNavigationDisabled()}
              className={`p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all ${
                isPrevNavigationDisabled() ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (view === "days") {
                  setView("months");
                } else if (view === "months") {
                  setYearRangeStart(Math.floor(viewYear / 20) * 20);
                  setView("years");
                } else {
                  setView("days");
                }
              }}
              className="text-xs font-semibold hover:bg-white/10 px-2..5 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              {headerLabel}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextNavigationDisabled()}
              className={`p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all ${
                isNextNavigationDisabled() ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          {/* Days view */}
          {view === "days" && (
            <>
              <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2 text-center text-[10px] font-medium text-slate-400 dark:text-emerald-400/60">
                {dayLabels.map((d) => (
                  <div key={d} className="text-center py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1 gap-x-1 px-4 pb-4 text-center">
                {calendarDays.map((day, idx) =>
                  day === null ? (
                    <div key={`empty-${idx}`} className="h-8 w-8" />
                  ) : (
                    <button
                      key={day}
                      type="button"
                      disabled={isDateDisabled(viewYear, viewMonth, day)}
                      onClick={() => handleSelectDay(day)}
                      className={`
                        h-8 w-8 text-xs font-normal rounded-full flex items-center justify-center transition-all
                        ${isSelected(day)
                          ? "bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-[0_0_0_2px_#10b981] cursor-pointer"
                          : isTodayDay(day)
                            ? "text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer"
                            : isDateDisabled(viewYear, viewMonth, day)
                              ? "text-slate-350 dark:text-emerald-950/30 opacity-40 cursor-not-allowed"
                              : "text-slate-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                        }
                      `}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </>
          )}

          {/* Months view */}
          {view === "months" && (
            <div className="grid grid-cols-3 gap-2 p-3 text-center">
              {months.map((m, idx) => {
                const disabledMonth = isMonthDisabled(viewYear, idx);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabledMonth}
                    onClick={() => handleSelectMonth(idx)}
                    className={`
                      py-3 px-2 rounded-xl text-xs font-medium transition-all
                      ${viewMonth === idx
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-md"
                        : disabledMonth
                          ? "text-slate-350 dark:text-emerald-950/30 opacity-40 cursor-not-allowed"
                          : "text-slate-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                      }
                    `}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Years view */}
          {view === "years" && (
            <div className="grid grid-cols-4 gap-2 p-3 text-center">
              {years.map((y) => {
                const disabledYear = isYearDisabled(y);
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={disabledYear}
                    onClick={() => handleSelectYear(y)}
                    className={`
                      py-2.5 rounded-xl text-xs font-medium transition-all
                      ${viewYear === y
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-md"
                        : disabledYear
                          ? "text-slate-355 dark:text-emerald-950/30 opacity-40 cursor-not-allowed"
                          : y === today.getFullYear()
                            ? "text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-slate-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                      }
                    `}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Today Button */}
          <button
            type="button"
            disabled={isTodayDisabled}
            onClick={handleToday}
            className={`w-full py-2.5 text-center text-xs font-semibold border-t border-emerald-100 dark:border-emerald-950 transition-all ${
              isTodayDisabled
                ? "text-slate-350 dark:text-emerald-950/30 opacity-40 cursor-not-allowed"
                : "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer"
            }`}
          >
            {isAr ? "اليوم" : "Today"}
          </button>
        </div>
      )}

      {name && (
        <input type="hidden" name={name} id={id || name} value={value || ""} />
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
