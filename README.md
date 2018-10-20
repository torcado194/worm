# \/\/>

\/\/> (pronounced wɜrm) is a stack-based, two-dimensional esoteric programming language. It builds upon many of the ideas of ><> and similar languages, introducing concepts such as wormholes, diagonal movement, stack-based register, separate character and number systems, and more.

# Getting started

This repo is a node.js implementation of the language. To use it, clone the repo and run it like so:

```
$ node worm.js program.worm
```

# Reference sheet

For a complete documentation of the program, check out the wiki (in progress)

    >v<^	Pointers: sets pointer direction to right, down, left, and up respectively.
    \/|_	Mirrors: reflect direction across y=x, y=-x, horizontal, and vertical axes respectively.
    xy	Lane shifts: shifts pointer diagonally clockwise and counterclockwise respectively, but retains direction.
    &	Rotate: rotates pointer direction 45° clockwise.
    #	Toggles "wall mode".
    k	Random: sets pointer direction to a new random direction, in one of the four cardinal or diagonal directions based on the current pointer angle.
    o	Wormhole: finds the closest matching o on the board and teleports the pointer there, retaining direction. If there is a conflict between multiple wormhole distances, the closest to (0,0) (earliest character index) is chosen. If there is no other o on the board, the pointer is teleported to (0,0).
    `	Teleport: pops y then x off the stack, then teleports the pointer to (x,y), retaining direction. The instruction at (x,y) will be executed. Locations outside the board will be modulo with the max width/height.
    !	Jump: skips the next instruction.
    ?	Conditional jump: pops x off the stack, if x is 0 skip the next instruction.
    .	Variable jump: pops x off the stack, skips the next x instructions. Negative numbers are ignored.
    0-9
    a-f	Pushes corresponding hexadecimal value onto the stack.
    +-*,%	Add, subtract, multiply, divide respectively: pops y then x off the stack, push the result of x [operator] y
    l	Floor: pops x off stack, pushes floor(x) back onto stack.
    ()=	Less than, greater than, and equality conditional operators: pops y then x off the stack, returns the result of x [operator] y, mapping false to 0 and true to 1.
    "	Toggles character string mode.
    '	Toggles decimal string mode.
    :	Duplicates top value on stack.
    ~	Removes top value on stack.
    $	Swaps top two values on stack.
    @	Rotates top three values on stack to the right. The rightmost value wraps to the start of the set of 3 values.
    {}	Shift: shifts the entire stack left or right respectively. Values off the end of the stack wrap to the other end.
    [	Begin new stack: pops x off the stack and creates a new stack, moving x values from the old stack into it.
    ]	Close stack: move all values of the current stack to the top of the underlying one. If the current stack is the main stack, this clears all values.
    p	Pops the top value off the stack and pushes it to the register.
    q	Pulls the top value off the register back onto the stack.
    i	Character input: read single characters from the input buffer. Returns a -1 when the buffer is empty.
    j	Decimal input: read numbers from the input buffer, parsing number groups as single numbers. Returns a -1 when the buffer is empty.
    u	Character output: pops x off the stack and writes it to stdout as a utf-8 character.
    n	Decimal output: pops x off the stack and writes it to stdout as a number.
    r	Character read: halts program execution and immediately captures any character sent to stdin and pushes it to the stack.
    t	Decimal read: halts program execution and waits for a newline-submitted string of characters, parsing numbers and pushing it to the stack.
    w	Wait: pops x off the stack, pauses execution for (x*10)ms.
    g	Get: pops y then x off the stack, pushes the value at (x,y) on the board. All edges return a -1, empty cells return 32.
    s	Set: pops y, x, and v off the stack, then sets the value at (x,y) on the board to v. Both 0 and 32 place a space on the board. Negative x and y values are ignored.
    ;	Stops the program.
