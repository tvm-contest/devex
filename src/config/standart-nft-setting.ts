export const nft_setting = {
    INFO_DATA_ABI: {
        "ABI version": 2,
        "header": ["time", "expire"],
        "functions": [
            {
                "name": "getInfo",
                "inputs": [
                ],
                "outputs": [
                    {"name":"addrData","type":"address"},
                    {"name":"addrRoot","type":"address"},
                    {"name":"addrOwner","type":"address"},
                    {"name":"addrTrusted","type":"address"},
                    {"name":"color","type":"uint8"}
                ]
            }
        ]
    }    
}