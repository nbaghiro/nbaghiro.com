title: How many strategies were tested before this one
date: 2026-09-18
about: Research methods
category: Industry & practice
cover: /img/posts/the-search-behind-a-backtest-wide.webp
card: /img/posts/the-search-behind-a-backtest-card.webp
summary: A backtest is easier to assess when the report includes the alternatives tried and the data used to select the final strategy.

A backtest is easier to interpret when it comes with a record of the search that produced it. A strategy chosen before inspecting the data and a strategy selected from many alternatives can produce similar-looking charts, while giving us different reasons to trust the result.

The final configuration does not show how many lookback periods, thresholds, asset lists or date ranges were tried along the way. Those choices are part of the experiment, even when they were made manually rather than by an optimizer.

## Counting the choices behind the result

Suppose a researcher tries four lookback periods, three thresholds and two asset universes. Testing every combination produces 24 configurations. Reporting only the best one leaves the reader unable to see whether it was representative or an unusual result within that group.

The configurations may be closely related. Twenty-four trials does not mean 24 independent experiments, and the count alone does not give a probability that the result is overfit. It still provides useful context about how much selection took place.

Bailey, Borwein, López de Prado and Zhu examine this selection problem in [The Probability of Backtest Overfitting](https://www.davidhbailey.com/dhbpapers/backtest-prob.pdf). Their work describes how selecting strategies through historical simulations can produce misleading results and develops a framework for assessing that risk. The practical implication I take from it is to preserve the research process alongside the chosen strategy.

## Keeping a record before choosing

For the example, I would record the reason for trying those parameters, the data period, the code revision and the assumptions about execution and costs. Each run would keep its configuration and result, including configurations that were later rejected.

That record makes subsequent questions answerable. Did a change follow a stated hypothesis, or was it introduced after seeing a disappointing result? Was the asset universe available at the time being simulated? Did the cost assumptions change between runs?

A manual adjustment belongs in the record too. Trying a different start date or excluding an inconvenient period can affect selection without appearing in a parameter grid. Recording those decisions does not make them invalid; it makes their influence visible.

## Protecting the later evaluation

Data reserved for evaluation loses that role if its results are repeatedly used to revise the strategy. Once a disappointing result leads to another adjustment, that information has influenced development. Renaming the same period a test set does not undo that influence.

I would decide in advance which data can guide development and when the reserved evaluation will be examined. If the result prompts further work, I would record that the evaluation informed the revision. A new assessment then needs to account for that history rather than presenting the revised strategy as untouched by it.

This can feel inconvenient when historical data is limited. It is still useful to acknowledge the limit. Reusing the same information while describing each attempt as a fresh test would make the evidence look stronger than it is.

## Reporting more than the selected curve

A useful report could show the chosen configuration alongside nearby alternatives. If a small change in a threshold produces a very different result, that sensitivity deserves investigation. Similar results across nearby settings are helpful context, although they do not establish that the strategy will work on new data.

The report should also identify what the simulation actually includes. A strategy calculation, modeled transaction costs and assumptions about when trades could execute each contribute to the result. A backtest that omits a relevant constraint cannot answer how the strategy behaves under that constraint.

For the 24-configuration example, I would want the selection rule, the full set of results and a clear account of which data informed the choice. That would let another person understand how the selected result emerged and reproduce the comparison. It would also make the next experiment easier to plan without losing track of what has already been tried.
