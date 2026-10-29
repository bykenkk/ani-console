import { Empty, Spin } from "@arco-design/web-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

type LogViewerProps = {
  text: string;
  loading: boolean;
  emptyDescription: string;
  ariaLabel: string;
  className?: string;
};

const AUTO_SCROLL_THRESHOLD_PX = 24;

export default function LogViewer({
  text,
  loading,
  emptyDescription,
  ariaLabel,
  className,
}: LogViewerProps) {
  const outputRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    if (!text) shouldAutoScrollRef.current = true;
    const output = outputRef.current;
    if (output && shouldAutoScrollRef.current) output.scrollTop = output.scrollHeight;
  }, [text]);

  const handleScroll = () => {
    const output = outputRef.current;
    if (output)
      shouldAutoScrollRef.current =
        output.scrollHeight - output.scrollTop - output.clientHeight <= AUTO_SCROLL_THRESHOLD_PX;
  };

  return (
    <div
      ref={outputRef}
      role="region"
      aria-label={ariaLabel}
      aria-busy={loading}
      tabIndex={0}
      className={clsx(
        "min-h-0 min-w-0 overflow-auto rounded border border-app-border-strong bg-(--color-menu-dark-bg) text-(--color-white) [&_.arco-empty-description]:text-(--color-white) [&_.arco-empty-icon]:text-(--color-white)",
        className,
      )}
      onScroll={handleScroll}
    >
      {!text ? (
        <div className="flex h-full min-h-32 items-center justify-center">
          {loading ? <Spin /> : <Empty description={emptyDescription} />}
        </div>
      ) : (
        <pre className="m-0 whitespace-pre-wrap wrap-break-word p-3 font-mono text-xs leading-5">
          {text}
        </pre>
      )}
    </div>
  );
}
