# Workspace Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current `/account` page into a cleaner `Workspace Settings` experience with sidebar navigation, renamed sections, a dedicated `Connections` section, a dedicated `Operators` section, and calmer copy throughout.

**Architecture:** Keep the `/account` route and existing `FounderWorkspaceContext` data layer, but split the 800-line page into a settings shell plus focused section components. Move section names and copy into shared config so the navigation, header, and tests stay aligned. Add a new `Connections` section that reads existing integration state first, then supports future app connections without another IA rewrite.

**Tech Stack:** React 19, React Router, existing Tailwind utility classes, `react-dom/server` + Node `assert` for lightweight component/config tests, existing Founder Systems context and API utilities.

---

## File Structure

### Create

- `E:\Work\Founder-Systems-main-merge\src\utils\accountSections.js`
- `E:\Work\Founder-Systems-main-merge\src\utils\accountSections.test.js`
- `E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.test.js`
- `E:\Work\Founder-Systems-main-merge\src\components\account\OverviewPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\WorkspacePanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\ProductsPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\OperatorsPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.test.js`
- `E:\Work\Founder-Systems-main-merge\src\components\account\BillingPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\ActivityPanel.jsx`
- `E:\Work\Founder-Systems-main-merge\src\components\account\SettingsPanel.jsx`

### Modify

- `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`
- `E:\Work\Founder-Systems-main-merge\src\utils\integrations.js`
- `E:\Work\Founder-Systems-main-merge\src\utils\founderApi.js`
- `E:\Work\Founder-Systems-main-merge\package.json`

### Existing responsibilities to preserve

- `FounderWorkspaceContext` remains the account/workspace source of truth.
- `getAgentAccountStatus`, `getIntegrationStatus`, and `getGmailIntegrationStartUrl` remain the current integration/operator data sources.
- `/account/telegram-connect/:productSlug` remains the operator setup flow target.

---

### Task 1: Create shared account section config and rename the IA

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\src\utils\accountSections.js`
- Create: `E:\Work\Founder-Systems-main-merge\src\utils\accountSections.test.js`
- Modify: `E:\Work\Founder-Systems-main-merge\package.json`

- [ ] **Step 1: Write the failing test for the new settings IA**

```js
// E:\Work\Founder-Systems-main-merge\src\utils\accountSections.test.js
import assert from 'node:assert/strict';
import {
  ACCOUNT_SECTIONS,
  DEFAULT_ACCOUNT_SECTION,
  getAccountSectionFromQuery,
  getAccountSectionMeta,
} from './accountSections.js';

assert.equal(DEFAULT_ACCOUNT_SECTION, 'overview');
assert.deepEqual(
  ACCOUNT_SECTIONS.map((section) => section.key),
  ['overview', 'workspace', 'products', 'operators', 'connections', 'billing', 'activity', 'settings']
);
assert.equal(getAccountSectionFromQuery('credits'), 'billing');
assert.equal(getAccountSectionFromQuery('history'), 'activity');
assert.equal(getAccountSectionFromQuery('memory'), 'workspace');
assert.equal(getAccountSectionFromQuery('settings'), 'settings');
assert.equal(getAccountSectionMeta('connections').label, 'Connections');

