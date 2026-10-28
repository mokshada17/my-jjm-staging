# Threat Model Template (STRIDE)

## System: [Name/Component]

**Date**: YYYY-MM-DD
**Author**: [Name]
**Reviewers**: [Senior Architect, Senior Cyber Security, Tech Lead]
**Version**: 1.0

### System Overview

**Purpose**: [What does this system do?]
**Actors**: [Users, services, external systems]
**Data Classification**: [Public, Internal, Confidential, Restricted]
**Compliance Scope**: [PCI, HIPAA, SOC2, GDPR, etc.]

### Data Flow Diagram

```
[External User] --> [API Gateway] --> [Service A] --> [Database]
                        |                   |
                        v                   v
                  [Auth Service]      [Cache/Queue]
```

### Trust Boundaries

| Boundary | Description | Controls |
|----------|-------------|----------|
| Network DMZ | Internet-facing | WAF, Rate limiting, TLS 1.3 |
| Service Mesh | Inter-service | mTLS, AuthZ policies |
| Data Layer | Database access | Encryption, Least privilege |

### STRIDE Analysis

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|-----------------|-----|-----------|
| API Gateway | M: mTLS, JWT | M: Signature | M: Audit logs | M: Encryption | M: Rate limit | M: RBAC |
| Service A | M: SPIFFE | M: Input validation | M: Audit logs | M: Field-level encryption | M: Circuit breaker | M: Least privilege |
| Database | M: Cert auth | M: Parameterized queries | M: Immutable logs | M: TDE, Column encryption | M: Connection pooling | M: Role separation |

**Rating**: H=High, M=Medium, L=Low (Likelihood × Impact)

### Threat Scenarios

| ID | Threat | STRIDE | Likelihood | Impact | Risk | Mitigation | Owner | Status |
|----|--------|--------|------------|--------|------|------------|-------|--------|
| T-001 | JWT token theft | Spoofing | Medium | High | High | Short expiry, refresh rotation, device binding | Dev | Open |
| T-002 | SQL injection | Tampering | Low | Critical | High | Parameterized queries, ORM, WAF | Dev | Mitigated |
| T-003 | Data exfiltration | Info Disclosure | Medium | High | High | DLP, Encryption, Access logging | Sec | Open |

### Security Requirements

**Functional:**
- [ ] Authentication: MFA, passwordless, session management
- [ ] Authorization: ABAC, resource-level permissions
- [ ] Audit: Immutable logs, tamper evidence, retention
- [ ] Encryption: At rest (AES-256), In transit (TLS 1.3)

**Non-Functional:**
- [ ] Vulnerability scanning: SAST/DAST/SCA in pipeline
- [ ] Penetration testing: Annual + major changes
- [ ] Incident response: Runbook, MTTR < 4hr
- [ ] Compliance: Evidence collection automated

### Residual Risk Acceptance

| Risk | Residual Level | Accepted By | Date | Review Date |
|------|----------------|-------------|------|-------------|
| [Risk description] | Medium | [Tech Lead] | YYYY-MM-DD | YYYY-MM-DD |

### Sign-off

- [ ] Senior Architect: _______________ Date: _______
- [ ] Senior Cyber Security: _______________ Date: _______
- [ ] Technical Lead: _______________ Date: _______