// React
import { useEffect, useState } from 'react';

// Third Party
import { Check, Compass, Plus, Search } from 'lucide-react';
import { Badge, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { searchSolarSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { BaseModal } from '@/Components/Base/BaseModal';
import { ModalTitle } from '@/Components/Base/ModalTitle';
import { getSecurityVariant } from '@/Components/Calculator/calculator';

type SolarSystemSearchResult = components['schemas']['SolarSystemSearchSchema'];

export interface AddRouteSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSystem: (systemId: number) => void;
  isPending: boolean;
  existingSystemIds?: number[];
}

export function AddRouteSystemModal({
  isOpen,
  onClose,
  onAddSystem,
  isPending,
  existingSystemIds = [],
}: AddRouteSystemModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SolarSystemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SolarSystemSearchResult | null>(null);

  // Debounced search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchSolarSystems(trimmed);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setResults([]);
    setIsSearching(false);
    setSelectedSystem(null);
  };

  return (
    <BaseModal
      show={isOpen}
      onHide={onClose}
      onExited={handleReset}
      title={
        <ModalTitle
          icon={<Compass size={20} />}
          title={t('ADD AVAILABLE SYSTEM')}
          subtitle={t('Search and add an EVE Online solar system to available route options.')}
        />
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => selectedSystem && onAddSystem(selectedSystem.id)}
            disabled={isPending || !selectedSystem}
          >
            {isPending ? t('Adding...') : t('Add System')}
          </Button>
        </>
      }
    >
      {/* Search Input */}
      <InputGroup className="mb-3">
        <InputGroup.Text>
          <Search size={16} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          autoFocus
          placeholder={t('Type at least 2 characters (e.g. Jita, Amarr, 1DQ1-A)...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="font-monospace"
        />
      </InputGroup>

      {/* Results Area */}
      <div className="overflow-y-auto font-monospace small">
        {isSearching && (
          <div className="py-5 text-center text-body-secondary">{t('Searching EVE SDE solar systems...')}</div>
        )}

        {!isSearching && searchTerm.trim().length >= 2 && results.length === 0 && (
          <div className="py-5 text-center text-body-secondary">
            {t('No solar systems found matching "{{query}}".', { query: searchTerm })}
          </div>
        )}

        {!isSearching && searchTerm.trim().length < 2 && (
          <div className="py-5 text-center text-body-secondary">{t('Enter a system name above to begin searching.')}</div>
        )}

        {!isSearching && results.length > 0 && (
          <ListGroup>
            {results.map((sys) => {
              const isAlreadyAdded = existingSystemIds.includes(sys.id);
              const isSelected = selectedSystem?.id === sys.id;

              return (
                <ListGroup.Item
                  key={sys.id}
                  action
                  active={isSelected}
                  disabled={isAlreadyAdded}
                  onClick={() => setSelectedSystem(sys)}
                  className="d-flex flex-wrap gap-2 align-items-center justify-content-between"
                >
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="fw-bold">{sys.name}</span>
                    {sys.region_name && <span className="small">({sys.region_name})</span>}
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={getSecurityVariant(sys.security_status)}>{sys.security_status.toFixed(1)}</Badge>
                    {isAlreadyAdded ? (
                      <span className="small fst-italic">{t('Already Added')}</span>
                    ) : isSelected ? (
                      <Check size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        )}
      </div>
    </BaseModal>
  );
}
