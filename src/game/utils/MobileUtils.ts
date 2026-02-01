export class MobileUtils {
    /**
     * Detect if the current device is a mobile device
     */
    static isMobile(): boolean {
        // Tauri desktop apps should NOT be treated as mobile (even if they have touch support)
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
            return false;
        }
        
        // Check for touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check user agent for mobile patterns
        const userAgent = navigator.userAgent.toLowerCase();
        const mobilePatterns = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileUA = mobilePatterns.test(userAgent);
        
        // Consider it mobile if either condition is true and screen is narrow
        const isNarrowScreen = window.innerWidth < 1024;
        
        return (hasTouch || isMobileUA) && isNarrowScreen;
    }

    /**
     * Request landscape orientation on mobile devices
     */
    static requestLandscape(): void {
        if (!this.isMobile()) return;

        // Try to lock orientation to landscape (may not work on all browsers)
        if (screen.orientation && (screen.orientation as any).lock) {
            (screen.orientation as any).lock('landscape').catch((err: Error) => {
                console.log('Orientation lock not supported:', err);
            });
        }

        // Fallback: Request landscape via meta tag (already in HTML)
        // and show a message to rotate if in portrait
        if (window.innerHeight > window.innerWidth) {
            console.log('Please rotate your device to landscape mode for the best experience');
        }
    }

    /**
     * Request fullscreen mode
     * Note: This must be called from a user gesture (like touch event)
     */
    static requestFullscreen(): Promise<void> {
        const elem = document.documentElement;

        if (elem.requestFullscreen) {
            return elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
            return (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
            return (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
            return (elem as any).msRequestFullscreen();
        }

        return Promise.reject('Fullscreen not supported');
    }

    /**
     * Check if currently in fullscreen
     */
    static isFullscreen(): boolean {
        return !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        );
    }

    /**
     * Exit fullscreen
     */
    static exitFullscreen(): Promise<void> {
        if (document.exitFullscreen) {
            return document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            return (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            return (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            return (document as any).msExitFullscreen();
        }

        return Promise.reject('Exit fullscreen not supported');
    }

    /**
     * Get device pixel ratio for high-DPI displays
     */
    static getPixelRatio(): number {
        return window.devicePixelRatio || 1;
    }
}
