import { useMemo, useRef, useState } from 'react';
import OutreachIntakeForm from './OutreachIntakeForm';
import OutreachCoachPanel from './OutreachCoachPanel';
import OutreachOutputTabs from './OutreachOutputTabs';
import SavedCampaignsDrawer from './SavedCampaignsDrawer';
import ResultsTrackerPanel from './ResultsTrackerPanel';
import OutreachMemoryPanel from './OutreachMemoryPanel';
import {
  createOutreachDraft,
  createOutreachInputSignature,
  getOutreachFieldFeedback,
  normalizeOutreachInput,
  normalizeOutreachOutput,
  validateOutreachInput,
} from '../../utils/outreachCampaign';
import {
  canApplyOutreachGenerationResult,
  createOutreachGenerationTracker,
  getOutreachActionGuard,
  getOutreachSaveGuard,
  invalidateOutreachGenerationTracker,
  isOutreachResultCurrent,
} from '../../utils/outreachWorkspaceState';
import {
  createCampaignRecord,
  deleteSavedCampaign,
  readSavedCampaigns,
  updateSavedCampaign,
  writeSavedCampaigns,
} from '../../utils/outreachCampaignStorage';
import { buildOutreachMemorySummary } from '../../utils/outreachMemory';

const INTAKE_STEPS = [
  {
    id: 'conversation',
    label: 'Conversation',
    description: 'Collect the signal in plain language, with one guided question at a time.',
  },
  {
    id: 'approval',
    label: 'Approval',
    description: 'Edit the structured draft, then approve the version you want generation to use.',
  },
  {
    id: 'generate',
    label: 'Generate',
    description: 'Run the existing outreach generator from the approved draft and review the output.',
  },
];
const REQUIRED_FIELD_COUNT = 8;

function formatFieldName(field) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

