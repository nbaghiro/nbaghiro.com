title: How much history a strategy needs
date: 2026-10-16
about: LlamaTrade
cover: /img/posts/before-the-first-order-wide.webp
card: /img/posts/before-the-first-order-card.webp
summary: LlamaTrade calculates a strategy's warm-up and retained history from its indicators and lookbacks. The calculation affects when evaluation can begin and how much work each step requires.

Before LlamaTrade evaluates a strategy, it needs enough price history for the indicators and conditions that strategy reads. A moving average with a period of 200 needs a different starting point from an ADX with a period of 14. The compiler calculates those requirements from the strategy.

The result is used to decide when evaluation can begin and how much history to retain. Those are related decisions, but they answer different questions. Warm-up establishes whether the calculation has enough input. Retained history limits the data available to later calculations.

## Compiling the requirements

![The compiler collects symbols and indicators and calculates the warm-up and retained-history window.](figure:plan)

Parsing produces a tree of strategy expressions. The compiler walks that tree to collect the symbols, indicator specifications and lookbacks. Repeated references with the same indicator, symbol, parameters and output share a specification.

The symbol set includes assets the strategy can hold, symbols read by its conditions, and its benchmark. An asset does not have to receive an allocation to be needed by the calculation.

For the momentum rotation example in the repository, the plan contains:

```
symbols       AAPL AMZN BIL GOOGL MSFT NVDA SPY   (7)
indicators    sma(SPY, close, (200,))
min_bars      200
window        210
```

The strategy can select three stocks from its universe or fall back to BIL. It also reads SPY's 200-bar average. That explains why the plan includes seven symbols even though the strategy holds fewer at a time.

## Calculating the warm-up

An indicator's period does not always equal the number of bars it needs. Some calculations use a previous value; others apply several stages of smoothing. The compiler has a rule for each indicator type.

```
reference              planned warm-up in bars
(sma SPY 20)                                 20
(bbands SPY 20 2.0)                          20
(rsi SPY 14)                                 15
(atr SPY 14)                                 15
(stoch SPY 14 3 3)                           18
(ema SPY 20)                                 22
(adx SPY 14)                                 28
(macd SPY 12 26 9)                           34
(obv SPY)                                     1
```

In this implementation, ADX smooths directional movement, calculates DX, and then applies another Wilder average. Its first defined output requires twice the declared period. MACD's signal line also depends on an earlier calculation: it is an exponential average of the difference between two exponential averages. Its requirement is the slow period plus the signal period minus one.

The EMA entry includes two extra bars of headroom. Its first defined value is available at 20 bars for a period of 20, while the plan requests 22. The table describes the compiler's requirement, including that margin.

If the plan allows evaluation before an indicator is defined, a condition can read NaN and be treated as false. Depending on the strategy, that can select an alternative allocation or leave no allocation. The calculation needs to be checked even when the run completes without an exception.

## Lookbacks outside indicators

Weighting and filtering blocks also read history. Momentum weighting defaults to a 90-bar lookback and needs the preceding bar to calculate the return. Volatility-based weighting methods default to 60 bars. A filter defaults to a 90-bar lookback, with a previous bar included in its requirement.

A metric with a period contributes its own requirement. For example, `(return SPY 60)` needs 61 bars to compare the start and end prices.

The compiler takes the largest requirement across the tree and applies a minimum of two bars. It visits every child so a shorter lookback in one branch does not hide a longer requirement elsewhere.

## Limiting retained history

![The evaluator retains the largest required window plus headroom, limiting the data recomputed at each step.](figure:window)

The evaluator recomputes indicators over its retained history at each step. If it keeps every previous bar, a calculation that scans that history does increasing work throughout the run. Summing those scans over N steps gives quadratic growth in that part of the work.

For bounded reads, the compiler retains the largest required window plus ten bars. In the example above, the 200-bar requirement produces a 210-bar window. Once that window is full, the evaluator removes older bars as new ones arrive.

There is a test that compares a momentum strategy's final allocation after 250 bars, with and without the window. The final weights match for the supplied price series. That is useful coverage for this case, but it does not prove that truncating history preserves every intermediate value or every indicator's output. Calculations that depend on earlier state need their own checks.

## Cumulative calculations

A metric written without a period reads all retained history. The OBV and VWAP implementations are also treated as cumulative calculations.

For a strategy containing one of these reads, the default window is 2,000 bars. If the warm-up and its headroom require more, the compiler keeps the larger amount. The 2,000-bar setting is therefore a default for these calculations, not an absolute upper limit.

This changes the meaning of a full-history metric once older bars have been removed. A drawdown over the retained window can differ from the drawdown since the beginning of the backtest. That is a limitation of the calculation and needs to be considered when interpreting the result.

## What to check when using the plan

A warm-up count only makes sense alongside the data interval. Two hundred daily bars and two hundred minute bars cover different periods. The fetch, preload and live aggregation paths need to provide the interval the strategy expects.

The compiler's rules also need to stay aligned with the indicator implementations. A test that checks default parameters can catch a missing entry; it cannot establish that every implementation still produces its first value at the expected point. Tests should check those boundaries directly and compare retained-history results for the calculations that depend on earlier values.
