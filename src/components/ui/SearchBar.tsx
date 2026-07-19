"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface SearchFieldOption {
  key: string;
  label: string;
}

export interface SearchTag {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  value: string;
}

interface SearchBarProps {
  placeholder?: string;
  searchFields: SearchFieldOption[];
  tags: SearchTag[];
  onTagsChange: (tags: SearchTag[]) => void;
  rawQuery?: string;
  onRawQueryChange?: (query: string) => void;
  className?: string;
}

export default function SearchBar({
  placeholder = "ابحث هنا...",
  searchFields,
  tags,
  onTagsChange,
  rawQuery = "",
  onRawQueryChange,
  className = "",
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(rawQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external rawQuery if passed
  useEffect(() => {
    setInputValue(rawQuery);
  }, [rawQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (onRawQueryChange) onRawQueryChange(val);
    if (val.trim() !== "") {
      setIsOpen(true);
      setFocusedIndex(0);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectField = (field: SearchFieldOption) => {
    if (!inputValue.trim()) return;

    const newTag: SearchTag = {
      id: `${field.key}-${Date.now()}`,
      fieldKey: field.key,
      fieldLabel: field.label,
      value: inputValue.trim(),
    };

    onTagsChange([...tags, newTag]);
    setInputValue("");
    if (onRawQueryChange) onRawQueryChange("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag
      onTagsChange(tags.slice(0, tags.length - 1));
    } else if (isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev: number) => (prev + 1) % searchFields.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(
          (prev: number) => (prev - 1 + searchFields.length) % searchFields.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (searchFields[focusedIndex]) {
          handleSelectField(searchFields[focusedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    } else if (e.key === "Enter" && inputValue.trim() !== "") {
      // Default to first option or 'all'
      e.preventDefault();
      const defaultField = searchFields[0] || { key: "all", label: "بحث شامل" };
      handleSelectField(defaultField);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="w-full min-h-[42px] py-1 px-3 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-[#021b14] flex flex-wrap items-center gap-2 text-xs text-emerald-950 dark:text-white outline-none focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all cursor-text"
      >
        {/* Render Active Tags / Chips */}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 rounded-lg text-[11px] font-bold border border-emerald-300/60 dark:border-emerald-800 shadow-sm animate-fadeIn"
          >
            <span className="text-emerald-700/80 dark:text-emerald-400">
              {tag.fieldLabel}:
            </span>
            <span className="font-extrabold text-emerald-950 dark:text-white">
              {tag.value}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="text-emerald-600 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 p-0.5 rounded-full hover:bg-white/50 dark:hover:bg-black/30 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Text Input */}
        <div className="flex-1 flex items-center min-w-[140px] relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (inputValue.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              tags.length === 0
                ? placeholder
                : "أضف فلتر بحث آخر..."
            }
            className="w-full bg-transparent outline-none pr-2 pl-8 py-1 text-xs text-emerald-950 dark:text-white placeholder-emerald-600/40 dark:placeholder-emerald-400/40"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-600/60 dark:text-emerald-400 h-4 w-4 pointer-events-none" />
        </div>
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && inputValue.trim() !== "" && (
        <div className="absolute top-full right-0 left-0 mt-1.5 bg-white dark:bg-[#03251c] border border-emerald-100 dark:border-emerald-900 rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn space-y-0.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 border-b border-emerald-50 dark:border-emerald-950/40 flex items-center justify-between">
            <span>اختر حقل البحث المخصص:</span>
            <span className="text-[9px] text-slate-400">استخدم ↵ Enter للاختيار</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 py-1">
            {searchFields.map((field, idx) => (
              <button
                key={field.key}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleSelectField(field);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`w-full text-right px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                  idx === focusedIndex
                    ? "bg-emerald-100/80 dark:bg-emerald-950 text-emerald-950 dark:text-white font-bold"
                    : "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search
                    size={13}
                    className={
                      idx === focusedIndex
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-emerald-500/70 dark:text-emerald-400/70"
                    }
                  />
                  <span>
                    بحث <strong className="text-emerald-900 dark:text-emerald-200">{field.label}</strong> لـ :
                  </span>
                </div>
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                  {inputValue}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
