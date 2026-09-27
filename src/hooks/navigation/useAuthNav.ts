import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useAuthNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
) {
  const openSignUp = useCallback(() => {
    setCurrentView("signup");
  }, [setCurrentView]);

  const closeSignUp = useCallback(() => {
    setCurrentView("home");
  }, [setCurrentView]);

  const openOtp = useCallback(() => {
    setCurrentView("otp");
  }, [setCurrentView]);

  const closeOtp = useCallback(() => {
    setCurrentView("signin");
  }, [setCurrentView]);

  const openSignIn = useCallback(() => {
    setCurrentView("signin");
  }, [setCurrentView]);

  const closeSignIn = useCallback(() => {
    setCurrentView("home");
  }, [setCurrentView]);

  const openForgotPassword = useCallback(() => {
    setCurrentView("forgot-password");
  }, [setCurrentView]);

  const closeForgotPassword = useCallback(() => {
    setCurrentView("signin");
  }, [setCurrentView]);

  const openSocialLogin = useCallback(() => {
    setCurrentView("social-login");
  }, [setCurrentView]);

  const closeSocialLogin = useCallback(() => {
    setCurrentView("home");
  }, [setCurrentView]);

  return {
    openSignUp,
    closeSignUp,
    openOtp,
    closeOtp,
    openSignIn,
    closeSignIn,
    openForgotPassword,
    closeForgotPassword,
    openSocialLogin,
    closeSocialLogin,
  };
}