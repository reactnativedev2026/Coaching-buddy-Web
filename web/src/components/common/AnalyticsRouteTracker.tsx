import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}
/** React-Router navigation signals only; no user data and no auth changes. */
export default function AnalyticsRouteTracker() {
  const location = useLocation();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; // Initial page load is counted by GA4 Google tag.
      return;
    }
    const pathname = location.pathname;
    // Skip account, SEO admin, onboarding and login areas to avoid sensitive tracking.
    if (/^\/(seo-admin|student|dashboard|courses|bookings|media|offers|settings|login|onboard|success|design-system)(\/|$)/.test(pathname)) return;
    if (/^\/institute\/(login|dashboard|courses|bookings|media|offers|settings|onboard|success)(\/|$)/.test(pathname)) return;
    const timer = window.setTimeout(() => {
      const page_location = `${window.location.origin}${pathname}`;
      const page_path = pathname;
      const page_title = document.title;
      if (import.meta.env.VITE_GTM_ID) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'cb_virtual_page_view', page_location, page_path, page_title });
      } else if (import.meta.env.VITE_GA4_MEASUREMENT_ID && window.gtag) {
        window.gtag('event', 'page_view', { page_location, page_path, page_title });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  return null;
}
