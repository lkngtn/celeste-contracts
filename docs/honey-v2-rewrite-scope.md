# Honey v2 Celeste rewrite scope

## Direction

Honey v2 should aim for a full contract rewrite rather than a minimal BrightID compatibility patch.

The goal is not to preserve Celeste's old code shape. The goal is to preserve and simplify the mechanism:

- sybil-resistant keeper eligibility
- staked juror participation
- sortition-based drafting
- commit/reveal voting where appropriate
- dispute finality and rulings
- incentives, rewards, and slashing
- optimistic registry membership governed by Celeste

The existing Celeste/Aragon Court contracts remain the reference implementation and mechanism baseline, but the Honey v2 implementation should be clean, modern, and easier to audit.

## Why rewrite

A compatibility-only fork keeps too much legacy shape:

- BrightID-era `uniqueUserId` plumbing
- old Buidler/Truffle tooling
- Solidity `0.5.8` constraints
- hard minimum/maximum stake assumptions
- complex historical module boundaries that may not match Honey v2

Honey v2 wants simpler primitives:

- `IdentityRegistry` as a challengeable address registry
- minimum stake to prevent dust participation
- no hard maximum stake
- sublinear/quadratic effective stake weight
- cleaner optimistic application/challenge flows
- modern Solidity and test tooling

Because those changes touch core staking/sortition assumptions, they should be designed as a rewrite and audited as such rather than presented as a small audited-code-preserving diff.

## Non-goals

The rewrite should not expand scope into unrelated governance features:

- no Conviction Voting rewrite
- no QCV/common-pool redesign in this repo
- no multi-DAO Gardens framework
- no metadata/proof storage in `IdentityRegistry`
- no on-chain identity graph or account-linking system
- no attempt to preserve bytecode or storage compatibility with old Celeste deployments

## Core architecture

```text
IdentityRegistry
  - challengeable address registry
  - answers whether an address is eligible
  - no on-chain proof metadata

StakeRegistry / JurorsRegistry
  - verified addresses can stake and activate
  - minimum active stake remains
  - no hard maximum active stake
  - effective weight = sublinear function of active stake

Sortition
  - drafts jurors by effective weight, not raw stake

DisputeManager
  - manages evidence windows, rounds, appeals, finality

Voting
  - commit/reveal or selected final voting mechanism

Treasury / Fees / Rewards
  - handles dispute fees, juror rewards, and slashing
```

## Identity registry model

`IdentityRegistry` remains the right name, but the on-chain model is only address membership.

The registry should expose a minimal interface:

```solidity
interface IIdentityRegistry {
    function isVerified(address account) external view returns (bool);
}
```

Target flow:

1. An address applies by posting collateral.
2. A challenge period starts.
3. If unchallenged, the address becomes verified.
4. If challenged, Celeste arbitrates the application.
5. Existing verified addresses can be challenged with collateral.
6. If the member fails to respond or loses arbitration, the address is removed.

Evidence/proofs are coordinated off-chain by keepers and do not need an on-chain metadata field.

## Staking model

Honey v2 should keep a minimum active stake and remove the hard maximum active stake.

Instead of a max cap, use sublinear effective stake weight:

```text
activeStake = raw tokens at risk
effectiveWeight = f(activeStake)
```

Initial candidate:

```text
effectiveWeight = sqrt(activeStake)
```

Design goals:

- larger stakers still earn more total revenue
- marginal ROI declines as stake grows
- diverse participation is encouraged by market forces
- dust participation is limited by the minimum stake and registry application economics
- stake at risk remains economically meaningful

Open questions:

- exact curve: `sqrt(stake)` vs configurable exponent/step curve
- whether rewards are based on effective weight, drafted duties, or raw stake exposure
- whether slashing is per-duty fixed, raw-stake proportional, or locked-amount based
- whether effective weights are computed live or cached on activation changes

## Rewrite strategy

### Phase 1 — tooling and scaffolding

- Move from Buidler to modern Hardhat or Foundry.
- Use Solidity `0.8.x` for rewritten contracts.
- Keep old Celeste tests as behavioral reference where practical.
- Add new unit tests around simplified registry and quadratic stake weighting.

### Phase 2 — clean identity registry

- Implement minimal `IIdentityRegistry`.
- Add bootstrap/import path with explicit sunset.
- Add collateralized application flow.
- Add challenge/removal flow.
- Wire challenged registry actions to Celeste once arbitration core exists.

### Phase 3 — staking and sortition rewrite

- Implement stake activation for verified addresses only.
- Keep minimum active stake.
- Remove maximum active stake.
- Track raw active stake and effective weight separately.
- Draft jurors by effective weight.
- Test concentration and edge cases extensively.

### Phase 4 — dispute/voting/rewards core

- Rebuild only the necessary Celeste/Court mechanism pieces.
- Preserve mechanism-level behavior from the old contracts where still desired.
- Simplify module boundaries where possible.
- Revisit appeals, fee accounting, evidence windows, and slashing with the new staking model.

### Phase 5 — integration and audit

- Integrate registry challenges with the dispute lifecycle.
- Run differential/mechanism tests against old Celeste where meaningful.
- Add invariant/fuzz tests for stake accounting, sortition weights, and slashing.
- Commission a new audit; do not rely on the old audit for rewritten contracts.

## Compatibility posture

The current `honey-v2-identity-registry` patch branch remains useful as:

- a research diff showing where BrightID touched old Celeste
- a test/reference baseline
- a deployable interim experiment if needed

But the production Honey v2 target should be a new implementation branch that does not preserve BrightID compatibility cruft.

Suggested branch name:

```text
honey-v2-rewrite
```

## Immediate next decisions

1. Hardhat vs Foundry for the rewrite.
2. Solidity version target, likely latest stable `0.8.x`.
3. Minimal dispute lifecycle to implement first.
4. Exact effective stake weighting function.
5. Registry collateral token and challenge/default timing.
6. Which old Celeste tests should become behavioral regression tests.
