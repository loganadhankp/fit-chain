// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HealthInsuranceNFT
 * @notice Dynamic NFT representing health insurance policies.
 *         Metadata updates based on oracle-verified health data from wearables.
 * @dev ERC-721 with role-based access, pausability, and reentrancy protection.
 */
contract HealthInsuranceNFT is ERC721, AccessControl, Pausable, ReentrancyGuard {
    // ---------------------------------------------------------------
    //  Roles
    // ---------------------------------------------------------------
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");

    // ---------------------------------------------------------------
    //  Data structures
    // ---------------------------------------------------------------
    struct PolicyData {
        uint256 policyId;
        address policyHolder;
        uint256 basePremium;        // in wei
        uint256 healthScore;        // 0-100
        uint256 discountPercentage; // 0-20
        uint256 coverageTier;       // 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Platinum
        uint256 lastUpdated;
        bool    isActive;
        string  ipfsMetadataHash;
    }

    // ---------------------------------------------------------------
    //  State
    // ---------------------------------------------------------------
    uint256 private _nextTokenId = 1;

    mapping(uint256 => PolicyData) public policies;
    mapping(address => uint256[])  public userPolicies;
    mapping(uint256 => uint256)    private _lastOracleUpdate; // tokenId => timestamp

    uint256 public constant UPDATE_COOLDOWN = 24 hours;
    uint256 public constant MAX_DISCOUNT    = 20; // 20 %

    // ---------------------------------------------------------------
    //  Events
    // ---------------------------------------------------------------
    event PolicyMinted(uint256 indexed tokenId, address indexed holder, uint256 basePremium);
    event HealthScoreUpdated(uint256 indexed tokenId, uint256 oldScore, uint256 newScore);
    event PremiumUpdated(uint256 indexed tokenId, uint256 newPremium, uint256 discountPercentage);
    event TierUpgraded(uint256 indexed tokenId, uint256 oldTier, uint256 newTier);
    event PolicyPaused(uint256 indexed tokenId);
    event PolicyResumed(uint256 indexed tokenId);
    event PolicyRevoked(uint256 indexed tokenId);

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------
    constructor() ERC721("HealthChain Insurance", "HCI") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ---------------------------------------------------------------
    //  Core – Minting
    // ---------------------------------------------------------------

    /**
     * @notice Mint a new insurance-policy NFT.
     * @param _to          Address of the policy holder.
     * @param _basePremium Base premium in wei.
     * @param _ipfsHash    IPFS CID for the full policy document.
     * @return tokenId     The newly minted token ID.
     */
    function mintPolicy(
        address _to,
        uint256 _basePremium,
        string memory _ipfsHash
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (uint256) {
        require(_to != address(0), "Invalid address");
        require(_basePremium > 0, "Premium must be > 0");

        uint256 tokenId = _nextTokenId++;

        _safeMint(_to, tokenId);

        policies[tokenId] = PolicyData({
            policyId:           tokenId,
            policyHolder:       _to,
            basePremium:        _basePremium,
            healthScore:        0,
            discountPercentage: 0,
            coverageTier:       1, // Bronze
            lastUpdated:        block.timestamp,
            isActive:           true,
            ipfsMetadataHash:   _ipfsHash
        });

        userPolicies[_to].push(tokenId);

        emit PolicyMinted(tokenId, _to, _basePremium);

        return tokenId;
    }

    // ---------------------------------------------------------------
    //  Core – Oracle Health-Score Updates
    // ---------------------------------------------------------------

    /**
     * @notice Update the health score for a policy (oracle-only).
     * @param _tokenId  Token ID of the policy NFT.
     * @param _newScore New health score (0-100).
     */
    function updateHealthScore(
        uint256 _tokenId,
        uint256 _newScore
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(_ownerOf(_tokenId) != address(0), "Policy does not exist");
        require(_newScore <= 100, "Invalid health score");
        require(
            block.timestamp >= _lastOracleUpdate[_tokenId] + UPDATE_COOLDOWN,
            "Update cooldown active"
        );

        PolicyData storage policy = policies[_tokenId];
        require(policy.isActive, "Policy is not active");

        uint256 oldScore = policy.healthScore;
        policy.healthScore   = _newScore;
        policy.lastUpdated   = block.timestamp;
        _lastOracleUpdate[_tokenId] = block.timestamp;

        // Recalculate discount
        uint256 newDiscount = calculateDiscount(_newScore);
        policy.discountPercentage = newDiscount;

        // Check for tier change
        uint256 newTier = calculateTier(_newScore);
        if (newTier != policy.coverageTier) {
            uint256 oldTier = policy.coverageTier;
            policy.coverageTier = newTier;
            emit TierUpgraded(_tokenId, oldTier, newTier);
        }

        emit HealthScoreUpdated(_tokenId, oldScore, _newScore);
        emit PremiumUpdated(_tokenId, getCurrentPremium(_tokenId), newDiscount);
    }

    // ---------------------------------------------------------------
    //  View / Pure helpers
    // ---------------------------------------------------------------

    /**
     * @notice Calculate discount percentage from a health score.
     */
    function calculateDiscount(uint256 _healthScore) public pure returns (uint256) {
        if (_healthScore >= 90) return 20; // 20 %
        if (_healthScore >= 80) return 15; // 15 %
        if (_healthScore >= 70) return 10; // 10 %
        if (_healthScore >= 60) return 5;  //  5 %
        return 0;
    }

    /**
     * @notice Calculate coverage tier from a health score.
     */
    function calculateTier(uint256 _healthScore) public pure returns (uint256) {
        if (_healthScore >= 85) return 4; // Platinum
        if (_healthScore >= 70) return 3; // Gold
        if (_healthScore >= 55) return 2; // Silver
        return 1;                         // Bronze
    }

    /**
     * @notice Get the current premium after applying the discount.
     */
    function getCurrentPremium(uint256 _tokenId) public view returns (uint256) {
        require(_ownerOf(_tokenId) != address(0), "Policy does not exist");
        PolicyData memory policy = policies[_tokenId];
        uint256 discount = (policy.basePremium * policy.discountPercentage) / 100;
        return policy.basePremium - discount;
    }

    /**
     * @notice Return all token IDs owned by a user.
     */
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    // ---------------------------------------------------------------
    //  Admin – Policy lifecycle
    // ---------------------------------------------------------------

    function pausePolicy(uint256 _tokenId) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(_tokenId) != address(0), "Policy does not exist");
        policies[_tokenId].isActive = false;
        emit PolicyPaused(_tokenId);
    }

    function resumePolicy(uint256 _tokenId) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(_tokenId) != address(0), "Policy does not exist");
        policies[_tokenId].isActive = true;
        emit PolicyResumed(_tokenId);
    }

    function revokePolicy(uint256 _tokenId) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_ownerOf(_tokenId) != address(0), "Policy does not exist");
        policies[_tokenId].isActive = false;
        _burn(_tokenId);
        emit PolicyRevoked(_tokenId);
    }

    // ---------------------------------------------------------------
    //  Admin – Oracle management
    // ---------------------------------------------------------------

    function addOracle(address _oracle) external onlyRole(ADMIN_ROLE) {
        grantRole(ORACLE_ROLE, _oracle);
    }

    function removeOracle(address _oracle) external onlyRole(ADMIN_ROLE) {
        revokeRole(ORACLE_ROLE, _oracle);
    }

    // ---------------------------------------------------------------
    //  Admin – Emergency pause
    // ---------------------------------------------------------------

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ---------------------------------------------------------------
    //  Overrides
    // ---------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Keep `policyHolder` and `userPolicies` in sync on transfer.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Skip on mint / burn – only care about real transfers
        if (from != address(0) && to != address(0)) {
            policies[tokenId].policyHolder = to;
            _removeFromUserPolicies(from, tokenId);
            userPolicies[to].push(tokenId);
        }
    }

    // ---------------------------------------------------------------
    //  Internal helpers
    // ---------------------------------------------------------------

    function _removeFromUserPolicies(address _user, uint256 _tokenId) private {
        uint256[] storage tokens = userPolicies[_user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == _tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
}

