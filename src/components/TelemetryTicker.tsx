"use client";

import React, { useEffect, useState } from "react";

export default function TelemetryTicker() {
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const start = performance.now();
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        const end = performance.now();
        const diff = Math.max(1, Math.round(end - start));
        setLatency(diff);
      };
      channel.port2.postMessage(null);
    };

    measure();
    const interval = setInterval(measure, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="hidden sm:inline" title="Real browser event-loop queue latency">
      LATENCY: {latency !== null ? `${latency}ms` : "--ms"}
    </span>
  );
}

