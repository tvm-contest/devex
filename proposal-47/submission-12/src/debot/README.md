# DeBot
 
## Test our Debot on TON Surf
<ul dir="auto">
<li>Follow the link to the <a href = "https://web.ton.surf/debot?address=0%3Ab8716bbb76f8e328164949e13695637879331e4d499127d8c2adf74bbfcbcd91&net=devnet&restart=true">Ton Surf </a></li>
<li>Enter your wallet address</li>
<li>Enter your Nft Root address</li>
Example: 0:4de52efe97e4333b56536f2b216c02d7ae3326cdc02364a3c3ab7e2d420629da
 <li>Follow the instructions</li>
</ul>

## To deploy DeBot manually
<ul dir="auto"> 
  <li>Run <p><code>tonos-cli genaddr NftDebot.tvc NftDebot.abi.json --genkey NftDebot.keys.json > log.log</code></p></li>
  <li>Transfer the funds to the address in the log.log file</li>
  <li>Run <p><code>tonos-cli --url https://net.ton.dev deploy NftDebot.tvc "{}" --sign NftDebot.keys.json --abi NftDebot.abi.json</code></p></li>
  <li>Run <code>bash deploy.sh</code></li>
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
<li>Run <code>tonos-cli --url https://net.ton.dev debot --debug fetch (your DeBot address)</code></li>
 <li>Follow the instructions</li>
</ul>
