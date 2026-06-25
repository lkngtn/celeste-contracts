const { ZERO_ADDRESS } = require('@aragon/contract-helpers-test')

module.exports = (web3, artifacts) => {
  class IdentityHelper {
    constructor(web3, artifacts) {
      this.web3 = web3
      this.artifacts = artifacts
      this.registeredIdentities = new Set()
    }

    async deploy() {
      const IdentityRegistryMock = this.artifacts.require('IdentityRegistryMock')
      this.identityRegistry = await IdentityRegistryMock.new()
      return this.identityRegistry
    }

    async registerUser(userUniqueAddress) {
      await this.registerUserWithData([userUniqueAddress], ZERO_ADDRESS, '0x0')
    }

    async registerUsers(usersUniqueAddresses) {
      for (const userUniqueAddress of usersUniqueAddresses) await this.registerUser(userUniqueAddress)
    }

    async registerUserWithData(userAddresses, contractAddress, data) {
      const uniqueAddress = userAddresses[userAddresses.length - 1]
      await this.identityRegistry.registerWithData(userAddresses, contractAddress, data)
      this.registeredIdentities.add(uniqueAddress.toLowerCase())
    }

    async registerUserWithMultipleAddresses(userUniqueAddress, userSecondAddress) {
      await this.registerUserWithData([userSecondAddress, userUniqueAddress], ZERO_ADDRESS, '0x0')
    }

    async registerUsersWithMultipleAddresses(usersAddresses) {
      for (const userAddresses of usersAddresses) {
        await this.registerUserWithMultipleAddresses(userAddresses[0], userAddresses[1])
      }
    }

    async expireVerifiedUsers() {
      for (const identity of this.registeredIdentities) await this.identityRegistry.revoke(identity)
    }
  }

  return { buildIdentityHelper: () => new IdentityHelper(web3, artifacts) }
}
