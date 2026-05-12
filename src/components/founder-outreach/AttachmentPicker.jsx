import { useRef } from 'react';
import {
  mergeCompletedAttachmentOperation,
  removeAttachmentWithIntent,
  startAttachmentOperation,
} from '../../utils/outreachWorkspaceState';

const TEXT_ATTACHMENT_EXTENSIONS = ['txt', 'md', 'csv', 'tsv', 'json'];
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_CHARS = 1800;

function getExtension(filename) {
  const parts = String(filename || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function isTextAttachment(file) {
  const extension = getExtension(file?.name);
  return file?.type?.startsWith('text/') || TEXT_ATTACHMENT_EXTENSIONS.includes(extension);
}

async function normalizeFile(file) {
  const normalized = {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    parsed: false,
    excerpt: '',
  };

  if (!isTextAttachment(file)) {
    return normalized;
  }

  try {
    const text = await file.text();
    return {
      ...normalized,
      parsed: true,
      excerpt: String(text || '').trim().slice(0, MAX_ATTACHMENT_CHARS),
    };
  } catch {
    return normalized;
  }
}

const AttachmentPicker = ({ attachments = [], onChange }) => {
  const intentVersionRef = useRef(0);
  const latestIntentByIdRef = useRef({});

  async function handlePickFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, MAX_ATTACHMENTS);
    if (!files.length) {
      return;
    }

    const nextOperation = startAttachmentOperation(
      {
        intentVersion: intentVersionRef.current,
        latestIntentById: latestIntentByIdRef.current,
      },
      files.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
    );
    const { operationId, state } = nextOperation;
    intentVersionRef.current = state.intentVersion;
    latestIntentByIdRef.current = state.latestIntentById;

    const normalized = await Promise.all(files.map(normalizeFile));
    onChange((currentAttachments = []) => {
      return mergeCompletedAttachmentOperation({
        state: {
          intentVersion: intentVersionRef.current,
          latestIntentById: latestIntentByIdRef.current,
        },
        attachments: currentAttachments,
        operationId,
        entries: normalized,
        maxAttachments: MAX_ATTACHMENTS,
      });
    });
  }

  function handleRemove(id) {
    const nextRemoval = removeAttachmentWithIntent(
      {
        intentVersion: intentVersionRef.current,
        latestIntentById: latestIntentByIdRef.current,
      },
      attachments,
      id
    );
    intentVersionRef.current = nextRemoval.state.intentVersion;
    latestIntentByIdRef.current = nextRemoval.state.latestIntentById;
    onChange((currentAttachments = []) =>
      currentAttachments.filter((entry) => entry.id !== id)
    );
  }

  return (
    <div className="rounded-[20px] border border-dashed border-brand-black/18 bg-brand-cream px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-brand-black">Attachments</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-brand-black/52">
            Add up to four files. Text files are excerpted so the generator can use the context.
          </p>
        </div>

        <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-brand-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-brand-black">
          Add files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              handlePickFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      {attachments.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-2 rounded-2xl border border-brand-black/10 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-brand-black">{file.name}</p>
                <p className="mt-1 text-xs font-medium text-brand-black/48">
                  {file.parsed ? 'Excerpt ready for generation.' : 'Attached without text preview.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-brand-black/12 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-black/70"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm font-medium text-brand-black/45">
          No files attached yet.
        </p>
      )}
    </div>
  );
};

export default AttachmentPicker;
