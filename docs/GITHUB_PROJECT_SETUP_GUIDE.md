# GitHub Project Setup Guide

## Overview
This guide provides step-by-step instructions for setting up the StormCom project board at:
**https://github.com/orgs/CodeStorm-Hub/projects/7**

All tasks and issues are documented in `docs/GITHUB_ISSUES_PLAN.md` based on comprehensive research in `docs/research/`.

---

## Prerequisites

1. **Access**: Organization owner or admin access to CodeStorm-Hub
2. **Project Created**: Project #7 should exist at the URL above
3. **Repository**: Access to CodeStorm-Hub/stormcomui repository
4. **Documents**: Review `docs/PROJECT_PLAN.md` and `docs/GITHUB_ISSUES_PLAN.md`

---

## Step 1: Configure Project Board

### A. Create Custom Fields

Navigate to Project Settings → Fields and create:

1. **Phase** (Single select)
   - Options: `1`, `2`, `3`, `4`, `5`
   - Description: Implementation phase number

2. **Epic** (Text)
   - Description: Epic name (e.g., "Payment & Financial Operations")

3. **Estimate** (Number)
   - Description: Estimated days to complete

4. **Priority** (Single select)
   - Options: `P0`, `P1`, `P2`, `P3`
   - Color codes:
     - P0: Red (#d73a4a)
     - P1: Orange (#fb8500)
     - P2: Yellow (#ffd60a)
     - P3: Gray (#6c757d)

5. **Type** (Single select)
   - Options: `epic`, `story`, `task`, `research`

6. **Status** (Default field - configure)
   - Options: `Backlog`, `Sprint Ready`, `In Progress`, `In Review`, `Done`

---

## Step 2: Create Labels

Navigate to Repository → Labels and create:

### Priority Labels
```
priority: P0 - Critical (#d73a4a)
priority: P1 - High (#fb8500)
priority: P2 - Medium (#ffd60a)
priority: P3 - Low (#6c757d)
```

### Type Labels
```
type: epic (#7209b7)
type: story (#4895ef)
type: task (#4cc9f0)
type: research (#f72585)
```

### Phase Labels
```
phase: 1 (#0a9396)
phase: 2 (#005f73)
phase: 3 (#94d2bd)
phase: 4 (#ee9b00)
phase: 5 (#ca6702)
```

### Status Labels (Optional)
```
status: blocked (#d90429)
status: needs-review (#ffb703)
status: ready (#06ffa5)
```

---

## Step 3: Create Milestones

Navigate to Repository → Milestones and create:

1. **Phase 1: Lifecycle & Security**
   - Due date: 6 weeks from start
   - Description: Payment, fulfillment, returns, inventory, RBAC, performance foundation

2. **Phase 2: Merchandising & Pricing**
   - Due date: 12 weeks from start
   - Description: Collections, bundles, promotions, multi-currency pricing, images

3. **Phase 3: Extensibility & Observability**
   - Due date: 18 weeks from start
   - Description: Webhooks, analytics, OpenTelemetry, rate limiting

4. **Phase 4: Intelligence & i18n**
   - Due date: 26 weeks from start
   - Description: Segmentation, marketing automation, recommendations, localization

5. **Phase 5: Advanced Reliability**
   - Due date: 36 weeks from start
   - Description: Event sourcing, workflows, fraud detection, predictive models

---

## Step 4: Create Project Views

### View 1: By Phase (Board)
- **Type**: Board
- **Group by**: Phase
- **Sort by**: Priority (P0 first)
- **Filter**: None (show all)

### View 2: By Priority (Board)
- **Type**: Board
- **Group by**: Priority
- **Sort by**: Phase
- **Filter**: Status != Done

### View 3: Current Sprint (Table)
- **Type**: Table
- **Columns**: Title, Assignee, Priority, Estimate, Status, Phase
- **Filter**: Status = Sprint Ready OR Status = In Progress
- **Sort by**: Priority

### View 4: Roadmap (Timeline)
- **Type**: Roadmap
- **Group by**: Phase
- **Date field**: Milestone due date
- **Filter**: None (show all)

### View 5: Backlog (Table)
- **Type**: Table
- **Columns**: Title, Priority, Estimate, Phase, Epic, Type
- **Filter**: Status = Backlog
- **Sort by**: Priority, then Phase

---

## Step 5: Configure Workflows (Automation)

Navigate to Project Settings → Workflows

### Workflow 1: Auto-add Issues
- **Trigger**: Item added to repository
- **Action**: Set status to "Backlog"

### Workflow 2: Auto-move to In Progress
- **Trigger**: Item is assigned
- **Action**: Set status to "In Progress"

### Workflow 3: Auto-move to Done
- **Trigger**: Item is closed
- **Action**: Set status to "Done"

### Workflow 4: Auto-add Phase Label
- **Trigger**: Phase field is set
- **Action**: Add corresponding phase label

---

## Step 6: Create Issues from Template

### Manual Creation (Recommended for Review)

For each issue in `docs/GITHUB_ISSUES_PLAN.md`:

1. Go to Repository → Issues → New Issue
2. Copy issue details:
   - **Title**: From issue heading
   - **Description**: Include Description, Acceptance Criteria, Dependencies
   - **Labels**: Add priority, type, phase labels
   - **Milestone**: Assign to appropriate phase milestone
   - **Project**: Add to Project #7
   - **Custom Fields**: Set Phase, Epic, Estimate, Priority
3. Create issue
4. Repeat for all 70+ issues

### Scripted Creation (Advanced)

Use the provided script `scripts/create-github-issues.js`:

```bash
cd /home/runner/work/stormcomui/stormcomui
npm install @octokit/rest
node scripts/create-github-issues.js
```

**Note**: Script requires GITHUB_TOKEN environment variable

---

## Step 7: Organize Epics

### Create Epic Issues

For each Epic (21 total across 5 phases):

1. Create an epic-level issue with:
   - **Title**: "Epic: [Epic Name]"
   - **Type**: epic
   - **Description**: Overview, child issues list, success metrics
   - **Labels**: `type: epic`, appropriate phase label
   - **Milestone**: Phase milestone

2. Link child issues:
   - Reference epic in child issue description
   - Use GitHub issue references (#1, #2, etc.)

### Example Epic Issue

**Title**: Epic: Payment & Financial Operations

**Description**:
```markdown
## Overview
Implement complete payment and refund lifecycle tracking.

## Child Issues
- #1 Implement PaymentAttempt Table and Service
- #2 Implement Refund Table and Workflow
- #3 Implement Idempotency Middleware for Orders

## Success Metrics
- 100% payment attempts logged
- Refund processing time < 2 minutes
- Zero duplicate order processing

## Dependencies
- None (Phase 1 foundation)

## Estimate
12 days total
```

---

## Step 8: Setup Sprint Planning

### Sprint Configuration
- **Duration**: 2 weeks (10 working days)
- **Team Size**: 2-3 full-stack engineers
- **Capacity**: 15-20 story points per sprint (1 point = 1 day)

### Sprint 0 (First Sprint)
**Focus**: Foundation setup and Phase 1 kickoff

**Issues to Include**:
1. #1 PaymentAttempt Table (5 days)
2. #4 Fulfillment Tables (4 days)
3. #7 InventoryAdjustment Table (4 days)
4. #14 Cache Tags Infrastructure (4 days)
5. #16 Correlation ID Middleware (2 days)

**Total**: 19 days / 3 engineers = ~6.3 days per engineer

### Sprint Planning Process
1. **Weekly Standups**: Monday (planning), Friday (demo)
2. **Backlog Grooming**: Every 2 weeks
3. **Retrospective**: End of each sprint
4. **Review**: Stakeholder demo at sprint end

---

## Step 9: Setup Monitoring & Reporting

### GitHub Insights Configuration

1. **Velocity Chart**
   - Track completed story points per sprint
   - Target: 15-20 points per sprint

2. **Burndown Chart**
   - Track remaining work in current milestone
   - Update daily

3. **Cycle Time**
   - Measure: Time from "Sprint Ready" to "Done"
   - Target: < 5 days

4. **Issue Age**
   - Track open issue age
   - Flag issues > 30 days old

### Custom Reports

Create these views for reporting:

1. **Weekly Progress**
   - Table view filtered by: Updated in last 7 days
   - Group by: Status
   - Export weekly for stakeholder updates

2. **Blocked Items**
   - Table view filtered by: Status = Blocked
   - Sort by: Priority
   - Review in daily standups

3. **Ready for Review**
   - Table view filtered by: Status = In Review
   - Assign reviewers
   - Target review completion: < 24 hours

---

## Step 10: Team Setup

### Team Member Assignments

Assign team members based on expertise:

**Backend Engineer 1** (Primary)
- Payment & refund systems (#1, #2, #3)
- Inventory management (#7, #8, #9)
- API endpoints (#6)

**Backend Engineer 2** (Primary)
- Fulfillment & returns (#4, #5)
- RBAC & permissions (#10, #11, #12, #13)
- Security hardening (#19, #20)

**Full-Stack Engineer** (Primary)
- Performance optimization (#14, #15, #17, #18)
- UI components (#12, #23, #31, #42)
- Observability (#44, #45, #46)

**DevOps** (Part-time)
- Infrastructure setup
- CI/CD configuration
- Monitoring setup (#44, #45, #46)

### Onboarding Checklist

For each team member:
- [ ] Repository access granted
- [ ] Local development environment setup
- [ ] Database credentials provided
- [ ] Review PROJECT_PLAN.md and GITHUB_ISSUES_PLAN.md
- [ ] Assigned to first sprint issues
- [ ] Added to team Slack/Discord channel

---

## Step 11: Communication Setup

### Tools

1. **GitHub Projects**: Primary source of truth
2. **GitHub Discussions**: Architecture decisions, Q&A
3. **Slack/Discord**: Daily communication
4. **Weekly Email**: Progress summary to stakeholders

### Meeting Schedule

- **Daily Standup**: 15min (async in Slack or sync call)
- **Sprint Planning**: 1 hour every 2 weeks
- **Sprint Review/Demo**: 1 hour every 2 weeks
- **Sprint Retrospective**: 30min every 2 weeks
- **Monthly Stakeholder Review**: 1 hour

---

## Step 12: Documentation Standards

### Issue Description Template

```markdown
## Context
[Why is this issue needed? What problem does it solve?]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Notes
[Technical approach, key decisions, edge cases]

## Testing
[How to verify the implementation]

## Dependencies
- Blocks: #X, #Y
- Blocked by: #Z

## Resources
- [Link to design doc]
- [Link to API spec]
```

### PR Description Template

```markdown
## Issue
Fixes #[issue number]

## Changes
- [Change 1]
- [Change 2]

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Screenshots attached (for UI changes)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

## Step 13: Quality Gates

### Definition of Ready (DoR)

Issues must meet these criteria before sprint inclusion:
- [ ] Acceptance criteria clearly defined
- [ ] Dependencies identified
- [ ] Estimate provided
- [ ] Priority assigned
- [ ] Assigned to correct milestone

### Definition of Done (DoD)

Issues are complete when:
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] QA validation complete
- [ ] No known critical bugs

---

## Step 14: Risk Management

### Risk Register (Project Level)

Track in Project #7 with special label `risk`:

1. **Resource Availability**
   - Impact: High
   - Mitigation: Cross-training, documentation

2. **Technical Complexity**
   - Impact: Medium
   - Mitigation: Spike tasks, proof-of-concepts

3. **Scope Creep**
   - Impact: High
   - Mitigation: Strict change management process

4. **Integration Issues**
   - Impact: Medium
   - Mitigation: Early integration testing, mocks

### Weekly Risk Review

During sprint planning:
1. Review risk register
2. Update risk status
3. Adjust mitigation plans
4. Flag new risks

---

## Step 15: Success Metrics Dashboard

### KPIs to Track

Create a dashboard (GitHub Wiki or external) tracking:

**Development Metrics**
- Sprint velocity (story points completed)
- Cycle time (issue open to close)
- PR review time
- Bug count and severity

**Business Metrics** (from PROJECT_PLAN.md)
- Order creation p95 latency
- Cache hit ratio
- Inventory reconciliation incidents
- Webhook delivery success rate
- Promotion adoption rate
- Customer segmentation coverage

### Weekly Reporting

Generate weekly report including:
1. Completed issues
2. In-progress issues
3. Blocked issues
4. KPI updates
5. Risk status
6. Next week plan

---

## Appendix A: Issue Creation Script

Save as `scripts/create-github-issues.js`:

```javascript
const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = "CodeStorm-Hub";
const repo = "stormcomui";
const projectNumber = 7;

async function createIssuesFromPlan() {
  const plan = fs.readFileSync("docs/GITHUB_ISSUES_PLAN.md", "utf8");
  
  // Parse issues from markdown
  // This is a simplified example - you'll need to implement proper parsing
  
  const issues = []; // Parse from plan document
  
  for (const issue of issues) {
    try {
      const created = await octokit.issues.create({
        owner,
        repo,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        milestone: issue.milestone,
      });
      
      console.log(`Created issue #${created.data.number}: ${issue.title}`);
      
      // Add to project
      // Note: GitHub Projects v2 API requires GraphQL
      
    } catch (error) {
      console.error(`Failed to create issue: ${issue.title}`, error.message);
    }
  }
}

createIssuesFromPlan().catch(console.error);
```

---

## Appendix B: Useful GitHub CLI Commands

```bash
# List all issues
gh issue list --repo CodeStorm-Hub/stormcomui

# Create issue from template
gh issue create --title "Issue Title" --body "Issue body" --label "priority: P0,type: story"

# Add issue to project
gh project item-add PROJECT_ID --owner CodeStorm-Hub --url ISSUE_URL

# List project fields
gh project field-list PROJECT_ID --owner CodeStorm-Hub

# Update issue status
gh project item-edit --id ITEM_ID --field-id FIELD_ID --project-id PROJECT_ID
```

---

## Appendix C: Quick Start Checklist

- [ ] Step 1: Configure custom fields in Project #7
- [ ] Step 2: Create all labels in repository
- [ ] Step 3: Create 5 phase milestones
- [ ] Step 4: Setup 5 project views (Board, Priority, Sprint, Roadmap, Backlog)
- [ ] Step 5: Configure 4 automation workflows
- [ ] Step 6: Create first 10 issues (Phase 1 priority issues)
- [ ] Step 7: Create 6 epic issues (Phase 1 epics)
- [ ] Step 8: Plan Sprint 0 with 5 issues
- [ ] Step 9: Setup velocity and burndown charts
- [ ] Step 10: Assign team members to Sprint 0 issues
- [ ] Step 11: Schedule first sprint planning meeting
- [ ] Step 12: Create issue/PR templates in .github/
- [ ] Step 13: Document DoR and DoD
- [ ] Step 14: Initialize risk register
- [ ] Step 15: Setup metrics dashboard

---

## Support & Questions

For questions or issues with setup:
1. Review `docs/PROJECT_PLAN.md` for strategic context
2. Review `docs/GITHUB_ISSUES_PLAN.md` for detailed issue specifications
3. Consult `docs/research/` for domain-specific details
4. Create a GitHub Discussion in the repository

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-24  
**Owner**: StormCom Engineering Team
