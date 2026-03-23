import { useEffect, useRef } from 'react';

/**
 * Intersection Observer hook for scroll-triggered reveal animations.
 * Adds 'visible' class to elements with 'reveal' class when in viewport.
 */
export default function useReveal(threshold = 0.15) {
    const ref = useRef(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold }
        );

        // Observe the container and all .reveal children
        const revealElements = node.querySelectorAll('.reveal');
        revealElements.forEach((el) => observer.observe(el));

        // Also observe the container itself if it has .reveal
        if (node.classList.contains('reveal')) {
            observer.observe(node);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return ref;
}
