// React
import { useMemo } from "react";

// Third Party
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { Button, ButtonGroup, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import type { components } from "@/Api/OpenApi";
import { HandlerStatusBadge } from "@/Components/Administration/HandlerStatusBadge";
import { BaseTable } from "@/Components/Base/BaseTable";
import { renderTooltip } from "@/Utils/bootsTrap";
import { formatDate } from "@/Utils/format";

type Handler = components["schemas"]["AdministrationHandlerSchema"];

export interface AdministrationHandlersTableProps {
  handlers: Handler[];
  updatingId: number | null;
  onInspect: (handler: Handler) => void;
  onUpdate: (handler: Handler) => void;
  onDelete: (handler: Handler) => void;
}

const columnHelper = createColumnHelper<Handler>();

/** Table of all contract handlers with inspect, update and delete actions. */
export function AdministrationHandlersTable({
  handlers,
  updatingId,
  onInspect,
  onUpdate,
  onDelete,
}: AdministrationHandlersTableProps) {
  const { t } = useTranslation();

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("Handler"),
          cell: (info) => <span className="fw-semibold text-nowrap">{info.getValue()}</span>,
        }),
        columnHelper.accessor("status", {
          header: t("Status"),
          cell: (info) => <HandlerStatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor((row) => row.character_name ?? "-", {
          id: "character_name",
          header: t("Character"),
        }),
        columnHelper.accessor((row) => row.last_sync ?? "", {
          id: "last_sync",
          header: t("Last Sync"),
          cell: (info) => (
            <span className="text-nowrap small">{formatDate(info.getValue() || null)}</span>
          ),
        }),
        columnHelper.accessor("contracts_total", {
          header: t("Contracts"),
          meta: { align: "right" },
          cell: (info) => (
            <span className="text-nowrap">
              {info.getValue()}
              <span className="small text-muted">
                {" "}
                ({info.row.original.contracts_pending} / {info.row.original.contracts_in_progress})
              </span>
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: t("Actions"),
          enableSorting: false,
          meta: { align: "right" },
          cell: (info) => {
            const handler = info.row.original;
            return (
              <ButtonGroup size="sm">
                {renderTooltip(
                  t("Inspect"),
                  <Button
                    variant="info"
                    aria-label={t("Inspect")}
                    onClick={() => onInspect(handler)}
                  >
                    <Eye size={14} />
                  </Button>,
                )}
                {renderTooltip(
                  t("Update"),
                  <Button
                    variant="primary"
                    aria-label={t("Update")}
                    disabled={updatingId === handler.id}
                    onClick={() => onUpdate(handler)}
                  >
                    {updatingId === handler.id ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                  </Button>,
                )}
                {renderTooltip(
                  t("Delete"),
                  <Button
                    variant="danger"
                    aria-label={t("Delete")}
                    onClick={() => onDelete(handler)}
                  >
                    <Trash2 size={14} />
                  </Button>,
                )}
              </ButtonGroup>
            );
          },
        }),
      ] as ColumnDef<Handler, unknown>[],
    [t, updatingId, onInspect, onUpdate, onDelete],
  );

  return (
    <BaseTable
      columns={columns}
      data={handlers}
      emptyText={t("No handlers found.")}
      exportFileName="administration_handlers.csv"
    />
  );
}

export default AdministrationHandlersTable;
