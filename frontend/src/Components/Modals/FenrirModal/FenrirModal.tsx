// React
import React from 'react';

// Third Party
import { Modal as BsModal } from 'react-bootstrap';
import type { ModalProps as BsModalProps } from 'react-bootstrap';

// Styles
import styles from '@/Components/Modals/FenrirModal/FenrirModal.module.css';

export interface FenrirModalProps extends BsModalProps {
  /** Optional convenience prop corresponding to show */
  isOpen?: boolean;
  /** Optional convenience prop corresponding to onHide */
  onClose?: () => void;
}

/**
 * Reusable dark-themed Modal built on top of react-bootstrap's Modal.
 * Styled with Fenrir aesthetics (dark background, cyan borders, and glowing accents).
 */
export function FenrirModal({
  isOpen,
  show,
  onClose,
  onHide,
  dialogClassName,
  contentClassName,
  centered = true,
  children,
  ...rest
}: FenrirModalProps) {
  const isShowing = show ?? isOpen ?? false;
  const handleHide = onHide ?? onClose ?? (() => {});

  return (
    <BsModal
      show={isShowing}
      onHide={handleHide}
      centered={centered}
      dialogClassName={`${styles.fenrirModalDialog} ${dialogClassName || ''}`}
      contentClassName={`${styles.fenrirModalContent} ${contentClassName || ''}`}
      restoreFocus={false}
      {...rest}
    >
      {children}
    </BsModal>
  );
}

function FenrirModalHeader({
  className,
  children,
  closeButton = true,
  ...rest
}: React.ComponentProps<typeof BsModal.Header>) {
  return (
    <BsModal.Header
      closeButton={closeButton}
      className={`${styles.fenrirModalHeader} ${className || ''}`}
      {...rest}
    >
      {children}
    </BsModal.Header>
  );
}

function FenrirModalTitle({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof BsModal.Title>) {
  return (
    <BsModal.Title className={`${styles.fenrirModalTitle} ${className || ''}`} {...rest}>
      {children}
    </BsModal.Title>
  );
}

function FenrirModalBody({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof BsModal.Body>) {
  return (
    <BsModal.Body className={`${styles.fenrirModalBody} ${className || ''}`} {...rest}>
      {children}
    </BsModal.Body>
  );
}

function FenrirModalFooter({
  className,
  children,
  ...rest
}: React.ComponentProps<typeof BsModal.Footer>) {
  return (
    <BsModal.Footer className={`${styles.fenrirModalFooter} ${className || ''}`} {...rest}>
      {children}
    </BsModal.Footer>
  );
}

FenrirModal.Header = FenrirModalHeader;
FenrirModal.Title = FenrirModalTitle;
FenrirModal.Body = FenrirModalBody;
FenrirModal.Footer = FenrirModalFooter;