const OutreachWorkspace = () => {
  const [draft, setDraft] = useState(createOutreachDraft);
  const [intakeMode, setIntakeMode] = useState('beginner');
  const [result, setResult] = useState(null);
  const [intakeStage, setIntakeStage] = useState('chat');
  const [approvedSignature, setApprovedSignature] = useState('');
  const [conversationResetToken, setConversationResetToken] = useState(0);
  const [savedCampaigns, setSavedCampaigns] = useState(() => readSavedCampaigns());
  const [currentSavedCampaignId, setCurrentSavedCampaignId] = useState('');
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState({ status: 'idle', message: '' });
  const generationTrackerRef = useRef({ latestRequestId: 0 });
  const activeGenerateControllerRef = useRef(null);

  const feedback = useMemo(() => getOutreachFieldFeedback(draft), [draft]);
  const validation = useMemo(() => validateOutreachInput(draft), [draft]);
  const missingFields = useMemo(() => new Set(validation.missing), [validation.missing]);
  const isResultCurrent = useMemo(
    () => isOutreachResultCurrent({ draft, result }),
    [draft, result]
  );
  const actionGuard = useMemo(() => getOutreachActionGuard({ draft, result }), [draft, result]);
  const saveGuard = useMemo(() => getOutreachSaveGuard({ draft, result }), [draft, result]);
  const currentDraftSignature = useMemo(() => createOutreachInputSignature(draft), [draft]);
  const isDraftApproved = Boolean(approvedSignature) && approvedSignature === currentDraftSignature;
  const currentSavedCampaign = useMemo(
    () => savedCampaigns.find((campaign) => campaign.id === currentSavedCampaignId) || null,
    [savedCampaigns, currentSavedCampaignId]
  );
  const memorySummary = useMemo(
    () => buildOutreachMemorySummary(savedCampaigns),
    [savedCampaigns]
  );

  const activeStep = useMemo(() => {
    if (loading || result) {
      return 2;
    }

    if (intakeStage === 'review' || isDraftApproved) {
      return 1;
    }

    return 0;
  }, [intakeStage, isDraftApproved, loading, result]);

  function updateDraft(updater) {
    setDraft((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return normalizeOutreachInput(next);
    });
    setError('');
    setSaveState((current) => (current.message ? { status: 'idle', message: '' } : current));
  }

  function cancelActiveGenerate() {
    if (activeGenerateControllerRef.current) {
      activeGenerateControllerRef.current.abort();
      activeGenerateControllerRef.current = null;
    }

    generationTrackerRef.current = invalidateOutreachGenerationTracker(generationTrackerRef.current);
    setLoading(false);
  }

  function handleApproveDraft() {
    const { missing, isValid } = validateOutreachInput(draft);
    setIntakeStage('review');

    if (!isValid) {
      setError(`Still needed before approval: ${missing.map(formatFieldName).join(', ')}.`);
      return;
    }

    setApprovedSignature(createOutreachInputSignature(draft));
    setError('');
  }

  async function handleGenerate() {
    const { normalized, missing, isValid } = validateOutreachInput(draft);

    if (!isValid) {
      setIntakeStage('review');
      setError(`Still needed before generation: ${missing.map(formatFieldName).join(', ')}.`);
      return;
    }

    if (!isDraftApproved) {
      setIntakeStage('review');
      setError('Approve the structured draft before generation.');
      return;
    }

    setLoading(true);
    setError('');
    setSaveState({ status: 'idle', message: '' });

    const tracker = createOutreachGenerationTracker(generationTrackerRef.current);
    generationTrackerRef.current = tracker.state;

    if (activeGenerateControllerRef.current) {
      activeGenerateControllerRef.current.abort();
    }

    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;
    activeGenerateControllerRef.current = controller;

    try {
      const response = await fetch('/api/founder-outreach-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalized),
        signal: controller?.signal,
      });

      const payload = await response.json().catch(() => null);

      if (!canApplyOutreachGenerationResult(generationTrackerRef.current, tracker.requestId)) {
        return;
      }

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Failed to generate campaign.');
      }

      const normalizedOutput = normalizeOutreachOutput(payload);
      if (!normalizedOutput.ok) {
        throw new Error(normalizedOutput.error || 'Failed to normalize campaign output.');
      }

      setResult({
        ...normalizedOutput,
        normalizedInput: normalizedOutput.normalizedInput || normalized,
      });
    } catch (submitError) {
      if (!canApplyOutreachGenerationResult(generationTrackerRef.current, tracker.requestId)) {
        return;
      }

      if (submitError?.name === 'AbortError') {
        return;
      }

      setError(submitError?.message || 'Failed to generate campaign.');
    } finally {
      if (canApplyOutreachGenerationResult(generationTrackerRef.current, tracker.requestId)) {
        setLoading(false);
        if (activeGenerateControllerRef.current === controller) {
          activeGenerateControllerRef.current = null;
        }
      }
    }
  }

  function handleSave() {
    if (!saveGuard.canSave) {
      setSaveState({
        status: 'idle',
        message:
          saveGuard.reason === 'stale_result'
            ? 'Regenerate this draft before saving it.'
            : 'Generate a campaign before saving it.',
      });
      return;
    }

    const normalizedInput = normalizeOutreachInput(draft);
    const next = currentSavedCampaignId
      ? updateSavedCampaign(
          currentSavedCampaignId,
          {
            name: normalizedInput.productName || 'Untitled campaign',
            productName: normalizedInput.productName,
            buyerRole: normalizedInput.buyerRole,
            targetCustomer: normalizedInput.targetCustomer,
            channels: normalizedInput.channels,
            input: normalizedInput,
            output: result,
          }
        ).slice(0, 12)
      : [createCampaignRecord({
          input: normalizedInput,
          output: result,
        }), ...savedCampaigns].slice(0, 12);

    setSavedCampaigns(next);
    writeSavedCampaigns(next);
    setCurrentSavedCampaignId((current) => current || next[0]?.id || '');
    setSaveState({
      status: 'saved',
      message: currentSavedCampaignId ? 'Saved campaign updated locally.' : 'Campaign saved locally.',
    });
  }

  function handleOpenSavedCampaign(record) {
    cancelActiveGenerate();

    const normalizedInput = normalizeOutreachInput(record.input);
    const normalizedOutput = normalizeOutreachOutput(record.output);
    const loadedValidation = validateOutreachInput(normalizedInput);

    setDraft(normalizedInput);
    setCurrentSavedCampaignId(record.id);
    setIsSavedDrawerOpen(false);
    setError('');
    setApprovedSignature(createOutreachInputSignature(normalizedInput));
    setIntakeStage(loadedValidation.isValid ? 'review' : 'chat');
    setConversationResetToken((current) => current + 1);

    if (!normalizedOutput.ok) {
      setResult(null);
      setSaveState({
        status: 'idle',
        message: 'Saved campaign loaded, but its generated output could not be restored.',
      });
    } else {
      setResult({
        ...normalizedOutput,
        normalizedInput: normalizedOutput.normalizedInput || normalizedInput,
      });
      setSaveState({ status: 'idle', message: 'Loaded saved campaign.' });
    }
  }

  function handleDeleteSavedCampaign(id) {
    const next = deleteSavedCampaign(id);
    setSavedCampaigns(next);
    setCurrentSavedCampaignId((current) => (current === id ? '' : current));
    setSaveState({ status: 'idle', message: 'Saved campaign removed.' });
  }

  function handleUpdateResults(nextResults) {
    if (!currentSavedCampaignId) {
      setSaveState({
        status: 'idle',
        message: 'Save this campaign first, then you can track results here.',
      });
      return;
    }

    const next = updateSavedCampaign(currentSavedCampaignId, { results: nextResults }).slice(0, 12);
    setSavedCampaigns(next);
    writeSavedCampaigns(next);
    setSaveState({ status: 'saved', message: 'Results tracker updated.' });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[20px] border border-brand-black/10 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(27,28,26,0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-[780px]">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-black/45">
            Founder outreach kit
          </p>
          <h1 className="mt-1 text-[1.15rem] font-black tracking-tight-brand text-brand-black sm:text-[1.3rem]">
            Chat first, approve the brief, then generate the campaign.
          </h1>
          <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/56">
            Keep the intake loose. The structured draft appears only when the signal is clear
            enough to review.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTAKE_STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isComplete = index < activeStep;

            return (
              <div
                key={step.id}
                className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${
                  isActive
                    ? 'border-brand-black bg-brand-black text-white'
                    : isComplete
                      ? 'border-brand-black/12 bg-brand-orange text-white'
                      : 'border-brand-black/10 bg-white text-brand-black/52'
                }`}
                title={step.description}
              >
                {index + 1}. {step.label}
              </div>
            );
          })}
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.6fr)] xl:gap-6">
      <div className="min-w-0 space-y-4">
        <OutreachIntakeForm
          key={`outreach-intake-${conversationResetToken}`}
          draft={draft}
          mode={intakeMode}
          missingFields={missingFields}
          stage={intakeStage}
          isApproved={isDraftApproved}
          onModeChange={setIntakeMode}
          onChange={updateDraft}
          onStageChange={setIntakeStage}
          onApprove={handleApproveDraft}
          onGenerate={handleGenerate}
          loading={loading}
          error={error}
        />

        <OutreachOutputTabs
          loading={loading}
          result={result}
          isResultCurrent={isResultCurrent}
          actionGuard={actionGuard}
        />
      </div>

      <aside className="min-w-0 space-y-3 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-112px)] xl:overflow-y-auto xl:pr-1">
        <OutreachCoachPanel
          draft={draft}
          feedback={feedback}
          result={result}
          onSave={handleSave}
          isResultCurrent={isResultCurrent}
          saveState={saveState}
          savedCount={savedCampaigns.length}
        />
        <SavedCampaignsDrawer
          campaigns={savedCampaigns}
          currentSavedCampaignId={currentSavedCampaignId}
          draft={draft}
          result={result}
          isOpen={isSavedDrawerOpen}
          onOpen={handleOpenSavedCampaign}
          onDelete={handleDeleteSavedCampaign}
          onToggle={() => setIsSavedDrawerOpen((current) => !current)}
        />
        <ResultsTrackerPanel
          campaign={currentSavedCampaign}
          onChange={handleUpdateResults}
        />
        <OutreachMemoryPanel summary={memorySummary} />
      </aside>
      </section>
    </section>
  );
};

export default OutreachWorkspace;
