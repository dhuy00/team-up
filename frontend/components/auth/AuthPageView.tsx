"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Play,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthPageViewProps {
  defaultMode?: "signin" | "signup";
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({
  defaultMode = "signin",
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    user,
    setIsOnboardingOpen,
    login,
    register,
    logout,
  } = useAuth();

  const queryMode = searchParams?.get("mode");
  const initialMode: "signin" | "signup" =
    pathname === "/signup" || queryMode === "signup"
      ? "signup"
      : pathname === "/signin" || queryMode === "signin"
        ? "signin"
        : defaultMode;

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");

  const resetFormFields = () => {
    setEmail("");
    setPassword("");
    setName("");
    setUsername("");
    setLocation("");
  };

  const handleModeChange = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    resetFormFields();
    if (pathname === "/signin" && nextMode === "signup") {
      router.replace("/signup", { scroll: false });
    } else if (pathname === "/signup" && nextMode === "signin") {
      router.replace("/signin", { scroll: false });
    } else if (pathname?.startsWith("/auth")) {
      router.replace(`/auth?mode=${nextMode}`, { scroll: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      const ok = await login(email, password);
      if (ok) {
        resetFormFields();
        router.push("/");
      }
    } else {
      const res = await register({
        name,
        email,
        password,
        username,
        location,
      });
      if (res.ok) {
        resetFormFields();
        router.push("/passport");
      }
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col bg-canvas-soft text-ink transition-colors duration-200">
      {/* Compact Standalone Auth Top Bar */}
      <header className="w-full border-b border-border bg-canvas/90 backdrop-blur-md shrink-0 z-40">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-[10px] bg-ink flex items-center justify-center text-primary shadow-xs">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-[900] tracking-tight text-ink leading-none">
                {t("common.appName")}
              </span>
              <span className="text-[9px] font-bold text-mute tracking-wider uppercase leading-tight mt-0.5">
                {t("common.appTagline")}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-full bg-canvas-soft hover:bg-border/60 border border-border text-xs font-bold text-ink inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("auth.backToExplore")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Centered Single-Card Auth Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 min-h-0">
        <div className="max-w-[460px] w-full">
          {/* Sign In / Create Account Form Card */}
          <div className="bg-canvas rounded-[24px] p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between gap-5">
            <div className="space-y-4">
              {/* Compact Active Session Banner if already logged in */}
              {user && (
                <div className="px-3.5 py-2.5 rounded-[14px] bg-primary-pale/50 border border-primary-neutral flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Image
                      src={user.profile.avatar}
                      alt={user.profile.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover border border-ink shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink truncate">
                        {t("auth.signedInBannerTitle", {
                          name: user.profile.name,
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOnboardingOpen(true)}
                      className="px-2.5 py-1 bg-canvas hover:bg-canvas-soft text-ink border border-border rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-positive-deep" />
                      <span>{t("auth.setupPassportWizard")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-2.5 py-1 bg-canvas hover:bg-negative/10 text-negative border border-border rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>{t("auth.signOut")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Switcher Tabs: Sign In vs Create Account */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-canvas-soft rounded-[14px] border border-border">
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className={`py-2 rounded-[10px] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                  onClick={() => handleModeChange("signup")}
                  className={`py-2 rounded-[10px] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    mode === "signup"
                      ? "bg-canvas text-ink shadow-xs"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t("auth.signUp")}</span>
                </button>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-[900] text-ink tracking-tight">
                  {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
                </h1>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                autoComplete="off"
                className="space-y-3.5"
              >
                {mode === "signup" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                        {t("auth.fullNameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("auth.fullNamePlaceholder")}
                        className="w-full h-10 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                        {t("auth.usernameLabel")}
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t("auth.usernamePlaceholder")}
                        className="w-full h-10 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                      {t("auth.emailLabel")}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.emailPlaceholder")}
                      className="w-full h-10 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                      {t("auth.passwordLabel")}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.passwordPlaceholder")}
                      className="w-full h-10 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                      {t("auth.locationLabel")}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("auth.locationPlaceholder")}
                      className="w-full h-10 px-3.5 bg-canvas-soft border border-border rounded-[12px] text-xs sm:text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-primary w-full py-2.5 px-6 rounded-[24px] text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm"
                  >
                    {mode === "signin"
                      ? t("auth.signInBtn")
                      : t("auth.createAccountBtn")}
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-mute">
              <span className="truncate">{t("footer.tagline")}</span>
              <span className="shrink-0">{t("footer.rights")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPageView;
