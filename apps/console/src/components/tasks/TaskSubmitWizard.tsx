'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
  Card,
  FormField,
  Modal,
  Skeleton,
  AlertBanner,
  JsonViewer,
  useToast,
} from '@solar/ui';
import type { Skill, Resource, TaskSubmitRequest } from '@solar/api';
import { useSolar } from '../useSolar';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  FileText,
  Zap,
  Database,
  Settings,
  CheckCircle,
  Copy,
  Code,
  X,
  Plus,
} from 'lucide-react';

const STEPS = ['Prompt', 'Skills', 'Resources', 'Options', 'Review'] as const;

const taskSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  skills: z.array(z.object({
    skill_id: z.string(),
    version: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
  })).min(1, 'Select at least one skill'),
  resources: z.array(z.object({
    resource_id: z.string(),
    type: z.string(),
    access: z.enum(['read', 'write', 'read_write']),
  })),
  mode: z.enum(['sync', 'async_poll', 'async_webhook']).default('async_poll'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  max_latency_ms: z.number().min(1000).max(300000).default(30000),
  deadline: z.string().optional(),
  idempotency_key: z.string().min(1),
  tags: z.array(z.object({ key: z.string(), value: z.string() })),
});

type TaskFormData = z.infer<typeof taskSchema>;

function generateIdempotencyKey(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function TaskSubmitWizard() {
  const [step, setStep] = useState(0);
  const [codeMode, setCodeMode] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const solar = useSolar();
  const { addToast } = useToast();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      prompt: '',
      skills: [],
      resources: [],
      mode: 'async_poll',
      priority: 'normal',
      max_latency_ms: 30000,
      idempotency_key: generateIdempotencyKey(),
      tags: [],
    },
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags',
  });

  const { data: skillsList, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => solar.sun.skills.list(),
  });

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => solar.sun.resources.list({ page: 1 }),
  });

  const submitMutation = useMutation({
    mutationFn: (data: TaskSubmitRequest) => solar.venus.tasks.submit(data),
    onSuccess: (task) => {
      addToast({ type: 'success', title: 'Task submitted', description: `Task ${task.task_id.substring(0, 12)}… created successfully.` });
      window.location.href = `/tasks/active`;
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Submission failed', description: err.message });
    },
  });

  const canAdvance = useCallback(() => {
    const values = form.getValues();
    switch (step) {
      case 0: return values.prompt.length >= 10;
      case 1: return values.skills.length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }, [step, form]);

  const handleSubmit = () => {
    const values = form.getValues();
    const request: TaskSubmitRequest = {
      idempotency_key: values.idempotency_key,
      prompt: values.prompt,
      skills: values.skills,
      resources: values.resources.length > 0 ? values.resources : undefined,
      mode: values.mode,
      sla: {
        priority: values.priority,
        max_latency_ms: values.max_latency_ms,
        deadline: values.deadline || undefined,
      },
      tags: values.tags.reduce((acc, t) => ({ ...acc, [t.key]: t.value }), {} as Record<string, string>),
    };
    submitMutation.mutate(request);
  };

  const stepIcons = [
    <FileText size={16} key="p" />,
    <Zap size={16} key="s" />,
    <Database size={16} key="r" />,
    <Settings size={16} key="o" />,
    <CheckCircle size={16} key="c" />,
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader
        title="Submit New Task"
        description="Configure and submit an AI agent task in 5 steps."
      />

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', marginTop: '1.5rem' }}>
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => i < step && setStep(i)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 0.5rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: i <= step ? 'pointer' : 'default',
              background: i === step ? 'var(--color-solar-accent)' : i < step ? 'var(--color-solar-success)' : 'var(--color-solar-card)',
              color: i <= step ? '#fff' : 'var(--color-solar-text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {stepIcons[i]}
            <span style={{ display: 'inline-block' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <StepPrompt form={form} codeMode={codeMode} setCodeMode={setCodeMode} />}
          {step === 1 && <StepSkills form={form} skills={skillsList ?? []} loading={skillsLoading} />}
          {step === 2 && <StepResources form={form} resources={resourcesData?.items ?? []} loading={resourcesLoading} />}
          {step === 3 && <StepOptions form={form} tagFields={tagFields} appendTag={appendTag} removeTag={removeTag} />}
          {step === 4 && <StepReview form={form} showJson={showJsonPreview} setShowJson={setShowJsonPreview} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-solar-border)' }}>
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft size={16} /> Back
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit Task'} <Send size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Prompt ──────────────────────────────────────────────────────────

function StepPrompt({ form, codeMode, setCodeMode }: { form: any; codeMode: boolean; setCodeMode: (v: boolean) => void }) {
  const prompt = form.watch('prompt');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
          Task Prompt
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setCodeMode(!codeMode)}>
          <Code size={14} /> {codeMode ? 'Rich Text' : 'Code Mode'}
        </Button>
      </div>
      <Controller
        name="prompt"
        control={form.control}
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Describe what you want the AI agent to accomplish. Be specific about inputs, expected outputs, and any constraints..."
            rows={codeMode ? 16 : 8}
            style={{
              fontFamily: codeMode ? 'var(--font-mono)' : 'inherit',
              fontSize: codeMode ? '0.8rem' : '0.875rem',
              background: 'var(--color-solar-card)',
              border: '1px solid var(--color-solar-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              color: 'var(--color-solar-text-primary)',
              resize: 'vertical',
              width: '100%',
            }}
          />
        )}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: prompt.length < 10 ? 'var(--color-solar-error)' : 'var(--color-solar-text-secondary)' }}>
          {prompt.length} characters {prompt.length < 10 && '(minimum 10)'}
        </span>
        {form.formState.errors.prompt && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-error)' }}>
            {form.formState.errors.prompt.message}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Skills ──────────────────────────────────────────────────────────

