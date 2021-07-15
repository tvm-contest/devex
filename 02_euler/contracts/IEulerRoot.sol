/* Interface IEulerRoot */

pragma ton-solidity >= 0.32.0;

interface IEulerRoot {

  function has_solved( uint32 problem, uint256 pubkey ) external ;
  function submit( uint32 problem, bytes proof, uint256 pubkey) view external ;
  
}
