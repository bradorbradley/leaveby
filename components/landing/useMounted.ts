"use client";

import { useEffect, useState } from "react";

/** True after hydration. Demos are built from the current time, so they render only on the client. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
