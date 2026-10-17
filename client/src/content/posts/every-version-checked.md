title: Checking generated exercises before publication
date: 2026-10-20
about: Lumischool
cover: /img/posts/every-version-checked-wide.webp
card: /img/posts/every-version-checked-card.webp
summary: Lumischool generates questions from parameterized templates. Its verifier checks the resulting answers, layouts and feedback, using a fixed sample when the number of combinations exceeds its limit.

A Lumischool exercise is written once and asked many times. An item declares parameters, and each combination of their values is a version of the question with its own numbers, its own picture and its own answer. The item below has one parameter, so it is six questions:

```
item story.apples-to-ten v=1 skills=[bonds-to-10] {
  let n=3..8
  roles fruit=apple
  scene 24x9 {
    text ask "Mia has {n} {fruit.many}. How many more does she need to have 10?"
    props row count=n prop=apple below=ask gap=1
    number-input answer right-of=row gap=1
  }
  answer (10 - n)
}
```

Parameters let a child repeat a lesson with different numbers and matching drawings. Reviewing the template alone can miss errors that occur for particular values, so the generated questions need checks too.

The verifier in `engine/notation/verify.ts` builds those questions and checks each one. The lesson pack is compiled from the same workspace. Reported errors block the build; warnings do not. Combinations outside a sample remain unchecked.

## Building the versions

`variantsOf` walks the parameters and evaluates each item's `where` conditions, keeping the combinations that pass. When an item allows more than 10,000, it stops walking and draws a seeded sample of 400 instead, recording that the report is sampled.

![One item fans into the versions its parameters allow. Items under the walk limit are checked exhaustively; larger ones are checked through a seeded sample.](figure:variant-fan)

Running that over the curriculum as it stands on 16 October 2026: 5,622 items, 186,272 versions built and checked, 21 of them sampled rather than walked. One item, `columns.add`, allows around 64 million combinations by the sampler's own estimate, and is checked through 400 of them. The whole pass took 54 seconds in one run on my laptop, which is a figure for that machine and that corpus rather than a general measurement.

Sampling leaves some combinations unchecked. For those 21 items the report describes 400 questions out of a much larger space, and a fault in an unvisited combination is not ruled out. The seed is fixed, so the same 400 are checked on every run, which makes the result stable but does not widen it.

## What each version has to satisfy

The answer expression must evaluate successfully. Other checks test whether the drawing and layout can represent the generated question.

Some parts have a capacity the item can exceed without the author noticing. A bus draws one passenger per window, so a version asking about more passengers than there are windows would not draw them all. A sweet jar holds 24. A caption strip holds about two and a half characters for each square of its width. Each of those is a rule in the verifier rather than something an author has to remember.

Layout is checked per version too, because the same template can fit at one value and not at another. An equation with a one-square blank is fine while the answer is a single digit; the version where it reaches ten reports that the blank is too narrow and that the answer belongs in a number box. That failure exists in one version of an item whose other versions are correct, which is the case that reading the template cannot catch.

## A hint that would fire on the right answer

An item can carry feedback: a rule that matches a particular wrong answer and says something useful about it. The apples item above has one.

```
feedback {
  when (answer == n) point=row {
    say "That is how many she has now. Count on from {n} to 10."
  }
}
```

The rule is for a child who answers with the number of apples they can see instead of the number still needed. The hint is appropriate for that mistake, but it also needs to distinguish it from a correct answer.

The verifier evaluates every feedback rule once per version, in an environment where the answer names are bound to the correct values. If a rule is true there, the hint would fire when the child was right, and it reports that the rule cannot tell the mistake apart.

![The hint matches a child who answered with the count they can see. At one value of the parameter, that is also the correct answer, and the two sets overlap.](figure:hint-overlap)

For this item, `answer == n` is also true when `10 - n == n`, which is `n = 5`. Five is inside the range the item declares, so one of its six versions would tell a child that a right answer is wrong. The verifier reports it with the version named:

```
warning: this rule is also true for the correct answer,
so it cannot tell the mistake apart (n = 5)
```

Across the whole curriculum today there are two issues of any kind, and both are this one: `story.apples-to-ten` and `bonds.make-ten`, each at `n = 5`. They are warnings rather than errors, so the pack still builds and the author decides whether to narrow the range or rewrite the rule.

## Answers a child arranges

Some questions are answered by placing parts rather than typing a value, and those are checked differently. `prove` in `engine/arrange.ts` walks every arrangement the part allows, evaluates the answer condition over each one, and reports three things.

At least one arrangement has to be right, or the question cannot be answered at all. No more than one in four may be right, or putting pieces anywhere answers it too often. And no feedback rule may be true of a right arrangement, which here is an error rather than a warning, because the child can see that they solved it. The prover also keeps the simplest right arrangement it found, which becomes the worked answer on the grown-ups' sheet.

The walk is bounded at 20,000 arrangements. Above that, a board whose pieces are placed independently can be solved piece by piece, where the answer and every rule read at most one piece's measurements; that path is exact rather than sampled. Anything larger is refused with a message asking the author for fewer pieces or places.

## Checkers that work the answer out

Some answers cannot be written as an expression over the parameters, so they are produced by a checker declared in code. A checker states the settings it accepts, can list its own solutions so a puzzle is proved solvable before it ships, and can name the answers it works out itself.

Running the program is how the coding questions are checked. That catches a class of mistake that is hard to see in a template. A debugging question asks which single line is wrong, and if two lines are each short by one, mending either leaves the other, so the item is refused with a message saying no change to a single line fixes it. A program that draws random numbers can be asked what could happen but not what did; asking for the value of a random total is refused, and so is a multiple-choice question where two of the options could not happen, because it has more than one answer.

## What this does not establish

A verified item is a question that passed the implemented checks. That does not establish whether it teaches the intended concept well. The checker interface has a separate `warnings` hook for issues that need author review without blocking publication. Teaching quality still needs human judgment.

The physics games are a different case. `engine/motion/verify.ts` can replay a recorded solution through the simulation and report whether it reaches the win condition, and its comment is careful to say that a successful replay is a witness of reachability rather than an exhaustive proof. That function is currently exercised only by its own tests. No game level ships through it today, so the games do not have the guarantee the exercises have.

For generated content, reviewing the template and checking its outputs serve different purposes. The verifier catches problems with answers, drawings and feedback that can appear only at particular parameter values. Its report also needs to make clear which combinations were checked and which issues still require author review.
