import { useState, useEffect } from "react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if user has dismissed the prompt multiple times
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) {
      setDismissCount(parseInt(dismissed, 10));
    }

    // Show prompt after 3 visits if not dismissed too many times
    const visitCount =
      parseInt(localStorage.getItem("visitCount") || "0", 10) + 1;
    localStorage.setItem("visitCount", visitCount.toString());

    if (visitCount >= 3 && dismissed < 3) {
      setShowPrompt(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem("installPromptDismissed", newCount.toString());
    setShowPrompt(false);

    // Don't show again if dismissed 3+ times
    if (newCount >= 3) {
      localStorage.setItem("installPromptPermanentlyDismissed", "true");
    }
  };

  if (!showPrompt || !deferredPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 safe-area-bottom">
      <div className="max-w-lg mx-auto glass-strong rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/10">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-zinc-400" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <DevicePhoneMobileIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">
              Install Fit Tracker
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Get the full experience with offline access and faster loading
            </p>

            {isIOS ? (
              <div className="text-xs text-zinc-500 bg-white/5 rounded-lg p-3">
                <p className="font-medium text-zinc-300 mb-1">
                  To install on iOS:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the Share button</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right</li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full sm:w-auto touch-feedback bg-white text-zinc-900 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Install App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
