import { useEffect, useMemo, useRef, useState } from 'react';
import AttachmentPicker from './AttachmentPicker';
import OutreachApprovalForm from './OutreachApprovalForm';
import {
  applyOutreachAnswer,
  detectOutreachUncertainty,
  getOutreachHelpResponse,
  getNextOutreachQuestion,
  getOutreachAssumptionSignals,
} from '../../utils/outreachIntake';

const bubbleStyles = {
  assistant: 'border border-brand-black/10 bg-white text-brand-black rounded-[20px] rounded-bl-[12px]',
  user: 'bg-brand-black text-white rounded-[20px] rounded-br-[12px]',
};

function ConversationBubble({ role = 'assistant', title, children }) {
  return (
    <article
      className={`max-w-[88%] px-4 py-3 shadow-[0_8px_18px_rgba(27,28,26,0.05)] sm:max-w-[72%] ${
        bubbleStyles[role]
      } ${role === 'user' ? 'ml-auto' : ''}`}
    >
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] opacity-45">
        {title || (role === 'user' ? 'Founder' : 'Outreach guide')}
      </p>
      <div className="whitespace-pre-line text-[12.5px] font-medium leading-[1.65] sm:text-[13.5px]">
        {children}
      </div>
    </article>
  );
}

function SuggestionChip({ label, onClick }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="rounded-full border border-brand-black/12 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/60 transition hover:border-brand-black/24 hover:text-brand-black"
    >
      {label}
    </button>
  );
}

function SignalCard({ label, value }) {
  return (
    <div className="rounded-[16px] border border-brand-black/10 bg-brand-cream/55 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black/45">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium leading-relaxed text-brand-black/72">{value}</p>
    </div>
  );
}

function buildAssistantReflection(question, nextDraft) {
  switch (question.key) {
    case 'productName':
      return `Great. I'll use "${nextDraft.productName}" as the offer name.`;
    case 'offer':
      return 'Good. That gives me the transformation the outreach needs to promise.';
    case 'targetCustomer':
      return 'Nice. That is narrow enough to start shaping a believable message.';
    case 'buyerRole':
      return 'Perfect. I will aim the copy at that reply owner.';
    case 'painPoint':
      return 'That helps. It sounds like a real pain moment instead of a broad theme.';
    case 'desiredOutcome':
      return 'Clear. That gives the campaign a visible win to point at.';
    case 'proof':
      return nextDraft.proof
        ? 'Helpful. I will carry that as proof in the draft.'
        : 'No problem. We can keep moving and leave proof light for now.';
    case 'cta':
      return 'Good. The ask stays light and easy to answer.';
    case 'tone':
      return `Locked. I will keep the voice ${nextDraft.tone}.`;
    case 'channels':
      return `Great. I will build the campaign for ${nextDraft.channels.join(' and ')}.`;
    default:
      return 'Got it.';
  }
}

