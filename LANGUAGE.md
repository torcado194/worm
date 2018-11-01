\\/\\/> (pronounced /wɜrm/) is a stack-based, two-dimensional esoteric programming language. It builds upon many of the ideas of ><> and similar languages.

# Basics

Code is composed of single character instructions arranged in 2d space.  
A pointer reads characters one at a time, performing its instruction then moving to the next character, but not necessarily from left to right.  
\\/\\/>  is stack-based; all memory is stored on and instructions performed on a stack. It also supports multiple stacks, and a second stack register.  
\\/\\/> can only be executed at runtime, it cannot be compiled.  

## Paradigms

While \\/\\/> adds many new features, it tries to keep the spirit of simplicity in languages like ><> alive. \\/\\/> does not add any new 'modern' programming concepts such as variables, blocks, etc., nor any of the hundreds of built-in operators that many codegolf languages have. There are only numeric literals, character capturing, and simple stack manipulation functions. The goal of \\/\\/> is to attempt to make code even more interesting to write/watch/understand by encouraging frequent self-overlapping and, in-turn, compactness, by introducing behaviors such as diagonal movement, lane-shifting, wormholes, etc. Most of the features introduced in the language revolve around movement behaviors, rather than simply useful data manipulation.  
\\/\\/> tries to split number-based input/output and character-based input/output as much as possible. Separate quotes for numbers, separate input/output instructions for numbers, etc.  
\\/\\/> also adds a stack-based register instead of a single-item register, but introduces no additional operators on the register besides just pushing/popping.

# Structure

The board refers to the entire program: the 2d arrangement of single character instructions. These single characters on the board are called cells. The layout seen by the language is visually identical to the layout of the characters.
The edges of the board are significant to how the code is executed. The edges of the top, left, and bottom of the board are always linear, but the right edge staggers based on the length of each line. 
See the Edges section under Movement for more information.

# Movement

A pointer travels from one character to the next depending on its current movement direction and movement angle.  
"direction" will refer to "pointer movement direction" and "angle" for "pointer movement angle" for this documentation.  
The pointer can be moving in one of 8 directions: Right, Down, Left, Up, Down-Right, Down-Left, Up-Left, and Up-Right. 
Direction refers to any of these 8 options.  
Angle refers to one of two options: cardinal or diagonal.  
A single instruction determines whether the pointer will run diagonally or cardinally.  
Direction can change based on certain instructions.  

## Direction instructions

### Pointers
**`>`**	Sets direction to Right  
**`v`**	Sets direction to Down  
**`<`**	Sets direction to Left  
**`^`**	Sets direction to Up  

### Mirrors
**`/`**	Reflects across the y = -x axis:
> --cardinal--  
> From Right, set to Up  
> From Up, set to Right  
> From Left, set to Down  
> From Down, set to Left  
> --diagonal--  
> From Down-Right, set to Up-Left  
> From Up-Left, set to Down-Right  
> From Down-Left or Up-Right, ignore  

**`\`**	Reflects across the y = x axis:  
> --cardinal--  
> From Right, set to Down  
> From Down, set to Right  
> From Left, set to Up  
> From Up, set to Left  
> --diagonal--  
> From Up-Right, set to Down-Left  
> From Down-Left, set to Up-Right  
> From Down-Right or Up-Left, ignore  

**`|`**	Reflects horizontally:  
> --cardinal--  
> From Right, set to Left  
> From Left, set to Right  
> From Up or Down, ignore  
> --diagonal--  
> From Down-Right, set to Down-Left  
> From Down-Left, set to Down-Right  
> From Up-Left, set to Up-Right  
> From Up-Right, set to Up-Left  

**`_`**	Reflects vertically:
> --cardinal--  
> From Up, bounce Down  
> From Down, bounce Up  
> From Left or Right, ignore  
> --diagonal--  
> From Down-Right, set to Up-Right  
> From Up-Right, set to Down-Right  
> From Down-Left, set to Up-Left  
> From Up-Left, set to Down-Left  

### Misc
**`y,x`**	Lane shifts: shifts pointer diagonally (relatively) but does not change direction or angle. Can be used to swap lanes.  
> x shifts pointer 45° clockwise  
> y shifts pointer 45° counterclockwise  
> Successive lane shift instructions shift the cursor according to the relative direction between the two instruction on the board, but retain the original travel direction.  
> ---examples---  
> right:  
> ```
> >>>x>>>
> >>>y>>>
> ```
> left:  
> ```
> <<<y<<<
> <<<x<<<
> ```
> down:  
> ```
> vv
> vv
> yx
> vv
> vv
> ```
> diagonal down-left:  
> ```
>     ba
>    ba
>   yx
>  ab
> ab
> ```
> (the "b" path travels one cell down after hitting "y", the "a" path goes one cell left after hitting "x", which causes y to be hit again. traveling from x to y tells y that the current direction is "Left" because the y is to the left of the x, which shifts the pointer down-left one tile. since the original direction was down-left, the pointer continues to go down-left)  
> ```
>      b
>     ba
>    ya
>   ax
>  ab
>  b
> ```
> (similarly for this instance. x is hit immediately after y)  
> ```
> aabx
>  x  x
>  x  x
>   xx
> ```
> (this creates an infinite loop. each x jumps to the next in a clockwise fashion. once reaching the last x, it jumps to the b and continues right since that was the starting direction. the a's are only hit once at the start.)  

**`&`**	Rotate: Rotates the pointer angle by 45° clockwise.
> ---example---  
> ```
> aaa&
>     a
>      a
> ```

**`#`**	Toggles "Wall Mode": See the Wall Mode section for more information.

