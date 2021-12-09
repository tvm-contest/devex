pragma ton-solidity ^0.38.0;
pragma AbiHeader expire;
pragma AbiHeader time;
pragma AbiHeader pubkey;

import "ui/AddressInput.sol";
import "ui/AmountInput.sol";
import "ui/ConfirmInput.sol";
import "ui/Debot.sol";
import "ui/Menu.sol";
import "ui/Sdk.sol";
import "ui/Terminal.sol";

import "./Interfaces.sol";
import "./Libraries.sol";
import "./Structures.sol";

contract DensDebot is Debot, IDataStructs {

    address root;

    constructor(address _root) public {
        require(tvm.pubkey() != 0);
        require(msg.pubkey() == tvm.pubkey());
        tvm.accept();
        root = _root;
    }

    /// @notice Entry point function for DeBot.
    function start() public override {
        Terminal.print(0, "Welcome to the DeNS debot!");
        Terminal.print(0, "Please select your option:");
        Menu.select ("Options",     "Available debot actions", [
            MenuItem("Resolve",     "Resolve an address",        tvm.functionId(mi_Resolve)),
            MenuItem("Root",        "Operating the DeNS root",   tvm.functionId(mi_Root)),
            MenuItem("Certificate", "Working with certificates", tvm.functionId(mi_Certificate)),
            MenuItem("Auction",     "Interaction with auctions", tvm.functionId(mi_Auction)),
            MenuItem("Quit", "", 0)
        ]);
    }

    function mi_Resolve(uint32 index) public {
        require(index >= 0); // silence
        Terminal.inputStr(tvm.functionId(mi_Resolve_1), "Domain name:", false);
    }

    string[] chain;
    address curr_p;
    uint curr_i;
    function mi_Resolve_1(string value) public {
        string st = value;
        Terminal.print(0, format("Resolving {}...", st));
        uint l = st.byteLength();
        uint s = 0;
        delete chain;
        for (uint i = 0; i < l; i++) {
            if (st.substr(i, 1) == "/") { // /
                chain.push(st.substr(s, i - s));
                s = i + 1;
            }
        }
        chain.push(st.substr(s, l - s));
        curr_i = 0;
        curr_p = address(0);
        goResolve();
        // Terminal.print(0, format("Certificate address: {}", par));
        // uint32 exp = IDensCertificate(par).getExpiry();
        // address val = IDensCertificate(par).getValue();
        // if (now > exp) {
        //     Terminal.print(0, "Certificate expired :(");
        // } else {
        //     Terminal.print(0, "Resolution successful:");
        //     Terminal.print(0, format("{}", val));
        // }
    }

    function goResolve() private {
        string part = chain[curr_i];
        Terminal.print(0, format("Lookup {}/{}...", curr_p, part));
        IDensRoot(root).resolveRPC{callback: onResolve}(part, curr_p, PlatformTypes.Certificate);
    }

    function onResolve(address res) public {
        Terminal.print(0, format("Got address {}", res));
        if (curr_i + 1 == chain.length) {
            Terminal.print(0, "Requesting value...");
            IDensCertificate(res).whois{callback: onResolveWhois}();
            return;
        }
        curr_i += 1;
        goResolve();
    }

    function onResolveWhois(Whois res) public {
        Terminal.print(0, "Received information:");
        Terminal.print(0, format("Owner: {}", res.owner));
        Terminal.print(0, format("Registered: {}s ago", now - res.registered));
        Terminal.print(0, format("Expires: in {}s", int(res.expiry) - int(now)));
        Terminal.print(0, format("Address value (request result):\n{}", res.value));
        start();
    }

    function mi_Root(uint32 index) public {

    }

    function mi_Certificate(uint32 index) public {

    }

    function mi_Auction(uint32 index) public {

    }

    function getVersion() public override returns (string name, uint24 semver) {
        (name, semver) = ("DeNS Debot", _version(0,1,0));
    }

    function _version(uint24 major, uint24 minor, uint24 fix) private pure inline returns (uint24) {
        return (major << 16) | (minor << 8) | (fix);
    }

}