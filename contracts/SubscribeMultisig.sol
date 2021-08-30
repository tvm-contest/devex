pragma ton-solidity >=0.47.0;
pragma AbiHeader time;
pragma AbiHeader pubkey;
pragma AbiHeader expire;
pragma ignoreIntOverflow;

//================================================================================
//
/// @title Subscribe Multisig Wallet
/// @author SuperArmor 
/// @notice Original contract - SafeMultisig by TonLabs (https://github.com/tonlabs/ton-labs-contracts/blob/master/solidity/safemultisig/SafeMultisigWallet.sol)

//================================================================================
//
import "../interfaces/ISubscribeMultisig.sol";
import "../contracts/Subscription.sol";

//================================================================================
//
contract SubscribeMultisig is ISubscribeMultisig
{
    //========================================
    //
    struct Transaction 
    {
        uint64  id;                // Transaction Id.
        uint32  confirmationsMask; // Transaction confirmations from custodians.
        uint8   signsRequired;     // Number of required confirmations.
        uint8   signsReceived;     // Number of confirmations already received.
        uint256 creator;           // Public key of custodian queued transaction.
        uint8   index;             // Index of custodian.
        address dest;              // Destination address of gram transfer.
        uint128 value;             // Amount of nanograms to transfer.
        uint16  sendFlags;         // Flags for sending internal message (see SENDRAWMSG in TVM spec).
        TvmCell payload;           // Payload used as body of outbound internal message.
        bool    bounce;            // Bounce flag for header of outbound internal message.
    }

    //========================================
    // Constants
    uint8   constant MAX_QUEUED_REQUESTS = 5;
    uint64  constant EXPIRATION_TIME     = 3600; // lifetime is 1 hour
    uint8   constant MAX_CUSTODIAN_COUNT = 32;
    uint128 constant MIN_VALUE           = 1e6;
    uint    constant MAX_CLEANUP_TXNS    = 40;

    //========================================
    // Send flags    
    uint8 constant FLAG_PAY_FWD_FEE_FROM_BALANCE = 1;   // Forward fees for message will be paid from contract balance.
    uint8 constant FLAG_IGNORE_ERRORS            = 2;   // Tells node to ignore errors in action phase while outbound messages are sent.
    uint8 constant FLAG_SEND_ALL_REMAINING       = 128; // Tells node to send all remaining balance.

    //========================================
    // Variables
    uint256 m_ownerKey;                            // Public key of custodian who deployed a contract.
    uint256 m_requestsMask;                        // Binary mask with custodian requests (max 32 custodians).
    uint8   m_custodianCount;                      // Read-only custodian count, initiated in constructor.
    uint8   m_defaultRequiredConfirmations;        // Default number of confirmations needed to execute transaction.
    mapping(uint64 => Transaction) m_transactions; // Dictionary of queued transactions waiting confirmations.
    mapping(uint256 => uint8) m_custodians;        // pub_key -> custodian_index: set of custodians, initiated in constructor, but values can be changed later in code.
    TvmCell static _subscriptionCode;

    //========================================
    // Exception codes
    /*
    100 - message sender is not a custodian;
    102 - transaction does not exist;
    103 - operation is already confirmed by this custodian;
    107 - input value is too low;
    108 - wallet should have only one custodian;
    113 - Too many requests for one custodian;
    117 - invalid number of custodians;
    121 - payload size is too big;
    */
    /*
    200 - message sender is not my subscription;
    */

    //========================================
    // Events
    event TransferAccepted(bytes payload);

    //========================================
    // Runtime functions
    function tvm_ctos(TvmCell cell)         private pure returns (uint)       {}
    function tvm_tree_cell_size(uint slice) private pure returns (uint, uint) {}

    //========================================
    // Constructor
    /// @dev Contract constructor.
    /// @param owners Array of custodian keys.
    /// @param reqConfirms Default number of confirmations required for executing transaction.
    constructor(uint256[] owners, uint8 reqConfirms) public 
    {
        require(msg.pubkey() == tvm.pubkey(),                              100);
        require(owners.length > 0 && owners.length <= MAX_CUSTODIAN_COUNT, 117);
        tvm.accept();
        
        uint8 ownerCount = 0;
        m_ownerKey = owners[0];

        for(uint256 key : owners)
        {
            if (!m_custodians.exists(key)) 
            {
                m_custodians[key] = ownerCount++;
            }
        }
        m_defaultRequiredConfirmations = (ownerCount <= reqConfirms ? ownerCount : reqConfirms);
        m_custodianCount = ownerCount;
    }

    //========================================
    // Inline helper macros
    /// @dev Returns queued transaction count by custodian with defined index.
    function _getMaskValue(uint256 mask, uint8 index) inline private pure returns (uint8) 
    {
        return uint8((mask >> (8 * uint256(index))) & 0xFF);
    }

    /// @dev Increment queued transaction count by custodian with defined index.
    function _incMaskValue(uint256 mask, uint8 index) inline private pure returns (uint256) 
    {
        return mask + (1 << (8 * uint256(index)));
    }

    /// @dev Decrement queued transaction count by custodian with defined index.
    function _decMaskValue(uint256 mask, uint8 index) inline private pure returns (uint256) 
    {
        return mask - (1 << (8 * uint256(index)));
    }

    /// @dev Checks bit with defined index in the mask.
    function _checkBit(uint32 mask, uint8 index) inline private pure returns (bool) 
    {
        return (mask & (uint32(1) << index)) != 0;
    }

    /// @dev Checks if object is confirmed by custodian.
    function _isConfirmed(uint32 mask, uint8 custodianIndex) inline private pure returns (bool) 
    {
        return _checkBit(mask, custodianIndex);
    }

    /// @dev Sets custodian confirmation bit in the mask.
    function _setConfirmed(uint32 mask, uint8 custodianIndex) inline private pure returns (uint32) 
    {
        mask |= (uint32(1) << custodianIndex);
        return mask;
    }

    /// @dev Checks that custodian with supplied public key exists in custodian set.
    function _findCustodian(uint256 senderKey) inline private view returns (uint8) 
    {
        require(m_custodians.exists(senderKey), 100);
        return(m_custodians[senderKey]);
    }

    /// @dev Generates new id for object.
    function _generateId() inline private pure returns (uint64) 
    {
        return (uint64(now) << 32) | (tx.timestamp & 0xFFFFFFFF);
    }

    /// @dev Returns timestamp after which transactions are treated as expired.
    function _getExpirationBound() inline private pure returns (uint64) 
    {
        return (uint64(now) - EXPIRATION_TIME) << 32;
    }

    /// @dev Returns transfer flags according to input value and `allBalance` flag.
    function _getSendFlags(uint128 value, bool allBalance) inline private pure returns (uint8, uint128) 
    {        
        uint8 flags = FLAG_IGNORE_ERRORS | FLAG_PAY_FWD_FEE_FROM_BALANCE;
        if(allBalance) 
        {
            flags = FLAG_IGNORE_ERRORS | FLAG_SEND_ALL_REMAINING;
            value = uint128(address(this).balance);
        }
        return (flags, value);
    }

    //========================================
    // Public functions
    /// @dev A payable method for accepting incoming funds. Generates
    /// an event with incoming payload.
    /// @param payload Payload from message body.
    function acceptTransfer(bytes payload) external override 
    {
        emit TransferAccepted(payload);
    }

    /// @dev Allows custodian if she is the only owner of multisig to transfer funds with minimal fees.
    /// @param dest Transfer target address.
    /// @param value Amount of funds to transfer.
    /// @param bounce Bounce flag. Set true if need to transfer funds to existing account;
    /// set false to create new account.
    /// @param flags `sendmsg` flags.
    /// @param payload Tree of cells used as body of outbound internal message.
    function sendTransaction(address dest, uint128 value, bool bounce, uint8 flags, TvmCell payload) public view override
    {
        require(m_custodianCount == 1,          108);
        require(msg.pubkey()     == m_ownerKey, 100);
        tvm.accept();
        dest.transfer(value, bounce, flags, payload);
    }

    /// @dev Allows custodian to submit and confirm new transaction.
    /// @param dest Transfer target address.
    /// @param value Nanograms value to transfer.
    /// @param bounce Bounce flag. Set true if need to transfer grams to existing account; set false to create new account.
    /// @param allBalance Set true if need to transfer all remaining balance.
    /// @param payload Tree of cells used as body of outbound internal message.
    /// @return transId Transaction ID.
    function submitTransaction(address dest, uint128 value, bool bounce, bool allBalance, TvmCell payload) public returns (uint64 transId)
    {
        uint256 senderKey = msg.pubkey();
        uint8   index     = _findCustodian(senderKey);
        require(value >= MIN_VALUE, 107);
        (uint bits, uint cells) = tvm_tree_cell_size(tvm_ctos(payload));
        require(bits < 8192 && cells < 8, 121);
        _removeExpiredTransactions();
        require(_getMaskValue(m_requestsMask, index) < MAX_QUEUED_REQUESTS, 113);
        tvm.accept();

        (uint8 flags, uint128 realValue) = _getSendFlags(value, allBalance);        
        uint8 requiredSigns = m_defaultRequiredConfirmations;

        if (requiredSigns == 1) 
        {
            dest.transfer(realValue, bounce, flags, payload);
            return 0;
        } 
        else 
        {
            m_requestsMask = _incMaskValue(m_requestsMask, index);
            uint64 trId = _generateId();
            Transaction txn = Transaction(trId, 0/*mask*/, requiredSigns, 0/*signsReceived*/,
                senderKey, index, dest, realValue, flags, payload, bounce);

            _confirmTransaction(trId, txn, index);
            return trId;
        }
    }

    /// @dev Allows custodian to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(uint64 transactionId) public 
    {
        uint8 index = _findCustodian(msg.pubkey());
        _removeExpiredTransactions();
        optional(Transaction) txn = m_transactions.fetch(transactionId);
        require(txn.hasValue(), 102);
        require(!_isConfirmed(txn.get().confirmationsMask, index), 103);
        tvm.accept();

        _confirmTransaction(transactionId, txn.get(), index);
    }

    //========================================
    //Internal functions
    /// @dev Confirms transaction by custodian with defined index.
    /// @param transactionId Transaction id to confirm.
    /// @param txn Transaction object to confirm.
    /// @param custodianIndex Index of custodian.
    function _confirmTransaction(uint64 transactionId, Transaction txn, uint8 custodianIndex) inline private 
    {
        if ((txn.signsReceived + 1) >= txn.signsRequired) 
        {
            txn.dest.transfer(txn.value, txn.bounce, txn.sendFlags, txn.payload);
            m_requestsMask = _decMaskValue(m_requestsMask, txn.index);
            delete m_transactions[transactionId];
        } 
        else 
        {
            txn.confirmationsMask = _setConfirmed(txn.confirmationsMask, custodianIndex);
            txn.signsReceived++;
            m_transactions[transactionId] = txn;
        }
    }

    /// @dev Removes expired transactions from storage.
    function _removeExpiredTransactions() inline private 
    {
        uint64 marker = _getExpirationBound();

        uint i = 0;
        for((uint64 trId, Transaction txn) : m_transactions)
        {
            bool needCleanup = trId <= marker;
            if (!needCleanup) { return; }

            tvm.accept();
            
            if(!needCleanup || i >= MAX_CLEANUP_TXNS)
            {
                return;
            }

            m_requestsMask = _decMaskValue(m_requestsMask, txn.index);
            delete m_transactions[trId];
        }
    }

    //========================================
    // Get methods
    /// @dev Helper get-method for checking if custodian confirmation bit is set.
    /// @return confirmed True if confirmation bit is set.
    function isConfirmed(uint32 mask, uint8 index) public pure returns (bool confirmed) 
    {
        confirmed = _isConfirmed(mask, index);
    }

    /// @dev Get-method that returns wallet configuration parameters.
    /// @return maxQueuedTransactions The maximum number of unconfirmed transactions that a custodian can submit.
    /// @return maxCustodianCount The maximum allowed number of wallet custodians.
    /// @return expirationTime Transaction lifetime in seconds.
    /// @return minValue The minimum value allowed to transfer in one transaction.
    /// @return requiredTxnConfirms The minimum number of confirmations required to execute transaction.
    function getParameters() public view returns (uint8 maxQueuedTransactions, uint8 maxCustodianCount, uint64 expirationTime, uint128 minValue, uint8 requiredTxnConfirms) 
    {
        maxQueuedTransactions = MAX_QUEUED_REQUESTS;
        maxCustodianCount     = MAX_CUSTODIAN_COUNT;
        expirationTime        = EXPIRATION_TIME;
        minValue              = MIN_VALUE;
        requiredTxnConfirms   = m_defaultRequiredConfirmations;
    }

    /// @dev Get-method that returns transaction info by id.
    /// @return trans Transaction structure.
    /// Throws exception if transaction does not exist.
    function getTransaction(uint64 transactionId) public view returns (Transaction trans) 
    {
        require(m_transactions.exists(transactionId), 102);
        trans = m_transactions[transactionId];
    }

    /// @dev Get-method that returns array of pending transactions.
    /// Returns not expired transactions only.
    /// @return transactions Array of queued transactions.
    function getTransactions() public view returns (Transaction[] transactions) 
    {
        uint64 bound = _getExpirationBound();
        for((uint64 id, Transaction txn) : m_transactions)
        {
            if (id > bound) 
            {
                transactions.push(txn);
            }
        }
    }

    /// @dev Get-method that returns submitted transaction ids.
    /// @return ids Array of transaction ids.
    function getTransactionIds() public view returns (uint64[] ids) 
    {
        for((uint64 trId, ) : m_transactions)
        {
            ids.push(trId);
        }
    }

    /// @dev Helper structure to return information about custodian.
    /// Used in getCustodians().
    struct CustodianInfo 
    {
        uint8 index;
        uint256 pubkey;
    }

    /// @dev Get-method that returns info about wallet custodians.
    /// @return custodians Array of custodians.
    function getCustodians() public view returns (CustodianInfo[] custodians) 
    {
        for((uint256 key, uint8 index) : m_custodians)
        {
            custodians.push(CustodianInfo(index, key));
        }
    }    

    //========================================
    // Fallback and receive functions to receive simple transfers.
    fallback() external {}
    receive () external {}

    //========================================
    // Subscription functions
    function calculateFutureSubscriptionAddress(address serviceAddress) private inline view returns (address, TvmCell)
    {
        TvmCell stateInit = tvm.buildStateInit({
            contr: Subscription,
            varInit: {
                _walletAddress:  address(this),
                _serviceAddress: serviceAddress
            },
            code: _subscriptionCode
        });

        return (address(tvm.hash(stateInit)), stateInit);
    }

    //========================================
    // Current implementation requires only one custodian ownership to create a subscription;
    // Multi-custodian Multisigs are not supported, but can be in the future.
    function createSubscription(address serviceAddress, uint256 planID, uint32 period, uint32 periodPrice) external override 
    { 
        require(m_custodianCount == 1,          108);
        require(msg.pubkey()     == m_ownerKey, 100);

        tvm.accept();
        (address subscriptionAddress, TvmCell stateInit) = calculateFutureSubscriptionAddress(serviceAddress);

        new Subscription{value: gasToValue(500000, address(this).wid), bounce: false, stateInit: stateInit}();
        ISubscription(subscriptionAddress).createSubscription{value: periodPrice, flag: 1}(planID, period, periodPrice);
    }

    function subscriptionPaymentRequested(address serviceAddress, uint128 periodPrice) external override 
    {
        (address subscriptionAddress, ) = calculateFutureSubscriptionAddress(serviceAddress);
        require(msg.sender == subscriptionAddress, 200);

        tvm.accept();

        subscriptionAddress.transfer(periodPrice, true, 1); // flag:1 because Subscription contract needs to get the exact amount.
                                                            // We will bounce if there's not enough balance, this is expected; Subscription will catch the bounce.
    }
}

//================================================================================
//
