import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AdminShell audit nav (AOP.7H)', () => {
  const shell = readFileSync(join(__dirname, '../components/admin-shell.tsx'), 'utf8');
  const auditPage = readFileSync(join(__dirname, '../app/audit-logs/page.tsx'), 'utf8');

  it('shows audit link only when canViewAdminAuditLogs', () => {
    expect(shell).toContain('canViewAdminAuditLogs');
    expect(shell).toMatch(/canViewAdminAuditLogs\(user\.role\)[\s\S]*\/audit-logs/);
    expect(shell).not.toMatch(/canModerate[\s\S]*\/audit-logs/);
  });

  it('audit page gates on AUDIT_VIEW helper', () => {
    expect(auditPage).toContain('canViewAdminAuditLogs');
  });
});
