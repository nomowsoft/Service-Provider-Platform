"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  showEmptyOption?: boolean;
  emptyOptionLabel?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "-- اختر المنتج --",
  disabled = false,
  error = false,
  className = "",
  showEmptyOption = false,
  emptyOptionLabel = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setPosition("top");
      } else {
        setPosition("bottom");
      }
      setSearch("");
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerSearch));
  }, [search, options]);

  // Prepend empty/null option if enabled and not currently searching
  const renderedOptions = useMemo(() => {
    let list = [...filteredOptions];
    if (showEmptyOption && !search) {
      list = [
        {
          value: "",
          label: emptyOptionLabel || placeholder || "-- اختر --",
        },
        ...list,
      ];
    }
    return list;
  }, [filteredOptions, showEmptyOption, emptyOptionLabel, placeholder, search]);

  const selectedOption = useMemo(() => {
    if (value === "") {
      return {
        value: "",
        label: emptyOptionLabel || placeholder || "-- اختر المنتج --",
      };
    }
    return options.find((opt) => opt.value === value);
  }, [value, options, emptyOptionLabel, placeholder]);

  const isEmpty = value === "" || value === undefined || value === null;

  // Replicating standard form inputs styles from globals.css
  const baseWrapperClass = `relative w-full text-xs font-semibold rounded-[14px] transition-all duration-250 outline-none select-none cursor-pointer flex items-center justify-between px-4 py-3 min-h-[46px] border-[1.5px] ${
    error
      ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200"
      : "border-[#d1fae5] bg-[#f0fdf4] dark:border-[#047857] dark:bg-[#022c22] text-[#064e3b] dark:text-[#e2e8f0]"
  } ${
    disabled
      ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
      : "hover:border-[#a7f3d0] dark:hover:border-[#10b981] hover:bg-white dark:hover:bg-[#043e2f]"
  } ${
    open && !disabled
      ? "border-[#10b981] dark:border-[#34d399] bg-white dark:bg-[#022c22] shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:shadow-[0_0_0_4px_rgba(52,211,153,0.25)]"
      : ""
  } ${className}`;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={baseWrapperClass}
        onClick={() => !disabled && setOpen(!open)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate text-right w-full ${isEmpty ? "text-slate-500 dark:text-slate-400" : ""}`}>
          {!isEmpty && selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          } mr-2`}
        />
      </div>

      {open && !disabled && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 z-50 bg-white dark:bg-[#022c22] border border-emerald-100 dark:border-emerald-900/50 rounded-[14px] shadow-lg max-h-60 overflow-hidden flex flex-col ${
            position === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
          }`}
          role="listbox"
        >
          {/* Search bar inside dropdown */}
          <div className="px-3 py-2 border-b border-emerald-50 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/20">
            <div className="relative flex items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full bg-white dark:bg-[#03251c] text-xs text-emerald-900 dark:text-emerald-100 outline-none placeholder:text-slate-400 border border-emerald-100 dark:border-emerald-900/50 rounded-lg py-1.5 pl-8 pr-3 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <Search size={14} className="text-emerald-700 dark:text-emerald-400 absolute left-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Options container with scrollbar */}
          <div className="overflow-y-auto max-h-48 divide-y divide-emerald-50/40 dark:divide-emerald-950/40 rtl">
            {renderedOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                لا توجد نتائج
              </div>
            ) : (
              renderedOptions.map((opt) => {
                const isSelected = opt.value === value;
                const isOptDisabled = !!opt.disabled;
                return (
                  <div
                    key={opt.value}
                    className={`px-4 py-2.5 text-xs text-right cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20"
                    } ${
                      isOptDisabled
                        ? "opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOptDisabled) {
                        onChange(opt.value);
                        setOpen(false);
                      }
                    }}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isOptDisabled}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
