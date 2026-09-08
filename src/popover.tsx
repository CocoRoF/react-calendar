/** A minimal popover: no floating-ui, no portals to configure. It flips above the trigger
 *  when the panel would run past the viewport, closes on outside click and Escape, and
 *  returns focus to the trigger — the three things people actually notice. */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function Popover({ open, onOpenChange, trigger, children, align = "start", className }: PopoverProps): React.ReactElement {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [drop, setDrop] = useState<"down" | "up">("down");

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent): void => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        close();
        wrapRef.current?.querySelector<HTMLElement>("[data-rcal-trigger]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open || !panelRef.current || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const height = panelRef.current.offsetHeight;
    const room = window.innerHeight - rect.bottom;
    setDrop(room < height + 12 && rect.top > height + 12 ? "up" : "down");
  }, [open]);

  return (
    <div className={["rcal-popover-wrap", className].filter(Boolean).join(" ")} ref={wrapRef}>
      {trigger}
      {open ? (
        <div ref={panelRef} className={`rcal-popover rcal-drop-${drop} rcal-align-${align}`} role="dialog">
          {children}
        </div>
      ) : null}
    </div>
  );
}
