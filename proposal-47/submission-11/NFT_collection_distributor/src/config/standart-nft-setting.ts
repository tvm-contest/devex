export const nft_setting = {
    INFO_DATA_ABI: {
        "ABI version": 2,
        "header": ["time", "expire"],
        "functions": [
            {
                "name": "getInfoResponsible",
                "inputs": [
                    {"name":"_answer_id","type":"uint32"}
                ],
                "outputs": [
                    {"name":"addrRoot","type":"address"},
                    {"name":"addrOwner","type":"address"},
                    {"name":"addrAuthor","type":"address"},
                    {"name":"addrData","type":"address"},
                    {"name":"id","type":"uint256"},
                    {"name":"name","type":"bytes"},
                    {"name":"url","type":"bytes"},
                    {"name":"number","type":"uint8"},
                    {"name":"amount","type":"uint8"}
                ]
            }
        ]
    }    
}