**`k`**	Random: Sets direction to a new random direction, based on current angle:  
> If moving cardinally, choose Right, Down, Left, or Up equally.  
> If moving diagonally, choose Down-Right, Down-Left, Up-Left, or Up-Right equally.  

## Movement instructions
**`o`**	Wormhole: teleports pointer to another wormhole, retaining direction  
> The wormhole looks for the next closest wormhole on the board, in terms of taxi-distance (a wormhole (2,2) away is as close to one (4,0) away. add the absolute value of the x/y differences to find the taxi-distance).  
> In the case of a distance conflict, the earliest wormhole (closest to (0,0), earliest character index) is chosen.  
> If only one wormhole is present, the pointer is teleported to (0,0).  
> ---example---  
> ```
> o>>> v
>      o
> >>o
>   v
> ```

**`` ` ``**	Teleport: pops y then x off the stack, then teleports the pointer to (x,y), retaining direction.  
> The instruction at that location will be executed.  
> If trying to teleport outside of the board, a new position will be chosen by calculating the max width and height of the board, then setting x to (x % width) and y to (y % height)  
> If the chosen location still lands on an edge, handle it as normal with the current travel direction.  

**`!`**	Jump: skip the next instruction.

**`?`**	Conditional jump: pops x off stack, if x is 0 skip the next instruction, otherwise continue as normal.

**`.`**	Variable jump: pops x off the stack, skip the next x instructions. negative values are ignored (count as 0), fractions are floored. Generally, this should simply run the Move event x times in succession, so that the cursor visually jumps if visualizing, and so that edges/walls/etc. are handled one step at a time instead of handling the place the cursor would have landed if it jumped instantly.

## Edges
Edges determine how the pointer wraps (or bounces, see the next section) when reaching the end of the board. Edges exist everywhere a character does not.  
For example, here are the edges for this board:  
```
••••••••
•\/\/>x••••
•01 a v  !•
•b;!•••••••
• !x  < •
•••••••••
```
(these extend infinitely in all directions)  
By default, code execution wraps around the edges of the board. When the pointer hits a blue character in this example, it will teleport to the other end in the same direction it is moving. The light-blue characters on the third line are ignored in this case when moving vertically, but not horizontally. If there is any separation between edges (any character (including space) exists between two empty characters) only the furthest edge grouping in that direction is acknowledged.  
For instance, if the pointer is moving down at the 8th character, 2nd line (just to the left of the far right !), the bottom 3 edges count as the furthest edge group in that direction, meaning the pointer will immediately wrap to the top-most edge group (effectively staying in one place).  
Also note the bottom-right corner. The space character will still count as part of the board, meaning the edges form around that character even if it's not visible in the editor.  
One example for the significance of this staggered right edge is the ! on the 3rd line. If hitting that from the left, the pointer will jump the first character b and hit the next character ; immediately.  

Here is an exhaustive list of responses for the pointer landing on an edge:  
> When moving horizontally, landing on an edge at (x,y) will place the pointer at (x % w) where w is the number of characters in the current line. Basically placing the pointer at the start of the current line when moving right, and at the end of the current line when moving left.  
> When moving vertically, landing on an edge at (x,y) will place the pointer at (y % h) where h is the number of characters in the current column. Basically placing the pointer at the top of the current column when moving down, and at the bottom of the current line when moving up.  
> When moving diagonally, if the pointer will land on the edge, instead first move the pointer in the cardinal direction relatively counter-clockwise, check for an edge and handle according to the above methods, then move the pointer in the cardinal direction relatively clockwise of the original angle and handle an edge according to the above methods. For example, if moving Down-Right and landing on an edge where there are only edges to the right of the cursor but not below, the cursor will move right, wrap to the start of the line, then move down.

It is important to note that non-furthest edges are ignored when wrapping (shown in light-blue in the above example). The two cardinal direction edge cases handle this by definition, because x or y will always be less than w or h if the edge it is landing on is not at the start/end of that row or column. So an interpreter with this logic will work, but conceptually this edge should be ignored completely when wrapping.  

## Wall mode
In wall mode, edges no longer wrap the cursor, instead they act as walls.  
Walls behave differently based on the cursor angle:  
When moving cardinally, hitting a wall will cause the pointer to turn 90° clockwise and continue along the edge.  
When moving diagonally, walls reflect the pointer almost like a mirror. Diagonal movement in wall mode acts as follows:  
> The pointer checks for a wall at the next cell it will move to, which is always 1 horizontal and 1 vertical cell away from its current location.  
> If the pointer will land on a wall, it prioritizes clockwise rotation and checks the cell adjacent to the wall in that direction. For example, if moving Up-Right into a wall, it will check the cell below that wall (135° degrees relative to the current angle, away from the detected wall). If it finds one the new direction will be Up-Left, otherwise it will be Down-Right. If the next target location happens to be a wall, it will run the function again in this direction.

**`#`** toggles wall mode  
---examples---  
cardinal movement:  
```
••••••••
•aaaaaa••
•a    a<•
•aaaaaa<•
•^^••••••
•^^^^^^•
••••••••
```
The a's represent the path taken by the pointer as it hits walls and turns clockwise.

