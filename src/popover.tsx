/** A minimal popover: no floating-ui, no configuration.
 *
 *  It renders into a portal on `document.body` with fixed positioning, because a picker is
 *  usually opened inside something that clips — a dialog, a table cell, a card with
 *  `overflow: hidden`. An absolutely positioned panel would simply be cut off there.
 *
 *  Placement flips above the trigger when there is no room below, shifts horizontally to
 *  stay in the viewport, and caps its height so a small window scrolls instead of hiding
 *  half the calendar. Closes on outside click, Escape and scroll of an ancestor. */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  /** Panel classes — the app's theme class can be forwarded here (the panel is portalled
   *  out of the tree, so it does not inherit an ancestor's `.dark`). */
  panelClassName?: string;
}

const MARGIN = 8;

export function Popover({ open, onOpenChange, trigger, children, align = "start", className, panelClassName }: PopoverProps): React.ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const place = useCallback((): void => {
    const wrap = wrapRef.current;
    const panel = panelRef.current;
    if (!wrap || !panel) return;
    const t = wrap.getBoundingClientRect();
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const below = vh - t.bottom - MARGIN;
    const above = t.top - MARGIN;
    const dropUp = below < h && above > below;
    const maxHeight = Math.max(220, Math.min(h, dropUp ? above : below));
    const top = dropUp ? Math.max(MARGIN, t.top - MARGIN - Math.min(h, maxHeight)) : t.bottom + MARGIN;

    let left = align === "end" ? t.right - w : t.left;
    left = Math.min(left, vw - w - MARGIN);
    left = Math.max(MARGIN, left);

    setPos({ top, left, maxHeight });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent): void => {
      const target = e.target as Node;
      if (!wrapRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      close();
      wrapRef.current?.querySelector<HTMLElement>("[data-rcal-trigger]")?.focus();
    };
    const onReflow = (): void => place();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, close, place]);

  const panel = (
    <div
      ref={panelRef}
      className={["rcal-popover", panelClassName].filter(Boolean).join(" ")}
      role="dialog"
      style={pos
        ? { top: pos.top, left: pos.left, maxHeight: pos.maxHeight, visibility: "visible" }
        // First paint measures the panel; keep it out of sight until it has a place to be.
        : { top: 0, left: 0, visibility: "hidden" }}
    >
      {children}
    </div>
  );

  return (
    <div className={["rcal-popover-wrap", className].filter(Boolean).join(" ")} ref={wrapRef}>
      {trigger}
      {open && mounted ? createPortal(panel, document.body) : null}
    </div>
  );
}
