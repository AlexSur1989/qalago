import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dialog = readFileSync(join(here, 'BackofficeConfirmDialog.tsx'), 'utf8');
const provider = readFileSync(join(here, 'BackofficeConfirmProvider.tsx'), 'utf8');
if (!dialog.includes('<dialog')) throw new Error('confirm dialog must use native dialog');
if (!dialog.includes('aria-labelledby')) throw new Error('confirm dialog needs labelled title');
if (!dialog.includes('aria-describedby')) throw new Error('confirm dialog needs described body');
if (!dialog.includes('cancelRef')) throw new Error('initial focus must not default to destructive confirm');
if (!dialog.includes('disabled={pending}')) throw new Error('pending must disable actions');
if (!dialog.includes("e.key === 'Escape'")) throw new Error('Escape closes when not pending');
if (!dialog.includes('btn-danger')) throw new Error('danger variant must use danger button');
if (!provider.includes('registerBackofficeConfirm')) throw new Error('provider must register bridge');
console.log('confirm.contract: ok');