diagonal movement:  
```
••••••••
•a   a ••
• a a a •
•  a   a•
•^^••••••
•^^^^^^•
••••••••
```
A path going Down-Right from (0,0). hitting a flat edge reflects across that axis, hitting a corner reflects across both axis.  
```
•••••
•   ••••
•  a   •
• a b  •
•a c •••
• c  •
```
Starts at the bottom left a traveling Up-Right. The pointer hits a corner at the top, and prioritizes turning clockwise. It then travels Down-Right until hitting the lower corner, prioritizing clockwise rotation again and ending up traveling Down-Left.  
---edge cases---  
Currently, hitting a mirror pointing into a wall (for instance, hitting a / from the left on the top row) will cause the pointer to turn and continue as if the mirror were not there. This may change.  

# Literals and Operators

## Literals
**`0-9`**  
**`a-f`**	pushes corresponding hexadecimal value onto stack (a pushes 10, f pushes 15).

## Arithmetic operators
**`+`**	Add: pops y then x off stack, pushes x + y back onto stack.  
**`-`**	Subtract: pops y then x off stack, pushes x - y back onto stack.  
**`*`**	Multiply: pops y then x off stack, pushes x * y back onto stack.  
**`,`**	Divide: pops y then x off stack, pushes x / y back onto stack. Uses float division, not integer division.  
**`%`**	Modulo: pops y then x off stack, pushes x % y back onto stack. Uses divisor-signed modulo, equivalent to (x % y + y) % y.  
**`l`**	Floor: pops x off stack, pushes floor(x) back onto stack.  

## Conditional operators
**`)`**	Greater than: pops y then x off stack, pushes 1 if x > y and 0 otherwise.  
**`(`**	Less than: pops y then x off stack, pushes 1 if x < y and 0 otherwise.  
**`=`**	Equals: pops y then x off stack, pushes 1 if x = y and 0 otherwise.  

## Misc
**`"`**	Toggle character string mode. Any character after this will be pushed onto the stack immediately, until hitting a matching ". Movement instructions are ignored but walls are not.  
**`'`**	Toggle decimal string mode. Numbers after this instruction are parsed as decimals. Movement instructions are ignored but walls are not.  
See "Parsing numbers" for more detail.  

# Parsing numbers

