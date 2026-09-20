// React
import { useEffect, useState } from 'react';

// Third Party
import { Check, Compass, Plus, Search } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { searchSolarSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { FenrirModal } from '@/Components/Modals';

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

  const getSecColor = (sec: number) => {
    if (sec >= 0.5) return '!text-emerald-400 !bg-emerald-950/60 border-emerald-500/40';
    if (sec > 0.0) return '!text-amber-400 !bg-amber-950/60 border-amber-500/40';
    return '!text-rose-400 !bg-rose-950/60 border-rose-500/40';
  };

  return (
    <FenrirModal
      isOpen={isOpen}
      onClose={onClose}
      onExited={handleReset}
      size="lg"
    >
      <FenrirModal.Header>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg !bg-cyan-950/60 border !border-cyan-500/40 !text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('ADD AVAILABLE SYSTEM')}</FenrirModal.Title>
            <p className="text-[11px] !text-slate-400 font-mono m-0">
              {t('Search and add an EVE Online solar system to available route options.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <FenrirModal.Body>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 !text-slate-500 absolute left-3 top-3" />
            <Form.Control
              type="text"
              autoFocus
              placeholder={t('Type at least 2 characters (e.g. Jita, Amarr, 1DQ1-A)...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono !bg-slate-900 border !border-slate-700 rounded-lg !text-slate-200 focus:outline-none focus:!border-cyan-500"
            />
          </div>

          {/* Results Area */}
          <div className="min-h-[220px] max-h-[300px] overflow-y-auto space-y-1.5 pr-1 font-mono">
            {isSearching && (
              <div className="py-10 text-center text-xs !text-slate-500">
                {t('Searching EVE SDE solar systems...')}
              </div>
            )}

            {!isSearching && searchTerm.trim().length >= 2 && results.length === 0 && (
              <div className="py-10 text-center text-xs !text-slate-500">
                {t('No solar systems found matching "{{query}}".', { query: searchTerm })}
              </div>
            )}

            {!isSearching && searchTerm.trim().length < 2 && (
              <div className="py-10 text-center text-xs !text-slate-500">
                {t('Enter a system name above to begin searching.')}
              </div>
            )}

            {!isSearching &&
              results.map((sys) => {
                const isAlreadyAdded = existingSystemIds.includes(sys.id);
                const isSelected = selectedSystem?.id === sys.id;

                return (
                  <button
                    key={sys.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => setSelectedSystem(sys)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                      isSelected
                        ? '!bg-cyan-950/60 !border-cyan-500 !text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : isAlreadyAdded
                        ? '!bg-slate-900/40 !border-slate-800/80 !text-slate-600 cursor-not-allowed'
                        : '!bg-slate-900/80 !border-slate-800 !text-slate-300 hover:!bg-slate-800/80 hover:!border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold">{sys.name}</span>
                      {sys.region_name && (
                        <span className="text-[11px] !text-slate-400">({sys.region_name})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getSecColor(
                          sys.security_status
                        )}`}
                      >
                        {sys.security_status.toFixed(1)}
                      </span>

                      {isAlreadyAdded ? (
                        <span className="text-[10px] !text-slate-500 italic">
                          {t('Already Added')}
                        </span>
                      ) : isSelected ? (
                        <Check className="w-4 h-4 !text-cyan-400" />
                      ) : (
                        <Plus className="w-4 h-4 !text-slate-500" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => selectedSystem && onAddSystem(selectedSystem.id)}
            disabled={isPending || !selectedSystem}
            className="text-xs font-semibold !bg-cyan-600 hover:!bg-cyan-500 !border-cyan-500"
          >
            {isPending ? t('Adding...') : t('Add System')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </FenrirModal>
  );
}
