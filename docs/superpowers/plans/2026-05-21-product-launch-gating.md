# Product Launch Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep only the four financial models publicly buyable while every other product stays visible but shows as coming soon, with internal-only access for `ayushpoojary1@gmail.com`.

**Architecture:** Add one central launch-gating utility that knows which products are publicly available and which email bypasses the gate. Use that utility in the product catalog, product detail action logic, and tool routes so the same rule controls visibility, purchase state, and launch access.

**Tech Stack:** React, React Router, existing Founder Workspace account context, node:test

---

### Task 1: Add launch-gating tests

**Files:**
- Modify: `E:/Work/Founder-Systems-main-merge/src/utils/productExperience.test.js`

- [ ] **Step 1: Write failing tests for public financial access and internal override**
- [ ] **Step 2: Run the product experience test file to verify the new assertions fail**
- [ ] **Step 3: Implement the minimum utility changes needed to pass**
- [ ] **Step 4: Re-run the product experience tests until they pass**

### Task 2: Centralize launch gating in product utilities

**Files:**
- Modify: `E:/Work/Founder-Systems-main-merge/src/utils/productExperience.js`

- [ ] **Step 1: Add the internal tester email constant and public product allowlist**
- [ ] **Step 2: Add helper functions for launch state and internal access**
- [ ] **Step 3: Make product primary actions return a coming-soon state for gated products**

### Task 3: Apply gating to catalog and product detail

**Files:**
- Modify: `E:/Work/Founder-Systems-main-merge/src/pages/Products.jsx`
- Modify: `E:/Work/Founder-Systems-main-merge/src/pages/ProductDetail.jsx`

- [ ] **Step 1: Read the signed-in email from workspace context in the catalog**
- [ ] **Step 2: Mark gated non-financial products as coming soon in product cards**
- [ ] **Step 3: Replace launch/purchase CTAs with a coming-soon state on product detail for public users**
- [ ] **Step 4: Preserve full access for the internal tester email**

### Task 4: Guard direct tool routes

**Files:**
- Create: `E:/Work/Founder-Systems-main-merge/src/components/InternalProductRoute.jsx`
- Modify: `E:/Work/Founder-Systems-main-merge/src/App.jsx`

- [ ] **Step 1: Create a route wrapper that checks launch state using the signed-in email**
- [ ] **Step 2: Redirect unauthorized direct tool visits back to the public product detail page**
- [ ] **Step 3: Wrap the non-financial tool routes with the new internal-only route guard**

### Task 5: Verify behavior

**Files:**
- Modify: `E:/Work/Founder-Systems-main-merge/src/components/ProductCard.jsx` (only if button copy needs alignment after verification)

- [ ] **Step 1: Run `node src/utils/productExperience.test.js`**
- [ ] **Step 2: Run `npm.cmd run build`**
- [ ] **Step 3: Do a quick browser verification of one financial product and one gated app product**
