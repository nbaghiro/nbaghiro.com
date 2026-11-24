title: Making a design refresh easier to maintain
date: 2026-11-21
about: LlamaTrade
cover: /img/posts/maintaining-a-design-refresh-wide.webp
card: /img/posts/maintaining-a-design-refresh-card.webp
summary: The implementation choices behind LlamaTrade’s appearance cleanup, from semantic colors and first-paint preferences to cross-platform checks and realistic screen states.

We’re pleased with how LlamaTrade’s design cleanup came together. Revisiting the earlier appearance gave us a chance to make the screens more consistent and clarify which decisions should carry across the web and mobile apps.

The useful work continues after the screenshots look right. A new screen, another accent or a different device can expose assumptions that were hidden in the original design.

LlamaTrade already has web appearance tokens, a small initialization script and a native palette resolver. This article uses those pieces to explain the structure, then describes the checks we would use to keep the design consistent as it grows. It does not claim that every screen or color combination has passed a complete accessibility audit.

## Give colors a purpose in the interface

A color value such as blue or green does not explain what a component should do with it. A token for a panel, secondary text, gain or warning carries more useful meaning.

LlamaTrade’s appearance definitions distinguish surfaces and foreground text from accent colors and financial status colors. The native palette also separates accent text, accent fill and the text placed on that fill. Those distinctions let a button remain readable when an accent that works for a thin line would be unsuitable as its background.

The design decision is that changing an accent should not redefine a gain, loss or warning. A positive value still needs a consistent semantic role across the interface. The exact palette can vary by light and dark mode while the meaning remains stable.

![Surface and accent choices control appearance. Gain, loss and warning tokens retain their semantic roles across those choices.](figure:design-token-roles)

Color should not be the only way to communicate those states. A signed value, label, icon or position can provide another cue. W3C’s guidance on use of color explicitly addresses information conveyed only through color. [W3C use-of-color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)

## Resolve preferences before drawing the first screen

A saved dark-mode preference is less useful if the page first paints in light mode and switches afterwards.

On the web, LlamaTrade’s initialization script reads stored appearance settings and sets attributes on the document element before the application starts. It validates the saved accent against the options for the selected mode and falls back when a value is not recognized. System mode is resolved from the device preference.

That early path and the application store need to agree. If the initialization script chooses one default and the hydrated application chooses another, the flash can return even though both pieces work independently.

We would test missing storage, malformed data, a removed accent and a changed system preference. Storage access can fail, so a usable default should not depend on successfully reading local state.

The initial decision is only one part of system mode. A running application may need to respond when the device changes appearance. That behavior should be tested separately from first paint.

## Share meaning across web and native

The web uses CSS variables and document attributes. The native app uses a typed palette with a pure resolver. They express similar roles, but separate definitions can diverge as the product changes.

We would compare the resolved roles across platforms rather than assume matching names guarantee matching behavior. A shared contract can list required roles such as canvas, panel, foreground, accent fill, gain and warning. Each platform must supply them, and deliberate differences should be documented.

That does not require every pixel to be identical. Native controls, font rendering and available space differ. The useful agreement is that the same financial state, selection or disabled action is recognizable in both places.

If values are duplicated, a comparison test can reveal drift. If values are generated from one source, the generator and platform adaptations still need review. A single source of data reduces one class of mismatch; it does not establish that the resulting screen is good.

## Check the combinations people can actually select

Theme options multiply quickly. Light and dark modes, multiple surfaces and several accents create more combinations than a handful of screenshots can cover.

We would resolve every supported combination in a fast data test. It can check that required tokens exist, values are valid and expected semantic roles do not change with the accent. Contrast checks should use the actual foreground and background pair a component renders, including opacity and overlays.

W3C’s minimum text-contrast guidance distinguishes ordinary text from large text and has specific exceptions. A single contrast threshold applied indiscriminately to every token is not a complete test of a screen. [W3C minimum-contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

For visual review, we would select representative combinations plus known difficult ones: a pale accent, a dark accent, a low-emphasis label and a filled control on each surface. Data checks can cover the full matrix while rendered reviews focus on the places where layout and perception matter.

![Data tests resolve every supported theme combination. Rendered checks examine selected screens and difficult states, including focus, errors, long values and empty results.](figure:design-review-matrix)

## Include states that do not appear in launch screenshots

A polished dashboard with short labels and positive numbers is only one state. We would review losses, zero balances, long instrument names, missing data, loading rows and an unavailable action.

Focus and selection need their own treatment. A selection background should not conceal a negative value. A keyboard focus ring should remain visible against both the component and its surrounding surface. An error message needs room to wrap without displacing the action it explains unpredictably.

Tables deserve attention because alignment carries meaning. Tabular numerals can reduce visual movement when values update. Decimal precision, currency symbols and units should follow the data contract rather than whichever formatting looks neatest in the screenshot.

The same state fixtures can be reused on phone and desktop. That makes it easier to see whether a responsive layout removes information, changes reading order or leaves a control difficult to reach.

## Separate content density from screen size

A mobile screen has less room, but that does not mean every value should become smaller. We would decide which comparisons need to remain visible together and which details can move into an expanded view.

For example, a position row might preserve its instrument, quantity and current result while moving secondary metadata behind a deliberate action. The choice should be consistent enough that a person does not have to relearn each screen.

Long content is a useful stress test. Truncating an instrument name may be acceptable if the full identifier is available nearby or on demand. Truncating the sign or unit of a financial value is a different problem. Responsive rules should recognize that distinction.

## Make future changes reviewable

For a new component, we would ask which existing roles it consumes and which states it introduces. A new token is justified when it represents a new role, not merely because a local hex value is convenient.

Visual snapshots help show change, but they need stable fixtures, fonts and viewport sizes. A screenshot difference is evidence to inspect, not automatically a regression. A changed text wrap may be intended; a missing warning state may be more serious than a large background-color difference.

We would keep the design review close to the feature change. Adding a new accent should bring its resolved token checks and representative screenshots with it. Adding a new table should include realistic values and its empty, loading and error states.

The design refresh gave us a clearer set of choices to build from. Maintaining it means making those choices explicit enough that the next screen can follow them, and testing the states that a single attractive screenshot cannot show.
