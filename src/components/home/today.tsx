"use client";

import { useSyncExternalStore } from "react";

const format = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Dubai",
});

function subscribe() {
  return () => {};
}

export function Today() {
  const label = useSyncExternalStore(
    subscribe,
    () => format.format(new Date()),
    () => null,
  );

  return <span>{label ?? "\u00a0"}</span>;
}
