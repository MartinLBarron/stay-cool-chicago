// Platform detection and deep-link builder for navigation apps.

const IOS_RE    = /iPad|iPhone|iPod/i;
const MOBILE_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const isIOS     = () => IOS_RE.test(navigator.userAgent);
export const isMobile  = () => MOBILE_RE.test(navigator.userAgent);
export const isDesktop = () => !isMobile();

/**
 * Returns { primary, fallback } direction URLs for the current platform.
 *
 *   iOS     → primary: Apple Maps deep link, fallback: Google Maps web
 *   Android → primary: Google Maps,          fallback: Apple Maps web
 *   Desktop → primary: Google Maps,          fallback: Apple Maps web
 */
/**
 * Returns a URL that opens the location as a pin (no routing).
 */
export function getLocationURL(lat, lng) {
  return isIOS()
    ? `maps://maps.apple.com/?ll=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function getDirectionsURLs(lat, lng) {
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  const apple  = isIOS()
    ? `maps://maps.apple.com/?daddr=${lat},${lng}`          // native app on iOS
    : `https://maps.apple.com/?daddr=${lat},${lng}`;         // web fallback on desktop

  return isIOS()
    ? { primary: apple,  primaryLabel: 'Apple Maps',  fallback: google, fallbackLabel: 'Google Maps' }
    : { primary: google, primaryLabel: 'Google Maps', fallback: apple,  fallbackLabel: 'Apple Maps'  };
}
