# Product Requirements Document (PRD)
# Karnaugh Map & Quine-McCluskey Boolean Logic Minimization Libraries

## 1. Overview

### 1.1 Project Summary
This project involves creating TypeScript libraries for Boolean logic minimization, ported from existing C# implementations. The libraries will provide:
1. A **Quine-McCluskey algorithm** library for Boolean function simplification
2. A **Karnaugh Map** library with an Angular component for visual Boolean logic editing and solving

Both libraries will be published under the `@mintplayer` npm scope and integrate with the `@mintplayer/ng-bootstrap` component library.

### 1.2 Key Requirement: Variable Support
**IMPORTANT:** Both the Quine-McCluskey solver and the Karnaugh Map component must support **any number of input variables**. There should be no hardcoded limit on the number of variables - the implementation must be dynamic and scalable.

### 1.3 References
- **Source C# Code:**
  - [MintPlayer.KarnaughMap](https://github.com/MintPlayer/MintPlayer.DotnetDesktop.Tools/tree/master/KarnaughMap)
  - [MintPlayer.QuineMcCluskey](https://github.com/MintPlayer/MintPlayer.DotnetDesktop.Tools/tree/master/QuineMcCluskey)
- **UI Component Library:**
  - [@mintplayer/ng-bootstrap](https://www.npmjs.com/package/@mintplayer/ng-bootstrap)
  - [Demo App Example](https://github.com/MintPlayer/mintplayer-ng-bootstrap/tree/master/apps/ng-bootstrap-demo)

---

## 2. Technical Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21.x | Framework for UI components |
| TypeScript | ~5.9 | Primary language |
| Nx | 22.x | Monorepo tooling |
| Vitest | 4.x | Unit testing |
| @mintplayer/ng-bootstrap | latest | Bootstrap UI components |

---

## 3. Library Architecture

### 3.1 Project Structure

```
libs/
├── mintplayer/
│   ├── quine-mccluskey/              # @mintplayer/quine-mccluskey
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── quine-mccluskey-solver.interface.ts
│   │   │   │   │   └── required-loop.interface.ts
│   │   │   │   ├── enums/
│   │   │   │   │   └── logic-state.enum.ts
│   │   │   │   ├── data/
│   │   │   │   │   ├── table1/
│   │   │   │   │   │   ├── column.ts
│   │   │   │   │   │   ├── group.ts
│   │   │   │   │   │   └── record.ts
│   │   │   │   │   └── table2/
│   │   │   │   │       ├── row.ts
│   │   │   │   │       └── column.ts
│   │   │   │   ├── quine-mccluskey-solver.ts
│   │   │   │   └── required-loop.ts
│   │   │   └── index.ts
│   │   └── project.json
│   │
│   └── ng-karnaugh-map/              # @mintplayer/ng-karnaugh-map
│       ├── src/
│       │   ├── lib/
│       │   │   ├── interfaces/
│       │   │   │   └── karnaugh-map-cell.interface.ts
│       │   │   ├── enums/
│       │   │   │   ├── cell-value.enum.ts
│       │   │   │   └── edit-mode.enum.ts
│       │   │   ├── helpers/
│       │   │   │   └── gray-code.helper.ts
│       │   │   ├── events/
│       │   │   │   ├── karnaugh-map-solved.event.ts
│       │   │   │   └── loop-added.event.ts
│       │   │   ├── components/
│       │   │   │   └── karnaugh-map/
│       │   │   │       ├── karnaugh-map.component.ts
│       │   │   │       ├── karnaugh-map.component.html
│       │   │   │       └── karnaugh-map.component.scss
│       │   │   └── karnaugh-map.module.ts
│       │   └── index.ts
│       └── project.json
│
apps/
└── karnaugh-demo/                    # Demo application
    └── src/
        └── app/
            └── pages/
                └── karnaugh/
```

### 3.2 Library Dependencies

```
@mintplayer/ng-karnaugh-map
    └── depends on → @mintplayer/quine-mccluskey
    └── depends on → @mintplayer/ng-bootstrap
```

---

## 4. @mintplayer/quine-mccluskey Library

### 4.1 Purpose
A pure TypeScript library implementing the Quine-McCluskey algorithm for Boolean function minimization. This library has no Angular dependencies and can be used in any TypeScript/JavaScript project.

### 4.2 Variable Support
**The solver must support any number of input variables.** The number of variables is determined dynamically based on the highest minterm value provided:
- `numVariables = Math.ceil(Math.log2(Math.max(...minterms, ...dontcares) + 1))`
- Alternatively, the number of variables can be explicitly provided as a parameter

### 4.3 Interfaces

#### 4.3.1 IQuineMcCluskeySolver
```typescript
export interface IQuineMcCluskeySolver {
  /**
   * Solves Boolean minimization using Quine-McCluskey algorithm
   * @param minterms - Array of minterm indices where output is 1
   * @param dontcares - Array of don't-care term indices
   * @param numVariables - Optional: explicit number of variables (auto-detected if not provided)
   * @returns Promise resolving to array of required loops (prime implicants)
   */
  solve(minterms: number[], dontcares: number[], numVariables?: number): Promise<IRequiredLoop[]>;
}
```

#### 4.3.2 IRequiredLoop
```typescript
export interface IRequiredLoop {
  /**
   * Array of minterm indices covered by this prime implicant
   */
  readonly minterms: number[];

  /**
   * Converts the loop to a Boolean expression string
   * @param inputVariables - Array of variable names (e.g., ['A', 'B', 'C', 'D'])
   * @returns Boolean expression (e.g., "A'BC")
   */
  toString(inputVariables: string[]): string;
}
```

### 4.4 Enums

#### 4.4.1 ELogicState
```typescript
export enum ELogicState {
  False = 0,
  True = 1,
  DontCare = 2
}
```

### 4.5 Core Algorithm Implementation

#### 4.5.1 Table 1 - Prime Implicant Generation
Data structures for the first phase:

```typescript
// Column containing groups organized by number of 1-bits
interface Table1Column {
  groups: Table1Group[];
}

// Group of records with same number of 1-bits
interface Table1Group {
  records: Table1Record[];
}

// Individual minterm record
interface Table1Record {
  minterms: number[];        // Original minterms combined
  bits: ELogicState[];       // Binary representation with don't-cares (dynamic length)
  isUsed: boolean;           // Whether combined with another record
}
```

**Algorithm Steps:**
1. Convert decimal minterms to binary (bit array length = number of variables)
2. Organize by bit count (Hamming weight)
3. Compare adjacent groups, combine terms differing by exactly 1 bit
4. Mark combined terms as "used"
5. Repeat until no more combinations possible
6. Unused terms become prime implicants

#### 4.5.2 Table 2 - Prime Implicant Selection
Data structures for the second phase:

```typescript
interface Table2Row {
  loop: IRequiredLoop;       // The prime implicant
  columns: Table2Column[];   // Coverage mapping
}

interface Table2Column {
  minterm: number;           // The minterm being covered
  isCovered: boolean;        // Whether already covered by essential PI
}
```

**Algorithm Steps:**
1. Build coverage matrix (which prime implicants cover which minterms)
2. Find essential prime implicants (only implicant covering a minterm)
3. For remaining uncovered minterms, apply Petrick's method:
   - Build product-of-sums expression
   - Expand to sum-of-products
   - Apply absorption law for simplification
   - Select minimum-cost solution

### 4.6 Public API

```typescript
// Main export
export class QuineMcCluskeySolver implements IQuineMcCluskeySolver {
  async solve(minterms: number[], dontcares: number[], numVariables?: number): Promise<IRequiredLoop[]>;
}

// Factory function for DI
export function createQuineMcCluskeySolver(): IQuineMcCluskeySolver;
```

---

## 5. @mintplayer/ng-karnaugh-map Library

### 5.1 Purpose
An Angular component library providing an interactive Karnaugh Map for Boolean logic visualization and minimization. Integrates with `@mintplayer/ng-bootstrap` for consistent styling.

### 5.2 Variable Support
**The Karnaugh Map must support any number of input variables.** The component dynamically adjusts:
- Grid dimensions (rows × columns) based on variable count
- Variable distribution between rows and columns (typically split evenly, with extra variable going to columns)
- Gray code labels for any bit width
- Cell rendering and navigation for any grid size

**Dynamic Grid Sizing:**
| Variables | Row Variables | Col Variables | Grid Size |
|-----------|---------------|---------------|-----------|
| 1 | 0 | 1 | 1 × 2 |
| 2 | 1 | 1 | 2 × 2 |
| 3 | 1 | 2 | 2 × 4 |
| 4 | 2 | 2 | 4 × 4 |
| 5 | 2 | 3 | 4 × 8 |
| 6 | 3 | 3 | 8 × 8 |
| 7 | 3 | 4 | 8 × 16 |
| n | floor(n/2) | ceil(n/2) | 2^floor(n/2) × 2^ceil(n/2) |

### 5.3 Enums

#### 5.3.1 ECellValue
```typescript
export enum ECellValue {
  Undefined = -1,  // Not yet set
  Zero = 0,        // Output is 0
  One = 1,         // Output is 1
  DontCare = 2     // Don't care condition
}
```

#### 5.3.2 EEditMode
```typescript
export enum EEditMode {
  Edit = 0,   // User can modify cell values
  Solve = 1  // User can select cells for solving
}
```

### 5.4 Interfaces

#### 5.4.1 IKarnaughMapCell
```typescript
export interface IKarnaughMapCell {
  row: number;
  column: number;
  minterm: number;
  value: ECellValue;
  isSelected: boolean;
}
```

### 5.5 Helpers

#### 5.5.1 Gray Code Helper
```typescript
export class GrayCodeHelper {
  /**
   * Converts grid position to minterm index using Gray code
   * Works for any number of row/column bits
   */
  static gridPositionToMinterm(row: number, col: number, rowBits: number, colBits: number): number;

  /**
   * Converts minterm index to grid position
   * Works for any number of row/column bits
   */
  static mintermToGridPosition(minterm: number, rowBits: number, colBits: number): { row: number; col: number };

  /**
   * Generates Gray code sequence for any number of bits
   */
  static generateGrayCode(bits: number): number[];

  /**
   * Converts binary to Gray code
   */
  static binaryToGray(binary: number): number;

  /**
   * Converts Gray code to binary
   */
  static grayToBinary(gray: number): number;
}
```

### 5.6 Events

```typescript
export interface KarnaughMapSolvedEvent {
  onesLoops: IRequiredLoop[];   // Minimized expression for output=1
  zerosLoops: IRequiredLoop[];  // Minimized expression for output=0
}

export interface LoopAddedEvent {
  loop: IRequiredLoop;
  isForOnes: boolean;
}
```

### 5.7 Component API

#### 5.7.1 KarnaughMapComponent

**Selector:** `mintplayer-karnaugh-map`

**Inputs:**
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `inputVariables` | `string[]` | `['A', 'B']` | Variable names (any length supported) |
| `outputVariable` | `string` | `'Y'` | Name of the output variable |
| `mode` | `EEditMode` | `Edit` | Current editing mode |
| `solver` | `IQuineMcCluskeySolver` | `null` | Injected solver instance |
| `showGridLabels` | `boolean` | `true` | Show Gray code labels |
| `cellSize` | `number` | `40` | Size of each cell in pixels |
| `enableScrolling` | `boolean` | `true` | Enable scrolling for large maps |

**Outputs:**
| Output | Type | Description |
|--------|------|-------------|
| `solved` | `EventEmitter<KarnaughMapSolvedEvent>` | Emitted when map is solved |
| `loopAdded` | `EventEmitter<LoopAddedEvent>` | Emitted when a loop is added |
| `modeChange` | `EventEmitter<EEditMode>` | Emitted when mode changes |
| `cellValueChange` | `EventEmitter<IKarnaughMapCell>` | Emitted when cell value changes |

**Public Methods:**
```typescript
// Get/set cell value
getValue(minterm: number): ECellValue;
setValue(minterm: number, value: ECellValue): void;

// Solve operations
solveAutomatically(): Promise<void>;
solveSelection(): Promise<IRequiredLoop[]>;
clearSelection(): void;

// Utility
reset(): void;
exportState(): KarnaughMapState;
importState(state: KarnaughMapState): void;

// Dynamic variable management
addVariable(name?: string): void;
removeVariable(): void;
```

### 5.8 Template Structure

```html
<div class="karnaugh-map-container"
     [class.scrollable]="enableScrolling && totalCells > scrollThreshold">
  <!-- Header row with column Gray codes -->
  <div class="header-row">
    <div class="corner-cell">
      <span class="col-vars">{{ colVariables.join('') }}</span>
      <span class="row-vars">{{ rowVariables.join('') }}</span>
    </div>
    <div class="col-header" *ngFor="let code of columnCodes">
      {{ formatGrayCode(code, colBits) }}
    </div>
  </div>

  <!-- Map rows -->
  <div class="map-row" *ngFor="let row of rows; let i = index">
    <div class="row-header">{{ formatGrayCode(rowCodes[i], rowBits) }}</div>
    <div
      class="cell"
      *ngFor="let cell of row"
      [class.selected]="cell.isSelected"
      [class.focused]="cell === focusedCell"
      [class.one]="cell.value === ECellValue.One"
      [class.zero]="cell.value === ECellValue.Zero"
      [class.dontcare]="cell.value === ECellValue.DontCare"
      (click)="onCellClick(cell)"
      (keydown)="onCellKeydown($event, cell)"
      tabindex="0"
      [attr.aria-label]="getCellAriaLabel(cell)">
      {{ formatCellValue(cell.value) }}
    </div>
  </div>
</div>
```

### 5.9 Styling Integration

The component will use SCSS variables compatible with Bootstrap theming:

```scss
.karnaugh-map-container {
  --kmap-cell-size: 40px;
  --kmap-border-color: var(--bs-border-color);
  --kmap-cell-bg: var(--bs-body-bg);
  --kmap-one-bg: var(--bs-success-bg-subtle);
  --kmap-zero-bg: var(--bs-danger-bg-subtle);
  --kmap-dontcare-bg: var(--bs-secondary-bg-subtle);
  --kmap-selected-bg: var(--bs-warning-bg-subtle);
  --kmap-focus-outline: var(--bs-primary);

  &.scrollable {
    overflow: auto;
    max-width: 100%;
    max-height: 80vh;
  }
}
```

---

## 6. Demo Application

### 6.1 Features
1. **Interactive Karnaugh Map Editor**
   - Support for **any number of variables** (dynamically add/remove)
   - Toggle cell values (0, 1, X, undefined)
   - Keyboard navigation (arrow keys, space, number keys)
   - Scrollable view for large maps (7+ variables)

2. **Automatic Solving**
   - One-click minimization
   - Display simplified Boolean expression
   - Visual highlighting of grouped terms

3. **Manual Selection Mode**
   - Select cells to find specific groupings
   - Validate selections for proper Karnaugh groupings

4. **Expression Display**
   - Show Sum of Products (SOP) form
   - Show Product of Sums (POS) form
   - Copy to clipboard functionality

5. **Import/Export**
   - Save/load map configurations
   - Share via URL parameters

6. **Variable Management**
   - Add/remove variables dynamically
   - Rename variables
   - Reorder variables

### 6.2 UI Layout (using @mintplayer/ng-bootstrap)

```
┌─────────────────────────────────────────────────────────────┐
│  Karnaugh Map Solver                              [Theme]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Variables: [+] [-]  Current: 4 variables                  │
│                                                             │
│  Variable Names: [A] [B] [C] [D]    Output: [Y]            │
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │      CD                         │                       │
│  │     00  01  11  10              │                       │
│  │ AB ┌───┬───┬───┬───┐            │                       │
│  │ 00 │ 0 │ 1 │ 1 │ 0 │            │                       │
│  │ 01 │ 1 │ 1 │ 1 │ 1 │            │                       │
│  │ 11 │ 0 │ 1 │ 1 │ 0 │            │                       │
│  │ 10 │ 0 │ 0 │ 1 │ 1 │            │                       │
│  │    └───┴───┴───┴───┘            │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
│  Mode: (•) Edit  ( ) Solve                                 │
│                                                             │
│  [Solve Automatically]  [Clear]  [Reset]                   │
│                                                             │
│  ┌─ Result ─────────────────────────────────────────────┐  │
│  │ SOP: Y = A'CD + BD + BC                              │  │
│  │ POS: Y = (A + B)(C + D)(B + C')                      │  │
│  │                                            [Copy]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Phases

### Phase 1: Core Libraries
1. Create `@mintplayer/quine-mccluskey` library
   - Implement data structures (Table1, Table2) supporting any variable count
   - Implement Quine-McCluskey algorithm with dynamic bit width
   - Implement Petrick's method
   - Add comprehensive unit tests for various variable counts

2. Create `@mintplayer/ng-karnaugh-map` library
   - Implement Gray code helpers for any bit width
   - Create KarnaughMapComponent with dynamic grid sizing
   - Add keyboard/mouse interaction
   - Integrate with quine-mccluskey solver
   - Add scrolling support for large maps

### Phase 2: Demo Application
1. Create demo app with routing
2. Implement interactive UI using @mintplayer/ng-bootstrap
3. Add dynamic variable management
4. Add import/export functionality
5. Add responsive design with scrolling for large maps

### Phase 3: Polish & Documentation
1. Add JSDoc documentation
2. Create usage examples for various variable counts
3. Write README files for each library
4. Ensure accessibility (ARIA labels, keyboard navigation)

---

## 8. Testing Requirements

### 8.1 Unit Tests (@mintplayer/quine-mccluskey)
- Test Gray code conversion for various bit widths (1-10+ bits)
- Test prime implicant generation with known examples
- Test essential prime implicant selection
- Test Petrick's method with complex cases
- Test edge cases (all 0s, all 1s, all don't-cares)
- Test with large variable counts (8+ variables)

### 8.2 Unit Tests (@mintplayer/ng-karnaugh-map)
- Test cell value toggling
- Test minterm-to-position conversion for various grid sizes
- Test keyboard navigation
- Test mode switching
- Test solver integration
- Test dynamic variable addition/removal
- Test grid resizing when variables change

### 8.3 E2E Tests (Demo App)
- Test variable count changes (add/remove)
- Test full solve workflow with different variable counts
- Test import/export
- Test scrolling for large maps

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Handle any number of variables (practical limit determined by browser memory)
- Recommended comfortable viewing: up to 8 variables (256 cells)
- Solve operation should scale appropriately:
  - < 6 variables: < 100ms
  - 6-8 variables: < 1s
  - 8+ variables: provide progress indication

### 9.2 Accessibility
- Full keyboard navigation support for any grid size
- ARIA labels for screen readers
- High contrast mode support
- Focus management for large scrollable grids

### 9.3 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 10. Success Criteria

1. Both libraries are publishable to npm under `@mintplayer` scope
2. The Quine-McCluskey algorithm works correctly for **any number of variables**
3. The Karnaugh Map component dynamically supports **any number of variables**
4. Demo application showcases all features including dynamic variable management
5. All unit tests pass with >80% code coverage
6. Libraries integrate seamlessly with `@mintplayer/ng-bootstrap`

---

## Appendix A: Algorithm Reference

### Quine-McCluskey Algorithm Overview

The Quine-McCluskey algorithm is a method for minimizing Boolean functions. It is functionally equivalent to Karnaugh mapping but more suitable for computer implementation and **works for any number of variables**.

**Steps:**
1. **List all minterms** in binary form (bit width = number of variables)
2. **Group by number of 1s** (Hamming weight)
3. **Compare adjacent groups** - combine terms differing by exactly 1 bit
4. **Mark combined terms** and repeat until no more combinations
5. **Prime implicants** are terms that cannot be combined further
6. **Create coverage chart** showing which prime implicants cover which minterms
7. **Select essential prime implicants** (only one covering a minterm)
8. **Apply Petrick's method** for remaining coverage

### Gray Code Mapping

Karnaugh maps use Gray code ordering so adjacent cells differ by only 1 bit. The Gray code can be generated for any number of bits:

```typescript
// Generate Gray code for n bits
function generateGrayCode(n: number): number[] {
  if (n === 0) return [0];
  const result: number[] = [];
  const count = 1 << n; // 2^n
  for (let i = 0; i < count; i++) {
    result.push(i ^ (i >> 1)); // Binary to Gray conversion
  }
  return result;
}
```

| Bits | Sequence |
|------|----------|
| 1 | 0, 1 |
| 2 | 00, 01, 11, 10 |
| 3 | 000, 001, 011, 010, 110, 111, 101, 100 |
| 4 | 0000, 0001, 0011, 0010, 0110, 0111, 0101, 0100, 1100, 1101, 1111, 1110, 1010, 1011, 1001, 1000 |
| n | 2^n values in Gray code order |

### Grid Size Calculation

For n variables:
- Row bits = floor(n / 2)
- Column bits = ceil(n / 2)
- Rows = 2^(row bits)
- Columns = 2^(column bits)
- Total cells = 2^n