function StepSkills({ form, skills, loading }: { form: any; skills: Skill[]; loading: boolean }) {
  const selectedSkills: { skill_id: string }[] = form.watch('skills');

  const toggleSkill = (skill: Skill) => {
    const current = form.getValues('skills');
    const exists = current.find((s: any) => s.skill_id === skill.skill_id);
    if (exists) {
      form.setValue('skills', current.filter((s: any) => s.skill_id !== skill.skill_id));
    } else {
      form.setValue('skills', [...current, { skill_id: skill.skill_id, version: skill.version, parameters: {} }]);
    }
  };

  if (loading) return <Skeleton lines={6} height="60px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
        Select Skills
      </h3>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-solar-text-secondary)' }}>
        Choose one or more skills the agent should use for this task. Selected: {selectedSkills.length}
      </p>
      {skills.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-md)' }}>
          No skills available. Skills will be auto-populated when agents register with Sun.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {skills.map((skill) => {
            const isSelected = selectedSkills.some((s) => s.skill_id === skill.skill_id);
            return (
              <button
                key={skill.skill_id}
                type="button"
                onClick={() => toggleSkill(skill)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isSelected ? 'var(--color-solar-accent)' : 'var(--color-solar-border)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--color-solar-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>
                    {skill.display_name}
                  </span>
                  {isSelected && <CheckCircle size={16} style={{ color: 'var(--color-solar-accent)' }} />}
                </div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', lineHeight: 1.4 }}>
                  {skill.description}
                </p>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {skill.compatible_tiers.map((tier) => (
                    <Badge key={tier} variant="default">{tier}</Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Resources ───────────────────────────────────────────────────────

function StepResources({ form, resources, loading }: { form: any; resources: Resource[]; loading: boolean }) {
  const selectedResources: { resource_id: string; access: string }[] = form.watch('resources');

  const toggleResource = (resource: Resource) => {
    const current = form.getValues('resources');
    const exists = current.find((r: any) => r.resource_id === resource.resource_id);
    if (exists) {
      form.setValue('resources', current.filter((r: any) => r.resource_id !== resource.resource_id));
    } else {
      form.setValue('resources', [...current, { resource_id: resource.resource_id, type: resource.type, access: 'read' }]);
    }
  };

  const setAccess = (resourceId: string, access: string) => {
    const current = form.getValues('resources');
    form.setValue('resources', current.map((r: any) => r.resource_id === resourceId ? { ...r, access } : r));
  };

  if (loading) return <Skeleton lines={4} height="50px" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
        Attach Resources <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--color-solar-text-secondary)' }}>(optional)</span>
      </h3>
      {resources.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-md)' }}>
          No resources registered. You can register resources in the Resources page.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {resources.map((resource) => {
            const isSelected = selectedResources.some((r) => r.resource_id === resource.resource_id);
            const selectedItem = selectedResources.find((r) => r.resource_id === resource.resource_id);
            return (
              <div
                key={resource.resource_id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isSelected ? 'var(--color-solar-accent)' : 'var(--color-solar-border)'}`,
                  background: 'var(--color-solar-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleResource(resource)}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>
                      {resource.display_name}
                    </span>
                    <Badge variant="default">{resource.type}</Badge>
                    <Badge variant={resource.health === 'healthy' ? 'success' : resource.health === 'degraded' ? 'warning' : 'error'}>
                      {resource.health}
                    </Badge>
                    <Badge variant="default">{resource.sensitivity}</Badge>
                  </div>
                </div>
                {isSelected && (
                  <Select
                    value={selectedItem?.access ?? 'read'}
                    onChange={(e) => setAccess(resource.resource_id, e.target.value)}
                    style={{ width: '130px', fontSize: '0.75rem' }}
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="read_write">Read & Write</option>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Options ─────────────────────────────────────────────────────────

function StepOptions({ form, tagFields, appendTag, removeTag }: { form: any; tagFields: any[]; appendTag: any; removeTag: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
        Task Options
      </h3>

      {/* SLA Settings */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>SLA Settings</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Priority">
            <Controller
              name="priority"
              control={form.control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </Select>
              )}
            />
          </FormField>
          <FormField label="Execution Mode">
            <Controller
              name="mode"
              control={form.control}
              render={({ field }) => (
                <Select {...field}>
                  <option value="async_poll">Async Poll (recommended)</option>
                  <option value="sync">Synchronous</option>
                  <option value="async_webhook">Async Webhook</option>
                </Select>
              )}
            />
          </FormField>
        </div>
        <FormField label={`Max Latency: ${(form.watch('max_latency_ms') / 1000).toFixed(0)}s`}>
          <Controller
            name="max_latency_ms"
            control={form.control}
            render={({ field }) => (
              <input
                type="range"
                min={1000}
                max={300000}
                step={1000}
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-solar-accent)' }}
              />
            )}
          />
        </FormField>
        <FormField label="Deadline (optional)">
          <Controller
            name="deadline"
            control={form.control}
            render={({ field }) => (
              <Input type="datetime-local" {...field} value={field.value ?? ''} />
            )}
          />
        </FormField>
      </div>

      {/* Tags */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>Tags</p>
          <Button variant="ghost" size="sm" onClick={() => appendTag({ key: '', value: '' })}>
            <Plus size={14} /> Add Tag
          </Button>
        </div>
        {tagFields.map((field: any, index: number) => (
          <div key={field.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Controller
              name={`tags.${index}.key`}
              control={form.control}
              render={({ field }) => <Input placeholder="Key" {...field} style={{ flex: 1 }} />}
            />
            <Controller
              name={`tags.${index}.value`}
              control={form.control}
              render={({ field }) => <Input placeholder="Value" {...field} style={{ flex: 1 }} />}
            />
            <Button variant="ghost" size="sm" onClick={() => removeTag(index)}>
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>

      {/* Idempotency Key */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <FormField label="Idempotency Key">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Controller
              name="idempotency_key"
              control={form.control}
              render={({ field }) => <Input {...field} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />}
            />
            <Button variant="ghost" size="sm" onClick={() => form.setValue('idempotency_key', generateIdempotencyKey())}>
              Regenerate
            </Button>
          </div>
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 5: Review ──────────────────────────────────────────────────────────

function StepReview({ form, showJson, setShowJson }: { form: any; showJson: boolean; setShowJson: (v: boolean) => void }) {
  const values = form.getValues();
  const envelope: TaskSubmitRequest = {
    idempotency_key: values.idempotency_key,
    prompt: values.prompt,
    skills: values.skills,
    resources: values.resources.length > 0 ? values.resources : undefined,
    mode: values.mode,
    sla: { priority: values.priority, max_latency_ms: values.max_latency_ms, deadline: values.deadline || undefined },
    tags: values.tags.reduce((acc: Record<string, string>, t: { key: string; value: string }) => ({ ...acc, [t.key]: t.value }), {}),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
          Review & Submit
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setShowJson(!showJson)}>
          <Code size={14} /> {showJson ? 'Card View' : 'JSON Preview'}
        </Button>
      </div>

      {showJson ? (
        <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <JsonViewer data={envelope} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Prompt summary */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prompt</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {values.prompt.length > 300 ? values.prompt.substring(0, 300) + '…' : values.prompt}
            </p>
          </div>

          {/* Skills */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills ({values.skills.length})</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {values.skills.map((s: any) => <Badge key={s.skill_id} variant="info">{s.skill_id}</Badge>)}
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode</p>
              <Badge variant="default">{values.mode}</Badge>
            </div>
            <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</p>
              <Badge variant={values.priority === 'high' ? 'warning' : values.priority === 'low' ? 'default' : 'info'}>{values.priority}</Badge>
            </div>
          </div>

          {/* Idempotency */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Idempotency Key</p>
            <code style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>{values.idempotency_key}</code>
          </div>
        </div>
      )}
    </div>
  );
}
