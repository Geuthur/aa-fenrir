// Third Party
import { beforeEach, describe, expect, it, vi } from 'vitest';

// AA Fenrir
import { apiClient } from '@/Api/Api';
import {
    administrationQueryKeys,
    deleteAdministrationHandler,
    loadAdministrationHandler,
    loadAdministrationHandlers,
    updateAdministrationAll,
    updateAdministrationHandler,
} from '@/Api/calls/administration';
import { ProjectName } from '@/constants';

describe('administrationQueryKeys', () => {
    it('provides the handler keys', () => {
        expect(administrationQueryKeys.handlers).toEqual(['AdministrationHandlers']);
        expect(administrationQueryKeys.handler(2001)).toEqual(['AdministrationHandler', 2001]);
    });
});

describe('Administration API calls', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadAdministrationHandler', () => {
        it('passes the corporation id as path parameter', async () => {
            const mockHandler = { corporation_id: 2001 };
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockHandler,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadAdministrationHandler(2001);
            expect(result).toEqual(mockHandler);
            expect(apiClient.GET).toHaveBeenCalledWith(
                `/${ProjectName}/api/administration/handlers/{corporation_id}/`,
                { params: { path: { corporation_id: 2001 } } }
            );
        });
    });

    describe('updateAdministrationHandler', () => {
        it('passes the force refresh flag as query parameter', async () => {
            const response = { success: true, message: 'Update queued' };
            vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
                data: response,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await updateAdministrationHandler(2001, true);
            expect(result).toEqual(response);
            expect(apiClient.POST).toHaveBeenCalledWith(
                `/${ProjectName}/api/administration/handlers/{corporation_id}/update/`,
                { params: { path: { corporation_id: 2001 }, query: { force_refresh: true } } }
            );
        });
    });
});

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Every call of `Api/calls/administration.ts`: [name, HTTP method, call, fixed text]. */
const calls: [string, Method, () => Promise<unknown>, string][] = [
    ['loadAdministrationHandlers', 'GET', () => loadAdministrationHandlers(), 'Failed to load handlers'],
    ['loadAdministrationHandler', 'GET', () => loadAdministrationHandler(2001), 'Failed to load handler'],
    ['updateAdministrationHandler', 'POST', () => updateAdministrationHandler(2001, false), 'Failed to queue update'],
    ['deleteAdministrationHandler', 'DELETE', () => deleteAdministrationHandler(2001), 'Failed to delete handler'],
    ['updateAdministrationAll', 'POST', () => updateAdministrationAll(false), 'Failed to queue update'],
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
