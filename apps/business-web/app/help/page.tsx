'use client';

import { useUi, type UiLabels } from '@/components/locale-provider';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BusinessRow, myBusinessRows, ownerApi } from '@/lib/api';
import { useAuth } from '@/lib/use-auth';
import { BusinessShell, useSelectedBusiness } from '@/components/business-shell';

function buildFaq(ui: UiLabels) {
  return [
    { q: ui.____80ffc1, a: ui.____074f2d },
    { q: ui.____00d9ba, a: ui.____6928ec },
    { q: ui.____dd974f, a: ui.____e1b3c0 },
    { q: ui.____606e8a, a: ui.____e70693 },
    { q: ui.____ec41b7, a: ui.____9753e3 },
    { q: ui.____b37257, a: ui.___free_d25e9d },
    { q: ui.___d0fbec, a: ui.____d990b1 },
    { q: ui.____dd5e33, a: ui.__support_qalago_264d57 },
  ];
}

export default function HelpPage() {
  const ui = useUi();
  const faq = useMemo(() => buildFaq(ui), [ui]);

  const { token, user, ready, logout } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const business = useSelectedBusiness(businesses);

  useEffect(() => {
    if (!token) return;
    ownerApi.listMyBusinesses(token).then((res) => setBusinesses(myBusinessRows(res.items))).catch(() => undefined);
  }, [token]);

  if (!ready || !token) return <p className="page-content">{ui.text_89d69a}</p>;

  return (
    <BusinessShell
      activeNav="help"
      business={business}
      businesses={businesses}
      userName={user?.name ?? user?.phone ?? undefined}
      onLogout={logout}
    >
      <header className="page-header">
        <div>
          <h1>{ui.ownerNavHelp}</h1>
          <p className="page-header-meta">{ui.____5c9c03}</p>
        </div>
        <Link href="/dashboard" className="btn">{ui.__65f9d8}</Link>
      </header>

      <section className="form-card" style={{ maxWidth: 720, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{ui.__ef4a34}</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)' }}>
          <li>{ui.____2560e2}</li>
          <li>{ui.____c1ce94}</li>
          <li>{ui.___a38c01}</li>
          <li>{ui.____17fe3a}</li>
        </ol>
      </section>

      <section className="form-card" style={{ maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>FAQ</h3>
        {faq.map((item) => (
          <details key={item.q} className="faq-item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="form-card" style={{ maxWidth: 720, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{ui.text_75768c}</h3>
        <p style={{ margin: '0 0 8px' }}>
          Email:{' '}
          <a href="mailto:support@qalago.kz" style={{ color: 'var(--accent)' }}>
            support@qalago.kz
          </a>
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {ui.text_supportWhatsappHours}
        </p>
      </section>
    </BusinessShell>
  );
}
