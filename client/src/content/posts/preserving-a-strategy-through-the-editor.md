title: Preserving a strategy through the editor
date: 2026-10-20
updated: 2026-11-03
about: LlamaTrade
cover: /img/posts/preserving-a-strategy-through-the-editor-wide.webp
card: /img/posts/preserving-a-strategy-through-the-editor-card.webp
summary: How LlamaTrade converts strategies between visual blocks and DSL text, preserves nested allocations, and compares the TypeScript editor with the Python parser using shared examples.

LlamaTrade lets a strategy be represented as visual blocks or as text in a small domain-specific language. The editor keeps those blocks in TypeScript. The backend parses the text into Python objects and evaluates the resulting allocation tree.

Converting between them needs to preserve the strategy's structure and values. A group can still appear in the editor after its allocation has been lost. Exported text can still parse after its grouping has changed. Both changes can affect the weights the evaluator produces.

One current limitation is important before using the visual editor: compound `and`, `or` and `not` conditions accepted by Python fall back to a default comparison during import. The editor can therefore emit valid text with changed meaning. The supported allocation examples below round-trip correctly; they do not cover the whole backend grammar. [A language for portfolio allocations](https://nbaghiro.com/blogs/a-language-for-portfolio-allocations) explains the wider language.

## Two representations of the same strategy

The Python parser builds a nested tree. A weight node contains its children, a group contains its own children, and an asset names a symbol. An explicitly weighted group has a `weight` field alongside its name and children.

The editor uses a different structure. Blocks live in a map indexed by ID. Each block has references to its parent and children. A weight block also has an `allocations` map, keyed by child ID. The share assigned to a group lives in that map on its parent.

For a group called Equities receiving 60%, the relevant editor state can be illustrated as:

```
blocks["weight-1"] = {
  type: "weight",
  method: "specified",
  childIds: ["group-1", "asset-3"],
  allocations: { "group-1": 60, "asset-3": 40 }
}

blocks["group-1"] = {
  type: "group",
  name: "Equities",
  parentId: "weight-1",
  childIds: ["weight-2"]
}
```

This is a structural excerpt with illustrative IDs, rather than a complete editor object. It shows why serializing the group by itself would be insufficient: its assigned share is stored elsewhere.

![The editor keeps a group's share in its parent's allocation map. DSL text and the Python tree carry that share on the group.](figure:editor-representations)

The text representation puts the share on the child:

```
(group "Equities" :weight 60
  (weight :method equal
    (asset VTI)
    (asset QQQ)))
```

When the editor imports a child under a weight block, it reads the child's `:weight` parameter and records it against the new child ID. When it exports a specified-weight block, it looks up that ID in the parent's allocation map and writes the parameter back onto the group or asset.

## Why preserving the nesting matters

Consider an equal-weight block with two children: a group containing VTI and QQQ, and a standalone TLT asset. The group contains another equal-weight block for its two assets.

The outer block gives half to the group and half to TLT. The inner block divides the group's share equally. The final weights are VTI 25%, QQQ 25% and TLT 50%.

Flattening those three assets into a single equal-weight block would produce a third each. Every symbol would still be present, but the strategy would have changed.

![Nested equal weighting gives the pair half to divide, resulting in 25, 25 and 50 percent. A flat block gives each of the three assets a third.](figure:editor-nesting)

Specified weights add another value to preserve. This complete example gives the group 60% and TLT 40%:

```
(strategy "Editor example" :rebalance monthly
  (weight :method specified
    (group "Equities" :weight 60
      (weight :method equal
        (asset VTI)
        (asset QQQ)))
    (asset TLT :weight 40)))
```

The inner block divides the group's 60%, contributing 30% for each of its two assets. TLT keeps 40%. Changing the outer method from specified to equal would change those weights to 25%, 25% and 50%, even if the children stayed in place.

These examples explain why the checks need to include the weighting method, each assigned share and the parent-child structure. Comparing only the list of symbols would miss both changes. The percentages here describe the language's allocation rules; they are not performance results.

## Comparing through a common structure

The editor's ID-indexed blocks and the backend's nested nodes cannot be compared directly. The conformance tests project them into a common JSON structure.

For the group above, the relevant part of that structure is:

```
{
  "type": "group",
  "name": "Equities",
  "weight": 60,
  "children": [{
    "type": "weight",
    "method": "equal",
    "children": [
      {"type": "asset", "symbol": "VTI"},
      {"type": "asset", "symbol": "QQQ"}
    ]
  }]
}
```

The TypeScript test helper traverses the editor's child references. When it projects a group or asset, it reads the allocation from the parent weight block and writes it as the child's `weight` field. The resulting structure can then be compared with the Python parser's JSON output.

This projection removes editor-specific block IDs from the comparison while retaining the fields that describe the strategy. It also translates naming conventions, such as internal underscore-separated weighting methods into the DSL's hyphenated form.

The committed reference JSON is generated from the Python implementation. That makes Python the reference for these tests, but does not independently establish that Python's behavior is correct. The reference files still need review, and evaluator tests have a separate job: checking the allocations produced from a strategy.

## Checking import, export and repeated export

The shared corpus currently has eighteen source examples. They cover nested weighting, group allocations, conditions, filters, indicator outputs, crossovers, metadata and escaped strings.

For each example, the Python suite parses the source and compares its JSON output with the committed reference. It also serializes and reparses the strategy in both compact and pretty formats, then compares the resulting structure again.

The TypeScript suite checks three related properties:

1. Importing the source produces an editor tree whose canonical projection matches the reference.
2. Exporting that tree to DSL text and importing it again preserves the same canonical structure.
3. Exporting the second tree produces exactly the same text as the first export.

![A source example is imported, exported and imported again. Both trees are compared with a reference, and repeated exports must be identical.](figure:editor-roundtrip)

The third check is about stable serialization. The first export can change whitespace or formatting from the original source. Subsequent exports should settle on the same output, so repeated conversion does not keep rewriting the text.

Stable text alone can conceal a field lost on the first import. The canonical reference checks the original structure as well.

Escaping deserves examples of its own. Strategy names and descriptions are strings inside a parenthesised language. Quotes and backslashes need to survive parsing and serialization as content, without changing the surrounding syntax. The corpus includes cases for those strings alongside the allocation examples.

## Where validation fits

Preserving a tree does not establish that it is valid for evaluation. Validation checks relationships within the strategy, including whether specified shares sum to 100 and whether parameters are supported by their weighting method.

Validation checks whether a tree is supported; round-trip comparison checks whether conversion changed it. Both are needed because a different tree can still be valid.

Evaluation adds another check. A test can run a nested allocation and assert its resulting weights, making the effect of the hierarchy explicit. That is useful when changing allocation composition, even if no parser or serializer code changes.

The editor conversion tests also do not exercise every visual interaction. Dragging a block, changing an allocation or deleting a group involves editor state updates before serialization begins. Those operations need tests at their own boundaries. A serializer test starts with the tree it is given.

## A current limit in condition support

The Python grammar accepts compound conditions using `and`, `or` and `not`. The current visual importer handles comparisons and crossovers, but its condition parser does not construct an equivalent compound expression.

For example, a condition can require both a minimum price and an upper price threshold:

```
(and
  (> (price SPY) 100)
  (< (price SPY) 200))
```

The editor's `parseConditionExpr` returns no parsed condition for `and`. The surrounding import code then supplies its default comparison, equivalent to `(> (price SPY) 0)`. Exporting that tree can therefore produce valid DSL with a different condition.

The condition support boundary is:

- Comparisons: represented by operands and a comparator in the visual model.
- Crossovers: represented by the supported crossover comparators.
- Compound `and`, `or`, `not`: accepted by Python but not represented by this importer.

The desired import policy is to preserve an expression losslessly or reject it with a specific explanation. Substituting a default condition should not count as a successful import.

Implementing that policy requires either an explicit unsupported-expression error or an expanded visual condition model, followed by a regression test of the original expression after export. Neither improvement is claimed here as current behavior.

## What was checked for this article

The review used LlamaTrade revision `63ff5a6`. The Python DSL suite passed 367 tests. The TypeScript conformance and serializer suites passed 99 tests using the available Vitest 4.1.10 runner with a temporary configuration; the checkout declares an older runner version.

The complete example above was also imported and exported through the editor serializer. Its Python canonical tree was unchanged, a second export was identical, and evaluation returned VTI 30%, QQQ 30% and TLT 40%. The compound-condition fallback was reproduced separately.

The source review followed the group's weight through import and export, the test projection into canonical JSON, and the unsupported-condition fallback. Those checks support the implementation described here. They do not establish full editor coverage or equivalence for every backend expression.

The regression target is the strategy's meaning: the group retains its share, the weight block its method, and the condition its operands and operators.
