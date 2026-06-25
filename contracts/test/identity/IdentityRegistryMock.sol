pragma solidity ^0.5.8;

import "../../identity/RegisterAndCall.sol";

contract IdentityRegistryMock {
    mapping(address => address) internal identitiesByAccount;
    mapping(address => bool) internal verifiedIdentities;

    event IdentityVerified(address indexed identity);
    event AccountLinked(address indexed account, address indexed identity);
    event IdentityRevoked(address indexed identity);

    function verify(address _identity, address[] memory _accounts) public {
        verifiedIdentities[_identity] = true;
        emit IdentityVerified(_identity);
        for (uint256 i = 0; i < _accounts.length; i++) {
            identitiesByAccount[_accounts[i]] = _identity;
            emit AccountLinked(_accounts[i], _identity);
        }
    }

    function registerWithData(address[] memory _accounts, address _contractAddress, bytes memory _data) public {
        address identity = _accounts[_accounts.length - 1];
        verify(identity, _accounts);
        if (_contractAddress != address(0)) {
            RegisterAndCall(_contractAddress).receiveRegistration(_accounts[0], identity, _data);
        }
    }

    function revoke(address _identity) external {
        verifiedIdentities[_identity] = false;
        emit IdentityRevoked(_identity);
    }

    function isVerified(address _account) external view returns (bool) {
        return verifiedIdentities[identitiesByAccount[_account]];
    }

    function hasUniqueUserId(address _account) external view returns (bool) {
        return identitiesByAccount[_account] != address(0);
    }

    function uniqueUserId(address _account) external view returns (address) {
        return identitiesByAccount[_account];
    }
}
