# Tests of use case: Euler Problems Contest

The `tests/` directory contains a full scenario that can be run either
on a sandbox (local network) or on a public network, with the `ft`
tool installed.

In these tests, `user0` deploys the `EulerRoot` contract (script
`02_deploy.sh`), prepares a problem using `euler-client` (script
`01_prepare.sh`) and deploys the corresponding `EulerProblem` contract
(script `03_new_problem.sh`). `user1` deploys his `EulerUser` contract
(script `04_new_user.sh`) and submit his solution, using the
`euler-client` program and the `submit()` message of EulerRoot (script
`05_submit_user1.sh`). Finally, `user2` also successfully submits his
solution (script `06_submit_user2.sh`) while `user3` fails to replay
the solution of `user2` and cannot generate a proof for a wrong
solution.

