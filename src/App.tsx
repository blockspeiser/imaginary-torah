import { Outlet } from "@tanstack/react-router";
import { AppShell } from "@/app-shell";
import { useEffect } from "react";

import { useConversationStore } from "@/stores/conversations";
import { useAuthStore } from "@/stores/auth";

import "./App.css";

function App() {
  const uid = useAuthStore((s) => s.user?.uid)
  const isAuthReady = useAuthStore((s) => s.isReady)

  useEffect(() => {
    async function ensureAnonAuth() {
      await useAuthStore.getState().init();
    }

    ensureAnonAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return
    if (!uid) return
    void useConversationStore.getState().loadConversations()
  }, [isAuthReady, uid])

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default App;