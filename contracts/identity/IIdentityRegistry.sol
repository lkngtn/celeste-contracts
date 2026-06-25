pragma solidity ^0.5.8;

/**
 * @dev Provider-neutral identity registry used by Celeste v2 for sybil resistance.
 * The interface intentionally preserves the legacy identity register shape to keep
 * the Celeste fork small while allowing any registry implementation behind it.
 */
contract IIdentityRegistry {
    function isVerified(address _account) external view returns (bool);
    function hasUniqueUserId(address _account) external view returns (bool);
    function uniqueUserId(address _account) external view returns (address);
}
