import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPage from "@/app/admin/page";
import * as actions from "@/services/admin/actions";
import { getPhase2Backend } from "@/services/backend";

vi.mock("@/services/admin/actions", () => ({
  adminWhoAmI: vi.fn(),
  adminDashboardStats: vi.fn(),
  adminListPendingListings: vi.fn(),
  adminListOrders: vi.fn(),
  adminListDisputes: vi.fn(),
  adminListReports: vi.fn(),
  adminListUsers: vi.fn(),
  adminListAuditLog: vi.fn(),
  adminListCategories: vi.fn(),
  adminApproveListing: vi.fn().mockResolvedValue(undefined),
  adminRejectListing: vi.fn().mockResolvedValue(undefined),
  adminFeatureListing: vi.fn().mockResolvedValue(undefined),
  adminUpdateListingStatus: vi.fn().mockResolvedValue(undefined),
  adminCreateCategory: vi.fn().mockResolvedValue(undefined),
  adminUpdateCategory: vi.fn().mockResolvedValue(undefined),
  adminDeleteCategory: vi.fn().mockResolvedValue(undefined),
  adminSuspendUser: vi.fn().mockResolvedValue(undefined),
  adminUnsuspendUser: vi.fn().mockResolvedValue(undefined),
  adminResolveDispute: vi.fn().mockResolvedValue(undefined),
  adminTriageReport: vi.fn().mockResolvedValue(undefined),
  adminBroadcastNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/backend", () => ({
  getPhase2Backend: vi.fn(),
}));

const mocked = vi.mocked(actions);
const mockedBackend = vi.mocked(getPhase2Backend);

const TOKEN = "test-access-token";

/** Minimal backend stub — the panel only reaches for the auth service. */
function backendWithToken(token: string | null) {
  return {
    auth: { getAccessToken: vi.fn().mockResolvedValue(token) },
  } as unknown as ReturnType<typeof getPhase2Backend>;
}

function grantAccess() {
  mockedBackend.mockReturnValue(backendWithToken(TOKEN));
  mocked.adminWhoAmI.mockResolvedValue({
    ok: true,
    id: "admin-1",
    email: "admin@daneg.ae",
  });
  mocked.adminDashboardStats.mockResolvedValue({
    pendingListings: 3,
    openDisputes: 1,
    openReports: 2,
    suspendedUsers: 0,
    ordersToday: 4,
    totalUsers: 42,
    totalListings: 17,
  });
  mocked.adminListPendingListings.mockResolvedValue([]);
  mocked.adminListOrders.mockResolvedValue([]);
  mocked.adminListDisputes.mockResolvedValue([]);
  mocked.adminListReports.mockResolvedValue([]);
  mocked.adminListUsers.mockResolvedValue([]);
  mocked.adminListAuditLog.mockResolvedValue([]);
  mocked.adminListCategories.mockResolvedValue([]);
}

describe("Admin Panel UI (/admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, "", "/admin");
  });

  it("shows an admin sign-in form for a signed-out visitor", async () => {
    mockedBackend.mockReturnValue(backendWithToken(null));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin sign in")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Open admin panel/i })).toBeInTheDocument();
    expect(screen.queryByText("Total Users")).not.toBeInTheDocument();
    expect(mocked.adminWhoAmI).not.toHaveBeenCalled();
    expect(mocked.adminDashboardStats).not.toHaveBeenCalled();
  });

  it("accepts the demo credentials on the normal admin URL", async () => {
    mockedBackend.mockReturnValue(backendWithToken(null));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Admin sign in")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@daneg.ae" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "daneg123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Open admin panel/i }));

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(mocked.adminWhoAmI).not.toHaveBeenCalled();
  });

  it("blocks a signed-in non-admin without loading any data", async () => {
    mockedBackend.mockReturnValue(backendWithToken(TOKEN));
    mocked.adminWhoAmI.mockResolvedValue({
      ok: false,
      reason: "not-admin",
      message: "Your account does not have admin privileges.",
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByText("This account does not have admin privileges."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Total Users")).not.toBeInTheDocument();
    expect(mocked.adminDashboardStats).not.toHaveBeenCalled();
  });

  it("explains the misconfiguration when the server lacks its keys", async () => {
    mockedBackend.mockReturnValue(backendWithToken(TOKEN));
    mocked.adminWhoAmI.mockResolvedValue({
      ok: false,
      reason: "misconfigured",
      message: "Admin operations require SUPABASE_SERVICE_ROLE_KEY",
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/The admin backend is not configured/i),
      ).toBeInTheDocument();
    });
  });

  it("opens the sample admin panel with the demo credentials", async () => {
    mockedBackend.mockReturnValue(null);

    render(<AdminPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Demo credentials"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Open admin panel/i }));

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });
    expect(screen.getByText("Demo data")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Affiliate Links/i })[0]);
    await waitFor(() => {
      expect(screen.getByText("Affiliate links")).toBeInTheDocument();
    });
  });

  it("opens the isolated demo preview when the explicit demo URL is used", async () => {
    window.history.pushState({}, "", "/admin?demo=1");
    mockedBackend.mockImplementation(() => {
      throw new Error("The demo preview must not access the live backend.");
    });

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Demo credentials")).toBeInTheDocument();
    });
    expect(mockedBackend).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Open admin panel/i }));
    await waitFor(() => {
      expect(screen.getByText("Demo data")).toBeInTheDocument();
    });
  });

  it("renders live stats for a verified admin", async () => {
    grantAccess();

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
    expect(screen.getByText("Live Supabase")).toBeInTheDocument();
    expect(screen.getByText("admin@daneg.ae")).toBeInTheDocument();
  });

  it("passes the verified access token to every read action", async () => {
    grantAccess();

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });
    expect(mocked.adminWhoAmI).toHaveBeenCalledWith(TOKEN);
    expect(mocked.adminDashboardStats).toHaveBeenCalledWith(TOKEN);
    expect(mocked.adminListUsers).toHaveBeenCalledWith(TOKEN);
    expect(mocked.adminListAuditLog).toHaveBeenCalledWith(TOKEN);
  });

  it("switches tabs when tab buttons are clicked", async () => {
    grantAccess();

    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Pending Listings/i }));
    await waitFor(() => {
      expect(screen.getByText("Pending Listings Queue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getByText("User Account Management")).toBeInTheDocument();
    });
  }, 15000);

  it("toggles language between English and Arabic", async () => {
    grantAccess();

    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /العربية/i }));

    await waitFor(() => {
      expect(screen.getByText("لوحة التحكم")).toBeInTheDocument();
    });
  });
});
