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
