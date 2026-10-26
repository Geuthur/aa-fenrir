// Third Party
import type { TFunction } from "i18next";

export type HandlerStatus =
  | "ok"
  | "outdated"
  | "never_synced"
  | "no_character"
  | "token_error";

/** Bootstrap variant and translated label of a handler sync status. */
export function getHandlerStatus(
  t: TFunction,
  status: string
): { variant: string; label: string } {
  switch (status as HandlerStatus) {
    case "ok":
      return { variant: "success", label: t("Synced") };
    case "outdated":
      return { variant: "warning", label: t("Outdated") };
    case "never_synced":
      return { variant: "secondary", label: t("Never synced") };
    case "no_character":
      return { variant: "danger", label: t("No character") };
    case "token_error":
      return { variant: "danger", label: t("Token error") };
    default:
      return { variant: "secondary", label: status };
  }
}

/** Translated label of a contract status. */
export function getContractStatusLabel(t: TFunction, status: string): string {
  switch (status) {
    case "pending":
      return t("Pending");
    case "in_progress":
      return t("In Progress");
    case "finished":
      return t("Finished");
    case "finished_issuer":
      return t("Finished Issuer");
    case "finished_contractor":
      return t("Finished Contractor");
    case "canceled":
      return t("Canceled");
    case "rejected":
      return t("Rejected");
    case "failed":
      return t("Failed");
    case "deleted":
      return t("Deleted");
    case "reversed":
      return t("Reversed");
    default:
      return status;
  }
}
