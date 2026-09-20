// React
import { useEffect, useMemo, useState } from 'react';

// Third Party
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { loadRoutePresets, loadRouteSystems, loadUserData, updateUserSettings } from '@/Api/ApiCalls';
import { queryKeys } from '@/Api/query';
import {
  CargoInput,
  QuoteBreakdown,
  RouteSelector,
  calculateDistanceLy,
  calculateTransportQuote,
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
            if (presets.length > 0) {
                const first = presets[0];
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedCorridor(first);
                const oSys: EveSolarSystem = availableSystems.find(
                    (s) =>
                        (first.origin_system_id && s.id === Number(first.origin_system_id)) ||
                        (first.origin_system && s.name.toLowerCase() === first.origin_system.toLowerCase())
                ) || availableSystems[0];
                const dSys: EveSolarSystem = availableSystems.find(
                    (s) =>
                        (first.destination_system_id && s.id === Number(first.destination_system_id)) ||
                        (first.destination_system && s.name.toLowerCase() === first.destination_system.toLowerCase())
                ) || availableSystems[1] || availableSystems[0];
                setOrigin(oSys);
                setDestination(dSys);
                setOriginStation(first.origin_station || oSys.defaultStation || `${oSys.name} - Upwell Citadel`);
                setDestinationStation(first.destination_station || dSys.defaultStation || `${dSys.name} - Upwell Citadel`);
                setHasInitialized(true);
            } else {
                setOrigin(availableSystems[0]);
                setDestination(availableSystems[1] || availableSystems[0]);
                setOriginStation(availableSystems[0].defaultStation || `${availableSystems[0].name} - Upwell Citadel`);
                setDestinationStation((availableSystems[1] || availableSystems[0]).defaultStation || `${(availableSystems[1] || availableSystems[0]).name} - Upwell Citadel`);
                setHasInitialized(true);
            }
        }
    }, [presets, hasInitialized, availableSystems]);

    // Cargo & Rates State
    const [volumeM3, setVolumeM3] = useState(65000);
    const [collateralIsk, setCollateralIsk] = useState(1500000000); // 1.5B
    const [isRush, setIsRush] = useState(false);
    const [isCorpSubsidized, setIsCorpSubsidized] = useState(true);
    const [selectedShipId,] = useState('rhea');

    // Calculate quote dynamically
    const quote = useMemo(() => {
        return calculateTransportQuote({
        corridor: selectedCorridor,
        origin,
        destination,
        volumeM3,
        collateralIsk,
        isRush,
        isCorpSubsidized,
        selectedShipId,
        });
    }, [selectedCorridor, origin, destination, volumeM3, collateralIsk, isRush, isCorpSubsidized, selectedShipId]);

    const distanceLy = useMemo(() => calculateDistanceLy(origin, destination), [origin, destination]);
    const stargateJumps = useMemo(() => estimateStargateJumps(origin, destination), [origin, destination]);

    //const pendingCount = contracts.filter((c) => c.status === 'pending').length;
  return (
    <div className="min-h-screen !text-slate-200 flex flex-col font-sans selection:!bg-cyan-500/30 selection:!text-cyan-200">
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
            {/* Top Route & Flight Corridor Selector */}
            <RouteSelector
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                selectedCorridor={selectedCorridor}
                setSelectedCorridor={setSelectedCorridor}
                originStation={originStation}
                setOriginStation={setOriginStation}
                destinationStation={destinationStation}
                setDestinationStation={setDestinationStation}
                distanceLy={distanceLy}
                stargateJumps={stargateJumps}
                serviceType={selectedCorridor?.service_type || 'jump_freighter'}
                corridors={presets}
                quickSelectPresetIds={userData?.user.quick_select_presets}
                onOpenConfigurePresets={() => setShowConfigurePresetsModal(true)}
                systems={availableSystems}
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
                    maxVolumeAllowed={selectedCorridor?.max_volume || 360000}
                    maxCollateralAllowed={selectedCorridor?.max_collateral || 15000000000}
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
        </main>
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
    </div>
  );
}