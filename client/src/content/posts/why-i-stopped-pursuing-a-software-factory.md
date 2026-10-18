title: Why I stopped pursuing a software factory
date: 2026-09-11
about: Building products
category: Industry & practice
cover: /img/posts/why-i-stopped-pursuing-a-software-factory-wide.webp
card: /img/posts/why-i-stopped-pursuing-a-software-factory-card.webp
summary: Coding agents already do much of the implementation in my projects. Using what they build is still how I work out what to ask for next.

I started working on the idea of building my own software factory: a system where coding agents could take on more of the work of building a product. I stopped pursuing it because the promise had got ahead of what I actually needed.

Coding agents already do much of the implementation in my projects, and that part works. I still need to use what they build to understand whether it is useful and what should change next. Automating more of the process would not remove that responsibility.

## Using what gets built

A feature can meet its requirements and still be awkward to use. Requirements describe what someone knows to ask for. Using the feature brings up things that were missing from that description: information shown too late, a choice that is difficult to understand, or a small interruption repeated throughout a task.

Consider a booking flow. Every individual step might work: select a service, choose a time, enter contact details and confirm. Tests can verify that the appointment exists afterward. But suppose the duration and cancellation terms only appear on the final screen. A person may have to go back and reconsider the time they chose. Nothing is broken in the narrow sense, yet the flow makes the decision harder than it needs to be.

The next change could be quite small. Show the relevant information while the person is choosing. That is a much more useful instruction than asking an agent to improve the booking experience, and it comes from understanding the decision the person is trying to make.

## Getting specific enough to direct the work

This is the part I do not want to become distant from. The more familiar I am with a product, the better I can describe a problem without prescribing every detail of the implementation.

A useful request names the situation, the difficulty and the result that would help. In the booking example, the situation is choosing a time. The difficulty is discovering the appointment length after that choice. The result is being able to make the choice with the relevant information already visible. An agent has room to propose a solution, and I have something concrete to assess when I try it.

That familiarity also helps with scope. An extra setting or a new screen can look like progress in a task list. Sometimes the useful change is moving an explanation or removing a step. Spending time in the product makes it easier to tell which kind of change is needed.

## Keeping automation close to feedback

There is plenty of work I want agents to carry: implementation, tests, investigating failures and checking changes. When the task and its checks are well understood, automating more of it makes sense.

Product decisions often need another loop. I want to try the result, describe what feels difficult, make a change and try it again. A completed task or a passing test suite is useful evidence within that loop. It does not answer every question about the experience.

For work like this, I would rather have a small usable change to assess than a long sequence of dependent changes built on an assumption I have not tried yet. If the assumption is wrong, finding that out early saves revisiting everything that depended on it.

## Learning from people who use it

My own familiarity has limits. I know where things are because I helped decide where to put them. Someone arriving for the first time may need an explanation I no longer notice is missing. Watching how other people use the product and hearing where they get stuck gives me information I cannot get by using it alone.

That feedback can also overturn a decision I liked. Staying close to the product should make those conversations more specific, while leaving room for someone else's experience to change my mind.

This is why I stopped pursuing the factory idea. I want help carrying out the work, and I want to keep developing the understanding needed to direct it. Using the product, hearing from people and deciding what to change remain part of building it.
