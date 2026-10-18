title: A language for portfolio allocations
date: 2026-10-18
about: LlamaTrade
cover: /img/posts/a-language-for-portfolio-allocations-wide.webp
card: /img/posts/a-language-for-portfolio-allocations-card.webp
summary: LlamaTrade represents strategies as trees of allocation rules. A worked example follows the DSL through parsing, validation, hierarchical evaluation and the tests shared by the Python runtime and TypeScript editor.

LlamaTrade uses a small domain-specific language to describe portfolio allocations. A strategy can divide capital between groups, select assets, and change its allocation when a condition is met. The evaluator returns target weights. A separate session decides when to rebalance and turns those weights into intended orders.

That separation gives the language a specific job. It needs to describe how allocations compose, preserve that meaning when a strategy is edited, and make its data requirements available before evaluation begins.

The syntax uses S-expressions: parenthesised forms whose first item names the operation. Each allocation form corresponds to a node in a tree. The visual editor has its own representation of that tree, and the backend parses the text into Python objects.

## Following one strategy through the system

This example assigns 60% to an equity group and 40% to a bond group. The equity group divides its share equally between two assets.

```
(strategy "Nested allocation" :rebalance monthly
  (weight :method specified
    (group "Equities" :weight 60
      (weight :method equal
        (asset VTI)
        (asset QQQ)))
    (group "Bonds" :weight 40
      (asset TLT))))
```

The outer weight block has two children. Each child declares the share it receives from that block. Inside the equity group, a second weight block divides its own allocation equally.

The distinction between a child's share and its internal allocation matters throughout the implementation. An asset evaluates to 100% of its own subtree. Its parent determines how much of the portfolio that subtree receives.

![The strategy is parsed into nodes, validated, prepared for evaluation and evaluated into target weights. Order sizing follows in the session.](figure:dsl-pipeline)

## Parsing into typed nodes

The Python tokenizer recognises parentheses, strings, numbers, symbols, keyword parameters such as `:weight`, and operators. It skips whitespace and semicolon comments. Tokens carry character offsets, line numbers and columns for error reporting.

A recursive-descent parser then constructs nodes such as `Strategy`, `Weight`, `Group`, `Asset`, `If` and `Filter`. Conditions and values have separate node types. A comparison contains two values; a value can refer to a price, an indicator, a metric or a numeric literal.

A simplified structural view of the example is:

```
Strategy("Nested allocation", rebalance="monthly")
  Weight(method="specified")
    Group("Equities", weight=60)
      Weight(method="equal")
        Asset("VTI")
        Asset("QQQ")
    Group("Bonds", weight=40)
      Asset("TLT")
```

This grammar has no user-defined functions, imports or arbitrary Python statements. Evaluation dispatches over the supported node types. That keeps the set of operations inspectable, although a restricted grammar still needs resource limits and validation.

The Python parser rejects source longer than 100,000 characters before tokenising it. It also rejects parenthesis nesting deeper than 150 levels before recursive parsing. These are bounds on parser input, not a promise about the total cost of evaluating every accepted strategy.

## Checking meaning after parsing

Parsing establishes that the text has the expected structure. Validation checks relationships between fields and children.

For `:method specified`, asset and group children must declare weights, and the declared shares must sum to 100. An `if` beneath a specified-weight block needs branches with the same declared share, so choosing a branch does not change the parent's allocation contract.

There are also checks for empty groups, invalid symbols, positive lookbacks and selection counts. A `:top` parameter is accepted for momentum weighting, where the runtime uses it; validation rejects it on other weighting methods. Market-cap weighting is present in the vocabulary but rejected by validation because the evaluator does not have the required fundamental data.

These checks produce errors with an AST path and, where available, source coordinates and suggestions. A path such as `strategy.children[0].children[1]` identifies the relevant part of the tree even when the caller is working with structured data.

The distinction is also visible in the APIs. The strategy service's compile endpoint validates the source and returns a JSON representation of the AST. The runtime's `compile_strategy` prepares a `CompiledStrategy` for evaluation. Neither operation emits machine code. In the runtime, execution still walks the strategy tree.

The lower-level runtime compiler does not perform validation itself. `StrategySession` parses and validates before calling it. Code using the compiler directly must preserve that boundary.

## Composing the weights

Each subtree returns a map from symbol to percentage. The parent scales that map by the child's share, adds contributions for repeated symbols, and normalises the combined result.

For the equity group, the equal-weight block returns:

```
VTI  50%
QQQ  50%
```

The outer block assigns that group 60%. Its contributions to the whole portfolio are therefore:

```
VTI: 50 × 60 / 100 = 30%
QQQ: 50 × 60 / 100 = 30%
TLT: 100 × 40 / 100 = 40%
```

![A 60 percent equity group divides into two 30 percent portfolio allocations. The 40 percent bond group contributes its full share to TLT.](figure:dsl-composition)

