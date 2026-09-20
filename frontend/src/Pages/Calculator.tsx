// React
import { useEffect, useMemo, useState } from 'react';

// Third Party
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { loadRoutePresets, loadRouteSystems, loadUserData, updateUserSettings } from '@/Api/ApiCalls';
import { queryKeys } from '@/Api/query';
import {
  CargoInput,
  MatchedCorridorIndicator,
  QuoteBreakdown,
  RouteSelector,
  calculateDistanceLy,
  calculateTransportQuote,
  doesCorridorMatch,
  estimateStargateJumps,
} from '@/Components/Calculator';
import { ConfigurePresetsModal, ContractModal } from '@/Components/Calculator/Modals';
import type { EveSolarSystem, FreightCorridor, SecurityClass } from '@/types';

const EMPTY_SYSTEM: EveSolarSystem = {
    id: 0,
    name: '',
    security: 0,
    securityClass: 'highsec',
    region: '',
    defaultStation: '',
};

export default function Calculator() {
    const queryClient = useQueryClient();
    const [showContractModal, setShowContractModal] = useState(false);
    const [showConfigurePresetsModal, setShowConfigurePresetsModal] = useState(false);

    // Load User Data (for quick-select preset configuration)
    const { data: userData } = useQuery({
        queryKey: queryKeys.User,
        queryFn: loadUserData,
        refetchOnWindowFocus: false,
    });

    // Load Presets from API
    const { data: presets = [] } = useQuery({
        queryKey: queryKeys.RoutePresets,
        queryFn: loadRoutePresets,
        refetchOnWindowFocus: false,
    });

    // Load Available Route Systems from API
    const { data: routeSystems = [] } = useQuery({
        queryKey: queryKeys.RouteSystems,
        queryFn: loadRouteSystems,
        refetchOnWindowFocus: false,
    });

    const availableSystems: EveSolarSystem[] = useMemo(() => {
        return routeSystems.map((rs) => ({
            id: rs.system_id,
            name: rs.name,
            security: rs.security_status,
            securityClass:
                (rs.security_class as SecurityClass) ||
                (rs.security_status >= 0.45 ? 'highsec' : rs.security_status > 0 ? 'lowsec' : 'nullsec'),
            region: rs.region_name || 'Unknown',
            defaultStation: `${rs.name} - Upwell Citadel`,
            x: rs.x,
            y: rs.y,
            z: rs.z,
        }));
    }, [routeSystems]);

    // Save Quick-Select Presets Mutation
    const savePresetsMutation = useMutation({
        mutationFn: (presetIds: number[]) =>
            updateUserSettings({ quick_select_presets: presetIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.User });
            setShowConfigurePresetsModal(false);
        },
    });

    // Corridor & Route State
    const [selectedCorridor, setSelectedCorridor] = useState<FreightCorridor | null>(null);
    const [origin, setOrigin] = useState<EveSolarSystem>(EMPTY_SYSTEM);
    const [destination, setDestination] = useState<EveSolarSystem>(EMPTY_SYSTEM);
    const [originStation, setOriginStation] = useState('');
    const [destinationStation, setDestinationStation] = useState('');
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!hasInitialized && availableSystems.length > 0) {
            // Default to base rates with first available systems
            const oSys = availableSystems[0];
            const dSys = availableSystems[1] || availableSystems[0];
            setOrigin(oSys);
            setDestination(dSys);
            setOriginStation(oSys.defaultStation || `${oSys.name} - Upwell Citadel`);
            setDestinationStation(dSys.defaultStation || `${dSys.name} - Upwell Citadel`);
            setSelectedCorridor(null);
            setHasInitialized(true);
        }
    }, [hasInitialized, availableSystems]);

    // Matching corridor preset detection for selected origin & destination (bidirectional)
    const matchingCorridor = useMemo(() => {
        if (!origin.id && !origin.name) return null;
        if (!destination.id && !destination.name) return null;
        if (origin.id && destination.id && origin.id === destination.id) return null;

        return presets.find((p) => doesCorridorMatch(p, origin, destination)) || null;
    }, [presets, origin, destination]);

    // Effective active corridor:
    // Only applied if user explicitly selected a corridor and it matches the current systems (bidirectional)
    const effectiveCorridor = useMemo(() => {
        if (!selectedCorridor) return null;
        if (doesCorridorMatch(selectedCorridor, origin, destination)) {
            return selectedCorridor;
        }
        return null;
    }, [selectedCorridor, origin, destination]);

    const handleSelectOrigin = (sys: EveSolarSystem) => {
        setOrigin(sys);
        setOriginStation(sys.defaultStation || `${sys.name} - Upwell Citadel`);
        // If user had a corridor selected, only keep it if it still matches (bidirectional)
        setSelectedCorridor((prev) => (doesCorridorMatch(prev, sys, destination) ? prev : null));
    };

    const handleSelectDestination = (sys: EveSolarSystem) => {
        setDestination(sys);
        setDestinationStation(sys.defaultStation || `${sys.name} - Upwell Citadel`);
        // If user had a corridor selected, only keep it if it still matches (bidirectional)
        setSelectedCorridor((prev) => (doesCorridorMatch(prev, origin, sys) ? prev : null));
    };

    const handleApplyCorridor = (corridor: FreightCorridor) => {
        setSelectedCorridor(corridor);

        // Check whether current route is reverse direction
        const isReverse =
            (corridor.origin_system_id && Number(corridor.origin_system_id) === destination.id) ||
            (corridor.origin_system && corridor.origin_system.toLowerCase() === destination.name.toLowerCase());

        if (isReverse) {
            if (corridor.destination_station) setOriginStation(corridor.destination_station);
            if (corridor.origin_station) setDestinationStation(corridor.origin_station);
        } else {
            if (corridor.origin_station) setOriginStation(corridor.origin_station);
            if (corridor.destination_station) setDestinationStation(corridor.destination_station);
        }
    };

    const handleSelectPresetCorridor = (corridor: FreightCorridor | null) => {
        if (!corridor) {
            setSelectedCorridor(null);
            return;
        }

        // Check if current route already matches this corridor (direct or reverse)
        const isMatch = doesCorridorMatch(corridor, origin, destination);

        if (isMatch) {
            // Keep current systems, but apply the corridor and ensure correct stations for current direction
            handleApplyCorridor(corridor);
            return;
        }

        // Otherwise set systems to corridor's systems
        const oSys: EveSolarSystem = availableSystems.find(
            (s) =>
                (corridor.origin_system_id && s.id === Number(corridor.origin_system_id)) ||
                (corridor.origin_system && s.name.toLowerCase() === corridor.origin_system.toLowerCase())
        ) || {
            id: corridor.origin_system_id ? Number(corridor.origin_system_id) : 0,
            name: corridor.origin_system || 'Unknown',
            security: 0.0,
            securityClass: 'nullsec' as SecurityClass,
            region: 'Unknown',
            defaultStation: `${corridor.origin_system || 'Unknown'} - Upwell Citadel`,
        };

        const dSys: EveSolarSystem = availableSystems.find(
            (s) =>
                (corridor.destination_system_id && s.id === Number(corridor.destination_system_id)) ||
                (corridor.destination_system && s.name.toLowerCase() === corridor.destination_system.toLowerCase())
        ) || {
            id: corridor.destination_system_id ? Number(corridor.destination_system_id) : 0,
            name: corridor.destination_system || 'Unknown',
            security: 0.0,
            securityClass: 'nullsec' as SecurityClass,
            region: 'Unknown',
            defaultStation: `${corridor.destination_system || 'Unknown'} - Upwell Citadel`,
        };

        setOrigin(oSys);
        setDestination(dSys);
        setOriginStation(corridor.origin_station || oSys.defaultStation || `${oSys.name} - Upwell Citadel`);
        setDestinationStation(corridor.destination_station || dSys.defaultStation || `${dSys.name} - Upwell Citadel`);
        setSelectedCorridor(corridor);
    };

    const handleSwapRoute = () => {
        const prevOrigin = origin;
        const prevDest = destination;
        const prevOriginSt = originStation;
        const prevDestSt = destinationStation;

        setOrigin(prevDest);
        setDestination(prevOrigin);
        setOriginStation(prevDestSt);
        setDestinationStation(prevOriginSt);

        // Keep corridor active if it matches swapped systems (both directions are equal!)
        setSelectedCorridor((prev) => (doesCorridorMatch(prev, prevDest, prevOrigin) ? prev : null));
    };

    // Cargo & Rates State
    const [volumeM3, setVolumeM3] = useState(65000);
    const [collateralIsk, setCollateralIsk] = useState(1500000000); // 1.5B
    const [isRush, setIsRush] = useState(false);
    const [isCorpSubsidized, setIsCorpSubsidized] = useState(true);
    const [selectedShipId,] = useState('rhea');

    // Calculate quote dynamically
    const quote = useMemo(() => {
        return calculateTransportQuote({
        corridor: effectiveCorridor,
        origin,
        destination,
        volumeM3,
        collateralIsk,
        isRush,
        isCorpSubsidized,
        selectedShipId,
        });
    }, [effectiveCorridor, origin, destination, volumeM3, collateralIsk, isRush, isCorpSubsidized, selectedShipId]);

    const distanceLy = useMemo(() => calculateDistanceLy(origin, destination), [origin, destination]);
    const stargateJumps = useMemo(() => estimateStargateJumps(origin, destination), [origin, destination]);

    //const pendingCount = contracts.filter((c) => c.status === 'pending').length;
  return (
    <main className="mt-4 min-h-screen !text-slate-200 flex flex-col font-sans selection:!bg-cyan-500/30 selection:!text-cyan-200">
        <div className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
            {/* Top Route & Flight Corridor Selector */}
            <RouteSelector
                origin={origin}
                setOrigin={handleSelectOrigin}
                destination={destination}
                setDestination={handleSelectDestination}
                selectedCorridor={effectiveCorridor}
                setSelectedCorridor={handleSelectPresetCorridor}
                onSelectCorridor={handleSelectPresetCorridor}
                onSwapRoute={handleSwapRoute}
                originStation={originStation}
                setOriginStation={setOriginStation}
                destinationStation={destinationStation}
                setDestinationStation={setDestinationStation}
                distanceLy={distanceLy}
                stargateJumps={stargateJumps}
                serviceType={effectiveCorridor?.service_type || 'jump_freighter'}
                corridors={presets}
                quickSelectPresetIds={userData?.user.quick_select_presets}
                onOpenConfigurePresets={() => setShowConfigurePresetsModal(true)}
                systems={availableSystems}
            />

            {/* Dedicated Matched Corridor Status Component */}
            <MatchedCorridorIndicator
                selectedCorridor={effectiveCorridor}
                matchingCorridor={matchingCorridor}
                origin={origin}
                destination={destination}
                onApplyCorridor={handleApplyCorridor}
                onUseBaseRates={() => {
                    setSelectedCorridor(null);
                }}
            />

            {/* Two Column Layout: Cargo Inputs & Live Tariff Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-6">
                <CargoInput
                    volumeM3={volumeM3}
                    setVolumeM3={setVolumeM3}
                    collateralIsk={collateralIsk}
                    setCollateralIsk={setCollateralIsk}
                    isRush={isRush}
                    setIsRush={setIsRush}
                    isCorpSubsidized={isCorpSubsidized}
                    setIsCorpSubsidized={setIsCorpSubsidized}
                    selectedShipId={selectedShipId}
                    maxVolumeAllowed={effectiveCorridor?.max_volume || 360000}
                    maxCollateralAllowed={effectiveCorridor?.max_collateral || 15000000000}
                    corridor={effectiveCorridor}
                />
                </div>

                <div className="lg:col-span-6 space-y-6">
                <QuoteBreakdown
                    quote={quote}
                    onOpenContractModal={() => setShowContractModal(true)}
                />
                </div>
            </div>
            </div>
        </div>
        {/* Modals */}
        <ContractModal
            quote={quote}
            destinationStation={destinationStation}
            isOpen={showContractModal}
            onClose={() => setShowContractModal(false)}
        />
        <ConfigurePresetsModal
            isOpen={showConfigurePresetsModal}
            onClose={() => setShowConfigurePresetsModal(false)}
            corridors={presets}
            currentSelectedIds={userData?.user.quick_select_presets || []}
            onSave={(ids) => savePresetsMutation.mutate(ids)}
            isPending={savePresetsMutation.isPending}
        />
    </main>
  );
}