import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

export const homePages = ["overview", "diagnostics", "agent-workflow", "get-started"] as const;

export function useHomePages() {
  const containerRef = useRef<HTMLElement>(null);
  const [activePage, setActivePage] = useState(0);

  const navigate = useCallback((event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const container = containerRef.current;
    const section = container?.querySelector<HTMLElement>(`#${homePages[index]}`);
    if (!container || !section) return;

    event.preventDefault();
    container.scrollTo({
      top: section.offsetTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
    window.history.replaceState(window.history.state, "", `#${homePages[index]}`);
    section.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-home-page]"));
    let observer: IntersectionObserver | undefined;

    // Observe a narrow band in the middle of the viewport. This also works when
    // a section grows taller than the viewport on a phone or at increased zoom.
    function observePages() {
      if (!container) return;
      observer?.disconnect();
      const inset = Math.max(0, (container.clientHeight - 2) / 2);
      observer = new IntersectionObserver(() => {
        const center = container.getBoundingClientRect().top + container.clientHeight / 2;
        const index = sections.findIndex(section => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= center && bounds.bottom > center;
        });
        if (index >= 0) setActivePage(index);
      }, { root: container, rootMargin: `-${inset}px 0px -${inset}px 0px`, threshold: 0 });
      sections.forEach(section => observer?.observe(section));
    }

    function restoreAnchor() {
      if (!container) return;
      const id = window.location.hash.slice(1);
      const anchor = Array.from(container.querySelectorAll<HTMLElement>("[id]"))
        .find(element => element.id === id);
      const section = anchor?.closest<HTMLElement>("[data-home-page]");
      if (section) container.scrollTo({ top: section.offsetTop, behavior: "instant" });
    }

    const resizeObserver = new ResizeObserver(observePages);
    resizeObserver.observe(container);
    observePages();
    const frame = window.requestAnimationFrame(restoreAnchor);
    window.addEventListener("hashchange", restoreAnchor);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", restoreAnchor);
      observer?.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return { containerRef, activePage, navigate };
}
