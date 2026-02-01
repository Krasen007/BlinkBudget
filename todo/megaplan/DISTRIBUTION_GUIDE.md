# Manager's Guide: Distributing the Work

You have the Master Plan (`megaplan.md`) and the Individual Plans (`full_stack_developer.md`, etc.). Here is how to execute.

## 1. The Kick-off (Day 0)

Before assigning individual tasks, bring the team together (or send a group message) to establish context.

**Share with everyone:**

- The **Goal**: "Public release in 12 weeks. Focus on Security, Data Safety, and a 3-Click UX."
- The **Master Plan**: Share `todo/megaplan/megaplan.md` so they see the timeline.
- The **Repository**: Ensure everyone has valid access to `BlinkBudget`.

## 2. Individual Handoffs

Give each member their specific markdown file. **Do not just send the file; give them a specific directive.**

### 👨‍💻 Full-Stack Developer

> "Here is your battle plan: `todo/megaplan/full_stack_developer.md`.
> Warning: You are the Lead. Please review the 'Collaboration Rules' first.
> **Action:** Start with Week 1 Security Hardening immediately. Coordinate with DevOps on the Env variables today."

### 🎨 UX/UI Designer

> "Here is your schedule: `todo/megaplan/ui_ux_designer.md`.
> **Action:** We need the 'Emergency Data Export' mockups by Wednesday so Dev can build it next week. Please start the Audit today."

### 🕵️ QA Engineer

> "Here is your testing strategy: `todo/megaplan/qa_engineer.md`.
> **Action:** While Dev is building security rules, please prepare the 'Security Test Data' (mock accounts). You will be penetration testing the Auth system on Friday."

### 🔧 DevOps Engineer

> "Here is the infra plan: `todo/megaplan/devops_engineer.md`.
> **Action:** Priority 1 is the Environment Variable structure. Please sync with the Lead Dev to lock that down so they aren't blocked."

### 📝 Technical Writer

> "Here is the content plan: `todo/megaplan/technical_writer.md`.
> **Action:** Start drafting the Privacy Policy. You'll need to interview the Developer next week about how we handle data."

## 3. Weekly Workflow (Running the Sprint)

Do not let them go away for 12 weeks. Run this cycle every week:

**Monday: Planning**

- Review the "Week X" section of their files.
- Ask: "Is anything blocking you from starting Week X tasks?"
- _Example:_ Check if Designer has given specs to Dev for the current week's feature.

**Wednesday: Mid-Week Check**

- "Are we on track for Friday? Do we need to cut scope?"

**Friday: Demo & Merge**

- **Dev/Design:** Demo what was built/designed.
- **QA:** Report on bugs found.
- **Manager (You):** Update the Master `megaplan.md` (mark tasks as `[x]`).

## 4. Handling Overlap & Conflicts

The plans I created have **"Collaboration Rules"** at the top of each file. Remind them to read these!

- **If Dev is waiting for Design:** Dev should switch to a "Technical Debt" or "Security" task from a future week (if available) or help QA write tests.
- **If QA finds a blocker:** Dev stops new feature work to fix the bug immediately (Stop the Line policy).

## Summary Checklist for You

- [ ] Grant Repo Access
- [ ] Send `megaplan.md` to everyone
- [ ] Send individual `.md` files to each member
- [ ] Set up a recurring "Monday Sync" calendar invite
