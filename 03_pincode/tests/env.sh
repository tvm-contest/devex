
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

