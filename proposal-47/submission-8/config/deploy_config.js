module.exports = {
    deployConfig: {
        endpoints: ["https://main.ton.dev"],
        owner_wallet:"0:299c9cfcc59064679c2a580223a85d42f9f7b453e28abc781b45d45a99386722",
        supply: 128,
	    levels: [
            {
                images: [
	            {
                    name: "Black head",
                    path: "./img/head_black.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Brown head",
                    path: "./img/head_brown.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Red head",
                    path: "./img/head_red.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "White head",
                    path: "./img/head_white.png",
                    price: 3_000_000_000
                }
                ]
            },
            {
                images: [
                {
                    name: "Simple mouth",
                    path: "./img/mouth_no.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Open mouth",
                    path: "./img/mouth_open.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Mouth with teeth",
                    path: "./img/mouth_with_teeth.png",
	    	        price: 3_000_000_000
                },
                {
                    name: "Mouth with tongue",
                    path: "./img/mouth_with_tongue.png",
                    price: 4_000_000_000
                }
                ]
            },
            {
                images: [

                {
                    name: "Yellow eyes",
                    path: "./img/eyes_yellow.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Green eyes",
                    path: "./img/eyes_green.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Blue eyes",
                    path: "./img/eyes_blue.png",
	    	        price: 3_000_000_000
                },
                {
                    name: "Closed eyes",
                    path: "./img/eyes_closed.png",
                    price: 3_000_000_000
                }
                ]
            },
            {
                images: [
                {
                    name: "No bow",
                    path: "./img/bow_no.png",
	    	        price: 1_000_000_000
                },
                {
                    name: "Green bow",
                    path: "./img/bow_green.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Pink bow",
                    path: "./img/bow_pink.png",
	    	        price: 2_000_000_000
                },
                {
                    name: "Purple bow",
                    path: "./img/bow_purple.png",
                    price: 3_000_000_000
                }
                ]
            }
	    ]
    }
}
