pragma ton-solidity >= 0.36.0;
pragma msgValue 2e7;

contract Base {

    uint16 constant ERROR_DIFFERENT_CALLER =  211;

    uint64 constant START_BALANCE       = 3 ton;
    uint64 constant DEPLOYER_FEE        = 0.1 ton;
    uint64 constant PROCESS_FEE         = 0.3 ton;
    uint64 constant DEPLOY_FEE          = START_BALANCE + DEPLOYER_FEE;
    uint64 constant DEPLOY_PAY          = DEPLOY_FEE + PROCESS_FEE;
    uint64 constant DEPLOY_PROPOSAL_FEE = 3 ton;
    uint64 constant DEPLOY_PROPOSAL_PAY = DEPLOY_PROPOSAL_FEE + PROCESS_FEE;
    uint64 constant DEPOSIT_TONS_FEE    = 1 ton;
    uint64 constant DEPOSIT_TONS_PAY    = DEPOSIT_TONS_FEE + PROCESS_FEE;
    uint64 constant DEPOSIT_TOKENS_FEE  = 0.5 ton + DEPOSIT_TONS_FEE;
    uint64 constant DEPOSIT_TOKENS_PAY  = DEPOSIT_TOKENS_FEE + PROCESS_FEE;
    uint64 constant TOKEN_ACCOUNT_FEE   = 2 ton;
    uint64 constant TOKEN_ACCOUNT_PAY   = TOKEN_ACCOUNT_FEE + PROCESS_FEE;
    uint64 constant QUERY_STATUS_FEE    = 0.02 ton;
    uint64 constant QUERY_STATUS_PAY    = QUERY_STATUS_FEE + DEF_RESPONSE_VALUE;

    uint64 constant DEF_RESPONSE_VALUE = 0.03 ton;
    uint64 constant DEF_COMPUTE_VALUE = 0.2 ton;

    uint16 constant PROPOSAL_HAS_WHITELIST          = 2;    // Limit an ability to vote for the proposal to the selected list of addresses
    uint16 constant PROPOSAL_VOTE_SOFT_MAJORITY     = 4;    // Apply soft majority rules for vote counting
    uint16 constant PROPOSAL_VOTE_SUPER_MAJORITY    = 8;    // Apply super majority rules for vote counting
    uint16 constant PROPOSES_CONTEST                = 16;   // On success, deploy a contest with the supplied parameters

    modifier signed {
        require(msg.pubkey() == tvm.pubkey(), 101);
        tvm.accept();
        _;
    }

    modifier me {
        require(msg.sender == address(this), ERROR_DIFFERENT_CALLER);
        _;
    }

    modifier accept {
        tvm.accept();
        _;
    }
}
