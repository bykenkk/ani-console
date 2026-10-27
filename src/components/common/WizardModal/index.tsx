import { Modal } from "@arco-design/web-react";
import type { ReactNode, Ref } from "react";
import WizardSteps from "../WizardSteps";
import styles from "./index.module.css";

type WizardModalProps = {
  title: string;
  current: number;
  steps: readonly string[];
  busy?: boolean;
  onCancel: () => void;
  onStepChange?: (step: number) => void;
  scrollRef?: Ref<HTMLDivElement>;
  footer: ReactNode;
  children: ReactNode;
};

export default function WizardModal({
  title,
  current,
  steps,
  busy = false,
  onCancel,
  onStepChange,
  scrollRef,
  footer,
  children,
}: WizardModalProps) {
  return (
    <Modal
      visible
      title={title}
      style={{ width: 720, maxWidth: "calc(100vw - 48px)" }}
      className={styles.modal}
      closable={!busy}
      escToExit={!busy}
      onCancel={onCancel}
      footer={footer}
    >
      <div className="shrink-0 px-4 pb-5">
        <WizardSteps
          current={current}
          items={steps}
          className={styles.steps}
          onChange={onStepChange}
        />
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {children}
      </div>
    </Modal>
  );
}
