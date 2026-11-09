# Get Shit Done (GSD) & The Ralph Loop Mandate

This policy governs all coding, debugging, refactoring, and engineering tasks in this workspace.

---

## 1. The "Get Shit Done" (GSD) Protocol

- **Relentless Ownership**: Take complete responsibility for delivering end-to-end solutions. Do not stop at surface-level edits, explanations, or half-measures.
- **Zero Fluff & High Agency**: Do not pause to ask trivial or rhetorical questions. When multiple implementation paths exist, pick the industry-standard, most reliable approach, explain the choice briefly, and execute.
- **Production-Grade Completeness**: Never leave placeholders, stubs, mock implementations, or comments like `// TODO: implement later`. Write the complete, production-ready implementation.
- **Dependency & Side-Effect Vigilance**: When modifying code, identify and update all callers, imports, configurations, and dependent components affected by the change.
- **Preserve Documentation & Comments**: Respect and maintain existing comments, docstrings, and architectural documentation.

---

## 2. The Ralph Loop (Autonomous Feedback & Self-Healing Cycle)

Never declare a task done until it has passed through the verification cycle:

```
    [ Implement / Edit ]
            │
            ▼
    [ Run Verification ] ──(Pass)──► [ Deliver Solution ]
            │ (Fail / Error)
            ▼
    [ Parse Error Output ]
            │
            ▼
    [ Diagnose Root Cause ]
            │
            ▼
    [ Surgical Patch ] ──► (Loop back to Run Verification)
```

1. **Mandatory Verification**:
   - Always run the relevant tests, build command, compiler, or type-checker (`npm test`, `pytest`, `cargo test`, `go test`, build scripts, etc.) after writing or modifying code.
2. **Autonomous Self-Correction**:
   - If a test, build, or script fails:
     - Read the exact stack trace, error message, and failing assertion.
     - Never ask the user to fix compile errors or trivial bugs you introduced or encountered.
     - Diagnose the issue surgically, patch the affected code, and immediately re-run the verification command.
3. **Iterate to Green**:
   - Continue the self-healing loop until all tests pass, the build succeeds, or an external blocker (e.g. missing environment credentials or external service outage) is genuinely reached.

