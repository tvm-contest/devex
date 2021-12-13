# DeBot
 
## Test our Debot on TON Surf
<ul dir="auto">
<li>Follow the link to the <a href = "https://web.ton.surf/debot?address=0%3A03938c42bcba291d75d51e642af799b278ca3ac000ad972020454ab335477c70&net=devnet&restart=true">Ton Surf </a></li>
<li>Enter your wallet address</li>
<li>Enter NFT Root address</li>
Example: 0:732acc1068558fedd3cb5e3e2c8685c254a98cdeb89ecf7af695024ad9d6d87f
 <li>Follow the instructions</li>
</ul>

## To deploy DeBot manually
<ul dir="auto"> 
  <li>Run <p><code>tonos-cli genaddr NftDebot.tvc NftDebot.abi.json --genkey NftDebot.keys.json > log.log</code></p></li>
  <li>Transfer the funds to the address in the log.log file</li>
  <li>Run <code>bash build.sh</code></li>
  </ul>
  
## To run DeBot on TON Surf
<ul dir="auto">
  <li>Go to <a href = "https://web.ton.surf">Ton Surf</a></li>
  <li>Enter your DeBot address on window "Browse DeBots"</li>
 <li>Follow the instructions</li>
 </ul>

![image](https://user-images.githubusercontent.com/92379796/145450852-51c343b7-b4ff-405c-b701-406ada04c52e.png)

![image](https://user-images.githubusercontent.com/92379796/145451937-72f46b4f-a42d-4670-a272-36eb2ae9e91c.png)


## To run DeBot in the terminal
<ul dir="auto">
<li>Run <code>tonos-cli --url https://net.ton.dev debot fetch (your DeBot address)</code></li>
 <li>Follow the instructions</li>
</ul>
