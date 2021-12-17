export const surf_setting = {
    SEND_TRANSACTION_ABI: {
        "ABI version": 2,
	    "header": ["pubkey", "time", "expire"],
        "functions": [
            {
                "name": "sendTransaction",
                "inputs": [
                    {"name":"dest","type":"address"},
                    {"name":"value","type":"uint128"},
                    {"name":"bounce","type":"bool"},
                    {"name":"flags","type":"uint8"},
                    {"name":"payload","type":"cell"}
                ],
                "outputs": [
                ]
            }
        ]
    }    
}