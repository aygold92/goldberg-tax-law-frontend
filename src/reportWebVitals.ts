/**
 * Web Vitals performance monitoring utility.
 * 
 * This file provides performance monitoring capabilities for the application:
 * - Measures Core Web Vitals metrics (CLS, FID, FCP, LCP, TTFB)
 * - Enables performance tracking and analytics
 * - Supports custom performance reporting handlers
 * 
 * Core Web Vitals measured:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FID (First Input Delay): Interactivity
 * - FCP (First Contentful Paint): Loading performance
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 * 
 * Used for monitoring application performance and user experience metrics.
 */

import { ReportHandler } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
