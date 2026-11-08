// React
import { MemoryRouter } from "react-router-dom";

// Third Party
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUserData } from "aa-geuthur-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as ApiCalls from "@/Api/ApiCalls";
import { ProjectName } from "@/constants";
import Settings from "@/Pages/Settings";

vi.mock("aa-geuthur-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("aa-geuthur-react")>()),
  useUserData: vi.fn(),
}));

vi.mock("@/Api/ApiCalls", () => ({
  updateUserSettings: vi.fn(),
}));

const mockUser = (notification: boolean) =>
  vi.mocked(useUserData).mockReturnValue({
    data: { user: { notification } },
    isLoading: false,
    isError: false,
    error: null,
  } as never);

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/${ProjectName}/settings/`]}>
        <Settings />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the saved notification preference", () => {
    mockUser(true);

    renderPage();

    expect(screen.getByLabelText("Disable Notifications")).toBeChecked();
  });

  it("should save the preference when the form is submitted", async () => {
    const user = userEvent.setup();
    mockUser(false);
    vi.mocked(ApiCalls.updateUserSettings).mockResolvedValue({
      disable_notifications: true,
      quick_select_presets: [],
    });

    renderPage();
    await user.click(screen.getByLabelText("Disable Notifications"));
    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() =>
      expect(ApiCalls.updateUserSettings).toHaveBeenCalledWith({
        disable_notifications: true,
      }),
    );
  });
});
