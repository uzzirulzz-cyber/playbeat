"use client";

import { create } from "zustand";

export type View =
  | { name: "dashboard" }
  | { name: "cases" }
  | { name: "case"; caseId: string; tab?: CaseTab }
  | { name: "profile" }
  | { name: "admin" }
  | { name: "audit" };

export type CaseTab =
  | "overview"
  | "devices"
  | "scan"
  | "evidence"
  | "export"
  | "delivery"
  | "discussion"
  | "team";

interface ViewState {
  view: View;
  go: (v: View) => void;
  goCase: (caseId: string, tab?: CaseTab) => void;
}

export const useView = create<ViewState>((set) => ({
  view: { name: "dashboard" },
  go: (v) => set({ view: v }),
  goCase: (caseId, tab) => set({ view: { name: "case", caseId, tab } }),
}));