When handling sets of data, \\/\\/> has to parse the items in the set. (in other words, a string of characters, perhaps in a buffer. For the remainder of this section, "item" will refer to a text character and "set" refers to the string of these characters, but to prevent conflicts with the existing 'character' concept, item and set will be used instead).  
Many instructions are split between character and number parsing. In both cases, when handling either characters or numbers, parsing starts at the beginning of the set and pulls data out from the beginning causing later data to shift down into its place, so that characters at the beginning of the line are the first ones returned (similar to a queue, but in reverse).  
Character parsing is as expected, for each individual item in a list, its utf-8 character code is returned.
Instructions that parse numbers use a specific method:  
For any character that is not in the set [0123456789.- ] (numbers, period, dash/minus, and space), the utf-8 code of that character is returned in the same was as normal character parsing. Otherwise, parsing requires multiple steps:  
If the first item in the set is either a number, a - (minus), or a . (decimal point), collect that and continue to the next item.  
For every proceeding item:  
If it is a number, place it at the end of the current collection.  
If it is a . (decimal point), and it is the first . seen in this collection, place it at the end of the current collection.  
Otherwise, end the current collection and return it as a single item. This should create a number that is the same as it would look written out with these characters.  
For the nth number in the collection, multiply the total by 10 and add the current number. After collecting a . (decimal point), start a new counter d and add (10^(-d) * value) to the total. Every next number increments d.  
If the first character is a - (minus), multiply the total by -1.

If a second - or . is hit, this ends the current collection and starts the next.
A collection can start with either - or ., if this happens and the next character is not a number, it is passed as a character rather than 0.  
If a space character is found, it ends a set but is not returned itself.

In more layman's terms, in number parsing mode if a set of characters looks like a number, return the whole set as a single number just as it looks.  
---examples---  
"word23a5.67 5b" will be parsed as [w,o,r,d,23,a,5.67,5,b] (internally it will appear as [119,111,114,100,23,97,5.67,5,98], each character replaced with its utf-8 code).  
". ..5-.3.-44" will be parsed as [.,.,0.5,-0.3,.,-44]  
"=2a.3 - -34+1.1b" will be parsed as [=,2,a,0.3,-,-34,+,1.1,b]  

# Stacks and memory

\\/\\/> is stack-based. All information is pushed to/popped from a main stack, and most memory operations run off this stack. But there is not just one stack, there is also a stack-based register and support for nested stacks.  

## Main stack
**`:`**	Duplicate the top value on the stack.  
**`~`**	Remove the top value on the stack.  
**`$`**	Swap the top two values on the stack.  
**`@`**	Rotate the top three values on the stack to the right. The rightmost value wraps to the end. For example, a stack of [1,2,3,4] turns into [1,4,2,3]  
**`}`**	Shift the entire stack to the right. The rightmost value wraps to the end.  
**`{`**	Shift the entire stack to the left. The leftmost value wraps to the start.  
**`m`**	Mirror: reverses the entire stack.  
**`h`**	Height: pushes the height (size, number of items) of the stack onto the stack  

## Nested stacks
**`[`**	Pops x off the stack, creates a new stack and moves x values from the old stack into it.  
**`]`**	Closes the current stack, moving all its values to the top of the lower one. If the current stack is the main stack this clears all values, emptying the stack.  
> Use this to create isolated stack environments to manipulate sections of the main stack. For example:  
> 12345 3[m]; will start the main stack at [1,2,3,4,5] then the nested stack will pull the top 3 values, reverse them, then push them back on the stack, resulting in [1,2,5,4,3]  
> A new register will be created/destroyed when opening/closing new stacks. No values will be passed between registers.  

## Register
**`p`**	Pops x off the stack, pushes it to the top of the register.  
**`q`**	Pops x off the register, pushes it to the top of the stack. If the register is empty, it will push -1 instead.  
> Unlike a normal "register," \\/\\/>'s register acts as an entirely separate stack. You can push as many values as you want to the register with successive p calls, and pull them back down with successive q calls.

# Input/output

All input/output instructions are split into numeric and character versions. Normal input as a buffer is sent either as the first parameter in a terminal, or by piping it into the command. Input can also be sent after a blocking-read, which interprets characters sent through stdin.  
All input/output uses UTF-8

## Normal input
**`i`**	Character input: pulls a character from the input buffer onto the stack. If no more input is present, returns -1.  
**`j`**	Decimal input: pulls a number from the input buffer onto the stack. If no more input is present, returns -1. Characters in the input buffer are passed as normal, except . and space. Space is ignored except as a delimiter for numbers, and . acts as a decimal point in floats. adjacent numbers separated by characters or space count as a single item.    
> See "Parsing numbers" for more detail.

