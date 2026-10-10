import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Modal, Radio, Space, Steps } from "@arco-design/web-react";
import { useState } from "react";
import {
  createNetworkLoadBalancer,
  type CreateNetworkLoadBalancerInput,
  type NetworkLoadBalancer,
} from "@/api/network";
import LoadBalancerListenersField from "@/components/network/LoadBalancerListenersField";
import LoadBalancerNetworkFields from "@/components/network/LoadBalancerNetworkFields";
import LoadBalancerCreateSummary from "@/components/network/LoadBalancerCreateSummary";
import { validateForm } from "@/lib/form";

import type { LoadBalancerListenerValues } from "@/components/network/LoadBalancerListenerForm";
import { showMessage } from "@/lib/feedback";

type BasicValues = { name: string; description?: string };
export type LoadBalancerConfigurationValues = {
  vpc_id: string;
  subnet_id?: string;
  scheme: "internal" | "public" | "both";
  size: "small" | "medium" | "large";
  vip: string;
  publicIp?: string;
  listeners: LoadBalancerListenerValues[];
};

export default function CreateLoadBalancerModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated?: (item: NetworkLoadBalancer) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState<{
    basic: BasicValues;
    configuration: LoadBalancerConfigurationValues;
  }>();
  const [basicForm] = Form.useForm<BasicValues>();
  const [configurationForm] = Form.useForm<LoadBalancerConfigurationValues>();
  const create = useMutation({
    meta: { feedback: { channel: "message", action: "创建", errorFallback: "请求失败" } },
    mutationFn: (input: CreateNetworkLoadBalancerInput) => createNetworkLoadBalancer(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["network-load-balancers"] });
      onCreated?.(data);
      onCancel();
    },
  });
  return (
    <>
      <Modal
        visible
        title="创建负载均衡"
        autoFocus={false}
        style={{ width: 720 }}
        onCancel={onCancel}
        maskClosable={!create.isPending}
        closable={!create.isPending}
        cancelButtonProps={{ disabled: create.isPending }}
        okText={step < 3 ? "下一步" : "创建"}
        confirmLoading={create.isPending}
        okButtonProps={{ disabled: step === 3 }}
        onOk={async () => {
          if (step === 3) return; // Creation awaits the agreed listener, flavor and IP contracts.
          const basic = await validateForm<BasicValues>(basicForm);
          if (step === 1) {
            setStep(2);
            return;
          }
          const configuration =
            await validateForm<LoadBalancerConfigurationValues>(configurationForm);
          if (step === 2) {
            setSummary({ basic, configuration });
            setStep(3);
            return;
          }
          const listeners = configuration.listeners.flatMap(({ protocol, port, target_port }) =>
            protocol === "http" || protocol === "https" || protocol === "tcp"
              ? [{ protocol, port, target_port }]
              : [],
          );
          if (listeners.length !== configuration.listeners.length) {
            showMessage({
              type: "error",
              content: "UDP 和 SSL 监听器暂不支持提交，请移除后再创建",
            });
            return;
          }
          // TODO: 后端契约确认后接入 description、size、vip 及双网络类型。当前只提交已支持字段。
          await create.mutateAsync({
            name: basic.name.trim(),
            vpc_id: configuration.vpc_id,
            subnet_id: configuration.subnet_id,
            scheme: configuration.scheme === "both" ? undefined : configuration.scheme,
            listeners,
          });
        }}
        footer={(cancelButton, okButton) => (
          <Space>
            {cancelButton}
            {step > 1 && (
              <Button disabled={create.isPending} onClick={() => setStep((current) => current - 1)}>
                上一步
              </Button>
            )}
            {okButton}
          </Space>
        )}
      >
        <div className="flex flex-col" style={{ height: "min(560px, calc(100vh - 240px))" }}>
          <Alert
            type="info"
            content="创建暂未开放，监听器、规格与可用 IP 配置正在完善。"
            style={{ marginBottom: 16 }}
          />
          <Steps current={step} size="small" className="shrink-0" style={{ marginBottom: 28 }}>
            <Steps.Step title="基本信息" />
            <Steps.Step title="配置信息" />
            <Steps.Step title="摘要信息" />
          </Steps>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div hidden={step !== 1}>
              <Form form={basicForm} layout="vertical" disabled={create.isPending}>
                <Form.Item
                  label="名称"
                  field="name"
                  rules={[
                    { required: true, message: "请输入负载均衡名称" },
                    {
                      validator: (value, callback) => {
                        if (!value?.trim()) callback("请输入负载均衡名称");
                      },
                    },
                  ]}
                >
                  <Input placeholder="请输入负载均衡名称" maxLength={64} showWordLimit />
                </Form.Item>
                <Form.Item label="描述" field="description">
                  <Input.TextArea placeholder="请输入描述" autoSize={{ minRows: 3, maxRows: 5 }} />
                </Form.Item>
              </Form>
            </div>
            <div hidden={step !== 2}>
              <Form
                form={configurationForm}
                layout="vertical"
                initialValues={{ scheme: "internal", size: "small", listeners: [] }}
                disabled={create.isPending}
              >
                <Form.Item
                  label="规格"
                  field="size"
                  rules={[{ required: true, message: "请选择规格" }]}
                >
                  <Radio.Group
                    type="button"
                    options={[
                      { label: "小型", value: "small" },
                      { label: "中型", value: "medium" },
                      { label: "大型", value: "large" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label="网络类型"
                  field="scheme"
                  rules={[{ required: true, message: "请选择网络类型" }]}
                >
                  <Radio.Group
                    type="button"
                    options={[
                      { label: "公网", value: "public" },
                      { label: "私网", value: "internal" },
                      { label: "公网+私网", value: "both" },
                    ]}
                  />
                </Form.Item>
                <LoadBalancerNetworkFields form={configurationForm} />
                <Form.Item
                  label="监听器"
                  field="listeners"
                  rules={[
                    {
                      required: true,
                      type: "array",
                      minLength: 1,
                      message: "请至少添加一个监听器",
                    },
                  ]}
                >
                  <LoadBalancerListenersField disabled={create.isPending} />
                </Form.Item>
              </Form>
            </div>
            {step === 3 && summary && (
              <LoadBalancerCreateSummary
                basic={summary.basic}
                configuration={summary.configuration}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
