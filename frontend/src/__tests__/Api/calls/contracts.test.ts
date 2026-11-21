// Third Party
import { beforeEach, describe, expect, it, vi } from 'vitest';

// AA Fenrir
import { apiClient } from '@/Api/Api';
import {
    contractsQueryKeys,
    loadContractQueue,
} from '@/Api/calls/contracts';
import { ProjectName } from '@/constants';

describe('contractsQueryKeys', () => {
    it('provides the queue key', () => {
        expect(contractsQueryKeys.queue).toEqual(['Contracts']);
    });
});

describe('Contract API calls', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadContractQueue', () => {
        it('calls /contract/queue/ and returns the contracts', async () => {
            const mockContracts = [{ contract_id: 1 }];
            vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
                data: mockContracts,
                error: undefined,
                response: new Response(),
            } as never);

            const result = await loadContractQueue();
            expect(result).toEqual(mockContracts);
            expect(apiClient.GET).toHaveBeenCalledWith(`/${ProjectName}/api/contract/queue/`);
        });
    });
});

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Every call of `Api/calls/contracts.ts`: [name, HTTP method, call, fixed text]. */
const calls: [string, Method, () => Promise<unknown>, string][] = [
    ['loadContractQueue', 'GET', () => loadContractQueue(), 'Failed to load contracts queue'],
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
