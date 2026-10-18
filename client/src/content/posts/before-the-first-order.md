title: How much history a strategy needs before its first order
date: 2026-10-16
about: LlamaTrade
cover: /img/posts/before-the-first-order-wide.webp
card: /img/posts/before-the-first-order-card.webp
summary: A strategy cannot trade until its indicators are warm. LlamaTrade reads the strategy before fetching a single bar to work out how much past it needs, and the number in an indicator's name is usually not it.

A LlamaTrade strategy is a small S-expression that returns target weights. Before it can return anything, its indicators have to be warm, and whatever decides how much history to load has to know how much warm means.

That number is load-bearing in three places. A backtest has to fetch history from before its own start date, or its first months produce nothing. A live session has to preload bars before its first real one, or it sits idle accumulating them. And the evaluator has to decide how many bars to keep in memory, because it recomputes indicators over its accumulated history on every step.

So the strategy is read before any bar is fetched.

## The plan, before the data

![Compiling a strategy produces a plan before any market data is requested: the symbols it reads, the indicators it needs with each one's warm-up, the bars required before the first evaluation, and the cap on retained history.](figure:plan)

Parsing produces an AST. A static pass over that tree produces an execution plan: the set of symbols the strategy reads, one specification per distinct indicator, the number of bars needed before the first evaluation, and a cap on how many bars to retain per symbol.

Indicators are collected into a map keyed on type, symbol, source and parameters, so two references to the same 200-day average on the same symbol compile to one computation. Symbols come from three places: the assets the strategy can hold, the symbols its conditions read without holding, and the benchmark. A strategy that holds nothing but SPY while reading a condition on VIX needs both.

Here is a real plan, printed by the compiler on 18 October 2026 for the momentum rotation strategy in the docs:

```
symbols       AAPL AMZN BIL GOOGL MSFT NVDA SPY   (7)
indicators    sma(SPY, close, (200,))
min_bars      200
window        210
```

Seven symbols for a strategy that holds at most three, because the universe it ranks and the SPY it tests the regime against all have to arrive before it can decide anything.

## The number in the name is not the warm-up

The obvious way to compute the warm-up is to take the largest period any indicator declares. That is correct for a simple moving average and wrong for about half of the catalogue.

An indicator's warm-up is the index at which its slowest output is first defined, which depends on how it is built rather than on what it is called. The plan derives it per indicator type:

```
reference              bars before the first value
(sma SPY 20)                                    20
(bbands SPY 20 2.0)                             20
(rsi SPY 14)                                    15
(atr SPY 14)                                    15
(stoch SPY 14 3 3)                              18
(ema SPY 20)                                    22
(adx SPY 14)                                    28
(macd SPY 12 26 9)                              34
(obv SPY)                                        1
```

ADX is the clearest case. It is a Wilder average of DX, and DX is itself computed from Wilder-smoothed directional movement, so the published value only exists at twice the period. MACD's signal line is an exponential average of the MACD line, which is itself the difference of two exponential averages, so the signal warms at slow plus signal minus one. The exponential average gets two bars of headroom beyond its period so that chains of them stay warm.

Getting this wrong fails quietly, which is why it is worth the table. If the plan says a strategy is ready at 14 bars and the ADX it reads is still undefined, the condition reading it evaluates against a NaN, is treated as false, and the strategy holds nothing. No error is raised. The run completes. It just never trades, and the reason is three layers down.

## Blocks read history too

Indicators are not the only readers. A momentum weighting ranks by trailing return over a lookback, defaulting to 90 bars. The volatility-based methods, inverse volatility, risk parity and minimum variance, read a covariance window defaulting to 60. A filter ranking a universe defaults to 90. A metric with a period, such as `(return SPY 60)`, reads that many bars plus one, because a return over 60 bars needs the bar before the window as its base.

So the warm-up is the largest bounded read anywhere in the tree, across indicators and blocks together, floored at two bars so a crossover always has a previous bar to compare against. The walk visits every child rather than stopping at the first answer it finds, because a short-circuit would drop the lookbacks of later siblings, and the largest one is the only one that matters.

## Why there is a cap at all

![Retained history is capped at the largest window the strategy actually reads, plus headroom. The cap keeps per-bar indicator recomputation bounded without changing any result.](figure:window)

The evaluator recomputes indicators over its accumulated bar history on every step. With unbounded history, a run of N bars does work proportional to N on each of N steps, so a long backtest degrades quadratically. Capping retained history at the largest window the strategy actually reads makes it linear in the number of bars times that window.

The cap has to be exact or it changes answers. It is the largest bounded read plus ten bars of headroom, where the headroom covers off-by-one reads such as the previous bar a crossover needs. For the momentum rotation strategy that is 200 plus 10, which is the 210 in the plan above.

That the cap does not change results is a test rather than an argument: one case runs a strategy with the window applied and again with history unbounded, and asserts the outputs match.

## The reads that have no bound

Some reads genuinely want the whole series. A metric written without a period, such as `(return SPY)` or `(drawdown SPY)`, means the return or drawdown over everything retained. On-balance volume and VWAP are cumulative from the first bar by definition.

These cannot be bounded exactly, so they are bounded deliberately. A strategy containing one is capped at 2,000 bars, roughly eight years of daily data, and the cap is logged when it applies. The compiler reports it plainly:

```
strategy "Unbounded read"    min_bars 2    window 2000
```

This is an approximation and worth naming as one. A drawdown computed over 2,000 bars is not a drawdown over all history, and a strategy whose backtest runs longer than that is measuring something slightly different from what its author wrote. The alternative was unbounded memory and quadratic recompute on every such strategy, which seemed like the worse trade. The cap never falls below the warm-up need, so a long-warming strategy that also reads unbounded history keeps enough bars to function.

## What this buys downstream

A backtest uses the warm-up to pad its fetch window backwards. To trade from 2 January 2020 with a 200-bar warm-up it asks the market-data service for bars from around March 2019, so the moving average is already defined on the first day the user asked about rather than warming up through the first ten months of the result.

A live session uses the same number to preload. Before the first real-time bar arrives it fetches the warm-up from history, so a session started this morning can trade this morning rather than after 200 trading days. That preload is best-effort: if it fails, the session starts cold and warms from the stream instead of refusing to start.

## Limits

The warm-up is counted in bars, not in time, and a bar means whatever the feed is producing. A backtest at daily granularity and a live stream at one-minute granularity will both satisfy a 200-bar warm-up, but one covers ten months and the other covers about three hours. Reconciling the daily preload with the raw live stream is an open item rather than a solved one, and it is the largest known gap between what a backtest predicts and what a live session does.

The per-indicator warm-ups are derived from how the library computes each one, so they are only correct as long as the two stay in step. A parity test asserts that every indicator in the language has a default-parameter entry, which catches a new indicator added without one, but it cannot catch a changed implementation whose warm-up moved.

The behaviour described here is pinned by 18 cases over the window analysis, 6 over the retained history, and 5 over the warm-up lookback. All 29 pass as of 18 October 2026.