For the most part you can think of the input buffer being sent immediately on load. For example, running worm.js code.worm "word23a5.67 5b" will send "word23a5.67 5b" as the starting input buffer.  
The number/character parsing happens during the i/j instruction. Calling i for each item in this buffer will effectively transfer the whole buffer to the program stack popping from the front until empty (so the very bottom/first value in the stack will be the code for the character 'w'. the top/last value will be 'b').  
Calling j will parse numbers and place them in the stack (See "Parsing numbers" for more detail).  

## Normal output
**`u`**	Character output: pops x off the stack and writes it to stdout as a utf-8 character. ([97] sends an "a" to the output).  
**`n`**	Decimal (number) output: pops x off the stack and writes it to stdout as a number. ([5.23] sends 4 characters to the output, "5", ".", "2", and "3").  

## Blocking input read
**`r`**	Character read: halts program execution and waits for a single character sent to stdin. This will send any (normal utf-8 character) input immediately to the stack and resume execution.  
**`t`**	Integer read: halts program execution and waits for a number to be entered and sent to stdin. This will not send input immediately, it will wait until a newline is sent and parse the whole line as a number in the same manner as j or ''. (integer is a dumb name I just wanted a moniker for the t command. It can still read floats).  
> See "Parsing numbers" for more detail.

In the case where other characters are sent after the blocking t instruction, they are all parsed as characters. In-fact, you can think of t as more of a line-input function rather than one purely for number groupings, but it is still important to keep the number group parsing behavior of the t instruction in mind.

## Misc
**`w`**	Wait: pops x off the stack, pauses execution for (x\*10)ms.

# Code modification

One of the main reasons why this language cannot be compiled is because the code can modify itself at runtime.  

## Meta
**`g`**	Get: pops y then x off the stack, then pushes the value at (x,y) on the board. Accessing a cell outside the board's boundaries pushes a -1, and empty cells (spaces) push 32.  
**`s`**	Set: pops y, x, and v off the stack, then sets the value at (x,y) on the board to v. Both 0 and 32 place a space on the board. Negative x and y values are ignored. Any negative v value deletes the cell from the board and creates new boundaries. (subject to change)  

# Everything else

## Misc
**`;`**	Stops the program.

# Edge cases

\\/\\/> is very error-lenient, for every instruction that pops from the stack, if the stack is empty it will return a 0. Popping from other stacks/buffers may be different, for instance i/j will return -1 from an empty input buffer, q will return -1 from an empty register, etc.  
Any instructions interpreting popped values as coordinates will floor fractions and generally modulo the value into a positive number.  
Any instructions expecting an integer from a popped value will floor the value.  
If a teleport happens to land the pointer on an empty line and tries traveling horizontally, it will wrap downward to the next line, starting at the beginning of the line if going right or the end of the line if going left. This is to prevent an infinite instruction-less loop.  

# Order of events

