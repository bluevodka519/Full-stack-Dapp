// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title DAppToken
 * @dev ERC20 Token implementation with additional features for DApp demonstration
 * @author Full-Stack DApp Demo
 */
contract DAppToken {
    // Token metadata
    string public name = "DApp Demo Token";
    string public symbol = "DDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    // Owner of the contract
    address public owner;
    
    // Mapping from account addresses to current balance
    mapping(address => uint256) public balanceOf;
    
    // Mapping from account to spender approvals
    mapping(address => mapping(address => uint256)) public allowance;
    
    // Events as per ERC20 standard
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Additional events for enhanced functionality
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "DAppToken: caller is not the owner");
        _;
    }
    
    modifier validAddress(address _address) {
        require(_address != address(0), "DAppToken: invalid address");
        _;
    }
    
    /**
     * @dev Constructor that gives msg.sender all of existing tokens
     * @param _initialSupply Initial supply of tokens (in wei, 18 decimals)
     */
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply;
        balanceOf[msg.sender] = _initialSupply;
        emit Transfer(address(0), msg.sender, _initialSupply);
    }
    
    /**
     * @dev Transfer tokens from caller to another address
     * @param _to Recipient address
     * @param _value Amount to transfer
     * @return success Boolean indicating success
     */
    function transfer(address _to, uint256 _value) 
        public 
        validAddress(_to) 
        returns (bool success) 
    {
        require(balanceOf[msg.sender] >= _value, "DAppToken: insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    /**
     * @dev Approve spender to transfer tokens on behalf of caller
     * @param _spender Address authorized to spend
     * @param _value Amount authorized to spend
     * @return success Boolean indicating success
     */
    function approve(address _spender, uint256 _value) 
        public 
        validAddress(_spender) 
        returns (bool success) 
    {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /**
     * @dev Transfer tokens from one address to another (requires approval)
     * @param _from Source address
     * @param _to Destination address
     * @param _value Amount to transfer
     * @return success Boolean indicating success
     */
    function transferFrom(address _from, address _to, uint256 _value) 
        public 
        validAddress(_from) 
        validAddress(_to) 
        returns (bool success) 
    {
        require(balanceOf[_from] >= _value, "DAppToken: insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "DAppToken: insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * @param _to Address to receive minted tokens
     * @param _value Amount to mint
     */
    function mint(address _to, uint256 _value) 
        public 
        onlyOwner 
        validAddress(_to) 
    {
        require(_value > 0, "DAppToken: mint amount must be positive");
        
        totalSupply += _value;
        balanceOf[_to] += _value;
        
        emit Mint(_to, _value);
        emit Transfer(address(0), _to, _value);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param _value Amount to burn
     */
    function burn(uint256 _value) public {
        require(balanceOf[msg.sender] >= _value, "DAppToken: insufficient balance to burn");
        require(_value > 0, "DAppToken: burn amount must be positive");
        
        balanceOf[msg.sender] -= _value;
        totalSupply -= _value;
        
        emit Burn(msg.sender, _value);
        emit Transfer(msg.sender, address(0), _value);
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) 
        public 
        onlyOwner 
        validAddress(_newOwner) 
    {
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
    
    /**
     * @dev Get token balance of an address
     * @param _owner Address to query
     * @return balance Token balance
     */
    function getBalance(address _owner) public view returns (uint256 balance) {
        return balanceOf[_owner];
    }
    
    /**
     * @dev Get allowance amount
     * @param _owner Address of token owner
     * @param _spender Address of spender
     * @return remaining Remaining allowance
     */
    function getAllowance(address _owner, address _spender) 
        public 
        view 
        returns (uint256 remaining) 
    {
        return allowance[_owner][_spender];
    }
}
