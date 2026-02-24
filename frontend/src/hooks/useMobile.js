import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for detecting swipe gestures on mobile
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum swipe distance (default: 50px)
 * @param {number} options.timeout - Maximum time for swipe (default: 500ms)
 * @returns {Object} Swipe state and ref
 */
export function useSwipe(options = {}) {
  const { threshold = 50, timeout = 500 } = options;
  const [swipeDirection, setSwipeDirection] = useState(null);
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setSwipeDirection(null);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    // Only process if within timeout
    if (deltaTime > timeout) return;

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe
    if (absX > absY && absX > threshold) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
    // Vertical swipe
    else if (absY > absX && absY > threshold) {
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
    }
  }, [threshold, timeout]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { swipeDirection, elementRef, resetSwipe: () => setSwipeDirection(null) };
}

/**
 * Hook to detect if the current device is mobile/tablet
 * @returns {boolean} True if mobile/tablet
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the screen is in mobile breakpoint (< 640px)
 * @returns {boolean} True if mobile breakpoint
 */
export function useIsMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the app is running in standalone PWA mode
 * @returns {boolean} True if in standalone mode
 */
export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      // iOS
      const isIOSStandalone = window.navigator.standalone === true;
      // Android/Chrome
      const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      setIsStandalone(isIOSStandalone || isDisplayModeStandalone);
    };

    checkStandalone();
  }, []);

  return isStandalone;
}

/**
 * Hook to manage bottom sheet/modal state for mobile
 * @param {boolean} initialState - Initial open state
 * @returns {Object} Bottom sheet state and controls
 */
export function useBottomSheet(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isClosing, setIsClosing] = useState(false);

  const open = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
    // Prevent body scroll when sheet is open
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      document.body.style.overflow = '';
    }, 300);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return { isOpen, isClosing, open, close, toggle };
}

export default {
  useSwipe,
  useIsMobile,
  useIsMobileBreakpoint,
  useIsStandalone,
  useBottomSheet
};
