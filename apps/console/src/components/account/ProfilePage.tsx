'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  Button,
  Input,
  FormField,
  Card,
  Badge,
  useToast,
} from '@solar/ui';
import { useAuth } from '@solar/auth';
import { Providers } from '../Providers';
import { User, Mail, Shield, Building2, Save } from 'lucide-react';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  return (
    <Providers>
      <ProfilePageContent />
    </Providers>
  );
}

function ProfilePageContent() {
  const { session } = useAuth();
  const { addToast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: session?.displayName ?? '',
      email: session?.email ?? '',
    },
  });

  const handleSubmit = form.handleSubmit((_data) => {
    addToast({ type: 'success', title: 'Profile updated', description: 'Your changes have been saved.' });
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <PageHeader
        title="Profile"
        description="Manage your account details and preferences."
      />

      {/* Account info card */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-solar-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} style={{ color: '#fff' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
              {session?.displayName || 'User'}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
              <Badge variant={session?.role === 'admin' ? 'warning' : 'info'}>{session?.role ?? 'member'}</Badge>
              <Badge variant="default">{session?.plan ?? 'free'}</Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--color-solar-border)', borderBottom: '1px solid var(--color-solar-border)' }}>
          <InfoItem icon={<Shield size={14} />} label="Principal ID" value={(session?.principalId?.substring(0, 20) ?? '—') + '…'} />
          <InfoItem icon={<Building2 size={14} />} label="Tenant ID" value={(session?.tenantId?.substring(0, 20) ?? '—') + '…'} />
          <InfoItem icon={<Mail size={14} />} label="Email" value={session?.email ?? '—'} />
          <InfoItem icon={<Shield size={14} />} label="Scopes" value={session?.scopes?.join(', ') ?? '—'} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Display Name" error={form.formState.errors.display_name?.message}>
            <Controller name="display_name" control={form.control} render={({ field }) => <Input {...field} />} />
          </FormField>
          <FormField label="Email" error={form.formState.errors.email?.message}>
            <Controller name="email" control={form.control} render={({ field }) => <Input {...field} type="email" />} />
          </FormField>
          <Button type="submit" style={{ alignSelf: 'flex-start' }}>
            <Save size={16} /> Save Changes
          </Button>
        </form>
      </div>

      {/* Session info */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginTop: '1rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-solar-text-secondary)' }}>Issued</span>
            <span style={{ color: 'var(--color-solar-text-primary)' }}>{session?.issuedAt ? new Date(session.issuedAt).toLocaleString() : '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--color-solar-text-secondary)' }}>Expires</span>
            <span style={{ color: 'var(--color-solar-text-primary)' }}>{session?.expiresAt ? new Date(session.expiresAt).toLocaleString() : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <span style={{ color: 'var(--color-solar-text-secondary)', marginTop: '0.125rem' }}>{icon}</span>
      <div>
        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{value}</span>
      </div>
    </div>
  );
}
