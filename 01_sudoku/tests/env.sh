
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


export SUDOKU_INSTANCE=simple_instance.in
export SUDOKU_SOLUTION=solved_instance.in
export SUDOKU_PROVKEY=provkey.bin
export SUDOKU_VERIFKEY=verifkey.bin
