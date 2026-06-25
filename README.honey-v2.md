# Honey v2 Celeste fork

This directory vendors `1Hive/celeste-contracts` as the production Celeste baseline for Honey v2.

## Identity-registry changes

Changes from upstream made in this workspace:

- Removed the BrightID-specific contract dependency from `contracts/` and tests.
- Added `contracts/identity/IIdentityRegistry.sol` as the provider-neutral identity registry interface.
- Added `contracts/identity/RegisterAndCall.sol` as a generic optional registry callback.
- Added `contracts/test/identity/IdentityRegistryMock.sol` for tests and local deployments.
- Renamed controller module plumbing from `BRIGHTID_REGISTER` to `IDENTITY_REGISTRY`.
- Updated controller getter plumbing to `getIdentityRegistry()` / `_identityRegistry()`.
- Updated `JurorsRegistry` to use `identityActiveStake` and `_identityRegistry().uniqueUserId(...)`.
- Added an explicit `_identityRegistry().isVerified(_juror)` check before juror activation.
- Ported the old BrightID test helper/tests to the generic identity helper.

The fork intentionally keeps the rest of Celeste/Aragon Court machinery intact: dispute manager, court clock/config, juror registry/sortition, CRVoting, treasury, subscriptions, commit/reveal, appeals, and fee/slashing flows.

## Test commands

Install dependencies once:

```sh
npm install --legacy-peer-deps
```

Compile:

```sh
npm run compile
```

Run the Honey v2 fork test suite:

```sh
npm test
```

Current expected result:

```text
1073 passing
```

Notes:

- `npm test` runs the identity-registry fork suite plus registry/controller/subscriptions/fees-updater coverage.
- Legacy gas snapshots are intentionally not part of default `npm test`; run `npm run test:gas` separately if needed. Gas thresholds are inherited from upstream and may need recalibration after identity-registry changes.
- A very broad upstream legacy run is available with `npm run test:full:legacy`, but it is slow and includes historical benchmark tests.

## Deploy dry run

```sh
npm run deploy:identity-fork
```

This deploys to the default Buidler EVM and prints the deployed module addresses.

For a real network, pass Buidler network args and environment variables. The deploy script supports:

- `FEE_TOKEN` — existing court/staking fee token; if omitted, deploys `ERC20Mock` for local/test use.
- `IDENTITY_REGISTRY` — existing provider-neutral identity registry; if omitted, deploys `IdentityRegistryMock` for local/test use.
- `FUNDS_GOVERNOR`, `CONFIG_GOVERNOR`, `FEES_UPDATER`, `MODULES_GOVERNOR`.
- Celeste config env vars documented in `scripts/deploy-honey-v2-celeste.js`.

Example:

```sh
FEE_TOKEN=0x... \
IDENTITY_REGISTRY=0x... \
MODULES_GOVERNOR=0x... \
npx buidler run scripts/deploy-honey-v2-celeste.js --network <network>
```

## Deployment status

The fork compiles, the identity-registry test suite passes, and the deploy script dry-runs successfully on Buidler EVM. Before mainnet deployment, configure real governors, fee/staking token, and production identity registry addresses.
