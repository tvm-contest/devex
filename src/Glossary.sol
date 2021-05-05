pragma ton-solidity >= 0.36.0;

enum ProposalState { Undefined, New, OnVoting, Ended, Passed, Failed, Finalized, Distributed, Reserved, Last }
enum Stage { Undefined, New, Propose, Assess, Transit, Setup, Contend, Vote, Reveal, Finalize, Rank, Reward, Finish, Reject, Archive, Reserve, Last }
enum VoteCountModel { Undefined, Majority, SoftMajority, SuperMajority, Other, Reserved, Last }
enum ProposalType { Undefined, SetCode, Reserve, SetOwner, SetRootOwner }
