
# NFT collection distributor
The purpose of our project is to simplify user interact with creating NFT collections. User can create collection with various parameters including image. 

Also our team developed an NFT DeBot, which is the tool for minting NFTs.


# Why we used True NFT standart?
1) True NFT allows the user to interact with tokens in decentralised browsers and applications using a single blockchain address, or to send NFT with only the recipient's address.

2) When using True NFT, token owner information is included in the original token data, making it searchable. The data is placed in a separate non-removable contract, thus forming a searching index, which created after when the owner change.

3) All NFT data (including content) is stored in the Free TON blockchain, making it possible to search collection and token records and actions on them by sending standardised queries from smart contracts.
 
4) The use of True NFT ensures that the initial methods is available, allowing you to start developing exactly the unique functionality right away. In addition, due to the fact that part of the code is universal, it was possible to learn the logic of the written contracts.

![](header.png)
# Contracts changes


## Data contract
Added:
<ul dir="auto">
<li>Image URL, token rarity and possibility of transferring rights parameters and methods that return these parameters </li>
<li>Methods for changing the transferability of rights </li>
<li>Ability to transfer token without sale </li>
<li>Ability to transfer token management rights without transferring ownership and back </li>
<li>Modifiers </li>
</ul>

## NftRoot contract
Added:
<ul dir="auto">
<li>Rarity structure consisting of name and number of tokens</li>
<li>List, consisting of elements of the rarity structure, and tokens limit parameter</li>
<li>Checks for the correctness of the entered parameters</li>
<li>Ability to add commission volume</li>
<li>Ability to add and delete an admin</li>
<li>Ability to cancel the commission for the admin</li>
</ul>

## DirectSellRoot contract 
<ul dir="auto">
<li>Created for deploy DirectSell contract and obtaining its address</li>
</ul>

## DirectSell contract
Created: 
<ul dir="auto">
<li>Ability to put token for sale in constructor</li>
<li>Ability to buy a token by any member of the network</li>
<li>Ability to cancel the sale</li>
</ul>


# Video presentation  
> (there are some different from current version)
> 
> https://user-images.githubusercontent.com/55970327/145372739-daebec75-370b-449e-8f81-83699d529685.mp4

## Installation

<ul dir="auto">
<li>Run <code>tondev sol set -c 0.47.0</code></li>
<li>Run <code>tondev se start</code></li>
<li>Navigate to "trueNFTCollection" directory: <code>cd trueNFTCollection</code></li>
<li>Run <code>npm install</code></li>
</ul>

## Run

<ul dir="auto">
<li>Compile <code>npm run build</code></li>
<li>Start <code>npm run start</code></li>
</ul>

