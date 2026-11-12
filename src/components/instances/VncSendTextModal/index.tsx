import { useEffect, useRef, useState, type RefObject } from "react";
import type RFB from "@novnc/novnc/lib/rfb";
import { Alert, Form, Input, Modal, Typography } from "@arco-design/web-react";
import { showMessage } from "@/lib/feedback";
import { validateForm } from "@/lib/form";
import { createVncTextKeys } from "./text-keys";

type VncSendTextModalProps = {
  rfbRef: RefObject<RFB | null>;
  onCancel: () => void;
};

type VncSendTextFormValues = {
  text: string;
};

const MODIFIER_KEYS = [
  [0xffe3, "ControlLeft"],
  [0xffe4, "ControlRight"],
  [0xffe1, "ShiftLeft"],
  [0xffe2, "ShiftRight"],
  [0xffe9, "AltLeft"],
  [0xffea, "AltRight"],
  [0xffeb, "MetaLeft"],
  [0xffec, "MetaRight"],
  [0xff7e, "AltLeft"],
] as const;

export default function VncSendTextModal({ rfbRef, onCancel }: VncSendTextModalProps) {
  const [form] = Form.useForm<VncSendTextFormValues>();
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sendingRef = useRef(false);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      clearTimeout(timerRef.current);
    };
  }, []);

  const stopAndClose = () => {
    clearTimeout(timerRef.current);
    sendingRef.current = false;
    onCancel();
  };

  const send = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    const session = rfbRef.current;
    let values: VncSendTextFormValues;
    try {
      values = await validateForm(form);
    } catch {
      sendingRef.current = false;
      return;
    }
    if (disposedRef.current || !sendingRef.current) return;

    try {
      const rfb = session;
      if (!rfb || rfbRef.current !== rfb) throw new Error("VNC 连接已断开，请重新打开后发送");
      const keys = createVncTextKeys(values.text);
      if (!keys.length) throw new Error("请输入要发送的文字");

      // 清除远端修饰键和 noVNC 内部按键状态，避免文字被当作快捷键。
      for (const [keysym, code] of MODIFIER_KEYS) rfb.sendKey(keysym, code, false);
      rfb.viewOnly = true;
      rfb.viewOnly = false;
      rfb.blur();
      setProgress({ sent: 0, total: keys.length });

      let sent = 0;
      const sendNext = () => {
        if (disposedRef.current || !sendingRef.current) return;
        if (rfbRef.current !== rfb) {
          stopAndClose();
          return;
        }
        try {
          const key = keys[sent];
          if (key.shift) rfb.sendKey(0xffe1, "ShiftLeft", true);
          try {
            rfb.sendKey(key.keysym, key.code);
          } finally {
            if (key.shift) rfb.sendKey(0xffe1, "ShiftLeft", false);
          }
          sent += 1;
          if (sent === keys.length) {
            stopAndClose();
            showMessage({ type: "success", content: "文字已发送" });
          } else {
            if (sent % 10 === 0) setProgress({ sent, total: keys.length });
            timerRef.current = setTimeout(sendNext, 10);
          }
        } catch (error) {
          sendingRef.current = false;
          setProgress(null);
          showMessage({ type: "error", content: { error, fallback: "发送文字中断" } });
        }
      };
      timerRef.current = setTimeout(sendNext, 0);
    } catch (error) {
      sendingRef.current = false;
      setProgress(null);
      showMessage({ type: "error", content: { error, fallback: "发送文字失败" } });
    }
  };

  return (
    <Modal
      visible
      title="发送文字"
      style={{ width: 600 }}
      okText={progress ? "发送中" : "发送"}
      cancelText={progress ? "停止发送" : "取消"}
      okButtonProps={{ disabled: Boolean(progress) }}
      onOk={send}
      onCancel={stopAndClose}
      maskClosable={false}
    >
      <Alert
        type="warning"
        showIcon
        content="文字会输入到远端当前光标位置。换行会按下回车，可能执行命令；制表符可能切换焦点。"
      />
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          field="text"
          label="发送内容"
          extra="最多 2000 字符，支持英文、数字、半角符号、换行和制表符。远端请使用美式英文键盘布局，并关闭大写锁定。"
          rules={[
            { required: true, message: "请输入要发送的文字" },
            {
              validator: (value: string | undefined, callback) => {
                try {
                  createVncTextKeys(value ?? "");
                  callback();
                } catch (error) {
                  callback(error instanceof Error ? error.message : "文字包含无法发送的字符");
                }
              },
            },
          ]}
        >
          <Input.TextArea
            autoFocus
            rows={8}
            disabled={Boolean(progress)}
            spellCheck={false}
            placeholder="输入或粘贴要发送到远端的文字"
          />
        </Form.Item>
      </Form>
      {progress ? (
        <Typography.Text type="secondary" aria-live="polite">
          已发送 {progress.sent}/{progress.total} 字符，停止发送不会撤回已输入的文字。
        </Typography.Text>
      ) : null}
    </Modal>
  );
}
