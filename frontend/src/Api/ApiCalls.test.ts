// Third Party
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/Api/Api';
import {
    createRoutePreset,
    deleteRoutePreset,
    loadMenu,
    loadRoutePresets,
    loadUserData,
    updateUserSettings,
} from '@/Api/ApiCalls';

import { ProjectName } from '@/App';

describe('General API client functions', () => {
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

    describe('loadUserData', () => {
        it('returns user data on successful GET', async () => {
            const mockUser = { user_id: 1, character_id: 42, character_name: 'Test Pilot' };
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockUser,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadUserData();
            expect(result).toEqual({ user: mockUser });
            expect(apiClient.GET).toHaveBeenCalledWith(`/${ProjectName}/api/user/`);
        });

        it('throws error when GET fails or returns no data', async () => {
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: undefined,
                error: { status: 500 },
                response: new Response(),
            } as never);

            await expect(loadUserData()).rejects.toThrow('Failed to load user data');
        });
    });

    describe('loadMenu', () => {
        it('calls /menu/ and returns data', async () => {
            const mockMenu = { left_links: [], right_links: [] };
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockMenu,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadMenu();
            expect(result).toEqual(mockMenu);
            expect(apiClient.GET).toHaveBeenCalledWith(`/${ProjectName}/api/menu/`);
        });
    });

    describe('updateUserSettings', () => {
        it('submits FormData with disable_notifications and returns success', async () => {
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: { success: true },
                error: undefined,
                response: new Response(),
            } as never);

            const result = await updateUserSettings({ disable_notifications: true });
            expect(result).toEqual({ success: true });
            expect(apiClient.POST).toHaveBeenCalledWith(`/${ProjectName}/api/modify/user/settings/`, expect.any(Object));
        });

        it('submits FormData with quick_select_presets', async () => {
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: { success: true },
                error: undefined,
                response: new Response(),
            } as never);

            const result = await updateUserSettings({ quick_select_presets: [1, 2, 3] });
            expect(result).toEqual({ success: true });
            expect(apiClient.POST).toHaveBeenCalledWith(`/${ProjectName}/api/modify/user/settings/`, expect.any(Object));
        });

        it('throws error when update fails', async () => {
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: { success: false, message: 'Permission denied' },
                error: undefined,
                response: new Response(),
            } as never);

            await expect(updateUserSettings({ disable_notifications: false })).rejects.toThrow('Permission denied');
        });
    });
});
