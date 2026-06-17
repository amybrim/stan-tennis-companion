import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

const SESSION_KEY = "stan_guest_token";

function generateToken(): string {
  return "stan_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = generateToken();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

interface GuestSessionContextType {
  token: string;
  name: string;
}

const GuestSessionContext = createContext<GuestSessionContextType>({
  token: "",
  name: "Steve",
});

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [token] = useState(() => getOrCreateToken());
  const [name] = useState("Steve");

  const initMutation = trpc.guest.init.useMutation();

  useEffect(() => {
    initMutation.mutate({ token, name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <GuestSessionContext.Provider value={{ token, name }}>
      {children}
    </GuestSessionContext.Provider>
  );
}

export function useGuestSession() {
  return useContext(GuestSessionContext);
}
