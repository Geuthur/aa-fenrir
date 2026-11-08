// Third Party
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";

import { getContractStatusLabel, getHandlerStatus } from "@/Components/Administration/status";

const t = ((key: string) => key) as unknown as TFunction;

describe("getHandlerStatus", () => {
  it("maps ok to a success variant", () => {
    expect(getHandlerStatus(t, "ok")).toEqual({ variant: "success", label: "Synced" });
  });

  it("maps token and character problems to danger", () => {
    expect(getHandlerStatus(t, "token_error").variant).toBe("danger");
    expect(getHandlerStatus(t, "no_character").variant).toBe("danger");
  });

  it("maps outdated to warning", () => {
    expect(getHandlerStatus(t, "outdated").variant).toBe("warning");
  });

  it("falls back to the raw status for unknown values", () => {
    expect(getHandlerStatus(t, "unknown")).toEqual({ variant: "secondary", label: "unknown" });
  });
});

describe("getContractStatusLabel", () => {
  it("returns a label for known statuses", () => {
    expect(getContractStatusLabel(t, "in_progress")).toBe("In Progress");
  });

  it("falls back to the raw status for unknown values", () => {
    expect(getContractStatusLabel(t, "other")).toBe("other");
  });
});