const OutreachIntakeForm = ({
  draft,
  mode,
  missingFields,
  stage,
  loading,
  error,
  isApproved,
  onModeChange,
  onChange,
  onStageChange,
  onApprove,
  onGenerate,
}) => {
  const [composerValue, setComposerValue] = useState('');
  const [messages, setMessages] = useState([]);
  const messageIdRef = useRef(0);
  const composerRef = useRef(null);

  const currentQuestion = useMemo(() => getNextOutreachQuestion(draft, mode), [draft, mode]);
  const assumptionSignals = useMemo(() => getOutreachAssumptionSignals(draft), [draft]);
  const isReadyForReview = missingFields.size === 0;

  useEffect(() => {
    if (stage === 'chat') {
      composerRef.current?.focus();
    }
  }, [stage, currentQuestion?.key]);
  function pushMessage(role, content, title) {
    setMessages((current) => [
      ...current,
      {
        id: `outreach-message-${messageIdRef.current++}`,
        role,
        content,
        title,
      },
    ]);
  }

  function submitAnswer({ value, displayText }) {
    if (!currentQuestion || loading) {
      return;
    }

    if (detectOutreachUncertainty(value)) {
      const helpResponse = getOutreachHelpResponse(draft, currentQuestion, mode);
      pushMessage('user', displayText || String(value || ''));
      pushMessage('assistant', helpResponse.message, 'Outreach guide');
      setComposerValue('');
      return;
    }

    const nextDraft = applyOutreachAnswer(draft, currentQuestion.key, value);

    if (currentQuestion.key === 'channels' && nextDraft.channels.length === 0) {
      pushMessage(
        'assistant',
        'I did not catch the channels there. Try email, LinkedIn, or both.',
        'Outreach guide'
      );
      return;
    }

    onChange(nextDraft);
    pushMessage('user', displayText || String(value || ''));
    pushMessage(
      'assistant',
      buildAssistantReflection(currentQuestion, nextDraft),
      'Outreach guide'
    );
    setComposerValue('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const value = composerValue.trim();
    if (!value) {
      return;
    }

    submitAnswer({
      value,
      displayText: value,
    });
  }

  if (stage === 'review') {
    return (
      <OutreachApprovalForm
        draft={draft}
        missingFields={missingFields}
        loading={loading}
        error={error}
        isApproved={isApproved}
        onChange={onChange}
        onApprove={onApprove}
        onGenerate={onGenerate}
        onBack={() => onStageChange('chat')}
      />
    );
  }

  return (
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[24px] border border-brand-black/10 bg-white shadow-[0_18px_40px_rgba(27,28,26,0.06)]">
      <div className="border-b border-brand-black/8 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-black/45">
              Conversational intake
            </p>
            <h2 className="mt-1 text-[1.05rem] font-black tracking-tight-brand text-brand-black">
              Gather the signal in plain language first.
            </h2>
            <p className="mt-1 max-w-[760px] text-[13px] font-medium leading-relaxed text-brand-black/54">
              One question at a time, a little guidance when the wording gets fuzzy, then a clean
              approval draft before generation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'beginner', label: 'Beginner' },
              { id: 'advanced', label: 'Advanced' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onModeChange(option.id)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                  mode === option.id
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-black/12 bg-white text-brand-black/58'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          <ConversationBubble>
            Start with whatever is easiest to say. I will turn it into a usable outreach brief
            without forcing you through a rigid form.
          </ConversationBubble>

          {messages.map((message) => (
            <ConversationBubble key={message.id} role={message.role} title={message.title}>
              {message.content}
            </ConversationBubble>
          ))}

          {isReadyForReview ? (
            <ConversationBubble title="Outreach guide">
              I have enough to draft the structured brief. Give it a quick review, edit anything
              that feels off, and approve that version before generation.
            </ConversationBubble>
          ) : currentQuestion ? (
            <ConversationBubble title={currentQuestion.label}>
              <p>{currentQuestion.prompt}</p>
              <p className="mt-2 text-[12.5px] font-medium leading-relaxed text-brand-black/56">
                {currentQuestion.helper}
              </p>
            </ConversationBubble>
          ) : null}
        </div>

        {assumptionSignals.length > 0 ? (
          <div className="border-t border-brand-black/8 px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-black/45">
              What I am already inferring
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {assumptionSignals.map((signal) => (
                <SignalCard key={signal.id} label={signal.label} value={signal.value} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-brand-black/8 px-5 py-4">
          <AttachmentPicker
            attachments={draft.attachments || []}
            onChange={(attachments) =>
              onChange((current) => ({
                ...current,
                attachments:
                  typeof attachments === 'function'
                    ? attachments(current.attachments || [])
                    : attachments,
              }))
            }
          />
        </div>

        <div className="border-t border-brand-black/8 bg-brand-cream/35 px-5 py-4">
          {error ? (
            <div className="mb-3 rounded-[16px] bg-[#fff1eb] px-4 py-3 text-[13px] font-bold text-[#9f3c19]">
              {error}
            </div>
          ) : null}

          {isReadyForReview ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium leading-relaxed text-brand-black/62">
                The required inputs are covered. Open the approval draft to make final edits.
              </p>
              <button
                type="button"
                onClick={() => onStageChange('review')}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-brand-black bg-brand-black px-5 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review draft
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {currentQuestion?.suggestions?.length ? (
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.suggestions.map((suggestion) => (
                    <SuggestionChip
                      key={`${currentQuestion.key}-${suggestion.label}`}
                      label={suggestion.label}
                      onClick={() =>
                        submitAnswer({
                          value: suggestion.value,
                          displayText: suggestion.label,
                        })
                      }
                    />
                  ))}
                </div>
              ) : null}

              <textarea
                ref={composerRef}
                rows={3}
                value={composerValue}
                onChange={(event) => setComposerValue(event.target.value)}
                placeholder={currentQuestion?.placeholder || 'Reply naturally'}
                disabled={loading || !currentQuestion}
                className="min-h-[84px] w-full resize-none rounded-[18px] border border-brand-black/12 bg-white px-4 py-3 text-[13.5px] font-medium leading-relaxed text-brand-black shadow-[0_6px_14px_rgba(27,28,26,0.04)] outline-none transition placeholder:text-brand-black/30 focus:border-brand-black/24 focus:ring-2 focus:ring-brand-black/5 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] font-medium leading-relaxed text-brand-black/42">
                  Keep the answer rough if you want. The approval draft will stay editable.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      submitAnswer({
                        value: "I don't know",
                        displayText: "I don't know",
                      })
                    }
                    disabled={loading || !currentQuestion}
                    className="inline-flex items-center justify-center rounded-full border border-brand-black/12 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-brand-black/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Help me
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !currentQuestion || !composerValue.trim()}
                    className="inline-flex items-center justify-center rounded-full border border-brand-black bg-brand-black px-5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send answer
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default OutreachIntakeForm;
