# Spec: Typography System

## Requirements

### Requirement: Typography component

The system SHALL provide a `<Typography />` component that renders styled text via `variant` and `weight` props. Content is passed as children, allowing nesting and inline composition.

#### Scenario: Render text with variant and weight

- **WHEN** `<Typography variant="heading-xl" weight="bold">Hello</Typography>` is rendered
- **THEN** the text displays with fontSize 36, fontFamily `Satoshi-Bold`, and lineHeight `36 * 1.25`

#### Scenario: Nested typography

- **WHEN** `<Typography variant="body-base" weight="regular">Click <Typography variant="body-base" weight="bold" color={colors.orange[600]}>here</Typography></Typography>` is rendered
- **THEN** the word "here" renders bold in orange while the rest renders regular

#### Scenario: numberOfLines truncation

- **WHEN** `<Typography variant="body-base" weight="regular" numberOfLines={2}>Long text...</Typography>` is rendered
- **THEN** the text is truncated to 2 lines

#### Scenario: Style override

- **WHEN** a `style` prop is provided alongside `variant`
- **THEN** the style prop overrides the variant's defaults

#### Scenario: Invalid variant rejected at compile time

- **WHEN** a developer passes an invalid variant or weight string
- **THEN** TypeScript reports a type error — only predefined values are accepted

### Requirement: Variant defines size tier

The system SHALL use `variant` to select a size tier from the `{category}-{size}` pattern. Variant controls fontSize and lineHeight only — not font weight.

| Category | Size | Font Size (px) |
| -------- | ---- | -------------- |
| heading  | xl   | 36             |
| heading  | lg   | 32             |
| heading  | md   | 24             |
| heading  | sm   | 20             |
| body     | lg   | 18             |
| body     | base | 16             |
| body     | sm   | 14             |
| body     | xs   | 12             |

#### Scenario: Variant selects size

- **WHEN** `variant="heading-md"` is used
- **THEN** fontSize is 24 and lineHeight is `24 * 1.25`, regardless of the `weight` prop

### Requirement: Weight prop selects font family

The system SHALL accept a required `weight` prop with values: `black`, `bold`, `medium`, `regular`. The weight maps directly to the Satoshi font files:

| Weight    | Font Family     |
| --------- | --------------- |
| `black`   | Satoshi-Black   |
| `bold`    | Satoshi-Bold    |
| `medium`  | Satoshi-Medium  |
| `regular` | Satoshi-Regular |

#### Scenario: Weight sets font family

- **WHEN** `weight="medium"` is provided
- **THEN** fontFamily is `Satoshi-Medium`

### Requirement: Color prop

The system SHALL accept an optional `color` prop (a color string — hex value, `colors.*` constant, etc.) that sets the text color. When omitted, the color defaults to `colors.brown[900]`.

#### Scenario: Default color applied

- **WHEN** `<Typography variant="body-base" weight="regular">Hello</Typography>` is rendered without a `color` prop
- **THEN** the text color is `colors.brown[900]`

#### Scenario: Custom color via prop

- **WHEN** `<Typography variant="body-sm" weight="medium" color={colors.brown[700]}>Note</Typography>` is rendered
- **THEN** the text color is `colors.brown[700]`

#### Scenario: Arbitrary hex color

- **WHEN** `<Typography variant="body-base" weight="bold" color="#ff5500">Alert</Typography>` is rendered
- **THEN** the text color is `#ff5500`

### Requirement: Line height convention

The system SHALL apply a consistent line height multiplier per category:

- `heading-*` variants: `fontSize * 1.25`
- `body-*` variants: `fontSize * 1.5`

#### Scenario: Heading line height

- **WHEN** `variant="heading-xl"` (fontSize 36) is rendered
- **THEN** lineHeight is `45` (36 × 1.25)

#### Scenario: Body line height

- **WHEN** `variant="body-base"` (fontSize 16) is rendered
- **THEN** lineHeight is `24` (16 × 1.5)
