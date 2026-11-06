# Test Plan Template

## Project: [Name]

**Version**: 1.0
**Date**: YYYY-MM-DD
**Author**: [Senior Test Engineer]
**Reviewers**: [Senior Developer, Senior QA, Tech Lead]

### Scope

**In Scope:**
- [Feature/Component 1]
- [Feature/Component 2]

**Out of Scope:**
- [Explicitly excluded areas]
- [Future phases]

### Test Strategy

**Test Pyramid Target:**
- Unit Tests: 70% (target: >90% coverage on business logic)
- Integration Tests: 20% (target: >80% coverage on API contracts)
- E2E Tests: 10% (target: 100% critical user journeys)

**Risk-Based Focus:**
| Area | Risk Level | Test Investment |
|------|------------|-----------------|
| Payment processing | Critical | Maximum |
| User authentication | High | High |
| Reporting dashboard | Medium | Standard |
| Admin settings | Low | Minimum |

### Test Environment

| Environment | Purpose | Data | Refresh Cadence |
|-------------|---------|------|-----------------|
| Local | Developer testing | Synthetic | On demand |
| CI | Automated gates | Synthetic | Per run |
| Staging | Integration, UAT | Anonymized production | Daily |
| Production | Canary, monitoring | Real | N/A |

### Test Data Strategy

- **Synthetic Data**: Generated per test, no external dependencies
- **Anonymized Production**: For staging, PII masked, referential integrity maintained
- **Test Data Builders**: Domain-specific builders for complex objects
- **Database Seeding**: Idempotent scripts per test suite

### Test Types & Tools

| Type | Tool | Scope | Triggers |
|------|------|-------|----------|
| Unit | Vitest | Functions, hooks, components | Every commit |
| Integration | Vitest + Testcontainers | API, DB, messaging | Every PR |
| Contract | Pact | Consumer-provider contracts | Every PR |
| E2E | Playwright | Critical user journeys | Nightly + release |
| Visual | Playwright + pixelmatch | UI components | Every PR |
| Performance | k6 | Load, stress, soak | Weekly + release |
| Accessibility | axe-core | WCAG 2.1 AA | Every PR |
| Security | OWASP ZAP, Trivy | Vulnerability scan | Every build |

### Quality Gates

**CI Pipeline (Must Pass):**
- [ ] Unit tests: 100% pass, >80% coverage
- [ ] Integration tests: 100% pass
- [ ] Contract tests: 100% pass
- [ ] Lint/Typecheck: 0 errors
- [ ] Security scan: 0 critical/high
- [ ] Accessibility: 0 violations

**Pre-Release (Staging):**
- [ ] E2E critical paths: 100% pass
- [ ] Performance: p95 < 200ms, error rate < 0.1%
- [ ] Visual regression: 0 unexpected changes
- [ ] Exploratory testing: Charter completed
- [ ] UAT sign-off: Stakeholder approval

### Defect Management

**Severity Definitions:**
- **Critical**: Data loss, security breach, complete outage
- **High**: Major feature broken, no workaround
- **Medium**: Feature degraded, workaround exists
- **Low**: Minor issue, cosmetic, edge case

**SLA:**
- Critical: Fix in 24h, deploy in 48h
- High: Fix in 3 days, deploy in 5 days
- Medium: Next sprint
- Low: Backlog prioritization

### Test Reporting

**Dashboards:**
- Test execution trend (pass/fail/skip)
- Coverage trend (line, branch, mutation)
- Flaky test tracker
- Defect aging and escape rate
- Performance benchmarks

**Communication:**
- Daily: CI status in team channel
- Weekly: Quality metrics in sprint review
- Release: Go/No-Go report with evidence

### Entry/Exit Criteria

**Entry (Definition of Ready):**
- [ ] Requirements clear with acceptance criteria
- [ ] Testable architecture (testability review done)
- [ ] Test data available
- [ ] Environment provisioned

**Exit (Definition of Done):**
- [ ] All test types executed and passing
- [ ] Quality gates met
- [ ] Defects triaged per SLA
- [ ] Documentation updated
- [ ] Knowledge transferred

### Sign-off

- [ ] Senior Test Engineer: _______________ Date: _______
- [ ] Senior Developer: _______________ Date: _______
- [ ] Senior QA: _______________ Date: _______
- [ ] Technical Lead: _______________ Date: _______