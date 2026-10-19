title: What students can do after the help is removed
date: 2026-09-25
about: Learning
category: Industry & practice
cover: /img/posts/learning-after-ai-help-wide.webp
card: /img/posts/learning-after-ai-help-card.webp
summary: Better assisted practice does not by itself establish better learning. A classroom study shows why independent work belongs in the evaluation.

An AI assistant can help a student finish an exercise. Whether that help leaves the student better able to solve the next exercise is a separate question, and a learning product needs a way to check it.

A useful evaluation therefore includes work done with the assistant and work attempted afterward. The difference matters because a correct assisted answer can come from several sources: the student's understanding, a helpful hint or an explanation that has already supplied most of the solution.

## What one study found

A [2025 study of high-school mathematics](https://doi.org/10.1073/pnas.2422633122) compared a general GPT-4 interface, a tutor configured with learning safeguards and a control group. The general interface improved assisted practice performance, but students later performed worse without it. The reported reduction was 17% relative to the control group's average unassisted performance, rather than 17 percentage points. The guarded tutor's unassisted result was not statistically distinguishable from the control group.

That last finding does not establish that the groups were equivalent or that the tutor improved independent learning. The study concerns particular interfaces, students and tasks. It is useful evidence for examining how help is provided, without turning it into a claim that all AI assistance has the same effect.

## Deciding what the student should do

Consider an assistant helping someone solve an equation. It could show the full solution, explain one transformation or ask the student to choose the next step. Each response leaves a different amount of reasoning for the student to perform.

There are situations where seeing a worked solution is useful. The question for the product is what happens around it. Does the learner try a step first? Can they ask why it works? Is there another problem where they can apply the explanation without the answer already being visible?

I would start with the skill the exercise is supposed to develop, then examine which parts of that skill the assistant is doing on the student's behalf. That gives the design review something more specific than counting correct answers or measuring how quickly the session finishes.

## Checking a new attempt

After help with one equation, a new problem can give the learner an opportunity to use the same method. It should be sufficiently different that copying the earlier answer will not solve it, while remaining comparable in difficulty.

I would record what happens before another hint is given. If the learner needs support, the session can continue with it. The record should simply preserve the distinction between an independent attempt and an answer reached after assistance.

Asking for an explanation can add context, especially when the final answer alone does not reveal the method. But the wording and review of that explanation also need care. A student who understands the mathematics may express it briefly or use different language from the tutor. An evaluation that rewards matching the tutor's phrasing could measure the wrong thing.

## Recording the two kinds of attempt separately

Most of this depends on the product keeping assisted and unassisted work apart in its own data.
If both land in one events table as answered correctly, the distinction described here cannot be
recovered afterwards.

An attempt is worth storing with what surrounded it: whether a hint was shown before the answer,
whether an explanation had been given for that concept, how long since the relevant lesson, and
whether this was a first attempt or a retry. None of that is expensive to record, and none of it
can be reconstructed later from a score.

It also changes what a teacher or parent can be shown. A progress view built on completion says
a learner finished the unit. A view that separates the two says which ideas they used without
help, which they needed support for, and which have not been checked since the lesson. The
second is more useful and more honest about what is not yet known.

## Designing what the help actually gives

If help is going to vary, it is worth deciding what each level hands over. A prompt that asks the
learner what the question is asking for leaves the reasoning with them. A hint that names the
method narrows the search. A worked step performs one piece. A full solution performs all of it.

Those are different products, not different amounts of the same product, and a tutor that jumps
to the last one whenever a learner hesitates has made a design decision whether or not anyone
intended it.

A reasonable default is to offer the smallest useful step first and let the learner ask for more.
That depends on the learner being willing to ask, which varies, so the sequence is something to
try with learners rather than settle from first principles. What the earlier study supports is
narrower: the shape of the help affected what students could do afterwards, which is a reason to
treat that shape as a design decision rather than a detail.

## Choosing what to measure over time

An immediate new attempt and a later follow-up answer different questions. The first checks what the student can do just after receiving help. The second checks what they can still use after some time has passed. A product should label those observations accurately rather than presenting either as a complete measure of mastery.

For an evaluation of a new assistant design, I would define those outcomes before looking at the results. The tasks should be comparable across versions, and differences in prior knowledge and access to help should be considered when interpreting the comparison. Otherwise, an apparent improvement may come from easier questions or a different group of learners.

The aim is not to remove every form of support. Accessibility needs and the purpose of the activity still matter. The narrower question is whether the assistance being evaluated helps the learner develop the intended skill. Looking at a subsequent attempt gives the product a way to investigate that question beyond the answer produced during the assisted session.
