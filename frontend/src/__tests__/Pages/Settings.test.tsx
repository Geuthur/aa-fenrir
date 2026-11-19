// React
import { MemoryRouter } from "react-router-dom";

// Third Party
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useUserSettings } from "aa-geuthur-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectName } from "@/constants";
import Settings from "@/Pages/Settings";

// The hook itself is tested in the package, here the page is checked against its return value
vi.mock("aa-geuthur-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("aa-geuthur-react")>()),
  useUserSettings: vi.fn(),
}));

const mutate = vi.fn();

const mockSettings = (
  overrides: { data?: unknown; isLoading?: boolean; isError?: boolean; isPending?: boolean } = {},
) =>
  vi.mocked(useUserSettings).mockReturnValue({
    data: { disable_notifications: false, quick_select_presets: [] },
    isLoading: false,
    isError: false,
    updateMutation: { mutate, isPending: overrides.isPending ?? false },
    ...overrides,
  } as never);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/${ProjectName}/settings/`]}>
      <Settings />
    </MemoryRouter>,
  );

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show the loader while the settings load", () => {
    mockSettings({ data: undefined, isLoading: true });

    renderPage();

    expect(screen.getByText("Loading user settings...")).toBeInTheDocument();
    expect(screen.queryByLabelText("Disable Notifications")).not.toBeInTheDocument();
  });

  it("should show an error when the settings cannot be loaded", () => {
    mockSettings({ data: undefined, isError: true });

    renderPage();

    expect(screen.getByText("Failed to load user settings.")).toBeInTheDocument();
  });

  it("should show the saved notification preference", () => {
    mockSettings({ data: { disable_notifications: true, quick_select_presets: [] } });

    renderPage();

    expect(screen.getByLabelText("Disable Notifications")).toBeChecked();
  });

  it("should save the preference when the form is submitted", async () => {
    const user = userEvent.setup();
    mockSettings();

    renderPage();
    await user.click(screen.getByLabelText("Disable Notifications"));
    await user.click(screen.getByRole("button", { name: "Save Settings" }));

    expect(mutate).toHaveBeenCalledWith(
      { disable_notifications: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("should disable the save button while saving", () => {
    mockSettings({ isPending: true });

    renderPage();

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("should show a message after saving or when saving fails", async () => {
    const user = userEvent.setup();
    mockSettings();

    renderPage();
    await user.click(screen.getByRole("button", { name: "Save Settings" }));
    const callbacks = mutate.mock.calls[0][1] as { onSuccess: () => void; onError: (err: unknown) => void };

    act(() => callbacks.onSuccess());
    expect(await screen.findByText("Settings saved successfully.")).toBeInTheDocument();

    act(() => callbacks.onError(new Error("Permission Denied.")));
    expect(await screen.findByText("Permission Denied.")).toBeInTheDocument();
  });
});