The core loop of each step of the program consists of 2 events: execute and move.
1. Execute
    * Run the instruction under the pointer. If the instruction changes the pointer direction or angle, change that immediately
    * Some instructions cancel the move event. If that is not the case, continue to the Move event. Instructions that cancel the move event include x, y, and \`
2. Move
    * Move the pointer to the cell it will land on based on its current position and the direction and angle it is traveling. A "move" in this section means to acknowledge walls/edges but ignore all instructions on the board.
    * If the current cell is not an edge, continue.
    * If the current cell is an edge and the board is in Wall Mode, run the calculation outlined in the Wall Mode section. Continuation only happens once the pointer is on the board.
    * If the next cell is an edge and the board is not in Wall Mode, run the calculation outlined in the Edges section; If traveling diagonally move the pointer in the relatively counterclockwise cardinal direction and wrap if applicable, then move the pointer in the relatively clockwise cardinal direction and wrap if applicable. If moving cardinally, rotate clockwise along the wall.
    * continue back to the Execute event.

# Tips and tricks

* The o instruction can be used to return back to the start of the program, if only one exists. Useful for a single character loop command  
* The \` can also be used to return to the start of the program if there's nothing in the stack, since empty stack popping defaults to 0  
* To get the inverse of a number (0 - x), instead of doing 01-* you can save 3 characters by only using - if the number is the only one on the stack (since 0 will be used for the left value). Otherwise, you can do 1[-] which doesn't save any characters but feels cooler.  
* To get a -1 on the stack, if the register is empty the q instruction will push a -1  

# Test cases/example programs

Simple Hello World programs
```
"hello world"mx
uh?!;
```
prints "hello world"
```
\/\/>*"ello world"mx
c.8d         ouh?!;o
```
prints "hello world"
```
#&"olw"
"~  o
@~;d r u
"e"8l   h
?
!
/!&*pp:qq &o
```
prints "hello world"
```
"m00guuuuuuu|;
```
quine: outputs its own source code, '"m00guuuuuuu|;'
```
0p84*}x{2[$:@9a*)?-+]q!
\q:p?y  >i:0(?o:{:}%2(?
h ?!;4.o~m~u
\~q1+2%p^
```
A program complying to this codegolf challenge, which takes input and causes 'a' characters to replicate capslock (it's slightly incorrect)

# Reference sheet

**`>v<^`**	Pointers: sets pointer direction to right, down, left, and up respectively.  
**`\/|_`**	Mirrors: reflect direction across y=x, y=-x, horizontal, and vertical axes respectively.  
**`xy`**	Lane shifts: shifts pointer diagonally clockwise and counterclockwise respectively, but retains direction.  
**`&`**	Rotate: rotates pointer direction 45° clockwise.  
**`#`**	Toggles "wall mode".  
**`k`**	Random: sets pointer direction to a new random direction, in one of the four cardinal or diagonal directions based on the current pointer angle.  
**`o`**	Wormhole: finds the closest matching o on the board and teleports the pointer there, retaining direction. If there is a conflict between multiple wormhole distances, the closest to (0,0) (earliest character index) is chosen. If there is no other o on the board, the pointer is teleported to (0,0).  
**`` ` ``**	Teleport: pops y then x off the stack, then teleports the pointer to (x,y), retaining direction. The instruction at (x,y) will be executed. Locations outside the board will be modulo with the max width/height.  
**`!`**	Jump: skips the next instruction.  
**`?`**	Conditional jump: pops x off the stack, if x is 0 skip the next instruction.  
**`.`**	Variable jump: pops x off the stack, skips the next x instructions. Negative numbers are ignored.  
**`0-9`**  
**`a-f`**	Pushes corresponding hexadecimal value onto the stack.  
**`+-*,%`**	Add, subtract, multiply, divide respectively: pops y then x off the stack, push the result of x [operator] y  
**`l`**	Floor: pops x off stack, pushes floor(x) back onto stack.  
**`()=`**	Less than, greater than, and equality conditional operators: pops y then x off the stack, returns the result of x [operator] y, mapping false to 0 and true to 1.  
**`"`**	Toggles character string mode.  
**`'`**	Toggles decimal string mode.  
**`:`**	Duplicates top value on stack.  
**`~`**	Removes top value on stack.  
**`$`**	Swaps top two values on stack.  
**`@`**	Rotates top three values on stack to the right. The rightmost value wraps to the start of the set of 3 values.  
**`{}`**	Shift: shifts the entire stack left or right respectively. Values off the end of the stack wrap to the other end.  
**`[`**	Begin new stack: pops x off the stack and creates a new stack, moving x values from the old stack into it.  
**`]`**	Close stack: move all values of the current stack to the top of the underlying one. If the current stack is the main stack, this clears all values.  
**`m`**	Mirror: reverses the entire stack.  
**`h`**	Height: pushes the height (size, number of items) of the stack onto the stack  
**`p`**	Pops the top value off the stack and pushes it to the register.  
**`q`**	Pulls the top value off the register back onto the stack.  
**`i`**	Character input: read single characters from the input buffer. Returns a -1 when the buffer is empty.  
**`j`**	Decimal input: read numbers from the input buffer, parsing number groups as single numbers. Returns a -1 when the buffer is empty.  
**`u`**	Character output: pops x off the stack and writes it to stdout as a utf-8 character.  
**`n`**	Decimal output: pops x off the stack and writes it to stdout as a number.  
**`r`**	Character read: halts program execution and immediately captures any character sent to stdin and pushes it to the stack.  
**`t`**	Decimal read: halts program execution and waits for a newline-submitted string of characters, parsing numbers and pushing it to the stack.  
**`w`**	Wait: pops x off the stack, pauses execution for (x\*10)ms.  
**`g`**	Get: pops y then x off the stack, pushes the value at (x,y) on the board. All edges return a -1, empty cells return 32.  
**`s`**	Set: pops y, x, and v off the stack, then sets the value at (x,y) on the board to v. Both 0 and 32 place a space on the board. Negative x and y values are ignored.  
**`;`**	Stops the program.  