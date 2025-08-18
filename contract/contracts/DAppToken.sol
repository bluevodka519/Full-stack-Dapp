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

    // Staking functionality
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 duration; // in seconds
        uint256 unlockTime;
        bool claimed;
    }

    mapping(address => StakeInfo[]) public stakes;
    mapping(address => uint256) public totalStaked;
    uint256 public totalStakedSupply;

    // Staking rewards: 5% APY for 1 month, 8% for 3 months, 12% for 6 months, 20% for 1 year
    mapping(uint256 => uint256) public stakingRewards; // duration => reward rate (basis points)
    
    // Events as per ERC20 standard
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Additional events for enhanced functionality
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event EthDeposited(address indexed from, uint256 value);
    event EthWithdrawn(address indexed to, uint256 value);
    event TokensStaked(address indexed user, uint256 amount, uint256 duration, uint256 unlockTime);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 reward);
    
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

        // Initialize staking rewards (basis points: 10000 = 100%)
        stakingRewards[30 days] = 500;   // 5% APY for 1 month
        stakingRewards[90 days] = 800;   // 8% APY for 3 months
        stakingRewards[180 days] = 1200; // 12% APY for 6 months
        stakingRewards[365 days] = 2000; // 20% APY for 1 year

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

    /**
     * @dev Receive ETH deposits
     * Allows the contract to receive ETH directly
     */
    receive() external payable {
        require(msg.value > 0, "DAppToken: deposit amount must be positive");
        emit EthDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function to receive ETH
     * Called when msg.data is not empty
     */
    fallback() external payable {
        require(msg.value > 0, "DAppToken: deposit amount must be positive");
        emit EthDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH from contract (only owner)
     * @param _amount Amount of ETH to withdraw (in wei)
     */
    function withdrawEth(uint256 _amount) external onlyOwner {
        require(_amount > 0, "DAppToken: withdraw amount must be positive");
        require(address(this).balance >= _amount, "DAppToken: insufficient ETH balance");

        payable(owner).transfer(_amount);
        emit EthWithdrawn(owner, _amount);
    }

    /**
     * @dev Withdraw all ETH from contract (only owner)
     */
    function withdrawAllEth() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "DAppToken: no ETH to withdraw");

        payable(owner).transfer(balance);
        emit EthWithdrawn(owner, balance);
    }

    /**
     * @dev Get contract's ETH balance
     * @return balance ETH balance in wei
     */
    function getEthBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }

    /**
     * @dev Emergency withdraw function with safer transfer method
     * @param _amount Amount of ETH to withdraw (in wei)
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount > 0, "DAppToken: withdraw amount must be positive");
        require(address(this).balance >= _amount, "DAppToken: insufficient ETH balance");

        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "DAppToken: ETH transfer failed");

        emit EthWithdrawn(owner, _amount);
    }

    /**
     * @dev Stake tokens for a specific duration
     * @param _amount Amount of tokens to stake
     * @param _duration Duration in seconds (30 days, 90 days, 180 days, or 365 days)
     */
    function stakeTokens(uint256 _amount, uint256 _duration) external {
        require(_amount > 0, "DAppToken: stake amount must be positive");
        require(balanceOf[msg.sender] >= _amount, "DAppToken: insufficient balance");
        require(stakingRewards[_duration] > 0, "DAppToken: invalid staking duration");

        // Transfer tokens from user to contract
        balanceOf[msg.sender] -= _amount;
        totalStaked[msg.sender] += _amount;
        totalStakedSupply += _amount;

        // Create stake record
        uint256 unlockTime = block.timestamp + _duration;
        stakes[msg.sender].push(StakeInfo({
            amount: _amount,
            startTime: block.timestamp,
            duration: _duration,
            unlockTime: unlockTime,
            claimed: false
        }));

        emit TokensStaked(msg.sender, _amount, _duration, unlockTime);
    }

    /**
     * @dev Unstake tokens and claim rewards
     * @param _stakeIndex Index of the stake to unstake
     */
    function unstakeTokens(uint256 _stakeIndex) external {
        require(_stakeIndex < stakes[msg.sender].length, "DAppToken: invalid stake index");

        StakeInfo storage stake = stakes[msg.sender][_stakeIndex];
        require(!stake.claimed, "DAppToken: stake already claimed");
        require(block.timestamp >= stake.unlockTime, "DAppToken: stake still locked");

        uint256 stakedAmount = stake.amount;
        uint256 reward = calculateReward(msg.sender, _stakeIndex);
        uint256 totalReturn = stakedAmount + reward;

        // Mark as claimed
        stake.claimed = true;
        totalStaked[msg.sender] -= stakedAmount;
        totalStakedSupply -= stakedAmount;

        // Return staked tokens + rewards
        balanceOf[msg.sender] += totalReturn;

        emit TokensUnstaked(msg.sender, stakedAmount, reward);
    }

    /**
     * @dev Calculate staking reward for a specific stake
     * @param _user User address
     * @param _stakeIndex Index of the stake
     * @return reward Calculated reward amount
     */
    function calculateReward(address _user, uint256 _stakeIndex) public view returns (uint256 reward) {
        require(_stakeIndex < stakes[_user].length, "DAppToken: invalid stake index");

        StakeInfo memory stake = stakes[_user][_stakeIndex];
        if (stake.claimed) return 0;

        uint256 rewardRate = stakingRewards[stake.duration];
        // Calculate reward: (amount * rate * duration) / (10000 * 365 days)
        reward = (stake.amount * rewardRate * stake.duration) / (10000 * 365 days);

        return reward;
    }

    /**
     * @dev Get user's stake information
     * @param _user User address
     * @return stakeCount Number of stakes
     */
    function getUserStakes(address _user) external view returns (uint256 stakeCount) {
        return stakes[_user].length;
    }

    /**
     * @dev Get specific stake details
     * @param _user User address
     * @param _stakeIndex Stake index
     * @return amount Staked amount
     * @return startTime Stake start time
     * @return duration Stake duration
     * @return unlockTime Unlock time
     * @return claimed Whether claimed
     * @return reward Current reward amount
     */
    function getStakeDetails(address _user, uint256 _stakeIndex)
        external
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 duration,
            uint256 unlockTime,
            bool claimed,
            uint256 reward
        )
    {
        require(_stakeIndex < stakes[_user].length, "DAppToken: invalid stake index");

        StakeInfo memory stake = stakes[_user][_stakeIndex];
        return (
            stake.amount,
            stake.startTime,
            stake.duration,
            stake.unlockTime,
            stake.claimed,
            calculateReward(_user, _stakeIndex)
        );
    }

    /**
     * @dev Get available staking durations and their reward rates
     * @return durations Array of available durations
     * @return rates Array of corresponding reward rates (basis points)
     */
    function getStakingOptions() external view returns (uint256[] memory durations, uint256[] memory rates) {
        durations = new uint256[](4);
        rates = new uint256[](4);

        durations[0] = 30 days;
        durations[1] = 90 days;
        durations[2] = 180 days;
        durations[3] = 365 days;

        rates[0] = stakingRewards[30 days];
        rates[1] = stakingRewards[90 days];
        rates[2] = stakingRewards[180 days];
        rates[3] = stakingRewards[365 days];

        return (durations, rates);
    }
}
