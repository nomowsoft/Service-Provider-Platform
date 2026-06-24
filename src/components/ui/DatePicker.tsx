"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "اختر التاريخ",
  className = "",
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to today
  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const initialDate = value ? new Date(value) : today;
  
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  // Normalize min/max dates
  const minNormalized = minDate ? new Date(new Date(minDate).getFullYear(), new Date(minDate).getMonth(), new Date(minDate).getDate()) : null;
  const maxNormalized = maxDate ? new Date(new Date(maxDate).getFullYear(), new Date(maxDate).getMonth(), new Date(maxDate).getDate()) : null;

  // Check if prev/next month navigation should be disabled
  const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0);
  const isPrevMonthDisabled = minNormalized ? lastDayOfPrevMonth < minNormalized : false;

  const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
  const isNextMonthDisabled = maxNormalized ? firstDayOfNextMonth > maxNormalized : false;

  const isTodayDisabled = !!(
    (minNormalized && todayNormalized < minNormalized) ||
    (maxNormalized && todayNormalized > maxNormalized)
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  const monthNamesEN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to format date object to YYYY-MM-DD local string
  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPrevMonthDisabled) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNextMonthDisabled) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(formatDateString(selected));
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTodayDisabled) return;
    onChange(formatDateString(today));
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Calendar rendering math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create list of empty padding cells for the grid start offset
  const blankCells = Array.from({ length: firstDayIndex }, (_, i) => null);
  // Create list of day numbers for the month
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = [...blankCells, ...dayCells];

  // Format date display (e.g. "2026-06-20" -> "2026/06/20" or styled)
  const displayValue = value ? value.replace(/-/g, "/") : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] pl-10 pr-10 text-xs text-emerald-950 dark:text-white outline-none focus:border-emerald-500 transition-all cursor-pointer select-none text-left ${className}`}
        />
        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600/60 dark:text-emerald-400 h-4 w-4 pointer-events-none" />
        
        {value && (
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
          className="absolute z-50 mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-[#03251c] border border-emerald-100 dark:border-emerald-950 text-slate-800 dark:text-emerald-50 animate-fadeIn"
          style={{ left: 0 }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 dark:bg-emerald-800 text-white">
            <button
              type="button"
              disabled={isPrevMonthDisabled}
              onClick={handlePrevMonth}
              className={`p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all ${
                isPrevMonthDisabled ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-white tracking-wide">
              {monthNamesEN[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              disabled={isNextMonthDisabled}
              onClick={handleNextMonth}
              className={`p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all ${
                isNextMonthDisabled ? "opacity-30 cursor-not-allowed" : ""
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 px-4 pt-4 pb-2 text-center text-[10px] font-medium text-slate-400 dark:text-emerald-400/60">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-1 px-4 pb-4 text-center">
            {totalCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8 w-8" />;
              }

              const cellDate = new Date(currentYear, currentMonth, day);
              const isCellDisabled = !!(
                (minNormalized && cellDate < minNormalized) ||
                (maxNormalized && cellDate > maxNormalized)
              );

              // Check if selected
              const isSelected =
                value &&
                new Date(value).getDate() === day &&
                new Date(value).getMonth() === currentMonth &&
                new Date(value).getFullYear() === currentYear;

              // Check if today
              const isToday =
                today.getDate() === day &&
                today.getMonth() === currentMonth &&
                today.getFullYear() === currentYear;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={isCellDisabled}
                  onClick={() => !isCellDisabled && handleSelectDay(day)}
                  className={`
                    h-8 w-8 text-xs font-normal rounded-full flex items-center justify-center transition-all
                    ${
                      isCellDisabled
                        ? "text-slate-350 dark:text-emerald-950/30 opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-[0_0_0_2px_#10b981] cursor-pointer"
                        : isToday
                        ? "text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer"
                        : "text-slate-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

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
            Today
          </button>
        </div>
      )}
    </div>
  );
}
