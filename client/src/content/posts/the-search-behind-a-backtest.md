title: How many strategies were tested before this one
date: 2026-10-17
about: Research methods
category: Industry & practice
cover: /img/posts/the-search-behind-a-backtest-wide.webp
card: /img/posts/the-search-behind-a-backtest-card.webp
summary: A backtest is easier to assess when the report includes the alternatives tried and the data used to select the final strategy.

A strong backtest is easier to interpret when the report also says how many alternatives were tried before it was selected.

Changing the entry rule, the lookback period or the set of assets creates more opportunities to find a result that fits the historical data. Reporting only the best version leaves out that search.

## Recording the search

Bailey and colleagues describe this problem in [their research on backtest overfitting](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2308659). Testing more configurations can increase the chance of selecting a strategy whose apparent performance does not hold up on new data.

That makes the experiment history useful evidence alongside the return chart: what was tried, what was changed after seeing results, and which data remained unused during selection.

A held-out period is less informative if it keeps influencing the next revision. Keeping a record of those revisions makes it easier to assess what was actually tested. None of this guarantees future returns, but it helps distinguish a result evaluated on new data from one repeatedly adjusted to the same history.

## Keep the unsuccessful trials

A research record is more informative when it includes discarded configurations as well as the selected result. Otherwise, a reader cannot tell whether the final version was specified before looking at the data or chosen after many revisions.

This is relevant beyond trading. Whenever many alternatives are compared on the same evidence, selection becomes part of the experiment. A report that omits that process leaves out information needed to interpret the result.

## Separate development from evaluation

Document which data influenced each decision. If an evaluation period leads to another adjustment, it has become part of development. Calling it a test period does not restore the independence it had before the result was used.

For a strategy report, this history sits alongside other assumptions, such as transaction costs and how trades would be executed. The aim is not to turn a backtest into a promise. It is to make the evidence and its limits clear enough that another person can assess the work without reconstructing the entire research process.
