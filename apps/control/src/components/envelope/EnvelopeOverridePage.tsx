'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  Input,
  Switch,
  FormField,
  ConfirmDialog,
  useToast,
  LoadingSpinner,
  EmptyState,
  AlertBanner,
} from '@solar/ui';
import type { EnvelopeOverride, EnvelopeOverrideValidationError } from '@solar/api';
import { ENFORCED_ENVELOPE_KEYS } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Trash2, RotateCcw, Save, Search } from 'lucide-react';

// ─── Key Metadata ────────────────────────────────────────────────────────────

type KeyCategory = 'numeric' | 'boolean' | 'list';

interface KeyMeta {
  key: keyof EnvelopeOverride;
  label: string;
  category: KeyCategory;
}

const ENVELOPE_KEYS: KeyMeta[] = [
  // Numeric
  { key: 'max_budget_usd_per_task', label: 'Max Budget USD / Task', category: 'numeric' },
  { key: 'max_duration_seconds', label: 'Max Duration (seconds)', category: 'numeric' },
  { key: 'max_concurrent_per_principal', label: 'Max Concurrent / Principal', category: 'numeric' },
  { key: 'max_batch_children', label: 'Max Batch Children', category: 'numeric' },
  // Boolean
  { key: 'tool_calling', label: 'Tool Calling', category: 'boolean' },
  { key: 'agent_call_batch_parent', label: 'Agent Call Batch Parent', category: 'boolean' },
  { key: 'agent_call_child', label: 'Agent Call Child', category: 'boolean' },
  { key: 'session_mode', label: 'Session Mode', category: 'boolean' },
  // List
  { key: 'allowed_call_types', label: 'Allowed Call Types', category: 'list' },
  { key: 'allowed_lifecycle_types', label: 'Allowed Lifecycle Types', category: 'list' },
  { key: 'allowed_skill_patterns', label: 'Allowed Skill Patterns', category: 'list' },
  { key: 'model_class_hints', label: 'Model Class Hints', category: 'list' },
];

function isEnforced(key: keyof EnvelopeOverride): boolean {
  return (ENFORCED_ENVELOPE_KEYS as string[]).includes(key);
}

// ─── Tag Input Component ─────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'var(--color-solar-surface)',
              border: '1px solid var(--color-solar-border)',
              borderRadius: '4px',
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-solar-text-secondary)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-aura-red)',
                fontSize: '0.875rem',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter"
          style={{ flex: 1, fontSize: '0.8125rem' }}
        />
        <Button variant="secondary" size="sm" onClick={addTag} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Main Content ────────────────────────────────────────────────────────────

function EnvelopeOverrideContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [principalId, setPrincipalId] = useState('');
  const [loadedPrincipal, setLoadedPrincipal] = useState('');
  const [editState, setEditState] = useState<Partial<EnvelopeOverride>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationError, setValidationError] = useState<EnvelopeOverrideValidationError | null>(null);

  // ─── Queries & Mutations ──────────────────────────────────────────────────

  const envelopeQuery = useQuery({
    queryKey: ['envelope-override', loadedPrincipal],
    queryFn: () => solar.saturn.admin.getEnvelopeOverride(loadedPrincipal),
    enabled: !!loadedPrincipal,
  });

  const setOverrideMutation = useMutation({
    mutationFn: (override: EnvelopeOverride) =>
      solar.saturn.admin.setEnvelopeOverride(loadedPrincipal, override),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelope-override', loadedPrincipal] });
      setValidationError(null);
      toast({ type: 'success', title: 'Saved', description: 'Envelope override updated successfully.' });
    },
    onError: (err: any) => {
      if (err?.status === 422 && err?.body) {
        setValidationError(err.body as EnvelopeOverrideValidationError);
      } else {
        toast({ type: 'error', title: 'Error', description: err?.message || 'Failed to save override.' });
      }
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (key: string) =>
      solar.saturn.admin.deleteEnvelopeKey(loadedPrincipal, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelope-override', loadedPrincipal] });
      toast({ type: 'success', title: 'Deleted', description: 'Envelope key removed.' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', description: err?.message || 'Failed to delete key.' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => solar.saturn.admin.resetEnvelope(loadedPrincipal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['envelope-override', loadedPrincipal] });
      setEditState({});
      setValidationError(null);
      toast({ type: 'success', title: 'Reset', description: 'Envelope override reset to defaults.' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', description: err?.message || 'Failed to reset envelope.' });
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLoad = useCallback(() => {
    if (!principalId.trim()) return;
    setLoadedPrincipal(principalId.trim());
    setEditState({});
    setValidationError(null);
  }, [principalId]);

  const currentOverride = envelopeQuery.data?.envelope_override ?? {};

  const getDisplayValue = (meta: KeyMeta) => {
    if (meta.key in editState) return editState[meta.key];
    return currentOverride[meta.key];
  };

  const handleEditValue = (key: keyof EnvelopeOverride, value: unknown) => {
    setEditState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = () => {
    const merged: EnvelopeOverride = { ...currentOverride, ...editState };
    setOverrideMutation.mutate(merged);
  };

  const handleDeleteKey = (key: string) => {
    deleteKeyMutation.mutate(key);
    setEditState((prev) => {
      const next = { ...prev };
      delete next[key as keyof EnvelopeOverride];
      return next;
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Envelope Override"
        description="Manage per-principal envelope overrides (L3 layer). Set, update, or delete override keys."
      />

      {/* Principal Selector */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '1rem' }}>
          <FormField label="Principal ID" style={{ flex: 1 }}>
            <Input
              value={principalId}
              onChange={(e) => setPrincipalId(e.target.value)}
              placeholder="Enter principal UUID..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLoad();
              }}
            />
          </FormField>
          <Button onClick={handleLoad} disabled={!principalId.trim()}>
            <Search size={14} style={{ marginRight: '0.375rem' }} />
            Load
          </Button>
        </div>
      </Card>

      {/* Validation Errors */}
      {validationError && (
        <AlertBanner
          type="error"
          title={validationError.error.code}
          description={[
            validationError.error.message,
            ...(validationError.error.violations ?? []).map(
              (v) => `${v.key}: attempted ${String(v.attempted)}, ceiling ${String(v.ceiling)}`
            ),
          ].join(' | ')}
        />
      )}

      {/* Loading / Empty state */}
      {!loadedPrincipal && (
        <EmptyState
          title="No principal loaded"
          description="Enter a principal UUID and click Load to manage their envelope override."
        />
      )}

      {loadedPrincipal && envelopeQuery.isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <LoadingSpinner />
        </div>
      )}

      {loadedPrincipal && envelopeQuery.isError && (
        <AlertBanner
          type="error"
          title="Failed to load envelope"
          description={(envelopeQuery.error as any)?.message || 'Unknown error'}
        />
      )}

      {/* Envelope Table */}
      {loadedPrincipal && envelopeQuery.isSuccess && (
        <>
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.8125rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--color-solar-border)',
                      textAlign: 'left',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Key</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, minWidth: '220px' }}>Value</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ENVELOPE_KEYS.map((meta) => {
                    const value = getDisplayValue(meta);
                    const enforced = isEnforced(meta.key);
                    const hasValue = value !== undefined && value !== null;

                    return (
                      <tr
                        key={meta.key}
                        style={{ borderBottom: '1px solid var(--color-solar-border)' }}
                      >
                        {/* Key Name */}
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {meta.key}
                          </span>
                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--color-solar-text-secondary)',
                              marginTop: '0.125rem',
                            }}
                          >
                            {meta.label}
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          <Badge
                            variant={
                              meta.category === 'numeric'
                                ? 'info'
                                : meta.category === 'boolean'
                                  ? 'warning'
                                  : 'default'
                            }
                          >
                            {meta.category}
                          </Badge>
                        </td>

                        {/* Enforcement Badge */}
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          {enforced ? (
                            <Badge variant="success">Enforced</Badge>
                          ) : (
                            <Badge variant="warning">Intent-only (C5)</Badge>
                          )}
                        </td>

                        {/* Value / Editor */}
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          {meta.category === 'numeric' && (
                            <Input
                              type="number"
                              value={hasValue ? String(value) : ''}
                              onChange={(e) =>
                                handleEditValue(
                                  meta.key,
                                  e.target.value === '' ? undefined : Number(e.target.value),
                                )
                              }
                              placeholder="not set"
                              style={{ maxWidth: '160px', fontSize: '0.8125rem' }}
                            />
                          )}
                          {meta.category === 'boolean' && (
                            <Switch
                              checked={value === true}
                              onChange={(checked: boolean) =>
                                handleEditValue(meta.key, checked)
                              }
                            />
                          )}
                          {meta.category === 'list' && (
                            <TagInput
                              value={(value as string[]) ?? []}
                              onChange={(v) => handleEditValue(meta.key, v)}
                            />
                          )}
                        </td>

                        {/* Delete Key */}
                        <td style={{ padding: '0.625rem 0.5rem' }}>
                          {hasValue && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteKey(meta.key)}
                              disabled={deleteKeyMutation.isPending}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-aura-red)' }} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
              disabled={resetMutation.isPending}
            >
              <RotateCcw size={14} style={{ marginRight: '0.375rem' }} />
              Reset All
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={setOverrideMutation.isPending || Object.keys(editState).length === 0}
            >
              <Save size={14} style={{ marginRight: '0.375rem' }} />
              {setOverrideMutation.isPending ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </>
      )}

      {/* Reset Confirmation */}
      <ConfirmDialog
        open={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        title="Reset Envelope Override"
        description="This will remove all override keys for this principal and revert to tenant defaults. This action cannot be undone."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          resetMutation.mutate();
          setShowResetConfirm(false);
        }}
      />
    </div>
  );
}

// ─── Exported Page Component ─────────────────────────────────────────────────

export function EnvelopeOverridePage() {
  return (
    <Providers>
      <EnvelopeOverrideContent />
    </Providers>
  );
}
