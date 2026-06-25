const { assertRevert } = require('@aragon/contract-helpers-test/src/asserts')
const { bigExp, bn } = require('./helpers/lib/numbers')
const { buildHelper } = require('./helpers/wrappers/court')(web3, artifacts)

contract('Honey v2 identity registry fork', ([_, verifiedJuror, unverifiedJuror]) => {
  let courtHelper, registry, token

  beforeEach(async () => {
    courtHelper = buildHelper()
    await courtHelper.deploy({
      juror: verifiedJuror,
      minMaxPctTotalSupply: bigExp(1, 16),
      maxMaxPctTotalSupply: bigExp(1, 18)
    })
    registry = courtHelper.jurorsRegistry
    token = courtHelper.feeToken
  })

  async function stake(juror, amount) {
    await token.generateTokens(juror, amount)
    await token.approve(registry.address, amount, { from: juror })
    await registry.stake(amount, '0x', { from: juror })
  }

  it('allows an identity-verified juror to stake and activate', async () => {
    const amount = courtHelper.minActiveBalance
    await stake(verifiedJuror, amount)

    await registry.activate(amount, { from: verifiedJuror })

    const totalActiveStake = await registry.jurorsTotalActiveStake(verifiedJuror)
    assert(totalActiveStake.eq(amount), 'verified identity active stake not tracked')
  })

  it('rejects activation for accounts not verified by the identity registry', async () => {
    const amount = courtHelper.minActiveBalance
    await stake(unverifiedJuror, amount)

    await assertRevert(registry.activate(amount, { from: unverifiedJuror }), 'JR_IDENTITY_NOT_VERIFIED')
  })

  it('aggregates active stake by identity across multiple accounts', async () => {
    const identity = verifiedJuror
    const secondAccount = unverifiedJuror
    await courtHelper.identityHelper.registerUserWithMultipleAddresses(identity, secondAccount)

    const amount = courtHelper.minActiveBalance
    await stake(verifiedJuror, amount)
    await stake(secondAccount, amount)

    await registry.activate(amount, { from: verifiedJuror })
    await registry.activate(amount, { from: secondAccount })

    const identityStakeFromFirst = await registry.jurorsTotalActiveStake(verifiedJuror)
    const identityStakeFromSecond = await registry.jurorsTotalActiveStake(secondAccount)
    assert(identityStakeFromFirst.eq(amount.mul(bn(2))), 'first account identity stake mismatch')
    assert(identityStakeFromSecond.eq(identityStakeFromFirst), 'same identity should expose same total active stake')
  })
})
