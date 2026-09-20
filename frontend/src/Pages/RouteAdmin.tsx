// React
import { useMemo, useState } from 'react';

// Third Party
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
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

import {
  addRouteSystem,
  createRoutePreset,
  deleteRoutePreset,
  deleteRouteSystem,
  loadRoutePresets,
  loadRouteSystems,
  loadUserData,
  updateRoutePreset,
} from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { queryKeys } from '@/Api/query';
import { RouteAdminHeader, RouteCard } from '@/Components/RouteAdmin';
import {
  AddRouteSystemModal,
  CreateRouteModal,
  DeleteRouteModal,
  DeleteRouteSystemModal,
  EditRouteModal,
} from '@/Components/RouteAdmin/Modals';
import BaseTable from '@/Components/Tables/BaseTable/BaseTable';
import type { FreightCorridor } from '@/types';

type RouteSystemItem = components['schemas']['RouteSystemSchema'];

const systemColumnHelper = createColumnHelper<RouteSystemItem>();

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
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: queryKeys.User,
    queryFn: loadUserData,
    refetchOnWindowFocus: false,
  });

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
    if (sec >= 0.5) return '!text-emerald-400 !bg-emerald-950/60 border-emerald-500/40';
    if (sec > 0.0) return '!text-amber-400 !bg-amber-950/60 border-amber-500/40';
    return '!text-rose-400 !bg-rose-950/60 border-rose-500/40';
  };

  // Systems DataTable Column Definitions
  const systemColumns = useMemo(
    () => [
      systemColumnHelper.accessor('name', {
        header: t('System'),
        cell: ({ getValue }) => (
          <span className="font-bold !text-cyan-300">{getValue()}</span>
        ),
      }),
      systemColumnHelper.accessor('security_status', {
        header: t('Security'),
        cell: ({ row }) => {
          const sys = row.original;
          return (
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getSecColor(
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
          <span className="!text-slate-400">{getValue() || '—'}</span>
        ),
      }),
      systemColumnHelper.display({
        id: 'actions',
        enableSorting: false,
        header: () => <div className="text-right">{t('Actions')}</div>,
        cell: ({ row }) => {
          const sys = row.original;
          return (
            <div className="text-right">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setSystemToDelete(sys)}
                className="px-2 py-1 text-xs rounded !bg-red-950/40 hover:!bg-red-900 border !border-red-500/40 !text-red-300 transition-colors cursor-pointer"
                title={t('Remove System')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ] as ColumnDef<RouteSystemItem, unknown>[],
    [t]
  );

  if (isUserLoading) {
    return (
      <main className="mt-4">
        <div className="p-8 text-center !text-slate-400 font-mono text-sm">
          {t('Checking authorizations...')}
        </div>
      </main>
    );
  }

  // Permission Guard: Requires aafenrir.manage_access
  if (!userData?.user.has_manage_access) {
    return (
      <main className="mt-4">
        <div className="max-w-3xl mx-auto my-12 p-6 rounded-xl !bg-red-950/40 border !border-red-500/40 !text-slate-200">
          <div className="flex items-center gap-3 mb-3 !text-red-400 font-eve font-bold text-xl">
            <ShieldAlert className="w-6 h-6" />
            <span>{t('Access Denied')}</span>
          </div>
          <p className="text-sm !text-slate-300">
            {t('You do not have permission to manage routes. Requires permission:')}{' '}
            <code className="!bg-black/50 px-2 py-0.5 rounded !text-red-300 font-mono text-xs">
              aafenrir.manage_access
            </code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-4 min-h-screen !text-slate-200 px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <RouteAdminHeader
          onCreateClick={() => setIsCreateModalOpen(true)}
          onAddSystemClick={() => setIsAddSystemModalOpen(true)}
        />

        {/* Feedback Notifications */}
        {successMessage && (
          <div className="my-2 p-4 rounded-lg !bg-emerald-950/50 border !border-emerald-500/40 !text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="my-2 p-4 rounded-lg !bg-red-950/50 border !border-red-500/40 !text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-2 border-b !border-slate-800 pb-2">
          <Button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'routes'
                ? '!bg-cyan-600 !text-white !border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : '!bg-slate-900 !text-slate-400 hover:!text-white border !border-slate-800'
            }`}
          >
            <RouteIcon className="w-4 h-4" />
            <span>{t('Route Presets')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono">
              {presets.length}
            </span>
          </Button>

          <Button
            onClick={() => setActiveTab('systems')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'systems'
                ? '!bg-cyan-600 !text-white !border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : '!bg-slate-900 !text-slate-400 hover:!text-white border !border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('Available Systems')}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono">
              {routeSystems.length}
            </span>
          </Button>
        </div>

        {/* TAB 1: Route Presets */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Service Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      routeServiceFilter === pill.id
                        ? '!bg-cyan-600 !text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : '!bg-slate-900 !text-slate-400 hover:!text-slate-200 border !border-slate-800'
                    }`}
                  >
                    {pill.label}
                  </Button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 !text-slate-500 absolute left-3 top-2.5" />
                <Form.Control
                  type="text"
                  placeholder={t('Search routes, systems, stations...')}
                  value={routeSearch}
                  onChange={(e) => {
                    setRouteSearch(e.target.value);
                    setRoutePage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono !bg-slate-900 border !border-slate-700 rounded-lg !text-slate-200 focus:outline-none focus:!border-cyan-500"
                />
              </div>
            </div>

            {/* Routes Grid */}
            {isPresetsLoading ? (
              <div className="p-8 text-center !text-slate-400 font-mono text-xs">
                {t('Loading routes...')}
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="p-10 rounded-xl !bg-[#111724] border !border-slate-800 text-center !text-slate-400 text-sm">
                {routeSearch || routeServiceFilter !== 'all'
                  ? t('No route presets match your search criteria.')
                  : t('No route presets created yet. Click "Create New Route" above to add one.')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between pt-2 px-1 text-xs font-mono !text-slate-400">
                    <div>
                      {t('Showing {{start}}-{{end}} of {{total}} routes', {
                        start: (routePage - 1) * routesPerPage + 1,
                        end: Math.min(routePage * routesPerPage, filteredRoutes.length),
                        total: filteredRoutes.length,
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        disabled={routePage <= 1}
                        onClick={() => setRoutePage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 text-xs rounded !bg-slate-900 border !border-slate-800 hover:!bg-slate-800 !text-slate-300 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="px-2 font-semibold">
                        {t('Page {{page}} of {{total}}', {
                          page: routePage,
                          total: totalRoutePages,
                        })}
                      </span>
                      <Button
                        disabled={routePage >= totalRoutePages}
                        onClick={() => setRoutePage((p) => Math.min(totalRoutePages, p + 1))}
                        className="px-2.5 py-1 text-xs rounded !bg-slate-900 border !border-slate-800 hover:!bg-slate-800 !text-slate-300 disabled:opacity-40"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="space-y-4">
            {/* Search & Add Action Bar */}
            <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 !text-slate-500 absolute left-3 top-2.5" />
                <Form.Control
                  type="text"
                  placeholder={t('Search systems by name, region...')}
                  value={systemSearch}
                  onChange={(e) => {
                    setSystemSearch(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono !bg-slate-900 border !border-slate-700 rounded-lg !text-slate-200 focus:outline-none focus:!border-cyan-500"
                />
              </div>

              <Button
                onClick={() => setIsAddSystemModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg !bg-cyan-600 hover:!bg-cyan-500 !text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow"
              >
                <Compass className="w-4 h-4" />
                <span>+ {t('Add System')}</span>
              </Button>
            </div>

            {/* Systems DataTable */}
            {isSystemsLoading ? (
              <div className="p-8 text-center !text-slate-400 font-mono text-xs">
                {t('Loading available systems...')}
              </div>
            ) : filteredSystems.length === 0 ? (
              <div className="p-10 rounded-xl !bg-[#111724] border !border-slate-800 text-center !text-slate-400 text-sm">
                {systemSearch
                  ? t('No solar systems match your search.')
                  : t('No route systems configured yet. Click "+ Add System" to add one.')}
              </div>
            ) : (
              <BaseTable
                data={filteredSystems}
                columns={systemColumns}
                variant="fenrir"
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
