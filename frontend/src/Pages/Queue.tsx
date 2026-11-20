// React
import { useNavigate } from 'react-router-dom';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { ErrorLoader, FetchingLoader } from "aa-geuthur-react";
import { useTranslation } from 'react-i18next';

import { contractsQueryKeys, loadContractQueue } from '@/Api/calls/contracts';
import { ContractQueue } from '@/Components/Queue';
import { ProjectName } from '@/constants';

export default function Queue() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: contractsQueryKeys.queue,
    queryFn: loadContractQueue,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <main className="mt-4">
        <FetchingLoader message={t('Loading contracts queue...')} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mt-4">
        <ErrorLoader
          title={t('Error')}
          message={t('Failed to load contracts queue. Please try again.')}
        />
      </main>
    );
  }

  return (
    <main className="mt-4">
      <ContractQueue
        contracts={contracts}
        onNewQuoteClick={() => navigate(`/${ProjectName}/calculator/`)}
      />
    </main>
  );
}