For child allocations `A_i` and parent shares `s_i`, the merge first accumulates each symbol's contributions:

```
combined[symbol] = sum(A_i[symbol] * s_i / 100)
result[symbol]   = combined[symbol] * 100 / sum(combined)
```

The normalisation step also explains some less apparent behaviour. If two branches allocate to the same symbol, their contributions are added. If a conditional child returns an empty allocation, it contributes nothing and the remaining contributions are normalised to 100%.

An empty branch therefore does not reserve its former share as cash. If the entire allocation is empty, `StrategySession` currently returns no intended orders. That is different from issuing orders to liquidate existing holdings. The meaning of an empty result has to be understood at both the evaluator and session layers.

Equal weighting also operates on child blocks. An equal block containing a nested pair and one standalone asset assigns half to each child. The nested pair splits its half, producing 25%, 25%, 50%. Flattening the tree first would change the meaning to three equal shares.

Computed weighting methods use a different rule. Momentum, inverse volatility and the covariance-based methods collect the individual symbols from their children before calculating weights. Hierarchy is preserved for specified and equal composition; it is not the input unit for every weighting method.

## Selection and conditions

A filter evaluates its children, scores the resulting symbols, selects the requested top or bottom count, and renormalises the selected symbols' existing weights. It does not automatically replace their relative weights with an equal split.

For example, if the child allocation is 60%, 30%, 10% and the first two symbols are selected, their relative weights remain two to one. After normalisation they become approximately 66.67% and 33.33%.

Conditions are evaluated against the current state. A comparison reads its operands; a crossover also reads their previous values. An `if` evaluates the chosen branch, or returns an empty allocation when the condition is false and there is no else branch.

Missing or undefined inputs need particular care. The safe condition evaluator treats supported evaluation failures as false and records a degraded-evaluation count. False can select an else branch, so it should not be described as universally taking no action. The counter makes this distinct from a condition that was evaluated normally and returned false.

## Preparing the data and sizing orders

Before evaluation, the runtime collects the required symbols and indicator specifications. It calculates the minimum history needed and the retained-history window. These include requirements from conditions and lookbacks, not only assets that eventually receive an allocation.

For the example above, running the current compiler produced:

```
symbols         QQQ, TLT, VTI
minimum bars    2
retained bars   12
allocation      VTI: 30, QQQ: 30, TLT: 40
```

There are no indicators in this example. The two-bar minimum comes from the runtime's general floor; the retained window adds ten bars. More complex history requirements are covered in [How much history a strategy needs](https://nbaghiro.com/blogs/before-the-first-order).

`StrategySession` owns the compiled strategy, its history and the last rebalance date. On non-rebalance days it still feeds bars into history. When evaluation is due and returns an allocation, sizing uses the target weights together with current holdings, prices and equity to produce intended orders. Drift tolerance and minimum order notional are session settings, separate from the allocation tree.

The backtest and live runner both use this session implementation. Sharing those calculations reduces duplicated behaviour, but does not establish that live fills, data delivery or execution costs will match a simulation.

## Preserving meaning through the editor

The browser uses TypeScript and stores blocks by id, with parent and child references. The backend uses nested Python nodes. The serializer translates between the visual tree and the text form.

The tests use canonical JSON to compare these representations. For the shared corpus, Python parses each source file and compares the result with committed JSON. It also serialises and reparses the strategy. The TypeScript tests parse the same cases, project the editor tree to the canonical shape, and check a parse/emit round-trip.

Comparing the full tree is useful here. Losing a group's `:weight 60` can leave text that still parses while changing the resulting allocation. The round-trip tests compare values and structure, rather than checking only that the parser accepts the output.

The corpus establishes agreement for its cases, not the whole grammar. One current gap is compound logical conditions. Python supports `and`, `or` and `not`, while the editor importer handles comparisons and crossovers. In a direct check, importing an `and` condition and emitting it again replaced it with the importer's default price comparison. Such expressions cannot currently be assumed to survive visual editing unchanged.

The worked allocation example in this article was checked separately through the Python evaluator and through a TypeScript parse/emit cycle. It produced 30%, 30%, 40%, and its canonical tree survived that editor round-trip. Those checks are specific to the example.

## Testing a language's behaviour

The tests need to cover several different contracts. Parser tests check accepted and rejected syntax. Validator tests check combinations the runtime supports. Round-trip tests check preservation of fields. Composition tests check the allocation produced by nested blocks.

For this review, 438 Python cases passed across the DSL suite and the selected composition, session and condition-evaluation suites. The two selected TypeScript suites also passed 99 cases using the available test runner. That is evidence for those tested behaviours. It does not make the editor importer a complete implementation of the backend grammar, or establish that a valid strategy is economically useful.

The main design responsibility is keeping each layer's meaning explicit. A group owns a share, a child subdivides it, a filter preserves relative weights, and a session converts the resulting allocation into intended orders. Those rules determine what the strategy does, and they need the same attention as the syntax used to write it.
