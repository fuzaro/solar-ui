'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Switch,
  ConfirmDialog,
  Input,
  Badge,
  Skeleton,
  useToast,
} from '@solar/ui';
import type { Skill, SkillGrantResponse, FgaBackfillResponse } from '@solar/api';
import { solar } from '../solarApi';
import { Shield, RefreshCw, UserCheck, AlertTriangle } from 'lucide-react';

// ─── Skill Access Matrix ─────────────────────────────────────────────────────

export function SkillAccessMatrix() {
  const [principalId, setPrincipalId] = useState('');
  const [activePrincipal, setActivePrincipal] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<{ skillId: string; displayName: string } | null>(null);
  const [confirmBackfill, setConfirmBackfill] = useState(false);
  const [grantedSkills, setGrantedSkills] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch available skills from the catalog
  const { data: skills, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ['skills', 'list'],
    queryFn: () => solar.sun.skills.list(),
    refetchInterval: 60_000,
  });

  // ─── Grant Mutation ──────────────────────────────────────────────────────────

  const grantMutation = useMutation({
    mutationFn: ({ principalId, skillId }: { principalId: string; skillId: string }) =>
      solar.saturn.admin.grantSkill(principalId, skillId),
    onSuccess: (resp: SkillGrantResponse) => {
      setGrantedSkills(prev => new Set([...prev, resp.skill_id]));
      toast({ title: 'Skill granted', description: `${resp.skill_id} → ${resp.principal_id}`, type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['skills', 'grants', activePrincipal] });
    },
    onError: (err: any) => toast({ title: 'Grant failed', description: err?.message ?? 'Unknown error', type: 'error' }),
  });

  // ─── Revoke Mutation ─────────────────────────────────────────────────────────

  const revokeMutation = useMutation({
    mutationFn: ({ principalId, skillId }: { principalId: string; skillId: string }) =>
      solar.saturn.admin.revokeSkill(principalId, skillId),
    onSuccess: (resp: SkillGrantResponse) => {
      setGrantedSkills(prev => {
        const next = new Set(prev);
        next.delete(resp.skill_id);
        return next;
      });
      toast({ title: 'Skill revoked', description: `${resp.skill_id} ✕ ${resp.principal_id}`, type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['skills', 'grants', activePrincipal] });
    },
    onError: (err: any) => toast({ title: 'Revoke failed', description: err?.message ?? 'Unknown error', type: 'error' }),
  });

  // ─── Backfill Mutation ───────────────────────────────────────────────────────

  const backfillMutation = useMutation({
    mutationFn: () => solar.saturn.admin.backfillFgaGrants(),
    onSuccess: (resp: FgaBackfillResponse) => {
      toast({
        title: 'Backfill complete',
        description: `${resp.principals} principals, ${resp.grants} grants seeded`,
        type: 'success',
      });
      setConfirmBackfill(false);
    },
    onError: (err: any) => {
      toast({ title: 'Backfill failed', description: err?.message ?? 'Unknown error', type: 'error' });
      setConfirmBackfill(false);
    },
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleLoadGrants = () => {
    if (!principalId.trim()) {
      toast({ title: 'Principal ID required', type: 'error' });
      return;
    }
    setActivePrincipal(principalId.trim());
    // Reset grants — in a full implementation we'd fetch existing grants
    setGrantedSkills(new Set());
  };

  const handleToggle = (skillId: string, displayName: string, currentlyGranted: boolean) => {
    if (!activePrincipal) return;
    if (currentlyGranted) {
      setConfirmRevoke({ skillId, displayName });
    } else {
      grantMutation.mutate({ principalId: activePrincipal, skillId });
    }
  };

  const handleConfirmRevoke = () => {
    if (confirmRevoke && activePrincipal) {
      revokeMutation.mutate({ principalId: activePrincipal, skillId: confirmRevoke.skillId });
      setConfirmRevoke(null);
    }
  };

  const allSkills = skills ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={18} style={{ color: 'var(--color-planet-saturn)' }} />
        <h3 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: 'var(--color-solar-text-primary)' }}>
          FGA Skill Access Control
        </h3>
      </div>

      {/* Principal Input */}
      <Card>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-solar-text-secondary)', marginBottom: '0.375rem' }}>
                Principal ID
              </label>
              <Input
                placeholder="agent:mercury-01 or user:admin@solar.ai"
                value={principalId}
                onChange={(e) => setPrincipalId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadGrants(); }}
              />
            </div>
            <Button variant="primary" size="sm" onClick={handleLoadGrants}>
              <UserCheck size={14} /> Load Grants
            </Button>
          </div>

          {activePrincipal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Badge variant="info">{activePrincipal}</Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
                — {grantedSkills.size} skill{grantedSkills.size !== 1 ? 's' : ''} granted
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Skill Grant List */}
      {activePrincipal && (
        <Card>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>
                Per-Skill Grants
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>
                {allSkills.length} available skill{allSkills.length !== 1 ? 's' : ''}
              </span>
            </div>

            {skillsLoading ? (
              <Skeleton lines={5} height="32px" />
            ) : allSkills.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)', fontSize: '0.8125rem' }}>
                No skills in catalog. Register skills first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {allSkills.map(skill => {
                  const isGranted = grantedSkills.has(skill.skill_id);
                  const isPending = (grantMutation.isPending && grantMutation.variables?.skillId === skill.skill_id)
                    || (revokeMutation.isPending && revokeMutation.variables?.skillId === skill.skill_id);
                  return (
                    <div
                      key={skill.skill_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        background: isGranted ? 'var(--color-solar-surface)' : 'transparent',
                        border: '1px solid var(--color-solar-border)',
                        borderRadius: 'var(--radius-md)',
                        opacity: isPending ? 0.6 : 1,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>
                          {skill.display_name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
                          {skill.skill_id}
                        </span>
                      </div>
                      <Switch
                        checked={isGranted}
                        onChange={() => handleToggle(skill.skill_id, skill.display_name, isGranted)}
                        disabled={isPending}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>
            Bulk Actions
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmBackfill(true)}
              disabled={backfillMutation.isPending}
            >
              <RefreshCw size={14} /> Backfill All Grants
            </Button>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>
              Seeds can_call_skill tuples for all principals based on their current skill assignments.
            </span>
          </div>
        </div>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke Skill Access"
        description={confirmRevoke ? `Remove "${confirmRevoke.displayName}" (${confirmRevoke.skillId}) from principal "${activePrincipal}"? This takes effect immediately.` : ''}
        confirmLabel="Revoke"
        variant="danger"
        loading={revokeMutation.isPending}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setConfirmRevoke(null)}
      />

      {/* Backfill Confirmation Dialog */}
      <ConfirmDialog
        open={confirmBackfill}
        title="Backfill FGA Grants"
        description="This will re-seed can_call_skill tuples for ALL principals based on their current skill assignments. Existing grants are preserved."
        confirmLabel="Run Backfill"
        variant="default"
        loading={backfillMutation.isPending}
        onConfirm={() => backfillMutation.mutate()}
        onCancel={() => setConfirmBackfill(false)}
      />
    </div>
  );
}
