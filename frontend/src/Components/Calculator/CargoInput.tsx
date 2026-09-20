// React
import { useState } from 'react';

// Third Party
import { Box, Check, Clipboard, Coins, Package, Users, Zap } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Calculator/CargoInput.module.css';

import { formatIskCompact, formatM3 } from '@/Components/Calculator/calculator';
import { parseEveClipboard } from '@/Components/Fenrir/cargoParser';
import { JUMP_FREIGHTERS, POPULAR_CARGO_PRESETS } from '@/Components/Fenrir/eveData';
import { FenrirModal } from '@/Components/Modals';
import type { CargoAppraisalItem, FreightCorridor, JumpFreighterShip } from '@/types';

interface CargoInputProps {
  volumeM3: number;
  setVolumeM3: (vol: number) => void;
  collateralIsk: number;
  setCollateralIsk: (col: number) => void;
  isRush: boolean;
  setIsRush: (val: boolean) => void;
  isCorpSubsidized: boolean;
  setIsCorpSubsidized: (val: boolean) => void;
  selectedShipId: string;
  maxVolumeAllowed: number;
  maxCollateralAllowed?: number;
  corridor?: FreightCorridor | null;
}

export function CargoInput({
  volumeM3,
  setVolumeM3,
  collateralIsk,
  setCollateralIsk,
  isRush,
  setIsRush,
  isCorpSubsidized,
  setIsCorpSubsidized,
  selectedShipId,
  maxVolumeAllowed,
  maxCollateralAllowed,
  corridor,
}: CargoInputProps) {
  const { t } = useTranslation();
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [appraisedItems, setAppraisedItems] = useState<CargoAppraisalItem[]>([]);
  const [appraisedVol, setAppraisedVol] = useState(0);
  const [appraisedVal, setAppraisedVal] = useState(0);
  const [appliedCopied, setAppliedCopied] = useState(false);

  const selectedShip: JumpFreighterShip =
    JUMP_FREIGHTERS.find((s) => s.id === selectedShipId) || JUMP_FREIGHTERS[0];

  const hasCorridor = Boolean(corridor && corridor.max_volume && corridor.max_volume > 0);
  const effectiveCapacity = hasCorridor ? corridor!.max_volume : selectedShip.capacityM3;
  const capacityName = hasCorridor ? corridor!.name : selectedShip.name;
  const rawPercent = Math.round((volumeM3 / effectiveCapacity) * 100);
  const isOverload = volumeM3 > effectiveCapacity;
  const barFillPercent = Math.min(100, rawPercent);

  const handleParseText = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setAppraisedItems([]);
      setAppraisedVol(0);
      setAppraisedVal(0);
      return;
    }
    const result = parseEveClipboard(text);
    setAppraisedItems(result.items);
    setAppraisedVol(result.totalVolume);
    setAppraisedVal(result.totalEstimatedValue);
  };

  const applyAppraisal = () => {
    if (appraisedVol > 0) setVolumeM3(appraisedVol);
    if (appraisedVal > 0) setCollateralIsk(appraisedVal);
    setAppliedCopied(true);
    setTimeout(() => {
      setAppliedCopied(false);
      setShowClipboardModal(false);
    }, 900);
  };

  return (
    <div className={`${styles.container} fenrir-gradient fenrir-border-700`}>
      <div className={styles.header}>
        {/* Decorative gradient corner */}
        <div className={styles.cornerGradient} />

        <div className={styles.titleGroup}>
          <Package className={styles.titleIcon} />
          <h2 className={styles.titleHeading}>
            {t('CARGO SPECS & COLLATERAL')}
          </h2>
        </div>

        {/* EVE Clipboard Appraiser Trigger */}
        <Button
          id="open-clipboard-appraiser"
          onClick={() => setShowClipboardModal(true)}
          className={styles.pasteBtn}
        >
          <Clipboard className={styles.pasteBtnIcon} />
          <span>{t('Paste EVE Inventory')}</span>
        </Button>
      </div>

      {/* Cargo Presets Bar */}
      <div className={styles.presetsBar}>
        <Form.Label className={styles.presetsLabel}>
          <Box className={styles.presetsIcon} />
          {t('Quick Load Presets:')}
        </Form.Label>
        <div className={styles.presetsGrid}>
          {POPULAR_CARGO_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              onClick={() => {
                setVolumeM3(preset.volume);
                setCollateralIsk(preset.value);
              }}
              className={styles.presetBtn}
              title={t(preset.desc)}
            >
              <div className={styles.presetBtnLabel}>
                {t(preset.label)}
              </div>
              <div className={styles.presetBtnStats}>
                <span>{formatM3(preset.volume)}</span>
                <span>{formatIskCompact(preset.value)}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Inputs: Volume & Collateral */}
      <div className={styles.inputsGrid}>
        {/* Volume Input */}
        <div className={styles.inputCard}>
          <div className={styles.inputCardHeader}>
            <Form.Label className={styles.inputCardLabel}>
              <span>{t('Cargo Volume (m³)')}</span>
            </Form.Label>
            <span className={styles.valueDisplayCyan}>
              {volumeM3.toLocaleString()} m³
            </span>
          </div>

          <div className={styles.inputWrapper}>
            <Form.Control
              type="number"
              id="cargo-volume-input"
              value={volumeM3 || ''}
              onChange={(e) => setVolumeM3(Math.max(0, Number(e.target.value)))}
              className={styles.volumeInput}
              placeholder={t('e.g. 50000')}
              step="1000"
              min="0"
              max={maxVolumeAllowed}
            />
            <span className={styles.inputSuffix}>m³</span>
          </div>

          {/* Volume capacity meter vs Selected Ship / Preset Corridor */}
          <div className={styles.capacityContainer}>
            <div className={styles.capacityHeader}>
              <span>{t('Hold Load ({{name}}):', { name: capacityName })}</span>
              <span className={isOverload ? styles.capacityOverload : styles.capacityNormal}>
                {t('{{percent}}% of {{capacity}}', {
                  percent: rawPercent,
                  capacity: formatM3(effectiveCapacity),
                })}
              </span>
            </div>
            <div className={styles.capacityTrack}>
              <div
                className={`${styles.capacityFill} ${
                  isOverload
                    ? styles.capacityFillDanger
                    : rawPercent > 85
                    ? styles.capacityFillWarning
                    : styles.capacityFillNormal
                }`}
                style={{ width: `${barFillPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Collateral Input */}
        <div className={styles.inputCard}>
          <div className={styles.inputCardHeader}>
            <Form.Label className={styles.inputCardLabel}>
              <Coins className={styles.collateralIcon} />
              <span>{t('Collateral Valuation (ISK)')}</span>
            </Form.Label>
            <span className={styles.valueDisplayAmber}>
              {formatIskCompact(collateralIsk)}
            </span>
          </div>

          <div className={styles.inputWrapper}>
            <Form.Control
              type="number"
              id="cargo-collateral-input"
              value={collateralIsk || ''}
              onChange={(e) => setCollateralIsk(Math.max(0, Number(e.target.value)))}
              className={styles.collateralInput}
              placeholder={t('e.g. 2000000000')}
              step="50000000"
              min="0"
              max={maxCollateralAllowed}
            />
            <span className={styles.inputSuffix}>ISK</span>
          </div>
          {maxCollateralAllowed !== undefined && collateralIsk > maxCollateralAllowed && (
            <div className={styles.errorText}>
              {t('Exceeds max allowed collateral of {{max}}', { max: formatIskCompact(maxCollateralAllowed) })}
            </div>
          )}

          {/* Quick Increment Buttons */}
          <div className={styles.quickIncrementContainer}>
            {[250000000, 500000000, 1000000000, 3000000000, 5000000000].map((val) => (
              <Button
                key={val}
                type="button"
                onClick={() => setCollateralIsk(val)}
                className={styles.quickIncrementBtn}
              >
                {formatIskCompact(val).replace(' ISK', '')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Surcharges, Member Perks & Hull Class */}
      <div className={styles.surchargesRow}>
        {/* Rush Priority Toggle */}
        <div className={styles.perkCard}>
          <div className={styles.perkInfo}>
            <div className={`${styles.perkIconBox} ${isRush ? styles.perkIconAmberActive : styles.perkIconInactive}`}>
              <Zap className={styles.perkIcon} />
            </div>
            <div>
              <div className={styles.perkTitle}>{t('RUSH Priority')}</div>
              <div className={styles.perkSubtitle}>{t('<6h guaranteed dispatch (+35%)')}</div>
            </div>
          </div>
          <Form.Check
            id="rush-priority-toggle"
            checked={isRush}
            onChange={(e) => setIsRush(e.target.checked)}
            className={styles.checkAmber}
          />
        </div>

        {/* Corp Subsidy / Alliance Member */}
        <div className={styles.perkCard}>
          <div className={styles.perkInfo}>
            <div className={`${styles.perkIconBox} ${isCorpSubsidized ? styles.perkIconEmeraldActive : styles.perkIconInactive}`}>
              <Users className={styles.perkIcon} />
            </div>
            <div>
              <div className={styles.perkTitle}>{t('Alliance Subsidy')}</div>
              <div className={styles.perkSubtitle}>{t('Auth role discount (-12%)')}</div>
            </div>
          </div>
          <Form.Check
            id="corp-subsidy-toggle"
            checked={isCorpSubsidized}
            onChange={(e) => setIsCorpSubsidized(e.target.checked)}
            className={styles.checkEmerald}
          />
        </div>
      </div>

      {/* Clipboard Inventory Appraisal Modal */}
      <FenrirModal
        isOpen={showClipboardModal}
        onClose={() => setShowClipboardModal(false)}
        size="lg"
      >
        <FenrirModal.Header>
          <div className={styles.modalHeaderTitleGroup}>
            <Clipboard className={styles.modalHeaderIcon} />
            <FenrirModal.Title>{t('EVE INVENTORY CLIPBOARD APPRAISER')}</FenrirModal.Title>
          </div>
        </FenrirModal.Header>

        <FenrirModal.Body>
          <div className={styles.modalBodyContainer}>
            <p className={styles.modalDescription}>
              {t('In the EVE Online client, select items in your hangar or cargo hold, press Ctrl+C, and paste here. Our parser calculates volume and estimated market collateral automatically.')}
            </p>

            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => handleParseText(e.target.value)}
              placeholder={t('Paste EVE clipboard text here (e.g. Megathron 1 Battleship 50,000 m3 450,000,000 ISK or 50000 Helium Isotopes)...')}
              className={styles.modalTextarea}
            />

            {/* Appraisal summary preview */}
            <div className={styles.appraisalSummary}>
              <div>
                <span className={styles.summaryItemLabel}>{t('Items Detected:')}</span>{' '}
                <span className={styles.summaryValueWhite}>{t('{{count}} items', { count: appraisedItems.length })}</span>
              </div>
              <div>
                <span className={styles.summaryItemLabel}>{t('Total Volume:')}</span>{' '}
                <span className={styles.summaryValueCyan}>{formatM3(appraisedVol)}</span>
              </div>
              <div>
                <span className={styles.summaryItemLabel}>{t('Estimated Collateral:')}</span>{' '}
                <span className={styles.summaryValueAmber}>{formatIskCompact(appraisedVal)}</span>
              </div>
            </div>

            {/* Preview items table */}
            {appraisedItems.length > 0 && (
              <div className={styles.previewTableContainer}>
                {appraisedItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className={styles.previewItemRow}>
                    <span className={styles.previewItemName}>
                      {item.name} × {item.quantity.toLocaleString()}
                    </span>
                    <div className={styles.previewItemStats}>
                      <span className={styles.previewItemVolume}>{formatM3(item.totalVolume)}</span>
                      <span className={styles.previewItemValue}>{formatIskCompact(item.totalValue)}</span>
                    </div>
                  </div>
                ))}
                {appraisedItems.length > 10 && (
                  <div className={styles.previewTableMore}>
                    {t('...and {{count}} more items', { count: appraisedItems.length - 10 })}
                  </div>
                )}
              </div>
            )}
          </div>
        </FenrirModal.Body>

        <FenrirModal.Footer>
          <div className={styles.modalFooterActions}>
            <Button
              variant="outline-secondary"
              onClick={() => setShowClipboardModal(false)}
              className={styles.modalCancelBtn}
            >
              {t('Cancel')}
            </Button>
            <Button
              id="apply-appraisal-btn"
              onClick={applyAppraisal}
              disabled={appraisedItems.length === 0}
              className={styles.modalApplyBtn}
            >
              {appliedCopied ? (
                <>
                  <Check className={styles.modalBtnIcon} />
                  <span>{t('Applied to Calculator!')}</span>
                </>
              ) : (
                <>
                  <Clipboard className={styles.modalBtnIcon} />
                  <span>{t('Apply to Calculator')}</span>
                </>
              )}
            </Button>
          </div>
        </FenrirModal.Footer>
      </FenrirModal>
    </div>
  );
}
