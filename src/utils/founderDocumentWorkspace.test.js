import assert from 'assert';
import {
  MAX_PDF_SIZE_BYTES,
  ACCEPTED_DOCUMENT_MIME_TYPES,
} from './founderPdfSummary.js';
import {
  buildFounderDocumentWorkspaceMarkdown,
  createFounderDocumentWorkspaceDraft,
  normalizeFounderDocumentWorkspaceRequest,
  normalizeFounderDocumentWorkspaceResponse,
  validateFounderDocumentWorkspaceRequest,
} from './founderDocumentWorkspace.js';

const draft = createFounderDocumentWorkspaceDraft();
assert.deepEqual(draft.files, []);
assert.equal(draft.focus, '');

const normalized = normalizeFounderDocumentWorkspaceRequest({
  files: [
    {
      filename: 'deck.pdf',
      mimeType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
      fileSize: 1024,
    },
    {
      filename: 'board-model.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileData:
        'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==',
      fileSize: 4,
    },
  ],
  focus: 'Find contradictions and missing proof.',
});

assert.equal(normalized.files.length, 2);
assert.equal(normalized.files[0].id, 'file-1');
assert.equal(normalized.files[1].filename, 'board-model.xlsx');
assert.equal(normalized.focus, 'Find contradictions and missing proof.');

const invalid = validateFounderDocumentWorkspaceRequest({ files: [] });
assert.equal(invalid.isValid, false);
assert.match(invalid.error, /at least one/i);

const partiallyInvalid = validateFounderDocumentWorkspaceRequest({
  files: [
    {
      filename: 'deck.pdf',
      mimeType: 'application/pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQK',
      fileSize: 1024,
    },
    {
      filename: 'notes.exe',
      mimeType: 'application/octet-stream',
      fileData: 'data:application/octet-stream;base64,QUJDRA==',
      fileSize: 4,
    },
  ],
});

assert.equal(partiallyInvalid.isValid, false);
assert.equal(partiallyInvalid.validFiles.length, 1);
assert.equal(partiallyInvalid.invalidFiles.length, 1);
assert.match(partiallyInvalid.invalidFiles[0].error, /supported/i);

const oversized = validateFounderDocumentWorkspaceRequest({
  files: [
    {
      filename: 'large.pdf',
      mimeType: 'application/pdf',
      fileData: `data:application/pdf;base64,${Buffer.alloc(MAX_PDF_SIZE_BYTES + 1).toString('base64')}`,
      fileSize: 1,
    },
  ],
});

assert.equal(oversized.isValid, false);
assert.match(oversized.invalidFiles[0].error, /smaller than/i);

const legacySingleFile = validateFounderDocumentWorkspaceRequest({
  filename: 'investor-update.docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  fileData:
    'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,QUJDRA==',
  fileSize: 4,
});

assert.equal(legacySingleFile.isValid, true);
assert.equal(legacySingleFile.validFiles.length, 1);
assert.equal(
  ACCEPTED_DOCUMENT_MIME_TYPES.includes(legacySingleFile.validFiles[0].mimeType),
  true
);

const normalizedResponse = normalizeFounderDocumentWorkspaceResponse({
  workspaceTitle: 'Founder document workspace',
  filesAnalyzed: ['deck.pdf', 'board-model.xlsx'],
  overallRead: 'The story is promising, but the evidence is not fully aligned.',
  whatMattersMost: ['The deck makes stronger margin claims than the spreadsheet supports.'],
  contradictions: ['Deck cites 82% gross margin while the model implies 64%.'],
  missingProof: ['No retention backup appears anywhere in the upload set.'],
  watchouts: ['Fundraising narrative is outrunning operating proof.'],
  priorityQuestions: ['Which gross margin number is the current source of truth?'],
  nextActions: ['Reconcile the deck and model before sharing the pack externally.'],
  fileAnalyses: [
    {
      fileId: 'file-1',
      filename: 'deck.pdf',
      detectedType: 'pitch-deck',
      summary: 'The deck has a clear arc but thin evidence.',
      strongestSignals: ['Narrative is crisp.'],
      concerns: ['Traction proof is too light for the claims made.'],
      focusAreas: ['Show real retention or repeat usage support.'],
      extractionQuality: {
        label: 'high',
        notes: [],
      },
    },
    {
      fileId: 'file-2',
      filename: 'board-model.xlsx',
      detectedType: 'financial-statement',
      summary: 'The model suggests margin pressure and a longer cash cycle.',
      strongestSignals: ['Revenue growth is still visible.'],
      concerns: ['Cash conversion is weaker than the deck implies.'],
      focusAreas: ['Trace the margin assumptions back to source data.'],
      extractionQuality: {
        label: 'mixed',
        notes: ['One sheet tab looked sparse.'],
      },
    },
  ],
  extractionNotes: ['One spreadsheet tab could not be interpreted fully.'],
});

assert.equal(normalizedResponse.ok, true);
assert.equal(normalizedResponse.fileAnalyses.length, 2);
assert.equal(normalizedResponse.fileAnalyses[0].detectedType, 'pitch-deck');
assert.equal(normalizedResponse.fileAnalyses[1].extractionQuality.label, 'mixed');

const invalidResponse = normalizeFounderDocumentWorkspaceResponse({
  workspaceTitle: '',
  overallRead: '',
  whatMattersMost: [],
  fileAnalyses: [],
});

assert.equal(invalidResponse.ok, false);
assert.match(invalidResponse.error, /missing required sections/i);

const markdown = buildFounderDocumentWorkspaceMarkdown({
  workspaceName: 'Acme workspace',
  analysis: normalizedResponse,
});

assert.match(markdown, /^# Founder Document Intelligence: Acme workspace/m);
assert.match(markdown, /## Overall Read/m);
assert.match(markdown, /## Cross-File Contradictions/m);
assert.match(markdown, /## Suggested Next Actions/m);
assert.match(markdown, /## File Analyses/m);
assert.match(markdown, /### deck\.pdf/m);
assert.match(markdown, /\*\*Detected type:\*\* pitch-deck/m);

console.log('founderDocumentWorkspace tests passed');
