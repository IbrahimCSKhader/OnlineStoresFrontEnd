export function trackMetaPixelEvent(eventName) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  window.fbq("track", eventName);
  return true;
}

export function trackCompleteRegistration() {
  return trackMetaPixelEvent("CompleteRegistration");
}