console.log('accountSections tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node src\utils\accountSections.test.js
```

Expected: fail with `Cannot find module './accountSections.js'` or missing export errors.

- [ ] **Step 3: Implement the account section config and query mapping**

```js
// E:\Work\Founder-Systems-main-merge\src\utils\accountSections.js
export const ACCOUNT_SECTIONS = [
  { key: 'overview', label: 'Overview', queryAliases: ['overview'] },
  { key: 'workspace', label: 'Workspace', queryAliases: ['workspace', 'memory'] },
  { key: 'products', label: 'Products', queryAliases: ['products'] },
  { key: 'operators', label: 'Operators', queryAliases: ['operators'] },
  { key: 'connections', label: 'Connections', queryAliases: ['connections'] },
  { key: 'billing', label: 'Billing', queryAliases: ['billing', 'credits'] },
  { key: 'activity', label: 'Activity', queryAliases: ['activity', 'history'] },
  { key: 'settings', label: 'Settings', queryAliases: ['settings'] },
];

export const DEFAULT_ACCOUNT_SECTION = 'overview';

export function getAccountSectionFromQuery(value) {
  const normalized = String(value || '').toLowerCase();
  const match = ACCOUNT_SECTIONS.find((section) => section.queryAliases.includes(normalized));
  return match?.key || DEFAULT_ACCOUNT_SECTION;
}

export function getAccountSectionMeta(key) {
  return ACCOUNT_SECTIONS.find((section) => section.key === key) || ACCOUNT_SECTIONS[0];
}
```

- [ ] **Step 4: Add a targeted script for account settings tests**

```json
// E:\Work\Founder-Systems-main-merge\package.json
{
  "scripts": {
    "test:account-settings": "node src/utils/accountSections.test.js && node src/components/account/AccountSettingsShell.test.js && node src/components/account/ConnectionsPanel.test.js"
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:

```powershell
npm.cmd run test:account-settings
```

Expected: the first test file passes, later component tests still fail because those files do not exist yet.

- [ ] **Step 6: Commit**

```powershell
git add package.json src/utils/accountSections.js src/utils/accountSections.test.js
git commit -m "refactor: define workspace settings navigation"
```

---

### Task 2: Build the new sidebar settings shell

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.test.js`
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`

- [ ] **Step 1: Write the failing shell rendering test**

```js
// E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.test.js
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import AccountSettingsShell from './AccountSettingsShell.jsx';

const html = renderToStaticMarkup(
  <AccountSettingsShell
    title="Workspace settings"
    subtitle="Manage your shared context, connected tools, operator access, and credits in one place."
    activeSection="connections"
    onSectionChange={() => {}}
    sections={[
      { key: 'overview', label: 'Overview' },
      { key: 'connections', label: 'Connections' },
    ]}
  >
    <div>Panel content</div>
  </AccountSettingsShell>
);

assert.match(html, /Workspace settings/);
assert.match(html, /Connections/);
assert.match(html, /Panel content/);
console.log('AccountSettingsShell tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node src\components\account\AccountSettingsShell.test.js
```

Expected: fail because `AccountSettingsShell.jsx` does not exist.

- [ ] **Step 3: Implement the shell component**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\AccountSettingsShell.jsx
export default function AccountSettingsShell({
  title,
  subtitle,
  activeSection,
  onSectionChange,
  sections,
  children,
}) {
  return (
    <section className="grid gap-8 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Workspace settings
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight-brand md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-brand-black/62">
          {subtitle}
        </p>
        <nav className="mt-8 space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => onSectionChange(section.key)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                activeSection === section.key
                  ? 'bg-brand-black text-white'
                  : 'bg-white text-brand-black border border-brand-black/10'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Rework `Account.jsx` to use the new shell and section keys**

```jsx
// E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx
import AccountSettingsShell from '../components/account/AccountSettingsShell';
import {
  ACCOUNT_SECTIONS,
  getAccountSectionFromQuery,
} from '../utils/accountSections';

const [activeSection, setActiveSection] = useState(() => {
  const value = searchParams.get('tab');
  return getAccountSectionFromQuery(value);
});

function handleSectionChange(sectionKey) {
  setActiveSection(sectionKey);
  setSearchParams((current) => {
    const next = new URLSearchParams(current);
    next.set('tab', sectionKey);
    return next;
  });
}

<AccountSettingsShell
  title="Workspace settings"
  subtitle="Manage your shared context, connected tools, operator access, and credits in one place."
  activeSection={activeSection}
  onSectionChange={handleSectionChange}
  sections={ACCOUNT_SECTIONS}
>
  {/* section content goes here in later tasks */}
</AccountSettingsShell>
```

- [ ] **Step 5: Run tests to verify the shell passes**

Run:

```powershell
npm.cmd run test:account-settings
```

Expected: shell/config tests pass; connections test still fails because that component does not exist yet.

- [ ] **Step 6: Commit**

```powershell
git add src/components/account/AccountSettingsShell.jsx src/components/account/AccountSettingsShell.test.js src/pages/Account.jsx
git commit -m "feat: add workspace settings shell"
```

---

### Task 3: Split Overview, Workspace, and Products into focused panels

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\OverviewPanel.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\WorkspacePanel.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\ProductsPanel.jsx`
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`

- [ ] **Step 1: Create the `OverviewPanel` component skeleton**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\OverviewPanel.jsx
export default function OverviewPanel({
  overviewCards,
  workspaceName,
  quickActions,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
          Overview
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight-brand">
          {workspaceName || 'Founder Workspace'}
        </h2>
        <p className="mt-2 text-sm font-medium text-brand-black/60">
          Keep your shared context, connected tools, operator access, and credits organized in one place.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="rounded-[22px] border border-brand-black/10 bg-white p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">{card.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight-brand">{card.value}</p>
            <p className="mt-2 text-sm font-medium text-brand-black/58">{card.meta}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => action)}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the `WorkspacePanel` component skeleton**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\WorkspacePanel.jsx
export default function WorkspacePanel({
  memoryItems,
  memoryForm,
  editingId,
  submitting,
  onEdit,
  onArchive,
  onSave,
  onReset,
  onFormChange,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h2 className="text-2xl font-black tracking-tight-brand">Shared workspace</h2>
        <p className="mt-2 text-sm font-medium text-brand-black/58">
          This is the shared context your tools can read from. You stay in control of what gets saved.
        </p>
        {/* existing memory list rendering moves here */}
      </div>
      <aside className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">
          {editingId ? 'Edit memory item' : 'Add memory item'}
        </h3>
        {/* existing form moves here */}
      </aside>
    </section>
  );
}
```

- [ ] **Step 3: Create the `ProductsPanel` component skeleton**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\ProductsPanel.jsx
export default function ProductsPanel({
  productConnections,
  preferences,
  onPreferenceSave,
  getDefaultPreference,
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {productConnections.map((product) => {
        const preference = getDefaultPreference(product.slug, preferences);
        return (
          <article key={product.slug} className="rounded-[24px] border border-brand-black/10 bg-white p-6">
            <h2 className="text-xl font-black tracking-tight-brand">{product.name}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-brand-black/62">
              Choose how this Founder Systems product uses shared workspace context.
            </p>
            {/* existing import_mode and toggle controls move here */}
          </article>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 4: Replace the old inline tab bodies in `Account.jsx`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx
import OverviewPanel from '../components/account/OverviewPanel';
import WorkspacePanel from '../components/account/WorkspacePanel';
import ProductsPanel from '../components/account/ProductsPanel';

{activeSection === 'overview' ? (
  <OverviewPanel
    overviewCards={overviewCards}
    workspaceName={workspace?.name}
    quickActions={quickActions}
  />
) : null}

{activeSection === 'workspace' ? (
  <WorkspacePanel
    memoryItems={memoryItems}
    memoryForm={memoryForm}
    editingId={editingId}
    submitting={submitting}
    onEdit={startEditMemory}
    onArchive={handleArchiveMemory}
    onSave={handleSaveMemory}
    onReset={resetMemoryForm}
    onFormChange={setMemoryForm}
  />
) : null}

{activeSection === 'products' ? (
  <ProductsPanel
    productConnections={PRODUCT_CONNECTIONS}
    preferences={preferences}
    onPreferenceSave={handlePreferenceSave}
    getDefaultPreference={getDefaultPreference}
  />
) : null}
```

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm.cmd run test:account-settings
npm.cmd run build
```

Expected: config/shell tests pass; build passes; connections test still fails because that section is not built yet.

- [ ] **Step 6: Commit**

```powershell
git add src/components/account/OverviewPanel.jsx src/components/account/WorkspacePanel.jsx src/components/account/ProductsPanel.jsx src/pages/Account.jsx
git commit -m "refactor: split workspace and product settings panels"
```

---

### Task 4: Split Operators out of Billing and simplify Billing + Activity wording

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\OperatorsPanel.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\BillingPanel.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\ActivityPanel.jsx`
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`

- [ ] **Step 1: Implement `OperatorsPanel`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\OperatorsPanel.jsx
export default function OperatorsPanel({
  operatorProducts,
  agentStatus,
  entitlements,
  getAgentProductMeta,
  getAgentProductStatus,
  getTelegramConnectPath,
}) {
  return (
    <section className="rounded-[24px] border border-brand-black/10 bg-white p-6">
      <h2 className="text-2xl font-black tracking-tight-brand">Operator access</h2>
      <p className="mt-2 text-sm font-medium text-brand-black/58">
        Manage active operator passes and where they run.
      </p>
      <div className="mt-5 space-y-3">
        {operatorProducts.map((productSlug) => {
          const meta = getAgentProductMeta(productSlug);
          const state = getAgentProductStatus(agentStatus, productSlug, { entitlements });
          return (
            <div key={productSlug} className="rounded-2xl border border-brand-black/10 bg-brand-cream px-4 py-4">
              {/* existing Telegram operator rendering moves here */}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Implement `BillingPanel`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\BillingPanel.jsx
export default function BillingPanel({
  wallet,
  walletValueLabel,
  creditPacks,
  preferredCurrency,
  customCredits,
  customCreditCost,
  entitlements,
  submitting,
  onCurrencyChange,
  onCustomCreditsChange,
  onPackCheckout,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h2 className="text-2xl font-black tracking-tight-brand">Workspace wallet</h2>
        <p className="mt-2 text-sm font-medium text-brand-black/58">
          Manage credits, top-ups, and unlocked products.
        </p>
        {/* wallet, packs, and custom credits move here */}
      </div>
      <aside className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Unlocked products</h3>
        {/* entitlement list moves here */}
      </aside>
    </section>
  );
}
```

- [ ] **Step 3: Implement `ActivityPanel`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\ActivityPanel.jsx
export default function ActivityPanel({
  purchases,
  usageEvents,
  ledger,
  preferredCurrency,
  getPurchaseDisplayName,
  getProductName,
  formatDate,
  formatMoneyMinor,
  titleCase,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Purchases</h3>
        {/* purchases list */}
      </div>
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Usage</h3>
        {/* usage events */}
      </div>
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h3 className="text-xl font-black tracking-tight-brand">Wallet ledger</h3>
        {/* ledger list */}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire the new panels into `Account.jsx`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx
import OperatorsPanel from '../components/account/OperatorsPanel';
import BillingPanel from '../components/account/BillingPanel';
import ActivityPanel from '../components/account/ActivityPanel';

{activeSection === 'operators' ? <OperatorsPanel ... /> : null}
{activeSection === 'billing' ? <BillingPanel ... /> : null}
{activeSection === 'activity' ? <ActivityPanel ... /> : null}
```

- [ ] **Step 5: Run build verification**

Run:

```powershell
npm.cmd run build
```

Expected: build passes and `/account?tab=operators`, `/account?tab=billing`, and `/account?tab=activity` render through the new shell.

- [ ] **Step 6: Commit**

```powershell
git add src/components/account/OperatorsPanel.jsx src/components/account/BillingPanel.jsx src/components/account/ActivityPanel.jsx src/pages/Account.jsx
git commit -m "feat: split operator access from billing"
```

---

### Task 5: Add the new Connections section

**Files:**
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.jsx`
- Create: `E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.test.js`
- Modify: `E:\Work\Founder-Systems-main-merge\src\utils\integrations.js`
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`

- [ ] **Step 1: Write the failing `ConnectionsPanel` test**

```js
// E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.test.js
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ConnectionsPanel from './ConnectionsPanel.jsx';

const html = renderToStaticMarkup(
  <ConnectionsPanel
    connected={[
      {
        key: 'gmail',
        name: 'Gmail',
        description: 'Send approved emails from your connected Gmail account.',
        status: 'connected',
        accountLabel: 'ayushpoojary1@gmail.com',
        usedBy: ['Marketing Operator'],
      },
    ]}
    available={[
      {
        key: 'google-sheets',
        name: 'Google Sheets',
        description: 'Read KPI trackers, finance models, and planning sheets.',
        status: 'available',
        usedBy: ['Finance Operator', 'Founder Command Center'],
      },
    ]}
  />
);

assert.match(html, /Connections/);
assert.match(html, /Gmail/);
assert.match(html, /Google Sheets/);
assert.match(html, /Marketing Operator/);
console.log('ConnectionsPanel tests passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node src\components\account\ConnectionsPanel.test.js
```

Expected: fail because `ConnectionsPanel.jsx` does not exist.

- [ ] **Step 3: Expand integration normalization to support app cards**

```js
// E:\Work\Founder-Systems-main-merge\src\utils\integrations.js
export function buildConnectionCatalog(integrationStatus = {}) {
  return [
    {
      key: 'gmail',
      name: 'Gmail',
      group: 'communication',
      description: 'Send approved emails from your connected Gmail account.',
      status: integrationStatus.gmail?.can_send ? 'connected' : 'available',
      accountLabel: integrationStatus.gmail?.account_email || '',
      usedBy: ['Marketing Operator'],
    },
    {
      key: 'google-sheets',
      name: 'Google Sheets',
      group: 'sheets-reporting',
      description: 'Read KPI trackers, finance models, and planning sheets.',
      status: 'available',
      accountLabel: '',
      usedBy: ['Finance Operator', 'Founder Command Center'],
    },
    {
      key: 'google-docs',
      name: 'Google Docs',
      group: 'docs-files',
      description: 'Read strategy notes, update drafts, and shared operating docs.',
      status: 'available',
      accountLabel: '',
      usedBy: ['Ops Operator', 'Founder Update Generator'],
    },
  ];
}
```

- [ ] **Step 4: Implement `ConnectionsPanel.jsx`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\components\account\ConnectionsPanel.jsx
function ConnectionCard({ item, actionLabel = 'Connect' }) {
  return (
    <article className="rounded-[24px] border border-brand-black/10 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black tracking-tight-brand">{item.name}</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-brand-black/62">
            {item.description}
          </p>
        </div>
        <span className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]">
          {item.status === 'connected' ? 'Connected' : 'Not connected'}
        </span>
      </div>
      {item.accountLabel ? (
        <p className="mt-4 text-sm font-semibold text-brand-black/72">{item.accountLabel}</p>
      ) : null}
      <div className="mt-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Used by</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.usedBy.map((value) => (
            <span key={value} className="rounded-full border border-brand-black/10 bg-brand-cream px-3 py-1 text-xs font-bold text-brand-black/70">
              {value}
            </span>
          ))}
        </div>
      </div>
      <button className="btn-cta mt-5 !py-3 !px-5 !text-sm">
        {actionLabel}
      </button>
    </article>
  );
}

export default function ConnectionsPanel({ connected, available }) {
  return (
    <section className="space-y-8">
      <div className="rounded-[24px] border border-brand-black/10 bg-white p-6">
        <h2 className="text-2xl font-black tracking-tight-brand">Connections</h2>
        <p className="mt-2 text-sm font-medium text-brand-black/58">
          Connect the tools Founder Systems can work with on your behalf.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-black uppercase tracking-[0.14em] text-brand-black/55">Connected</h3>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {connected.map((item) => <ConnectionCard key={item.key} item={item} actionLabel="Manage" />)}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-black uppercase tracking-[0.14em] text-brand-black/55">Available</h3>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          {available.map((item) => <ConnectionCard key={item.key} item={item} actionLabel="Connect" />)}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire Connections into `Account.jsx`**

```jsx
// E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx
import ConnectionsPanel from '../components/account/ConnectionsPanel';
import { buildConnectionCatalog, normalizeIntegrations } from '../utils/integrations';

const connectionCatalog = useMemo(() => buildConnectionCatalog(integrationStatus), [integrationStatus]);
const connectedConnections = connectionCatalog.filter((item) => item.status === 'connected');
const availableConnections = connectionCatalog.filter((item) => item.status !== 'connected');

{activeSection === 'connections' ? (
  <ConnectionsPanel
    connected={connectedConnections}
    available={availableConnections}
  />
) : null}
```

- [ ] **Step 6: Run all account settings tests**

Run:

```powershell
npm.cmd run test:account-settings
npm.cmd run build
```

Expected: all account settings tests pass and build passes.

- [ ] **Step 7: Commit**

```powershell
git add src/utils/integrations.js src/components/account/ConnectionsPanel.jsx src/components/account/ConnectionsPanel.test.js src/pages/Account.jsx
git commit -m "feat: add workspace connections section"
```

---

### Task 6: Polish copy, reduce visual noise, and verify the full settings flow

**Files:**
- Modify: `E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx`
- Modify: `E:\Work\Founder-Systems-main-merge\src\components\account\*.jsx` created above

- [ ] **Step 1: Apply the final copy rewrites from the spec**

Use these exact replacements in the account/settings UI:

```txt
Account, memory, credits, and product handoffs.
-> Workspace settings

Keep strategy, outreach, and deck context inside one workspace so the products build on each other instead of making founders repeat themselves.
-> Manage your shared context, connected tools, operator access, and credits in one place.

Workspace memory
-> Shared workspace

Telegram operators
-> Operator access

Credit wallet
-> Workspace wallet

Purchase history
-> Purchases

Product usage
-> Usage

Wallet ledger
-> Wallet ledger
```

- [ ] **Step 2: Tone down the page styling where it still feels too marketing-heavy**

Targeted code direction:

```jsx
// E:\Work\Founder-Systems-main-merge\src\pages\Account.jsx
// replace the giant hero banner section with a smaller intro block
<div className="w-full pt-28 md:pt-32 pb-10 md:pb-12 px-6 md:px-12 border-b border-brand-black/10 bg-white">
  <div className="max-w-7xl mx-auto">
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">Founder Systems</p>
    <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight-brand">Workspace settings</h1>
    <p className="mt-4 max-w-3xl text-base md:text-lg font-medium leading-7 text-brand-black/62">
      Manage your shared context, connected tools, operator access, and credits in one place.
    </p>
  </div>
</div>
```

- [ ] **Step 3: Run final verification**

Run:

```powershell
npm.cmd run test:account-settings
npm.cmd run build
```

Expected:

- all account settings tests pass
- Vite build passes
- no JSX syntax errors

- [ ] **Step 4: Manual browser verification**

Open:

```txt
http://127.0.0.1:4173/account
```

Verify:

- sidebar renders cleanly on desktop
- `Overview`, `Workspace`, `Products`, `Operators`, `Connections`, `Billing`, `Activity`, `Settings` all switch correctly
- Gmail appears under `Connections`
- `Operators` is separate from `Billing`
- the page feels calmer and easier to scan than the old account surface

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Account.jsx src/components/account
git commit -m "style: polish workspace settings experience"
```

---

## Spec Coverage Check

This plan covers:

- renaming the surface to `Workspace Settings`
- replacing tab pills with sidebar navigation
- renaming `Memory`, `Credits`, and `History`
- adding `Operators`
- adding `Connections`
- splitting the giant `Account.jsx` into focused panels
- rewriting copy to calmer, more product-grade language
- using current Gmail integration status as the first live connection
- preparing the architecture for Sheets/Docs/Drive later

No uncovered spec requirements remain.
