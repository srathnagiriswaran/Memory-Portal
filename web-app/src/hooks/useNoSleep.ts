"use client";

import { useEffect, useRef, useState } from "react";
import NoSleep from "nosleep.js";

export function useNoSleep() {
  const [isAwake, setIsAwake] = useState(false);
  const noSleepRef = useRef<NoSleep | null>(null);

  useEffect(() => {
    // Initialize NoSleep instance only on the client
    noSleepRef.current = new NoSleep();

    return () => {
      // Clean up on unmount
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }
    };
  }, []);

  const enable = async () => {
    if (noSleepRef.current && !isAwake) {
      try {
        await noSleepRef.current.enable();
        setIsAwake(true);
      } catch (err) {
        console.error("Failed to enable NoSleep:", err);
      }
    }
  };

  const disable = () => {
    if (noSleepRef.current && isAwake) {
      noSleepRef.current.disable();
      setIsAwake(false);
    }
  };

  return { isAwake, enable, disable };
}
