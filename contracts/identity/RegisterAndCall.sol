pragma solidity ^0.5.8;

contract RegisterAndCall {
    /**
    * @dev Generic registry callback for registry implementations that support
    *      registration and contract interaction in a single transaction.
    *      Implementers must check msg.sender is the expected identity registry.
    */
    function receiveRegistration(address _usersSenderAddress, address _usersUniqueId, bytes calldata _data) external;
}
