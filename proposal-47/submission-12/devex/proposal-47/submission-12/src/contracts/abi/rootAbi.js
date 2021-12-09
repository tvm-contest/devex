export const rootAbi = {
	"ABI version": 2,
	"version": "2.2",
	"header": ["time", "expire"],
	"functions": [
		{
			"name": "constructor",
			"inputs": [
				{"name":"rootName","type":"string"},
				{"name":"rootIcon","type":"bytes"},
				{"name":"codeIndex","type":"cell"},
				{"name":"codeData","type":"cell"},
				{"name":"codeIndexBasis","type":"cell"},
				{"name":"tokensLimit","type":"uint256"},
				{"components":[{"name":"rarityName","type":"string"},{"name":"amount","type":"uint256"}],"name":"raritiesList","type":"tuple[]"}
			],
			"outputs": [
			]
		},
		{
			"name": "setName",
			"inputs": [
				{"name":"rootName","type":"string"}
			],
			"outputs": [
			]
		},
		{
			"name": "setIcon",
			"inputs": [
				{"name":"icon","type":"bytes"}
			],
			"outputs": [
			]
		},
		{
			"name": "mintNft",
			"inputs": [
				{"name":"rarity","type":"string"}
			],
			"outputs": [
			]
		},
		{
			"name": "deployBasis",
			"inputs": [
				{"name":"codeIndexBasis","type":"cell"}
			],
			"outputs": [
			]
		},
		{
			"name": "destructBasis",
			"inputs": [
			],
			"outputs": [
			]
		},
		{
			"name": "getAddrBasis",
			"inputs": [
			],
			"outputs": [
				{"name":"addrBasis","type":"address"}
			]
		},
		{
			"name": "resolveCodeHashIndex",
			"inputs": [
				{"name":"addrRoot","type":"address"},
				{"name":"addrOwner","type":"address"}
			],
			"outputs": [
				{"name":"codeHashIndex","type":"uint256"}
			]
		},
		{
			"name": "resolveIndex",
			"inputs": [
				{"name":"addrRoot","type":"address"},
				{"name":"addrData","type":"address"},
				{"name":"addrOwner","type":"address"}
			],
			"outputs": [
				{"name":"addrIndex","type":"address"}
			]
		},
		{
			"name": "resolveCodeHashData",
			"inputs": [
			],
			"outputs": [
				{"name":"codeHashData","type":"uint256"}
			]
		},
		{
			"name": "resolveData",
			"inputs": [
				{"name":"addrRoot","type":"address"},
				{"name":"id","type":"uint256"}
			],
			"outputs": [
				{"name":"addrData","type":"address"}
			]
		}
	],
	"data": [
	],
	"events": [
	],
	"fields": [
		{"name":"_pubkey","type":"uint256"},
		{"name":"_timestamp","type":"uint64"},
		{"name":"_constructorFlag","type":"bool"},
		{"name":"_codeData","type":"cell"},
		{"name":"_codeIndex","type":"cell"},
		{"name":"_totalMinted","type":"uint256"},
		{"name":"_addrBasis","type":"address"},
		{"name":"_codeIndexBasis","type":"cell"},
		{"name":"_tokensLimit","type":"uint256"},
		{"name":"_rarityTypes","type":"optional(cell)"},
		{"name":"_rarityMintedCounter","type":"optional(cell)"},
		{"name":"_rootIcon","type":"bytes"},
		{"name":"_rootName","type":"string"}
	]
}
