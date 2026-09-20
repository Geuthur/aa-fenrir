// React
import { useNavigate } from 'react-router-dom';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { loadContractQueue } from '@/Api/ApiCalls';
import { queryKeys } from '@/Api/query';
import { ProjectName } from '@/App';
import ErrorLoader from '@/Components/Loader/ErrorLoader';
import FetchingLoader from '@/Components/Loader/FetchingLoader';
import { ContractQueue } from '@/Components/Queue';

export default function Queue() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: queryKeys.Contracts,
    queryFn: loadContractQueue,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <FetchingLoader message={t('Loading contracts queue...')} />;
  }

  if (error) {
    return (
      <ErrorLoader
        title={t('Error')}
        message={t('Failed to load contracts queue. Please try again.')}
      />
    );
  }

  return (
    <div>
      <ContractQueue
        contracts={contracts}
        onNewQuoteClick={() => navigate(`/${ProjectName}/calculator/`)}
      />
    </div>
  );
}