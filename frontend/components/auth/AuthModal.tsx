"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Check, LogOut, Sparkles, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

export const AuthModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    demoAccounts,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setIsOnboardingOpen,
    login,
    register,
    switchDemoAccount,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("alex@teamup.app");
  const [password, setPassword] = useState("demo123");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");

  useLockBodyScroll(isAuthModalOpen);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsAuthModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      await login(email, password);
    } else {
      const res = await register({
        name,
        email,
        password,
        username,
        location,
      });
      if (res.ok) {
        setName("");
        setUsername("");
        setLocation("");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-canvas rounded-[24px] max-w-lg w-full px-6 sm:px-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar transition-colors duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-canvas pt-5 sm:pt-6 pb-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-primary text-ink text-xs font-bold rounded-full uppercase">
              {t("auth.switchAccount")}
            </span>
            <h3
              id="auth-modal-title"
              className="text-xl sm:text-2xl font-[900] text-ink mt-1.5 tracking-tight"
            >
              {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label={t("common.close")}
            className="p-2 bg-canvas-soft hover:bg-border/60 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Player Switcher */}
        <div className="p-4 rounded-[18px] bg-canvas-soft border border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                {t("auth.demoAccountsTitle")}
              </h4>
              <p className="text-[11px] text-mute mt-0.5">
                {t("auth.demoAccountsSubtitle")}
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setIsOnboardingOpen(true);
                }}
                className="px-3 py-1.5 bg-canvas hover:bg-border/50 text-ink border border-border rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3 h-3 text-positive-deep" />
                <span>{t("auth.setupPassportWizard")}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {demoAccounts.map((acc) => {
              const isCurrent = user?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => switchDemoAccount(acc)}
                  className={`w-full p-2.5 rounded-[14px] border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    isCurrent
                      ? "bg-primary-pale/50 border-primary-neutral"
                      : "bg-canvas hover:bg-canvas-soft border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Image
                      src={acc.profile.avatar}
                      alt={acc.profile.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-ink shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink truncate">
                        {acc.profile.name}{" "}
                        <span className="text-mute font-normal">
                          ({acc.profile.username})
                        </span>
                      </div>
                      <div className="text-[11px] text-mute truncate">
                        {acc.email} • {acc.profile.karma}% Karma
                      </div>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 bg-primary text-ink text-[10px] font-bold rounded-full inline-flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>{t("auth.activeSessionBadge")}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Tabs: Sign In vs Create Account */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas-soft rounded-[16px] border border-border">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`py-2 rounded-[12px] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "signin"
                ? "bg-canvas text-ink shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t("auth.signIn")}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-2 rounded-[12px] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === "signup"
                ? "bg-canvas text-ink shadow-xs"
                : "text-mute hover:text-ink"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t("auth.signUp")}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pb-5">
          {mode === "signup" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  {t("auth.fullNameLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  {t("auth.usernameLabel")}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.usernamePlaceholder")}
                  className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              {t("auth.emailLabel")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              {t("auth.passwordLabel")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-ink uppercase mb-1">
                {t("auth.locationLabel")}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("auth.locationPlaceholder")}
                className="w-full h-11 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
              />
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 bg-canvas-soft hover:bg-negative-pale text-body hover:text-negative border border-border rounded-[24px] text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("auth.signOut")}</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-[24px] text-sm font-semibold transition cursor-pointer shadow-sm ml-auto"
            >
              {mode === "signin"
                ? t("auth.signInBtn")
                : t("auth.createAccountBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
