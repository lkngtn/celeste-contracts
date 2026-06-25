const { BN, toWei } = require('web3-utils')

const Celeste = artifacts.require('Celeste')
const DisputeManager = artifacts.require('DisputeManager')
const CRVoting = artifacts.require('CRVoting')
const CourtTreasury = artifacts.require('CourtTreasury')
const JurorsRegistry = artifacts.require('JurorsRegistry')
const CourtSubscriptions = artifacts.require('CourtSubscriptions')
const ERC20Mock = artifacts.require('ERC20Mock')
const IdentityRegistryMock = artifacts.require('IdentityRegistryMock')

const MODULE_IDS = {
  disputes: '0x14a6c70f0f6d449c014c7bbc9e68e31e79e8474fb03b7194df83109a2d888ae6',
  treasury: '0x06aa03964db1f7257357ef09714a5f0ca3633723df419e97015e0c7a3e83edb7',
  voting: '0x7cbb12e82a6d63ff16fe43977f43e3e2b247ecd4e62c0e340da8800a48c67346',
  registry: '0x3b21d36b36308c830e6c4053fb40a3b6d79dde78947fbf6b0accd30720ab5370',
  subscriptions: '0x2bfa3327fe52344390da94c32a346eeb1b65a8b583e4335a419b9471e88c1365',
  identityRegistry: '0x3996d91349e7a673ed7b0e52e2ca432e52722f468cbd3f26bac1c0d9d3f0a17e'
}

const envAddress = (name, fallback) => process.env[name] || fallback
const envBN = (name, fallback) => new BN(process.env[name] || fallback)

async function main() {
  const accounts = await web3.eth.getAccounts()
  const deployer = accounts[0]

  const fundsGovernor = envAddress('FUNDS_GOVERNOR', deployer)
  const configGovernor = envAddress('CONFIG_GOVERNOR', deployer)
  const feesUpdater = envAddress('FEES_UPDATER', deployer)
  const modulesGovernor = envAddress('MODULES_GOVERNOR', deployer)

  const feeToken = process.env.FEE_TOKEN
    ? await ERC20Mock.at(process.env.FEE_TOKEN)
    : await ERC20Mock.new('Court Fee Token', 'CFT', 18)

  const identityRegistry = process.env.IDENTITY_REGISTRY
    ? await IdentityRegistryMock.at(process.env.IDENTITY_REGISTRY)
    : await IdentityRegistryMock.new()

  const termDuration = envBN('TERM_DURATION', 60 * 60 * 24)
  const latestBlock = await web3.eth.getBlock('latest')
  const defaultFirstTermStart = new BN(latestBlock.timestamp).add(termDuration).add(new BN(1))
  const firstTermStartTime = envBN('FIRST_TERM_START_TIME', defaultFirstTermStart.toString())
  const maxJurorsPerDraftBatch = envBN('MAX_JURORS_PER_DRAFT_BATCH', 10)
  const skippedDisputes = envBN('SKIPPED_DISPUTES', 0)

  const jurorFee = envBN('JUROR_FEE', toWei('10'))
  const draftFee = envBN('DRAFT_FEE', toWei('30'))
  const settleFee = envBN('SETTLE_FEE', toWei('40'))
  const maxRulingOptions = envBN('MAX_RULING_OPTIONS', 2)
  const evidenceTerms = envBN('EVIDENCE_TERMS', 4)
  const commitTerms = envBN('COMMIT_TERMS', 2)
  const revealTerms = envBN('REVEAL_TERMS', 2)
  const appealTerms = envBN('APPEAL_TERMS', 2)
  const appealConfirmTerms = envBN('APPEAL_CONFIRM_TERMS', 2)
  const firstRoundJurorsNumber = envBN('FIRST_ROUND_JURORS_NUMBER', 3)
  const appealStepFactor = envBN('APPEAL_STEP_FACTOR', 3)
  const maxRegularAppealRounds = envBN('MAX_REGULAR_APPEAL_ROUNDS', 2)
  const finalRoundLockTerms = envBN('FINAL_ROUND_LOCK_TERMS', 10)
  const penaltyPct = envBN('PENALTY_PCT', 100)
  const finalRoundReduction = envBN('FINAL_ROUND_REDUCTION', 3300)
  const appealCollateralFactor = envBN('APPEAL_COLLATERAL_FACTOR', 25000)
  const appealConfirmCollateralFactor = envBN('APPEAL_CONFIRM_COLLATERAL_FACTOR', 35000)
  const minActiveBalance = envBN('MIN_ACTIVE_BALANCE', toWei('100'))
  const minMaxPctTotalSupply = envBN('MIN_MAX_PCT_TOTAL_SUPPLY', toWei('0.001'))
  const maxMaxPctTotalSupply = envBN('MAX_MAX_PCT_TOTAL_SUPPLY', toWei('0.01'))
  const feeTokenTotalSupply = envBN('FEE_TOKEN_TOTAL_SUPPLY', 0)
  const totalActiveBalanceLimit = envBN('TOTAL_ACTIVE_BALANCE_LIMIT', minActiveBalance.mul(new BN('18446744073709551615')).div(new BN(1000)))
  const subscriptionPeriodDuration = envBN('SUBSCRIPTION_PERIOD_DURATION', 10)
  const periodPercentageYield = envBN('PERIOD_PERCENTAGE_YIELD', toWei('0.02'))

  const court = await Celeste.new(
    [termDuration, firstTermStartTime],
    [fundsGovernor, configGovernor, feesUpdater, modulesGovernor],
    feeToken.address,
    [jurorFee, draftFee, settleFee],
    maxRulingOptions,
    [evidenceTerms, commitTerms, revealTerms, appealTerms, appealConfirmTerms, firstRoundJurorsNumber, appealStepFactor, maxRegularAppealRounds, finalRoundLockTerms],
    [penaltyPct, finalRoundReduction],
    [appealCollateralFactor, appealConfirmCollateralFactor],
    [minActiveBalance, minMaxPctTotalSupply, maxMaxPctTotalSupply, feeTokenTotalSupply]
  )

  const disputeManager = await DisputeManager.new(court.address, maxJurorsPerDraftBatch, skippedDisputes)
  const voting = await CRVoting.new(court.address)
  const treasury = await CourtTreasury.new(court.address)
  const jurorsRegistry = await JurorsRegistry.new(court.address, totalActiveBalanceLimit)
  const subscriptions = await CourtSubscriptions.new(court.address, subscriptionPeriodDuration, feeToken.address, periodPercentageYield)

  await court.setModules(
    Object.values(MODULE_IDS),
    [disputeManager.address, treasury.address, voting.address, jurorsRegistry.address, subscriptions.address, identityRegistry.address],
    { from: modulesGovernor }
  )

  console.log(JSON.stringify({
    network: network.name,
    deployer,
    court: court.address,
    disputeManager: disputeManager.address,
    voting: voting.address,
    treasury: treasury.address,
    jurorsRegistry: jurorsRegistry.address,
    subscriptions: subscriptions.address,
    identityRegistry: identityRegistry.address,
    feeToken: feeToken.address,
    governors: { fundsGovernor, configGovernor, feesUpdater, modulesGovernor }
  }, null, 2))
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error)
  process.exit(1)
})
