"use client";

import Link from "next/link";
import { Heart, MonitorPlay } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [hasToken, setHasToken] = useState(true); // Default true to prevent hydration mismatch flash

  useEffect(() => {
    // Check if the device is already authenticated as a frame
    setHasToken(!!localStorage.getItem("frame_token"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Memory Portal</h1>
        <p className="text-gray-500 mb-8">Choose your experience</p>

        <div className="flex flex-col gap-4">
          <Link 
            href="/studio"
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-white group-hover:text-emerald-600 transition-colors">
              <Heart className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-semibold text-gray-900">Caretaker Studio</h2>
              <p className="text-sm text-gray-500">Manage memories & settings</p>
            </div>
          </Link>

          <Link 
            href="/frame"
            className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900">Magic Frame</h2>
                <p className="text-sm text-gray-500">Launch patient display</p>
              </div>
            </div>
            
            {!hasToken && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  // When caregiver clicks this button, it copies the secure link to the clipboard
                  // For a real production app, the token should be fetched securely, not hardcoded.
                  // For this implementation, we will assume a static FRAME_SECRET_KEY is used.
                  const token = process.env.NEXT_PUBLIC_FRAME_SECRET_KEY || "fallback_secret_123";
                  const url = `${window.location.origin}/frame?token=${token}`;
                  navigator.clipboard.writeText(url);
                  alert("Secure Magic Frame link copied to clipboard! Open this link on the patient's tablet.");
                }}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors z-10"
              >
                Copy Link
              </button>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
