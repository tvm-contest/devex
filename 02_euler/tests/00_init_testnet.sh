#!/bin/bash

. ./env.sh

# To run this script, you need to have already configured a switch 'nil'
# containing Surf accounts user0..user3. Use './create_nil_accounts.sh'
# to create these accounts

$FT switch to testnet || exit 2
$FT switch remove nil_euler
$FT switch create nil_euler --url https://net.freeton.nil.foundation/ || exit 2
$FT account copy from nil user0 user1 user2 user3 || exit 2


