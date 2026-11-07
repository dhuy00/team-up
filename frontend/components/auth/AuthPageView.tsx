"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Check,
  LogIn,
  LogOut,
  MapPin,
  Play,
  ShieldCheck,
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
    demoAccounts,
    setIsOnboardingOpen,
    login,
    register,
    switchDemoAccount,
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
  const [email, setEmail] = useState("alex@teamup.app");
  const [password, setPassword] = useState("demo123");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");

  const handleModeChange = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
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
        setName("");
        setUsername("");
        setLocation("");
        router.push("/passport");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas-soft text-ink transition-colors duration-200">
      {/* Standalone Minimal Auth Top Bar */}
      <header className="w-full border-b border-border bg-canvas/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-[11px] bg-ink flex items-center justify-center text-primary shadow-xs">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-[900] tracking-tight text-ink leading-tight">
                {t("common.appName")}
              </span>
              <span className="text-[10px] font-bold text-mute tracking-wider uppercase leading-tight">
                {t("common.appTagline")}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <ThemeToggle />
            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-canvas-soft hover:bg-border/60 border border-border text-xs font-bold text-ink inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t("auth.backToExplore")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Auth Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-[1120px] w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Brand Value Proposition & Quick Demo Account Switcher */}
          <div className="lg:col-span-5 bg-ink text-canvas rounded-[28px] p-6 sm:p-8 border border-ink shadow-xl flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-ink text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t("common.appTagline")}</span>
              </span>

              <h1 className="text-3xl sm:text-4xl font-[900] tracking-tight leading-[1.1] whitespace-pre-line">
                {t("explore.heroTitle")}
              </h1>

              <p className="text-xs sm:text-sm text-canvas/80 leading-relaxed">
                {t("explore.heroSubtitle")}
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{t("explore.localRadar")} • 1–25 km</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>{t("explore.realtimeRsvp")} &amp; Waitlist</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <span>{t("passport.sportsPassportTitle")}</span>
                </div>
              </div>
            </div>

            {/* 1-Click Demo Account Switcher Card */}
            <div className="p-4 rounded-[20px] bg-white/10 border border-white/15 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("auth.demoAccountsTitle")}
                  </h2>
                  <p className="text-[11px] text-canvas/75 mt-0.5">
                    {t("auth.demoAccountsSubtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {demoAccounts.map((acc) => {
                  const isCurrent = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        switchDemoAccount(acc);
                        router.push("/");
                      }}
                      className={`w-full p-2.5 rounded-[14px] border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-ink border-primary font-bold"
                          : "bg-white/5 hover:bg-white/15 text-canvas border-white/15"
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
                          <div className="text-xs font-bold truncate">
                            {acc.profile.name}{" "}
                            <span className="opacity-75 font-normal">
                              (@{acc.profile.username.replace(/^@/, "")})
                            </span>
                          </div>
                          <div className="text-[11px] opacity-80 truncate">
                            {acc.email} • {acc.profile.karma}% Karma
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 bg-ink text-primary text-[10px] font-bold rounded-full inline-flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>{t("auth.activeSessionBadge")}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sign In / Create Account Form Card */}
          <div className="lg:col-span-7 bg-canvas rounded-[28px] p-6 sm:p-10 border border-border shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Active Session Banner if already logged in */}
              {user && (
                <div className="p-4 rounded-[18px] bg-primary-pale/50 border border-primary-neutral flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={user.profile.avatar}
                      alt={user.profile.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border border-ink shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-ink truncate">
                        {t("auth.signedInBannerTitle", {
                          name: user.profile.name,
                        })}
                      </div>
                      <div className="text-[11px] text-positive-deep font-semibold truncate">
                        {user.email} • {user.profile.karma}% Karma
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOnboardingOpen(true)}
                      className="px-3 py-1.5 bg-canvas hover:bg-canvas-soft text-ink border border-border rounded-full text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-positive-deep" />
                      <span>{t("auth.setupPassportWizard")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-3 py-1.5 bg-canvas hover:bg-negative/10 text-negative border border-border rounded-full text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t("auth.signOut")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Switcher Tabs: Sign In vs Create Account */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-canvas-soft rounded-[18px] border border-border">
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className={`py-2.5 rounded-[13px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
                    mode === "signin"
                      ? "bg-canvas text-ink shadow-xs"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t("auth.signIn")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("signup")}
                  className={`py-2.5 rounded-[13px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
                    mode === "signup"
                      ? "bg-canvas text-ink shadow-xs"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t("auth.signUp")}</span>
                </button>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-[900] text-ink tracking-tight">
                  {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
                </h2>
                <p className="text-xs sm:text-sm text-body mt-1">
                  {mode === "signin"
                    ? t("auth.pageSubtitleSignIn")
                    : t("auth.pageSubtitleSignUp")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase mb-1.5">
                        {t("auth.fullNameLabel")}
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("auth.fullNamePlaceholder")}
                        className="w-full h-11 px-4 bg-canvas-soft border border-border rounded-[14px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink uppercase mb-1.5">
                        {t("auth.usernameLabel")}
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t("auth.usernamePlaceholder")}
                        className="w-full h-11 px-4 bg-canvas-soft border border-border rounded-[14px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1.5">
                    {t("auth.emailLabel")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    className="w-full h-11 px-4 bg-canvas-soft border border-border rounded-[14px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase mb-1.5">
                    {t("auth.passwordLabel")}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="w-full h-11 px-4 bg-canvas-soft border border-border rounded-[14px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-bold text-ink uppercase mb-1.5">
                      {t("auth.locationLabel")}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t("auth.locationPlaceholder")}
                      className="w-full h-11 px-4 bg-canvas-soft border border-border rounded-[14px] text-sm text-ink placeholder:text-mute focus:border-ink focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href="/"
                    className="px-5 py-2.5 bg-canvas-soft hover:bg-border/60 text-ink font-semibold rounded-[24px] border border-border text-xs sm:text-sm transition"
                  >
                    {t("auth.continueToApp")}
                  </Link>

                  <button
                    type="submit"
                    className="btn-primary px-7 py-3 rounded-[24px] text-sm font-bold transition cursor-pointer shadow-sm ml-auto"
                  >
                    {mode === "signin"
                      ? t("auth.signInBtn")
                      : t("auth.createAccountBtn")}
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-mute">
              <span>{t("footer.tagline")}</span>
              <span>{t("footer.rights")}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPageView;
