import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AdminShell audit nav (AOP.7H)', () => {
  const shell = readFileSync(join(__dirname, '../components/admin-shell.tsx'), 'utf8');
  const auditPage = readFileSync(join(__dirname, '../app/audit-logs/page.tsx'), 'utf8');

  it('shows audit link only when showAdminAuditNav', () => {
    expect(shell).toContain('showAdminAuditNav');
    expect(shell).toMatch(/showAdminAuditNav\(user\.role\)[\s\S]*\/audit-logs/);
    expect(shell).not.toMatch(/canModerate[\s\S]*\/audit-logs/);
  });

  it('shows staff link only for SUPER_ADMIN helper', () => {
    expect(shell).toContain('showAdminStaffNav');
    expect(shell).toMatch(/showAdminStaffNav\(user\.role\)[\s\S]*\/staff/);
  });

  it('audit page gates on AUDIT_VIEW helper', () => {
    expect(auditPage).toContain('canViewAdminAuditLogs');
  });
});
