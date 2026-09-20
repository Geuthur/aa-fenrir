// React
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Third Party
import { ArrowRightLeft, Compass, Navigation, Radio, ShieldAlert, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';

// Styles
import styles from '@/Components/Calculator/RouteSelector.module.css';

import { getSecurityColor, getServiceBadge } from '@/Components/Calculator/calculator';
import type { EveSolarSystem, FreightCorridor } from '@/types';

interface RouteSelectorProps {
  origin: EveSolarSystem;
  setOrigin: (sys: EveSolarSystem) => void;
  destination: EveSolarSystem;
  setDestination: (sys: EveSolarSystem) => void;
  selectedCorridor: FreightCorridor | null;
  setSelectedCorridor: (corridor: FreightCorridor | null) => void;
  originStation: string;
  setOriginStation: (st: string) => void;
  destinationStation: string;
  setDestinationStation: (st: string) => void;
  distanceLy: number;
  stargateJumps: number;
  serviceType: string;
  corridors?: FreightCorridor[];
  quickSelectPresetIds?: number[];
  onOpenConfigurePresets?: () => void;
  systems?: EveSolarSystem[];
}

export function RouteSelector({
  origin,
  setOrigin,
  destination,
  setDestination,
  selectedCorridor,
  setSelectedCorridor,
  originStation,
  setOriginStation,
  destinationStation,
  setDestinationStation,
  distanceLy,
  stargateJumps,
  serviceType,
  corridors = [],
  quickSelectPresetIds = [],
  onOpenConfigurePresets,
  systems = [],
}: RouteSelectorProps) {
  const { t } = useTranslation();

  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [eveTime, setEveTime] = useState('');
  
  useEffect(() => {
    const updateEveClock = () => {
      const now = new Date();
      const utcString = now.toUTCString().slice(17, 25);
      setEveTime(utcString);
    };
    updateEveClock();
    const interval = setInterval(updateEveClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const availableSystems = systems;

  const filteredOrigins = availableSystems.filter((s) =>
    s.name.toLowerCase().includes(originSearch.toLowerCase()) ||
    s.region.toLowerCase().includes(originSearch.toLowerCase())
  );

  const filteredDests = availableSystems.filter((s) =>
    s.name.toLowerCase().includes(destSearch.toLowerCase()) ||
    s.region.toLowerCase().includes(destSearch.toLowerCase())
  );

  const displayedPresets = useMemo(() => {
    if (quickSelectPresetIds && quickSelectPresetIds.length > 0) {
      const filtered = corridors.filter((c) => quickSelectPresetIds.includes(Number(c.id)));
      return filtered.slice(0, 5);
    }
    return corridors.slice(0, 5);
  }, [corridors, quickSelectPresetIds]);

  const handleCorridorSelect = (corridorId: string) => {
    if (!corridorId) {
      setSelectedCorridor(null);
      return;
    }
    const found = corridors.find((c) => String(c.id) === String(corridorId));
    if (found) {
      setSelectedCorridor(found);
      const oSys: EveSolarSystem = availableSystems.find(
        (s) =>
          (found.origin_system_id && s.id === Number(found.origin_system_id)) ||
          (found.origin_system && s.name.toLowerCase() === found.origin_system.toLowerCase())
      ) || {
        id: found.origin_system_id ? Number(found.origin_system_id) : 0,
        name: found.origin_system || 'Unknown',
        security: 0.0,
        securityClass: 'nullsec',
        region: 'Unknown',
        defaultStation: `${found.origin_system || 'Unknown'} - Upwell Citadel`,
      };
      const dSys: EveSolarSystem = availableSystems.find(
        (s) =>
          (found.destination_system_id && s.id === Number(found.destination_system_id)) ||
          (found.destination_system && s.name.toLowerCase() === found.destination_system.toLowerCase())
      ) || {
        id: found.destination_system_id ? Number(found.destination_system_id) : 0,
        name: found.destination_system || 'Unknown',
        security: 0.0,
        securityClass: 'nullsec',
        region: 'Unknown',
        defaultStation: `${found.destination_system || 'Unknown'} - Upwell Citadel`,
      };
      setOrigin(oSys);
      setDestination(dSys);
      setOriginStation(found.origin_station || oSys.defaultStation || `${oSys.name} - Upwell Citadel`);
      setDestinationStation(found.destination_station || dSys.defaultStation || `${dSys.name} - Upwell Citadel`);
    }
  };

  const handleSwapRoute = () => {
    setSelectedCorridor(null);
    const prevOrigin = origin;
    const prevDest = destination;
    const prevOriginSt = originStation;
    const prevDestSt = destinationStation;

    setOrigin(prevDest);
    setDestination(prevOrigin);
    setOriginStation(prevDestSt);
    setDestinationStation(prevOriginSt);
  };

  const originSec = getSecurityColor(origin.security);
  const destSec = getSecurityColor(destination.security);
  const serviceBadge = getServiceBadge(serviceType);

  const isCynoGuarded = Boolean(
    selectedCorridor?.is_cyno_route ||
    (selectedCorridor?.danger_level &&
      ['cyno_guarded', 'cyno guarded', 'cyno-guarded'].includes(
        selectedCorridor.danger_level.toLowerCase().trim()
      ))
  );

  const isSafe = Boolean(
    selectedCorridor?.danger_level &&
      selectedCorridor.danger_level.toLowerCase().trim() === 'safe'
  );
  return (
    <div className={`${styles.container} fenrir-gradient fenrir-border-700`}>
      {/* Decorative gradient corner */}
      <div className={styles.cornerGradient} />

      <div className={styles.header}>
        <div>
          <div className={styles.titleGroup}>
            <Compass className={styles.titleIcon} />
            <h2 className={styles.titleHeading}>
              { t('FLIGHT CORRIDOR & ROUTE') }
            </h2>
            {/* EVE UTC Clock */}
            <div className={styles.eveClock}>
              <Radio className={styles.clockIcon} />
              <span className={styles.clockLabel}>EVE TIME:</span>
              <span className={styles.clockTime}>{eveTime || '12:00:00'} UTC</span>
            </div>
          </div>
          <p className={styles.subtitle}>
            Select an alliance approved freight corridor or specify custom origin and destination citadels.
          </p>
        </div>

        {/* Preset Corridor Selector */}
        <div className={styles.presetSelectorWrapper}>
          <Form.Label className={styles.presetSelectorLabel}>
            <Sparkles className={styles.presetSelectorIcon} />
            Corridor Preset:
          </Form.Label>
          <Form.Select
            id="corridor-preset-select"
            value={selectedCorridor?.id ? String(selectedCorridor.id) : ''}
            onChange={(e) => handleCorridorSelect(e.target.value)}
            className={styles.presetSelectControl}
          >
            <option value="">-- Custom / Manual Route --</option>
            {corridors.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {/* Preset Route Quick Select Pills (Max 5, Customizable) */}
      {corridors.length > 0 && (
        <div className={styles.presetsPillsRow}>
          <span className={styles.presetsPillsLabel}>
            <Sparkles className={styles.presetsPillsIcon} />
            Presets:
          </span>
          {displayedPresets.map((c) => {
            const isSelected = selectedCorridor?.id ? String(selectedCorridor.id) === String(c.id) : false;
            return (
              <Button
                key={String(c.id)}
                size="sm"
                onClick={() => handleCorridorSelect(String(c.id))}
                className={isSelected ? styles.presetPillSelected : styles.presetPill}
              >
                <span>{c.name}</span>
                <span className={styles.presetPillSub}>({c.origin_system} ➔ {c.destination_system})</span>
              </Button>
            );
          })}
          {onOpenConfigurePresets && (
            <Button
              size="sm"
              onClick={onOpenConfigurePresets}
              title="Customize Quick-Select Presets"
              className={styles.configureBtn}
            >
              <SlidersHorizontal className={styles.configureIcon} />
              <span className={styles.configureBtnText}>Configure</span>
            </Button>
          )}
        </div>
      )}

      {/* Origin & Destination Grid */}
      <div className={styles.systemsGrid}>
        {/* Origin System Card */}
        <div className={styles.systemCard}>
          <div className={styles.systemCardHeader}>
            <span className={styles.systemCardTitle}>
              <span className={styles.originDot}></span>
              Origin Solar System
            </span>
            <span className={`${styles.secBadge} ${originSec.bg} ${originSec.text} ${originSec.border}`}>
              Sec: {originSec.label}
            </span>
          </div>

          <div className={styles.dropdownWrapper}>
            <Button
              id="origin-system-dropdown"
              onClick={() => setOriginOpen(!originOpen)}
              className={styles.systemDropdownBtn}
            >
              <span>{origin.name || '-- Select System --'}</span>
              <span className={styles.systemDropdownRegion}>
                {origin.region}
              </span>
            </Button>

            {originOpen && (
              <div className={styles.dropdownMenu}>
                <Form.Control
                  type="text"
                  placeholder="Search system or region..."
                  value={originSearch}
                  onChange={(e) => setOriginSearch(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                <div className={styles.dropdownList}>
                  {filteredOrigins.length === 0 ? (
                    <div className="p-3 text-center text-xs !text-slate-400">
                      {systems.length === 0 ? 'No systems configured in Route Admin' : 'No matching systems found'}
                    </div>
                  ) : (
                    filteredOrigins.map((sys) => {
                      const sec = getSecurityColor(sys.security);
                      return (
                        <Button
                          key={sys.id}
                          onClick={() => {
                            setSelectedCorridor(null);
                            setOrigin(sys);
                            setOriginStation(sys.defaultStation || `${sys.name} - Upwell Citadel`);
                            setOriginOpen(false);
                            setOriginSearch('');
                          }}
                          className={styles.systemItemBtn}
                        >
                          <span className={styles.systemItemName}>{sys.name}</span>
                          <div className={styles.systemItemMeta}>
                            <span className={styles.systemItemRegion}>{sys.region}</span>
                            <span className={`${styles.systemItemSecBadge} ${sec.bg} ${sec.text} ${sec.border}`}>
                              {sys.security.toFixed(1)}
                            </span>
                          </div>
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.stationWrapper}>
            <Form.Label className={styles.stationLabel}>
              Departure Station / Citadel Structure:
            </Form.Label>
            <Form.Control
              disabled
              type="text"
              id="origin-station-input"
              value={originStation}
              onChange={(e) => setOriginStation(e.target.value)}
              className={styles.stationInput}
              placeholder="e.g. Jita IV - Moon 4 - Caldari Navy Assembly Plant"
            />
          </div>
        </div>

        {/* Swap / Routing Connector */}
        <div className={styles.swapWrapper}>
          <Button
            id="swap-route-btn"
            onClick={handleSwapRoute}
            title="Swap Origin & Destination"
            className={styles.swapBtn}
          >
            <ArrowRightLeft className={styles.swapIcon} />
          </Button>
          <div className={styles.swapLabel}>
            Swap
          </div>
        </div>

        {/* Destination System Card */}
        <div className={styles.systemCard}>
          <div className={styles.systemCardHeader}>
            <span className={styles.systemCardTitle}>
              <span className={styles.destDot}></span>
              Destination Solar System
            </span>
            <span className={`${styles.secBadge} ${destSec.bg} ${destSec.text} ${destSec.border}`}>
              Sec: {destSec.label}
            </span>
          </div>

          <div className={styles.dropdownWrapper}>
            <Button
              id="dest-system-dropdown"
              onClick={() => setDestOpen(!destOpen)}
              className={styles.systemDropdownBtn}
            >
              <span>{destination.name || '-- Select System --'}</span>
              <span className={styles.systemDropdownRegion}>
                {destination.region}
              </span>
            </Button>

            {destOpen && (
              <div className={styles.dropdownMenu}>
                <Form.Control
                  type="text"
                  placeholder="Search destination system..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                <div className={styles.dropdownList}>
                  {filteredDests.length === 0 ? (
                    <div className="p-3 text-center text-xs !text-slate-400">
                      {systems.length === 0 ? 'No systems configured in Route Admin' : 'No matching systems found'}
                    </div>
                  ) : (
                    filteredDests.map((sys) => {
                      const sec = getSecurityColor(sys.security);
                      return (
                        <Button
                          key={sys.id}
                          type="button"
                          onClick={() => {
                            setSelectedCorridor(null);
                            setDestination(sys);
                            setDestinationStation(sys.defaultStation || `${sys.name} - Upwell Citadel`);
                            setDestOpen(false);
                            setDestSearch('');
                          }}
                          className={styles.systemItemBtn}
                        >
                          <span className={styles.systemItemName}>{sys.name}</span>
                          <div className={styles.systemItemMeta}>
                            <span className={styles.systemItemRegion}>{sys.region}</span>
                            <span className={`${styles.systemItemSecBadge} ${sec.bg} ${sec.text} ${sec.border}`}>
                              {sys.security.toFixed(1)}
                            </span>
                          </div>
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.stationWrapper}>
            <Form.Label className={styles.stationLabel}>
              Arrival Station / Citadel Structure:
            </Form.Label>
            <Form.Control
              disabled
              type="text"
              id="destination-station-input"
              value={destinationStation}
              onChange={(e) => setDestinationStation(e.target.value)}
              className={styles.stationInput}
              placeholder="e.g. 1DQ1-A 1 - Imperial Palace Keepstar"
            />
          </div>
        </div>
      </div>

      {/* Navigation Telemetry Bar */}
      <div className={styles.telemetryGrid}>
          {/* Buttons */}
          <div className={styles.telemetryCard}>
            <span className={styles.telemetryLabel}>Service Profile</span>
            <span className={`${styles.serviceBadge} ${serviceBadge.color}`}>
              {serviceBadge.label}
            </span>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.telemetryLabel}>Jump Drive Distance</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValueCyan}>{distanceLy.toFixed(3)}</span>
              <span className={styles.telemetryUnit}>Light Years</span>
            </div>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.telemetryLabel}>Stargate Transit</span>
            <div className={styles.telemetryValueRow}>
              <span className={styles.telemetryValueWhite}>{stargateJumps}</span>
              <span className={styles.telemetryUnit}>Gates</span>
            </div>
          </div>

          <div className={styles.telemetryCard}>
            <span className={styles.telemetryLabel}>Route Risk Rating</span>
            <div className={styles.riskRatingRow}>
              {isCynoGuarded ? (
                <span className={styles.riskRatingSafe}>
                  <Navigation className={styles.riskRatingIcon} /> Cyno-Guarded
                </span>
              ) : isSafe || (origin.securityClass === 'highsec' && destination.securityClass === 'highsec') ? (
                <span className={styles.riskRatingSafe}>
                  <ShieldCheck className={styles.riskRatingIcon} /> {isSafe ? 'Safe Corridor' : 'Highsec Concord Protected'}
                </span>
              ) : (
                <span className={styles.riskRatingWarning}>
                  <ShieldAlert className={styles.riskRatingIcon} /> Low/Null Transit
                </span>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
