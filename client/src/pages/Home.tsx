// Home.tsx is replaced by MorningBriefing.tsx as the root page
// This file is kept as a redirect for safety
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/");
  }, [navigate]);
  return null;
}
