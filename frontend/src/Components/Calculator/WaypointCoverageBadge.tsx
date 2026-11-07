// Third Party
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Calculator/QuoteBreakdown.module.css';

import type { CynoCoverageCharacterSchema, CynoCoverageSystemSchema } from '@/Api/schema';
import { splitCoverageCharacters } from '@/Components/Calculator/calculator';
import { formatDate, formatRelativeTime } from '@/Utils/format';

interface WaypointCoverageBadgeProps {
  /** Name of the waypoint system */
  name: string;
  /** Route admin characters in this system, if any */
  coverage?: CynoCoverageSystemSchema;
}

/**
 * Badge of a waypoint in the transit routing chain.
 * Systems covered by a route admin character are highlighted and open a
 * popover with the characters located there.
 */
export function WaypointCoverageBadge({ name, coverage }: WaypointCoverageBadgeProps) {
  const { t } = useTranslation();

  if (!coverage) {
    return <span className={styles.waypointBadge}>{name}</span>;
  }

  const { own, others } = splitCoverageCharacters(coverage.characters);

  const renderList = (characters: CynoCoverageCharacterSchema[]) => (
    <ul className={styles.coverageList}>
      {characters.map((character) => (
        <li key={character.character_id} className={styles.coverageCharacter}>
          {character.portrait && (
            <img
              src={character.portrait}
              alt={character.character_name}
              className={styles.coveragePortrait}
              width={32}
              height={32}
            />
          )}
          <div className={styles.coverageDetails}>
            <span className={styles.coverageName}>{character.character_name}</span>
            <span className={styles.coverageMeta}>
              {character.location_name || coverage.system_name}
            </span>
            {(character.ship_type_name || character.ship_name) && (
              <span className={styles.coverageMeta}>
                {character.ship_type_name}
                {character.ship_name ? ` · ${character.ship_name}` : ''}
              </span>
            )}
            <span
              className={styles.coverageUpdated}
              title={character.last_update ? formatDate(character.last_update) : undefined}
            >
              {t('Updated:')}{' '}
              {character.last_update ? formatRelativeTime(character.last_update) : t('Unknown')}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );

  const popover = (
    <Popover id={`waypoint-coverage-${coverage.system_id}`} className={styles.coveragePopover}>
      <Popover.Header as="div" className={styles.coveragePopoverHeader}>
        {t('Characters in {{system}}', { system: coverage.system_name })}
      </Popover.Header>
      <Popover.Body className={styles.coveragePopoverBody}>
        {others.length === 0 ? (
          renderList(own)
        ) : (
          <>
            {own.length > 0 && (
              <section className={styles.coverageSection}>
                <div className={styles.coverageSectionTitle}>{t('Your characters')}</div>
                {renderList(own)}
              </section>
            )}
            <section className={styles.coverageSection}>
              <div className={styles.coverageSectionTitle}>{t('Other route admins')}</div>
              {renderList(others)}
            </section>
          </>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="top" overlay={popover} rootClose>
      <button
        type="button"
        className={`${styles.waypointBadge} ${styles.waypointBadgeCovered} bg-success`}
        title={t('Show characters in this system')}
      >
        {name}
      </button>
    </OverlayTrigger>
  );
}
