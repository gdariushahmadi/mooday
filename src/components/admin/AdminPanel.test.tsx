import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import AdminPage from "@/app/admin/page";

// Mock server actions to avoid throwing in jsdom environment
vi.mock("@/services/admin/actions", () => ({
  adminDashboardStats: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListPendingListings: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListOrders: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListDisputes: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListReports: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListUsers: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminListAuditLog: vi.fn().mockRejectedValue(new Error("No Supabase session")),
  adminApproveListing: vi.fn().mockResolvedValue(undefined),
  adminRejectListing: vi.fn().mockResolvedValue(undefined),
  adminFeatureListing: vi.fn().mockResolvedValue(undefined),
  adminUnfeatureListing: vi.fn().mockResolvedValue(undefined),
  adminSuspendUser: vi.fn().mockResolvedValue(undefined),
  adminUnsuspendUser: vi.fn().mockResolvedValue(undefined),
  adminResolveDispute: vi.fn().mockResolvedValue(undefined),
  adminTriageReport: vi.fn().mockResolvedValue(undefined),
  adminBroadcastNotification: vi.fn().mockResolvedValue(undefined),
}));

async function loadDemo() {
  render(<AdminPage />);
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Load demo data/i })).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: /Load demo data/i }));
  await waitFor(() => {
    expect(screen.getByText("Demo / Mock Mode")).toBeInTheDocument();
  });
}

describe("Admin Panel UI (/admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows live failure error with Load demo data (no silent mock fallback)", async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Load demo data/i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.queryByText("Total Users")).not.toBeInTheDocument();
  });

  it("loads demo data and shows the demo banner + mode badge", async () => {
    await loadDemo();
    expect(
      screen.getByText(/You are viewing demo \/ mock data/i),
    ).toBeInTheDocument();
  });

  it("renders overview stat cards correctly after loading demo", async () => {
    await loadDemo();

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
    expect(screen.getByText("Open Disputes")).toBeInTheDocument();
    expect(screen.getByText("Open Reports")).toBeInTheDocument();
  });

  it("switches tabs when tab buttons are clicked", async () => {
    await loadDemo();

    const pendingTab = screen.getByRole("button", { name: /Pending Listings/i });
    fireEvent.click(pendingTab);

    await waitFor(() => {
      expect(screen.getByText("Pending Listings Queue")).toBeInTheDocument();
    });

    const ordersTab = screen.getByRole("button", { name: /Orders/i });
    fireEvent.click(ordersTab);

    await waitFor(() => {
      expect(screen.getByText("ord-8801")).toBeInTheDocument();
    });

    const usersTab = screen.getByRole("button", { name: /Users/i });
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText("User Account Management")).toBeInTheDocument();
    });
  }, 15000);

  it("toggles language between English and Arabic", async () => {
    await loadDemo();

    const langToggle = screen.getByRole("button", { name: /العربية/i });
    fireEvent.click(langToggle);

    await waitFor(() => {
      expect(screen.getByText("لوحة التحكم")).toBeInTheDocument();
    });
  });
});
