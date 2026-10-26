// React
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Third Party
import { ShieldAlert } from "lucide-react";
import { Alert, Card, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

// Styles
import styles from "@/Styles/modules/Administration.module.css";

import type { components } from "@/Api/OpenApi";
import {
  AdministrationDeleteModal,
  AdministrationHandlersTable,
  AdministrationInspectionView,
  AdministrationKpiCards,
  AdministrationTaskPanel,
} from "@/Components/Administration";
import {
  useAdministrationAccess,
  useAdministrationActions,
  useAdministrationHandlers,
} from "@/Components/Administration/Hooks";
import { FilterButtonGroup } from "@/Components/Base/FilterButtonGroup";
import ErrorLoader from "@/Components/Loader/ErrorLoader";
import FetchingLoader from "@/Components/Loader/FetchingLoader";

type HandlerFilter = "all" | "synced" | "issues";
type Handler = components["schemas"]["AdministrationHandlerSchema"];

export default function Administration() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inspectId = searchParams.get("inspect") ? Number(searchParams.get("inspect")) : null;

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<HandlerFilter>("all");
  const [forceRefreshGlobal, setForceRefreshGlobal] = useState(false);
  const [handlerToDelete, setHandlerToDelete] = useState<Handler | null>(null);

  const { isLoading: isAccessLoading, hasAdminAccess, isSuperuser } = useAdministrationAccess();
  const { data: handlers = [], isLoading, isError } = useAdministrationHandlers(hasAdminAccess);
  const actions = useAdministrationActions(() => setHandlerToDelete(null));

  const metrics = useMemo(() => {
    const synced = handlers.filter((h) => h.status === "ok").length;
    return {
      total: handlers.length,
      synced,
      issues: handlers.length - synced,
      openContracts: handlers.reduce(
        (sum, h) => sum + h.contracts_pending + h.contracts_in_progress,
        0
      ),
    };
  }, [handlers]);

  const filteredHandlers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return handlers.filter((handler) => {
      if (filter === "synced" && handler.status !== "ok") return false;
      if (filter === "issues" && handler.status === "ok") return false;
      return !query || handler.name.toLowerCase().includes(query);
    });
  }, [handlers, filter, searchTerm]);

  if (isAccessLoading) {
    return (
      <main className="aa-react container mt-4">
        <FetchingLoader message={t("Checking authorizations...")} />
      </main>
    );
  }

  if (!hasAdminAccess) {
    return (
      <main className="aa-react container mt-4">
        <Alert variant="danger" className="d-flex align-items-center gap-2">
          <ShieldAlert size={20} />
          <span>
            {t("You do not have permission to use the Administration. Requires permission:")}{" "}
            <code>aafenrir.full_access</code>
          </span>
        </Alert>
      </main>
    );
  }

  const header = (
    <header className="d-flex align-items-center gap-3 mb-4">
      <div className="p-2 rounded bg-danger-subtle text-danger border border-danger-subtle">
        <ShieldAlert size={28} />
      </div>
      <div>
        <h1 className="h3 mb-1 fw-bold">{t("Administration")}</h1>
        <p className="mb-0 small text-muted">
          {t("Contract handlers, synchronization status and contract statistics.")}
        </p>
      </div>
    </header>
  );

  if (inspectId !== null && !Number.isNaN(inspectId)) {
    return (
      <main className="aa-react container mt-4">
        <Card className="bg-dark">
          <Card.Body>
            {header}
            <AdministrationInspectionView
              corporationId={inspectId}
              onBack={() => setSearchParams({})}
            />
          </Card.Body>
        </Card>
      </main>
    );
  }

  return (
    <main className="aa-react container mt-4">
      <Card className="bg-dark">
        <Card.Body>
          {header}

          {actions.taskFeedback && (
            <Alert
              variant={actions.taskFeedback.variant}
              dismissible
              onClose={actions.clearTaskFeedback}
            >
              {actions.taskFeedback.message}
            </Alert>
          )}

          <AdministrationKpiCards metrics={metrics} />

          {isSuperuser && (
            <AdministrationTaskPanel
              forceRefresh={forceRefreshGlobal}
              onToggleForceRefresh={setForceRefreshGlobal}
              isPending={actions.isQueuing}
              onUpdateAll={() => actions.queueUpdateAll(forceRefreshGlobal)}
            />
          )}

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
            <FilterButtonGroup<HandlerFilter>
              options={[
                { value: "all", label: t("All"), count: metrics.total },
                { value: "synced", label: t("Synced"), count: metrics.synced },
                { value: "issues", label: t("Issues"), count: metrics.issues },
              ]}
              value={filter}
              onChange={setFilter}
              ariaLabel={t("Filter handlers by status")}
            />
            <div className={`w-100 ${styles.searchContainer}`}>
              <Form.Control
                type="search"
                size="sm"
                placeholder={t("Search handlers…")}
                aria-label={t("Search handlers")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <FetchingLoader message={t("Loading handlers...")} />
          ) : isError ? (
            <ErrorLoader
              title={t("Error")}
              message={t("Failed to load handlers. Please try again.")}
            />
          ) : (
            <AdministrationHandlersTable
              handlers={filteredHandlers}
              updatingId={actions.updatingId}
              onInspect={(handler) => setSearchParams({ inspect: String(handler.id) })}
              onUpdate={(handler) =>
                actions.triggerUpdate({
                  corporationId: handler.id,
                  forceRefresh: isSuperuser && forceRefreshGlobal,
                })
              }
              onDelete={setHandlerToDelete}
            />
          )}

          <AdministrationDeleteModal
            isOpen={handlerToDelete !== null}
            handlerName={handlerToDelete?.name ?? ""}
            isPending={actions.isDeleting}
            onClose={() => setHandlerToDelete(null)}
            onConfirm={() => handlerToDelete && actions.deleteHandler(handlerToDelete.id)}
          />
        </Card.Body>
      </Card>
    </main>
  );
}
