// Third Party
import { beforeEach, describe, expect, it, vi } from 'vitest';

// AA Fenrir
import { apiClient } from '@/Api/Api';
import {
    addRouteSystem,
    createRoutePreset,
    deleteRoutePreset,
    deleteRouteSystem,
    loadContractHandlers,
    loadRoutePresetCoverage,
    loadRoutePresets,
    loadRouteSystems,
    routesQueryKeys,
    searchSolarSystems,
    updateRoutePreset,
} from '@/Api/calls/routes';
import type { components } from '@/Api/OpenApi';
import { ProjectName } from '@/constants';

describe('routesQueryKeys', () => {
    it('provides the route keys', () => {
        expect(routesQueryKeys.presets).toEqual(['RoutePresets']);
        expect(routesQueryKeys.systems).toEqual(['RouteSystems']);
        expect(routesQueryKeys.contractHandlers).toEqual(['ContractHandlers']);
    });

    it('provides the route coverage key per preset', () => {
        expect(routesQueryKeys.presetCoverage(7)).toEqual(['RoutePresetCoverage', 7]);
    });
});

describe('Route API calls', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadRoutePresets', () => {
        it('calls /contract/presets/ and returns presets array', async () => {
            const mockPresets = [{ id: 1, name: 'Delve Express', originSystem: 'Jita' }];
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockPresets,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadRoutePresets();
            expect(result).toEqual(mockPresets);
            expect(apiClient.GET).toHaveBeenCalledWith(`/${ProjectName}/api/contract/presets/`);
        });

        it('throws error when GET fails', async () => {
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: undefined,
                error: { status: 500 },
                response: new Response(),
            } as never);

            await expect(loadRoutePresets()).rejects.toThrow('Failed to load route presets');
        });
    });

    describe('loadRoutePresetCoverage', () => {
        it('calls the coverage endpoint of the preset and returns the systems', async () => {
            const mockCoverage = [{ system_id: 30000142, system_name: 'Jita', characters: [] }];
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockCoverage,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadRoutePresetCoverage(3);
            expect(result).toEqual(mockCoverage);
            expect(apiClient.GET).toHaveBeenCalledWith(
                `/${ProjectName}/api/contract/preset/{preset_id}/coverage/`,
                { params: { path: { preset_id: 3 } } }
            );
        });

        it('throws error when GET fails', async () => {
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: undefined,
                error: { error: 'Permission Denied.' },
                response: new Response(),
            } as never);

            await expect(loadRoutePresetCoverage(3)).rejects.toThrow('Permission Denied.');
        });
    });

    describe('createRoutePreset', () => {
        it('calls POST /contract/presets/ and returns created preset', async () => {
            const mockInput = { name: 'New Corridor', originSystemId: 30000142, destinationSystemId: 30004759 };
            const mockCreated = { id: 2, name: 'New Corridor', originSystem: 'Jita', destinationSystem: '1DQ1-A' };
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: mockCreated,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await createRoutePreset(mockInput as never);
            expect(result).toEqual(mockCreated);
            expect(apiClient.POST).toHaveBeenCalledWith(`/${ProjectName}/api/contract/presets/`, {
                body: mockInput,
            });
        });

        it('throws error when creation fails', async () => {
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: undefined,
                error: { error: 'Permission Denied.' },
                response: new Response(),
            } as never);

            await expect(
                createRoutePreset({ name: 'Fail' } as never)
            ).rejects.toThrow('Permission Denied.');
        });
    });

    describe('deleteRoutePreset', () => {
        it('calls DELETE /contract/preset/{preset_id}/ and returns success', async () => {
            vi.spyOn(apiClient, 'DELETE').mockResolvedValueOnce({
                data: { success: true, message: 'Route preset deleted successfully.' },
                error: undefined,
                response: new Response(),
            } as never);

            const result = await deleteRoutePreset(5);
            expect(result).toEqual({ success: true, message: 'Route preset deleted successfully.' });
            expect(apiClient.DELETE).toHaveBeenCalledWith(
                `/${ProjectName}/api/contract/preset/{preset_id}/`,
                { params: { path: { preset_id: 5 } } }
            );
        });

        it('throws error when deletion fails', async () => {
            vi.spyOn(apiClient, 'DELETE').mockResolvedValueOnce({
                data: undefined,
                error: { detail: 'Route preset not found.' },
                response: new Response(),
            } as never);

            await expect(deleteRoutePreset(99)).rejects.toThrow('Route preset not found.');
        });
    });
});

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const presetPayload: components['schemas']['CreateRoutePresetSchema'] = {
    name: 'Corridor',
    origin_system_id: 30000142,
    origin_system_station: '',
    destination_system_id: 30004759,
    destination_system_station: '',
    service_type: 'jumpfreighter',
    max_volume: 0,
    max_collateral: 0,
    base_fee: 5000000,
    fee_per_m3: 0,
    fee_per_ly: 0,
    collateral_percent: 0,
    min_reward: 0,
    estimated_time: 0,
    is_cyno_route: false,
    cyno_waypoint_ids: [],
    danger_level: 'safe',
    has_alliance_subsidy: true,
    expiration_days: 7,
    days_to_complete: 3,
};

/** Every call of `Api/calls/routes.ts`: [name, HTTP method, call, fixed text]. */
const calls: [string, Method, () => Promise<unknown>, string][] = [
    ['loadRoutePresets', 'GET', () => loadRoutePresets(), 'Failed to load route presets'],
    ['loadRoutePresetCoverage', 'GET', () => loadRoutePresetCoverage(3), 'Failed to load route coverage'],
    ['createRoutePreset', 'POST', () => createRoutePreset(presetPayload), 'Failed to create route preset'],
    ['updateRoutePreset', 'PUT', () => updateRoutePreset(3, presetPayload), 'Failed to update route preset'],
    ['deleteRoutePreset', 'DELETE', () => deleteRoutePreset(3), 'Failed to delete route preset'],
    ['loadRouteSystems', 'GET', () => loadRouteSystems(), 'Failed to load route systems'],
    ['addRouteSystem', 'POST', () => addRouteSystem(30000142), 'Failed to add route system'],
    ['deleteRouteSystem', 'DELETE', () => deleteRouteSystem(30000142), 'Failed to delete route system'],
    ['searchSolarSystems', 'GET', () => searchSolarSystems('Jita'), 'Failed to search solar systems'],
    ['loadContractHandlers', 'GET', () => loadContractHandlers(), 'Failed to load contract handlers'],
];

const failWith = (method: Method, error: unknown) =>
    vi.spyOn(apiClient, method).mockResolvedValueOnce({
        data: undefined,
        error,
        response: new Response(),
    } as never);

describe('API error messages', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe.each(calls)('%s', (_name, method, call, fixedText) => {
        it('throws the message of the API', async () => {
            failWith(method, { error: 'Permission Denied' });

            await expect(call()).rejects.toThrow('Permission Denied');
        });

        it('throws the fixed text when the API sends no message', async () => {
            failWith(method, {});

            await expect(call()).rejects.toThrow(fixedText);
        });
    });
});
