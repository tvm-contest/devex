
function cmd()
{
    echo
    echo  COMMAND $*
    echo
    $* || exit 2
}

function cmdk()
{
    echo
    echo  COMMAND $*
    echo
    $*
}

FT="ft --echo"


export EULER_PROBLEM=101
export EULER_NONCE=478478
export EULER_SOLUTION=777

# ft under docker needs access to these variables
export FT_DOCKER="-e EULER_PROBLEM -e EULER_NONCE -e EULER_SOLUTION"

