"use client";

import React from "react";
import { GlobalProvider } from "../context/GlobalContext";

export default function ClientProviders({ children, initialUser }: { children: React.ReactNode; initialUser?: unknown }) {
  return <GlobalProvider initialUser={initialUser}>{children}</GlobalProvider>;
}
