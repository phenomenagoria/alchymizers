


---

Alchymizer -
a game about being a backcountry moonshiner making alcohol with various gimmicks and ingredients. with tbe goql of being the best distiller in the woods.
1. Core Game Concept

Players compete over 9 rounds to brew the most valuable potion.

Each round players:

1. Draw ingredient chips blindly from a bag.


2. Place them into a spiral pot track on their player board.


3. Try to maximize value without exploding.



Explosions happen when the sum of white chips > 7.

At the end of the round players:

Gain coins

Gain victory points

Buy new ingredients


This creates a bag-building engine where better ingredients increase power but also change probability.


---

2. Components

2.1 Player Boards (The Pot)

Each player has a pot board containing:

Spiral Track

A spiral path starting at the center and winding outward.

Each space has:

Victory points

Coins


Example structure:

Position	Coins	Victory Points

0 (start)	0	0
1	1	0
2	1	0
3	2	0
4	2	1
...	...	...
End	20+	15


The further along the spiral your potion goes, the better rewards.


---

Special Spaces

Some spaces include icons:

Icon	Meaning

Ruby	Gain a ruby
Drop icon	Move starting droplet forward
Ingredient symbol	Trigger ingredient ability



---

Starting Droplet

A marker showing where your spiral begins.

Advancing it makes future potions stronger.


---

Explosion Track

A marker showing the white chip total.

If white values exceed 7 → explosion.


---

2.2 Ingredient Chips

Chips are circular tokens placed into the bag.

Diameter typically:

~20–25 mm


Each chip has:

Color
Number (1, 2, or 4)

Example:

[Orange | 1]
[White | 3]
[Green | 2]

Number = how far forward the chip moves the potion


---

3. Starting Ingredients

Each player begins with the same bag contents.

Ingredient	Count	Value

White	4	1
White	2	2
White	1	3
Orange	1	1


Total chips in bag = 9

White chips are dangerous.

Orange chips are safe but weak.


---

4. Ingredient Colors and Abilities

Each color has unique mechanics.

Abilities activate either:

Immediately when drawn

At end of round


Below is the base rule set.


---

5. Ingredient Ability Specifications

5.1 White Chips (Explosion Chips)

Color: White
Values: 1, 2, 3

Rule:

white_total += value

if white_total > 7:
    potion explodes

Explosion consequences:

Player must choose ONE:

Take victory points

Take coins



They cannot take both.


---

5.2 Orange Chips (Pumpkin)

Color: Orange
Values: 1

Ability:

No special ability

Purpose:

Safe filler ingredient

Helps advance potion distance



---

5.3 Green Chips (Garden Spider)

Color: Green
Values: 1, 2, 4

Ability (Version 1 rules):

If the last or second-last chip placed is green:

gain 1 ruby


---

5.4 Red Chips (Toadstool)

Color: Red
Values: 1, 2, 4

Ability:

move forward extra spaces
equal to number of orange chips already placed

Example:

if orange_count = 2
red chip = value 1

move = 1 + 2 = 3 spaces


---

5.5 Blue Chips (Crow Skull)

Color: Blue
Values: 1, 2, 4

Ability:

When placed:

draw 1 more chip
if it is white -> return it to bag
otherwise place it


---

5.6 Yellow Chips (Mandrake)

Color: Yellow
Values: 1, 2, 4

Ability:

for each yellow chip already placed
move 1 extra space

Example:

2 previous yellows
place yellow 1

move = 1 + 2


---

5.7 Purple Chips (Ghost's Breath)

Color: Purple
Values: 1

Ability triggers end of round.

If player placed:

Purple Count	Reward

1	1 victory point
2	1 ruby
3	2 victory points



---

6. Round Flow

Each round has 4 phases.


---

Phase 1 — Fortune Teller Card

Draw an event card.

Examples:

Everyone gains a ruby

First chip counts double

Everyone moves droplet



---

Phase 2 — Brewing Phase

Players simultaneously:

while player chooses to draw:
    draw chip from bag
    place in pot
    resolve ability

Player may stop anytime.

Explosion stops the process.


---

Phase 3 — Scoring

Look at final chip position.

Rewards:

Reward	Description

Coins	buy ingredients
Victory Points	win condition
Rubies	upgrade droplet


Exploded players must choose:

points OR coins


---

Phase 4 — Buying Ingredients

Players spend coins.

Ingredient costs:

Ingredient	Cost

Orange	3
Green	4 / 8 / 14
Red	6 / 10 / 16
Blue	5 / 10 / 19
Yellow	8 / 12 / 18
Purple	9


Limits:

max 2 ingredients per round
must be different colors


---

Phase 5 — Cleanup

Players:

1. Return chips to bag


2. Move droplet if spending rubies


3. Reset white explosion counter




---

7. Rubies

Rubies allow:

2 rubies → move droplet forward 1

Droplet shift improves future starting point.


---

8. Game Length

Total rounds:

9 rounds

Round 9 special rule:

players cannot buy ingredients
only score


---

9. Victory Condition

Winner = player with most victory points after round 9.

Tie breaker:

player with best final potion position


---

10. Bag Mechanics (Probability Engine)

The core design principle is risk management through bag composition.

Players start with:

6 white chips
3 safe chips

As they buy ingredients:

safe chips increase

abilities increase

explosion risk changes


Game tension emerges from probability vs reward.


---

11. Piece Creation Guide (for Custom Version)

Your niece could design pieces like this:

Ingredient Chips

Material ideas:

Wood discs

3D printed tokens

Poker chips

Clay tokens


Label:

COLOR
VALUE
ICON

Example visual design:

Red chip:
🐸
2


---

Player Boards

Could be:

printed spiral

laser cut wood

dry erase board


Minimum fields:

spiral track
explosion counter
ruby storage
droplet marker


---

Bag

Any opaque container works:

cloth bag

dice bag

pouch



---

12. Minimum Component List

For 4 players:

Component	Count

Player boards	4
Bags	4
White chips	~24
Orange chips	~20
Other ingredient chips	~40
Rubies	~20
Droplets	4
Event cards	~24



---

13. Game Design Philosophy

The game works because of:

1. Push your luck tension


2. Bag probability evolution


3. Ingredient synergies


4. Simultaneous turns


5. Short round loops



Average round time:

5 minutes

Total game time:

45 minutes


---

💡 If you want, I can also give you:

a full printable component list

exact spiral track numbers

all 24 fortune teller cards

all ingredient rule variants