## Usage site example
<li> First of all, you must to set network and wallet giver (section "settings") </li> <BR>
 
 ![image](https://user-images.githubusercontent.com/55970327/146725164-8847ddce-2ca4-4f13-b3a1-0f7c52412db8.png)

<li> Also you can add user networks <i> src/config/network.ts </i>  </li> <BR>
 
 ![image](https://user-images.githubusercontent.com/55970327/146725391-9c21ca37-6691-484d-9015-e47884395c85.png)

 
<li> To create a new collection, you should go to section "Create Collection" and enter the collection name</li>
<li> Firstly, you should to enter the collection name </li> <BR>
 
![_ZDRkxWQUSk](https://user-images.githubusercontent.com/55970327/146720830-5f354f68-5709-43a2-b1b2-24edd6550b8d.jpg)
 
<li>Click "add token" and enter the type of token and their limit. (You must to create at leaste 1 type of token) </li> 
 
![image](https://user-images.githubusercontent.com/55970327/146721047-04b40f4b-2ad0-4bae-8b21-ab23eda50a60.png)
 
 <li>You can add additional parametres. You should to press the button "Add parametr" and choose variable type (string, number). Also you can to choose the range of their values and the filling requirements.   </li> 
 
![image](https://user-images.githubusercontent.com/55970327/146723175-a40114b5-ed5d-440e-ba80-8a872828004f.png)
 
 <li> Then you can upload root icon to ipfs and save url onchain. For more detailed information, see the section "Load to IPFS" </li>
 
![image](https://user-images.githubusercontent.com/55970327/146723807-37498ea8-2eb0-4506-9511-d523fcaf7ff0.png)

 
  <li> Finally, you should to press "Create collection" </li>  
 
 ![image](https://user-images.githubusercontent.com/55970327/146723996-cb023065-a7d3-4f4f-b133-cab7389b6e37.png)
 
   <li> In addition, you can save the collection settings and import its in the future. </li>  
 
 ![image](https://user-images.githubusercontent.com/55970327/146724096-b1a49c0d-e21f-422c-ae34-8da35ec1ef41.png)

<li>  Сollection set have JSON format  </li>  
 
![image](https://user-images.githubusercontent.com/55970327/146746141-c2c4da9e-2651-4dff-a1e2-4f8675ae8f3b.png)

 <li>  You can check your collections in section "Get a list of tokens" </li>  

![image](https://user-images.githubusercontent.com/55970327/146744353-ee80e54f-0f73-4a69-88f6-9d07cff1b553.png)
 
 ## Minting debot
 
  <li> When you are deploying debot, you get Nftroot address and Minting debot address (check your terminal)  </li>

<ul dir="auto">
<code> NftDebot contract was deployed at address: 0:e92acd6a39f8b4fbbfaa25c8e8c6598846844f370af5c5dee26a84547e16d761</code> <BR>
<code> NftRoot contract was deployed at address: 0:45b5af6f7d4d2828fda6ac86a744d300413839d24e110387870e1f5249d2fd00</code>
</ul>
 
 <li> You can use The DeBot for tokens minting in ton.surf, in the terminal, or at the other services.  </li>
 
 <p> <li> In the beginning, the user should attach:   </p>
 <ul>
<li> 1) The wallet from which transactions will be made, the address of NFTRoot, that contains a collection of rarities and sign all operations via private and public keys.  </li>
  
![image](https://user-images.githubusercontent.com/55970327/146750484-f869cef7-0ee5-4ae5-ab01-5568b03dc651.png)
  
  <p> <li> 2) Then you should to type the rarity of token and all additional parameters  </p>
  
![image](https://user-images.githubusercontent.com/55970327/146753180-b12697d7-d9b1-4771-a41e-22db50545c99.png)
  <p> <li> 3) Finally, you are receiving nft token address and information about it </p>
  
  ![image](https://user-images.githubusercontent.com/55970327/146753952-7e6dfaf4-7631-4baa-a2fe-a33a3f9a58fd.png)
  
   <p> <li> Also you can get all token, if you open the section "get a list of tokens" on the site </p>
  
  ![image](https://user-images.githubusercontent.com/55970327/146754584-1537a4d9-0894-4115-a331-dbce14efd015.png)

![image](https://user-images.githubusercontent.com/55970327/146754699-8f9d90f4-f089-4446-a2d1-04f5ac2e043f.png)

 </ul></li>
 
 ## Upload to IPFS
 
  <li> You can use other services, however we have intergration with <i> ipfs.infura </i>  </li> <BR>
 
 ![image](https://user-images.githubusercontent.com/55970327/146755436-0429c0f5-d3ea-4b11-9783-295c4e2fe8e9.png)

 <li> There are two options to choose image to upload </li>  
  <ul>
    <li> List of picture from folder <i> public\image </i>  (It is made for large number of image, which are made by NFT Art Generator) </li> 
    <li> You choose picture and click on it and get url </li>  <BR>
  
   ![image](https://user-images.githubusercontent.com/55970327/146763467-b74077c4-218f-4d99-b26d-178873532228.png)

   
   <li> Or upload a single picture and get url </li>  
 
   ![image](https://user-images.githubusercontent.com/55970327/146762388-41a0fb46-2118-4138-9670-e0fbccf9e696.png)


    
