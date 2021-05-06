pragma ton-solidity >=0.36.0;
pragma AbiHeader expire;
pragma AbiHeader time;

enum ContractType {
    Demiurge,
    Proposal,
    Padawan,
    DemiurgeDebot,
    VotingDebot
}

interface IDemiurgeStoreCallback {
    function updateABI(ContractType kind, string sabi) external;
    function updateImage(ContractType kind, TvmCell image) external;
}

contract DemiurgeStore {

    mapping(uint8 => string) public abis;

    mapping(uint8 => TvmCell) public images;

    modifier signed() {
        require(tvm.pubkey() == msg.pubkey(), 100);
        tvm.accept();
        _;
    }

    function setPadawanABI(string sabi) public signed {
        abis[uint8(ContractType.Padawan)] = sabi;
    }

    function setDemiurgeABI(string sabi) public signed {
        abis[uint8(ContractType.Demiurge)] = sabi;
    }

    function setProposalABI(string sabi) public signed {
        abis[uint8(ContractType.Proposal)] = sabi;
    }

    function setPadawanImage(TvmCell image) public signed {
        images[uint8(ContractType.Padawan)] = image;
    }

    function setProposalImage(TvmCell image) public signed {
        images[uint8(ContractType.Proposal)] = image;
    }

    function setDemiurgeImage(TvmCell image) public signed {
        images[uint8(ContractType.Demiurge)] = image;
    }

    /*
     *  Query Store functions
     */

    function queryABI(ContractType kind) public view {
        string sabi = abis[uint8(kind)];
        IDemiurgeStoreCallback(msg.sender).updateABI{value: 0, flag: 64, bounce: false}(kind, sabi);
    }

    function queryImage(ContractType kind) public view {
        TvmCell image = images[uint8(kind)];
        IDemiurgeStoreCallback(msg.sender).updateImage{value: 0, flag: 64, bounce: false}(kind, image);
    }
}