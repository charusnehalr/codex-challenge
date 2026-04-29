"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  periodDates?: string[];
};

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const displayFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromIso(value?: string) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function DatePicker({ label, value, onChange, placeholder = "Select date", periodDates = [] }: DatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedDate = dateFromIso(value);
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? today);
  const periodSet = useMemo(() => new Set(periodDates), [periodDates]);
  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  useEffect(() => {
    if (selectedDate) {
      setViewMonth(selectedDate);
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const rect = wrapperRef.current?.getBoundingClientRect();
    setOpensUpward(Boolean(rect && window.innerHeight - rect.bottom < 380));

    function onMouseDown(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function moveMonth(delta: number) {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectDate(date: Date) {
    onChange(isoDate(date));
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label ? <p className="mb-1.5 font-body text-xs font-medium text-ink2">{label}</p> : null}
      <button
        type="button"
        data-cursor-hover
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border bg-card px-4 font-body text-sm transition-all duration-200",
          open ? "border-clay ring-2 ring-clay/15" : "border-hairline hover:border-clay/50",
        )}
      >
        <span className="flex items-center gap-3">
          <CalendarDays className="size-4 text-muted" aria-hidden="true" />
          <span className={selectedDate ? "text-ink" : "text-muted"}>
            {selectedDate ? displayFormatter.format(selectedDate) : placeholder}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn(
              "absolute left-0 z-50 min-w-[320px] rounded-2xl border border-hairline bg-card p-5 shadow-[0_8px_40px_rgba(31,27,22,0.14),0_2px_8px_rgba(31,27,22,0.08)]",
              opensUpward ? "bottom-full mb-2" : "top-full mt-2",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <motion.button
                type="button"
                data-cursor-hover
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => moveMonth(-1)}
                className="grid size-8 place-items-center rounded-full border border-hairline bg-transparent text-muted transition-colors duration-150 hover:bg-shell hover:text-ink"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </motion.button>
              <h3 className="font-display text-lg italic text-ink">{monthFormatter.format(viewMonth)}</h3>
              <motion.button
                type="button"
                data-cursor-hover
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => moveMonth(1)}
                className="grid size-8 place-items-center rounded-full border border-hairline bg-transparent text-muted transition-colors duration-150 hover:bg-shell hover:text-ink"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </motion.button>
            </div>

            <div className="mb-2 grid grid-cols-7 border-b border-hairline pb-2">
              {weekdays.map((weekday) => (
                <div key={weekday} className="flex h-8 items-center justify-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {days.map((date) => {
                const outsideMonth = date.getMonth() !== viewMonth.getMonth();
                const selected = selectedDate ? sameDay(date, selectedDate) : false;
                const isToday = sameDay(date, today);
                const dateKey = isoDate(date);

                return (
                  <motion.button
                    key={dateKey}
                    type="button"
                    data-cursor-hover={!outsideMonth ? true : undefined}
                    disabled={outsideMonth}
                    whileTap={!outsideMonth ? { scale: 0.88 } : undefined}
                    animate={selected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={selected ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] } : { type: "spring", stiffness: 420, damping: 24 }}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "relative grid size-9 place-items-center rounded-xl font-body text-sm transition-colors duration-100",
                      outsideMonth && "pointer-events-none text-muted opacity-40",
                      !outsideMonth && !selected && !isToday && "text-ink2 hover:bg-shell hover:text-ink",
                      isToday && !selected && "border border-claySoft bg-claySoft/40 font-medium text-clay",
                      selected && "bg-clay font-semibold text-cream shadow-[0_2px_12px_rgba(184,112,79,0.35)]",
                    )}
                  >
                    <span>{date.getDate()}</span>
                    {periodSet.has(dateKey) && !outsideMonth ? (
                      <span className={cn("absolute bottom-1 size-1 rounded-full", selected ? "bg-cream" : "bg-clay")} />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-between border-t border-hairline pt-3">
              <button type="button" data-cursor-hover className="font-mono text-xs text-muted hover:underline" onClick={() => onChange(undefined)}>
                Clear
              </button>
              <button type="button" data-cursor-hover className="font-mono text-xs text-clay hover:underline" onClick={() => selectDate(today)}>
                Today
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
