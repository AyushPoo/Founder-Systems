# User-Owned Integrations Action Layer Design

## Goal

Founder Systems agents should behave like CMO, CFO, and COO operators, not just advisors. They should be able to draft, prepare, and execute bounded business actions through tools that the customer connects from their own accounts.

## Core Decision

All third-party tool access is user-owned.

Founder Systems must never use Ayush's Gmail, LinkedIn, Meta Ads, accounting, HR, or support accounts to act for customers. A customer connects their own account through OAuth or an official provider login. The agent can then act only inside the permissions that customer granted.

## V1 Connector

Start with Gmail for Marketing Agent because it proves the most important loop:

1. User asks the Marketing Agent to draft an email.
2. Agent drafts the email and asks for explicit approval.
3. User provides recipient details and approval.
4. Runtime calls Founder Systems internal action API.
5. Founder Systems verifies entitlement, wallet, block status, Gmail connection, and action caps.
6. Founder Systems sends through the user's connected Gmail account.
7. Analytics and credit guard record the attempt and the result.

## Safety Model

External actions require an explicit approval moment. A Telegram message such as "yes send it to priya@example.com" can count as approval only after the agent has shown the final draft, recipient, subject, and channel.

The agent can say it can send emails only when Gmail is connected. If Gmail is not connected, it should give the user a Founder Systems connect link instead of refusing permanently.

## Data Ownership

Founder Systems stores:

- Integration connection status.
- Encrypted OAuth refresh/access token payloads.
- Action attempts and results.
- Wallet and usage ledger records.

Hermes/runtime stores:

- Conversation state.
- Pending action draft state.
- Agent reasoning context.

Hermes must not become the source of truth for tool credentials, billing, or account ownership.

## Initial Capabilities

Marketing V1:

- Draft outbound emails.
- Ask for review.
- Send approved Gmail emails from the user's connected Gmail.
- Record action usage.

Future Marketing:

- Google Search Console read/reporting.
- Meta Ads campaign review and budget recommendations.
- LinkedIn drafting and posting where official APIs permit it.
- Email campaign tools such as Brevo, Mailchimp, HubSpot, or Apollo via user-owned connections.

Finance V1.5+:

- Read uploaded bank statements.
- Produce financial statements and reconciliations.
- Connect user-owned accounting systems such as Zoho Books, Xero, QuickBooks, or Tally-compatible export flows.

Ops V1.5+:

- Connect helpdesk, HR, and project tools.
- Draft SOPs and create tasks/tickets with approval.
- Handle customer-care workflows through approved integrations.

## Non-Negotiables

- Use official APIs or sanctioned OAuth flows where available.
- Do not ask users for raw passwords.
- Do not store third-party credentials unencrypted.
- Do not execute high-risk actions without explicit approval.
- Deny actions if the user is blocked, wallet is empty, product pass is inactive, model/tool is disabled, or caps are exceeded.
- Log allowed and denied attempts in analytics.

## References Checked

- Google Gmail API `users.messages.send` supports sending from the authenticated user's mailbox with the narrow `https://www.googleapis.com/auth/gmail.send` scope.
- Google OAuth web-server flow requires `access_type=offline` to receive refresh tokens for later user-approved API actions.

