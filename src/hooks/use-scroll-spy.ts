import { useState, useEffect, useRef } from 'react';

export function useScrollSpy(
  selectors: string[],
  options?: IntersectionObserverInit,
) {
  const [activeId, setActiveId] = useState<string>();
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = selectors.map(selector =>
      document.querySelector(selector),
    );

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      const intersectingEntries = entries.filter(entry => entry.isIntersecting);
      if (intersectingEntries.length > 0) {
        // Get the entry with the highest intersection ratio, or the first one if ratios are equal
        const mostVisible = intersectingEntries.reduce((prev, current) => 
          current.intersectionRatio > prev.intersectionRatio ? current : prev
        );
        setActiveId(mostVisible.target.id);
      }
    }, options);

    elements.forEach(el => {
      if (el) {
        observer.current?.observe(el);
      }
    });

    return () => observer.current?.disconnect();
  }, [selectors, options]);

  return activeId;
}
