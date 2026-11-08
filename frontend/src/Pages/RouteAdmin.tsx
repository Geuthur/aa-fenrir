// React
import { useMemo, useState } from 'react';

// Third Party
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type BaseColumnDef, BaseTable, createBaseColumnHelper, useUserData } from "aa-geuthur-react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Route as RouteIcon,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Pages/RouteAdmin.module.css';

import {
  addRouteSystem,
  createRoutePreset,
  deleteRoutePreset,
  deleteRouteSystem,
  loadRoutePresets,
  loadRouteSystems,
  updateRoutePreset,
} from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { queryKeys } from '@/Api/query';
import type { UserData } from "@/Api/schema";
import { RouteAdminHeader, RouteCard } from '@/Components/RouteAdmin';
import {
  AddRouteSystemModal,
  CreateRouteModal,
  DeleteRouteModal,
  DeleteRouteSystemModal,
  EditRouteModal,
} from '@/Components/RouteAdmin/Modals';
import type { FreightCorridor } from '@/types';

type RouteSystemItem = components['schemas']['RouteSystemSchema'];

const systemColumnHelper = createBaseColumnHelper<RouteSystemItem>();

/**
 * RouteAdmin Page.
 * Orchestrator for managing both route presets and available solar systems (RouteSystem).
 * Provides search, filtering, and pagination for clear navigation even with many entries.
 */
