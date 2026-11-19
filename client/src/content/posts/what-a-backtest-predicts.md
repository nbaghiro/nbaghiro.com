title: What a backtest predicts about a live run
date: 2026-11-18
about: LlamaTrade
cover: /img/posts/what-a-backtest-predicts-wide.webp
card: /img/posts/what-a-backtest-predicts-card.webp
summary: LlamaTrade shares strategy evaluation and order sizing between backtests and live sessions. Data delivery, bar resolution and execution still affect the decisions and results. This article explains the shared code and the remaining differences.

A backtest evaluates a strategy against historical data. To compare it with a live session, we need to understand which decision rules are shared and which inputs and execution conditions differ.

In [LlamaTrade](https://llamatrade.ai), we use the same strategy session to evaluate rules and size orders in both paths. Shared code keeps those calculations consistent, but differences in data, portfolio state and execution can still change the result.

## Shared strategy evaluation and sizing

The implementation has two layers: a strategy session and a runtime loop.

The first layer is a strategy session: one compiled strategy running over one account or sleeve, holding the merged history for every symbol it reads. It owns the whole path from bars to intended orders, and both the backtest engine and the live runner call its single entry point. This is the shared decision code.

The second layer is a runtime loop: the asynchronous per-tick driver around that session, plus the adapters it talks to. The backtest always runs on it. The live runner can use it through an environment variable, but that is not the default.

The session contains three shared calculations.

The evaluation tree and its indicators. All symbols are fed together as merged history, so a cross-symbol condition such as holding long treasuries when the RSI of the index is above 70 resolves against the same bars in both paths.

The rebalance clock. One portfolio-level function answers whether today is a rebalance day, from the strategy's cadence, and it refuses to rebalance twice on one calendar day. It replaces duplicate functions in the backtest and live adapters.

Sizing. One function diffs target weights against current holdings and equity. Sells come before buys, so cash freed inside a rebalance funds that rebalance's purchases. Resizes inside a five percent drift band are skipped. Buys are fitted to the cash that will actually be available, counting the proceeds of the sells landing in the same batch.

![A strategy session evaluating bars into target weights and intended orders sits between the backtest engine and the live runner. Both call the same session; each supplies its own feed, execution, portfolio and observer.](figure:parity-core)

## Adapters for data and execution

Each path supplies four adapters: the bar feed, execution, portfolio and observer.

The bar feed is a replay of a prepared historical dataset in a backtest, and a live bar stream in production. Execution is a simulated fill engine in a backtest, filling at the bar close with optional slippage and a flat per-fill commission, and a broker-backed submission in production. The portfolio is an in-memory book of cash and positions in a backtest, and a ledger-backed view in production. The observer publishes progress in a backtest and telemetry in production.

The loop itself has two entry points that share their per-tick core and differ only at the ends. The backtest entry takes a bounded feed, receives each fill synchronously, liquidates open positions at the last known prices when the feed runs out, and returns a result. The live entry takes an unbounded feed, submits an order and gets back an acceptance rather than a fill, never liquidates, and returns nothing.

The backtest's final equity includes this liquidation. A live session does not automatically liquidate when evaluation stops.

## Differences between backtests and live sessions

Some differences reflect the simulation model; others are unresolved implementation issues. Both affect how a backtest compares with a live run.

**Evaluation trigger.** A backtest evaluates on whatever symbols a date has. The live runner evaluates only when every subscribed symbol has the current period's bar, so a halted or gappy symbol stalls the rebalance rather than letting it run on partial data. There is a stall check that records this when it happens. A backtest can therefore rebalance on a day when the live session would wait.

**Fill model.** A simulated fill is complete and immediate at a known price. A real order can fill partially, settle asynchronously, and move the price it was sized against.

**Bar resolution.** The backtest replays split-adjusted daily bars. A live session warms up from daily history so it can trade from its first live bar, then extends from a raw intraday stream. A lookback is a number of bars at whatever resolution it is fed, so an indicator written against daily bars does not mean the same thing on a minute stream. Aligning these intervals remains an open implementation issue.

**Order quantization.** A backtest lets a fractional quantity through unrounded. Live rounds every quantity down to a tradable increment and re-checks the minimum notional before submitting. A small rebalance that the simulation executes can round to nothing in production.

![Both paths use the same decision rules. Differences in inputs, evaluation triggers, quantity rounding and fills can change their orders and results.](figure:parity-gap)

## Comparing the runtime loops

The shared loop is implemented and tested for live use, but the existing live loop remains the production default. We compare their behaviour before changing that default.

Each evaluation records the intents it sized: the session, the timestamp, which loop produced it, and the ordered intents. A tool aligns two of those captures evaluation by evaluation and reports whether they asked for exactly the same orders.

The tool compares quantities and prices exactly. A tolerance flag helps investigate differences; exact order agreement remains the acceptance criterion. The portfolio state used by each evaluation is printed alongside differences but excluded from the comparison. Different pods can hold different portfolio states, and that context helps distinguish an input difference from a loop difference.

Changing the default requires order-for-order agreement over an extended comparison run.

## Interpreting the result

A backtest shows the decisions produced from its historical inputs and simulated portfolio state. The live session uses the same evaluation and sizing rules, but can receive different data and wait for different conditions. Fills and broker limits can also change later holdings and decisions.

We label simulated results as backtests. Shared code helps compare the two paths; it does not guarantee identical orders, execution prices or returns.

LlamaTrade is invite only, with paper and live trading.