export default function RouteAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'routes' | 'systems'>('routes');

  // Check user permission
  const { data: userData, isLoading: isUserLoading } = useUserData<UserData>();

  // Load existing routes
  const { data: presets = [], isLoading: isPresetsLoading } = useQuery({
    queryKey: queryKeys.RoutePresets,
    queryFn: loadRoutePresets,
    refetchOnWindowFocus: false,
  });

  // Load configured route systems
  const { data: routeSystems = [], isLoading: isSystemsLoading } = useQuery({
    queryKey: queryKeys.RouteSystems,
    queryFn: loadRouteSystems,
    refetchOnWindowFocus: false,
  });

  // Modals & Feedback State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<FreightCorridor | null>(null);
  const [presetToDelete, setPresetToDelete] = useState<FreightCorridor | null>(null);
  const [isAddSystemModalOpen, setIsAddSystemModalOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState<RouteSystemItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Pagination State for Routes
  const [routeSearch, setRouteSearch] = useState('');
  const [routeServiceFilter, setRouteServiceFilter] = useState<string>('all');
  const [routePage, setRoutePage] = useState(1);
  const routesPerPage = 6;

  // Search State for Systems
  const [systemSearch, setSystemSearch] = useState('');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPreset: components['schemas']['CreateRoutePresetSchema']) =>
      createRoutePreset(newPreset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.RoutePresets });
      setSuccessMessage(t('Route preset created successfully.'));
      setErrorMessage(null);
      setIsCreateModalOpen(false);
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : t('Failed to create route preset.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: components['schemas']['CreateRoutePresetSchema'];
    }) => updateRoutePreset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.RoutePresets });
      setSuccessMessage(t('Route preset updated successfully.'));
      setErrorMessage(null);
      setPresetToEdit(null);
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : t('Failed to update route preset.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRoutePreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.RoutePresets });
      setSuccessMessage(t('Route preset deleted successfully.'));
      setErrorMessage(null);
      setPresetToDelete(null);
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : t('Failed to delete route preset.'));
    },
  });

  const addSystemMutation = useMutation({
    mutationFn: (systemId: number) => addRouteSystem(systemId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.RouteSystems });
      setSuccessMessage(t('Added {{name}} to available route systems.', { name: data.name }));
      setErrorMessage(null);
      setIsAddSystemModalOpen(false);
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : t('Failed to add route system.'));
    },
  });

  const deleteSystemMutation = useMutation({
    mutationFn: (systemId: number) => deleteRouteSystem(systemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.RouteSystems });
      setSuccessMessage(t('Route system removed successfully.'));
      setErrorMessage(null);
      setSystemToDelete(null);
    },
    onError: (err: unknown) => {
      setSuccessMessage(null);
      setErrorMessage(err instanceof Error ? err.message : t('Failed to remove route system.'));
    },
  });

  // Filtered & Paginated Routes
  const filteredRoutes = useMemo(() => {
    const q = routeSearch.toLowerCase().trim();
    return presets.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.origin_system.toLowerCase().includes(q) ||
        p.destination_system.toLowerCase().includes(q) ||
        (p.origin_station && p.origin_station.toLowerCase().includes(q)) ||
        (p.destination_station && p.destination_station.toLowerCase().includes(q));

      const matchesService =
        routeServiceFilter === 'all' || p.service_type === routeServiceFilter;

      return matchesSearch && matchesService;
    });
  }, [presets, routeSearch, routeServiceFilter]);

  const totalRoutePages = Math.max(1, Math.ceil(filteredRoutes.length / routesPerPage));
  const currentRoutes = useMemo(() => {
    const start = (routePage - 1) * routesPerPage;
    return filteredRoutes.slice(start, start + routesPerPage);
  }, [filteredRoutes, routePage, routesPerPage]);

  // Filtered Systems
  const filteredSystems = useMemo(() => {
    const q = systemSearch.toLowerCase().trim();
    return routeSystems.filter((s) => {
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.region_name && s.region_name.toLowerCase().includes(q)) ||
        s.security_class.toLowerCase().includes(q)
      );
    });
  }, [routeSystems, systemSearch]);

  const getSecColor = (sec: number) => {
    if (sec >= 0.5) return styles.secHigh;
    if (sec > 0.0) return styles.secLow;
    return styles.secNull;
  };

  // Systems DataTable Column Definitions
  const systemColumns = useMemo(
    () => [
      systemColumnHelper.accessor('name', {
        header: t('System'),
        cell: ({ getValue }) => (
          <span className={`fw-bold ${styles.sysName}`}>{getValue()}</span>
        ),
      }),
      systemColumnHelper.accessor('security_status', {
        header: t('Security'),
        cell: ({ row }) => {
          const sys = row.original;
          return (
            <span
              className={`px-2 rounded border ${styles.secBadge} ${getSecColor(
                sys.security_status
              )}`}
            >
              {sys.security_status.toFixed(1)} {sys.security_class.toUpperCase()}
            </span>
          );
        },
      }),
      systemColumnHelper.accessor('region_name', {
        header: t('Region'),
        cell: ({ getValue }) => (
          <span className={styles.sysRegion}>{getValue() || '—'}</span>
        ),
      }),
      systemColumnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-end">{t('Actions')}</div>,
        cell: ({ row }) => {
          const sys = row.original;
          return (
            <div className="text-end">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setSystemToDelete(sys)}
                className={`px-2 py-1 rounded border ${styles.removeBtn}`}
                title={t('Remove System')}
              >
                <Trash2 className={styles.iconXs} />
              </Button>
            </div>
          );
        },
      }),
    ] as BaseColumnDef<RouteSystemItem, unknown>[],
    [t]
  );

  if (isUserLoading) {
    return (
      <main className="mt-4">
        <div className={`text-center ${styles.loading}`}>
          {t('Checking authorizations...')}
        </div>
      </main>
    );
  }

  // Permission Guard: Requires aafenrir.manage_access
  if (!userData?.user.has_manage_access) {
    return (
      <main className="mt-4">
        <div className={`mx-auto border ${styles.denied}`}>
          <div className={`d-flex align-items-center gap-3 mb-3 font-eve fw-bold ${styles.deniedTitle}`}>
            <ShieldAlert className={styles.iconLg} />
            <span>{t('Access Denied')}</span>
          </div>
          <p className={styles.deniedText}>
            {t('You do not have permission to manage routes. Requires permission:')}{' '}
            <code className={`px-2 rounded ${styles.code}`}>
              aafenrir.manage_access
            </code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`mt-4 px-4 ${styles.page}`}>
      <div className={`mx-auto ${styles.container}`}>
        {/* Top Header */}
        <RouteAdminHeader
          onCreateClick={() => setIsCreateModalOpen(true)}
          onAddSystemClick={() => setIsAddSystemModalOpen(true)}
        />

        {/* Feedback Notifications */}
        {successMessage && (
          <div className={`my-2 p-4 border d-flex align-items-center gap-2 ${styles.alertSuccess}`}>
            <CheckCircle2 className={`flex-shrink-0 ${styles.iconMd}`} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className={`my-2 p-4 border d-flex align-items-center gap-2 ${styles.alertError}`}>
            <AlertTriangle className={`flex-shrink-0 ${styles.iconMd}`} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* View Navigation Tabs */}
        <div className={`d-flex align-items-center gap-2 pb-2 ${styles.tabBar}`}>
          <Button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 d-flex align-items-center gap-2 ${styles.tab} ${
              activeTab === 'routes' ? styles.tabActive : `border ${styles.tabInactive}`
            }`}
          >
            <RouteIcon className={styles.iconSm} />
            <span>{t('Route Presets')}</span>
            <span className={styles.count}>
              {presets.length}
            </span>
          </Button>

          <Button
            onClick={() => setActiveTab('systems')}
            className={`px-4 py-2 d-flex align-items-center gap-2 ${styles.tab} ${
              activeTab === 'systems' ? styles.tabActive : `border ${styles.tabInactive}`
            }`}
          >
            <Compass className={styles.iconSm} />
            <span>{t('Available Systems')}</span>
            <span className={styles.count}>
              {routeSystems.length}
            </span>
          </Button>
        </div>

        {/* TAB 1: Route Presets */}
        {activeTab === 'routes' && (
          <div>
            {/* Filter and Search Bar */}
            <div className={`fenrir-gradient fenrir-border-500 p-4 shadow-lg gap-4 ${styles.toolbar}`}>
              {/* Service Type Filter Pills */}
              <div className={`d-flex align-items-center overflow-x-auto pb-1 ${styles.pills}`}>
                {[
                  { id: 'all', label: t('All Corridors') },
                  { id: 'jumpfreighter', label: t('Jump Freighter') },
                  { id: 'freighter', label: t('Standard Freighter') },
                  { id: 'deep_space_transport', label: t('DST') },
                ].map((pill) => (
                  <Button
                    key={pill.id}
                    onClick={() => {
                      setRouteServiceFilter(pill.id);
                      setRoutePage(1);
                    }}
                    className={`px-3 ${styles.pill} ${
                      routeServiceFilter === pill.id
                        ? styles.pillActive
                        : `border ${styles.pillInactive}`
                    }`}
                  >
                    {pill.label}
                  </Button>
                ))}
              </div>

              {/* Search input */}
              <div className={styles.search}>
                <Search className={styles.searchIcon} />
                <Form.Control
                  type="text"
                  placeholder={t('Search routes, systems, stations...')}
                  value={routeSearch}
                  onChange={(e) => {
                    setRouteSearch(e.target.value);
                    setRoutePage(1);
                  }}
                  className={`w-100 py-2 border ${styles.searchInput}`}
                />
              </div>
            </div>

            {/* Routes Grid */}
            {isPresetsLoading ? (
              <div className={`text-center ${styles.loadingSm}`}>
                {t('Loading routes...')}
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className={`border text-center ${styles.empty}`}>
                {routeSearch || routeServiceFilter !== 'all'
                  ? t('No route presets match your search criteria.')
                  : t('No route presets created yet. Click "Create New Route" above to add one.')}
              </div>
            ) : (
              <>
                <div className={`gap-4 ${styles.routesGrid}`}>
                  {currentRoutes.map((preset: FreightCorridor) => (
                    <RouteCard
                      key={preset.id}
                      preset={preset}
                      onEditClick={(p) => setPresetToEdit(p)}
                      onDeleteClick={(p) => setPresetToDelete(p)}
                      isDeletePending={deleteMutation.isPending}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalRoutePages > 1 && (
                  <div className={`d-flex align-items-center justify-content-between pt-2 px-1 ${styles.pager}`}>
                    <div>
                      {t('Showing {{start}}-{{end}} of {{total}} routes', {
                        start: (routePage - 1) * routesPerPage + 1,
                        end: Math.min(routePage * routesPerPage, filteredRoutes.length),
                        total: filteredRoutes.length,
                      })}
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button
                        disabled={routePage <= 1}
                        onClick={() => setRoutePage((p) => Math.max(1, p - 1))}
                        className={`py-1 rounded border ${styles.pagerBtn}`}
                      >
                        <ChevronLeft className={styles.iconXs} />
                      </Button>
                      <span className="px-2 fw-semibold">
                        {t('Page {{page}} of {{total}}', {
                          page: routePage,
                          total: totalRoutePages,
                        })}
                      </span>
                      <Button
                        disabled={routePage >= totalRoutePages}
                        onClick={() => setRoutePage((p) => Math.min(totalRoutePages, p + 1))}
                        className={`py-1 rounded border ${styles.pagerBtn}`}
                      >
                        <ChevronRight className={styles.iconXs} />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: Available Systems */}
        {activeTab === 'systems' && (
          <div>
            {/* Search & Add Action Bar */}
            <div className={`fenrir-gradient fenrir-border-500 p-4 shadow-lg gap-4 ${styles.toolbar}`}>
              <div className={`${styles.search} ${styles.searchWide}`}>
                <Search className={styles.searchIcon} />
                <Form.Control
                  type="text"
                  placeholder={t('Search systems by name, region...')}
                  value={systemSearch}
                  onChange={(e) => {
                    setSystemSearch(e.target.value);
                  }}
                  className={`w-100 py-2 border ${styles.searchInput}`}
                />
              </div>

              <Button
                onClick={() => setIsAddSystemModalOpen(true)}
                className={`d-flex align-items-center flex-shrink-0 shadow ${styles.addBtn}`}
              >
                <Compass className={styles.iconSm} />
                <span>+ {t('Add System')}</span>
              </Button>
            </div>

            {/* Systems DataTable */}
            {isSystemsLoading ? (
              <div className={`text-center ${styles.loadingSm}`}>
                {t('Loading available systems...')}
              </div>
            ) : filteredSystems.length === 0 ? (
              <div className={`border text-center ${styles.empty}`}>
                {systemSearch
                  ? t('No solar systems match your search.')
                  : t('No route systems configured yet. Click "+ Add System" to add one.')}
              </div>
            ) : (
              <BaseTable
                data={filteredSystems}
                columns={systemColumns}
                itemLabel={t('systems')}
                initialState={{
                  pagination: { pageSize: 10 },
                  sorting: [{ id: 'name', desc: false }],
                }}
                emptyText={
                  systemSearch
                    ? t('No solar systems match your search.')
                    : t('No route systems configured yet. Click "+ Add System" to add one.')
                }
              />
            )}
          </div>
        )}

        {/* Modals */}
        <CreateRouteModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(newPreset) => createMutation.mutate(newPreset)}
          isPending={createMutation.isPending}
        />

        <EditRouteModal
          preset={presetToEdit}
          isOpen={Boolean(presetToEdit)}
          onClose={() => setPresetToEdit(null)}
          onSubmit={(data) => {
            if (presetToEdit) {
              updateMutation.mutate({ id: Number(presetToEdit.id), data });
            }
          }}
          isPending={updateMutation.isPending}
        />

        <DeleteRouteModal
          preset={presetToDelete}
          onClose={() => setPresetToDelete(null)}
          onConfirm={(id) => deleteMutation.mutate(id)}
          isPending={deleteMutation.isPending}
        />

        <AddRouteSystemModal
          isOpen={isAddSystemModalOpen}
          onClose={() => setIsAddSystemModalOpen(false)}
          onAddSystem={(systemId) => addSystemMutation.mutate(systemId)}
          isPending={addSystemMutation.isPending}
          existingSystemIds={routeSystems.map((s) => s.system_id)}
        />

        <DeleteRouteSystemModal
          system={systemToDelete}
          onClose={() => setSystemToDelete(null)}
          onConfirm={(id) => deleteSystemMutation.mutate(id)}
          isPending={deleteSystemMutation.isPending}
        />
      </div>
    </main>
  );
}
