import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IQuineMcCluskeySolver,
  IRequiredLoop,
  createQuineMcCluskeySolver,
} from '@mintplayer/quine-mccluskey';
import { ECellValue, EEditMode } from '../enums';
import { GrayCodeHelper } from '../helpers';
import {
  IKarnaughMapCell,
  IKarnaughMapState,
  IKarnaughMapSolvedEvent,
  ILoopAddedEvent,
} from '../interfaces';

/**
 * Karnaugh Map component for Boolean logic visualization and minimization.
 * Supports any number of input variables.
 */
@Component({
  selector: 'mintplayer-karnaugh-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ng-karnaugh-map.html',
  styleUrls: ['./ng-karnaugh-map.scss'],
})
export class NgKarnaughMapComponent implements OnInit, OnChanges {
  private elementRef = inject(ElementRef);

  /** Variable names for the map inputs */
  @Input() inputVariables: string[] = ['A', 'B'];

  /** Output variable name */
  @Input() outputVariable = 'Y';

  /** Current editing mode */
  @Input() mode: EEditMode = EEditMode.Edit;

  /** Injected solver instance (optional, creates default if not provided) */
  @Input() solver: IQuineMcCluskeySolver | null = null;

  /** Show Gray code labels on the grid */
  @Input() showGridLabels = true;

  /** Size of each cell in pixels */
  @Input() cellSize = 40;

  /** Enable scrolling for large maps */
  @Input() enableScrolling = true;

  /** Emitted when the map is solved */
  @Output() solved = new EventEmitter<IKarnaughMapSolvedEvent>();

  /** Emitted when a loop is added during solving */
  @Output() loopAdded = new EventEmitter<ILoopAddedEvent>();

  /** Emitted when the mode changes */
  @Output() modeChange = new EventEmitter<EEditMode>();

  /** Emitted when a cell value changes */
  @Output() cellValueChange = new EventEmitter<IKarnaughMapCell>();

  // Grid data
  cells: IKarnaughMapCell[][] = [];
  rowCodes: number[] = [];
  colCodes: number[] = [];
  rowVars: string[] = [];
  colVars: string[] = [];
  rowBits = 0;
  colBits = 0;

  // Focused cell for keyboard navigation
  focusedRow = 0;
  focusedCol = 0;

  // Solution data
  onesLoops: IRequiredLoop[] = [];
  zerosLoops: IRequiredLoop[] = [];

  // Expose enums to template
  readonly ECellValue = ECellValue;
  readonly EEditMode = EEditMode;

  ngOnInit(): void {
    this.initializeGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputVariables']) {
      this.initializeGrid();
    }
  }

  /**
   * Initializes the grid based on the number of input variables.
   */
  private initializeGrid(): void {
    const numVars = this.inputVariables.length;
    const { rowBits, colBits, rows, cols } =
      GrayCodeHelper.calculateGridDimensions(numVars);

    this.rowBits = rowBits;
    this.colBits = colBits;

    // Distribute variables between rows and columns
    const { rowVars, colVars } = GrayCodeHelper.distributeVariables(
      this.inputVariables
    );
    this.rowVars = rowVars;
    this.colVars = colVars;

    // Generate Gray codes for rows and columns
    this.rowCodes = GrayCodeHelper.generateGrayCode(rowBits);
    this.colCodes = GrayCodeHelper.generateGrayCode(colBits);

    // Create the cell grid
    this.cells = [];
    for (let row = 0; row < rows; row++) {
      const rowCells: IKarnaughMapCell[] = [];
      for (let col = 0; col < cols; col++) {
        const minterm = GrayCodeHelper.gridPositionToMinterm(
          row,
          col,
          rowBits,
          colBits
        );
        rowCells.push({
          row,
          column: col,
          minterm,
          value: ECellValue.Undefined,
          isSelected: false,
        });
      }
      this.cells.push(rowCells);
    }

    // Reset focus
    this.focusedRow = 0;
    this.focusedCol = 0;

    // Clear solutions
    this.onesLoops = [];
    this.zerosLoops = [];
  }

  /**
   * Gets the value of a cell by minterm index.
   */
  getValue(minterm: number): ECellValue {
    const { row, col } = GrayCodeHelper.mintermToGridPosition(
      minterm,
      this.rowBits,
      this.colBits
    );
    if (this.cells[row] && this.cells[row][col]) {
      return this.cells[row][col].value;
    }
    return ECellValue.Undefined;
  }

  /**
   * Sets the value of a cell by minterm index.
   */
  setValue(minterm: number, value: ECellValue): void {
    const { row, col } = GrayCodeHelper.mintermToGridPosition(
      minterm,
      this.rowBits,
      this.colBits
    );
    if (this.cells[row] && this.cells[row][col]) {
      this.cells[row][col].value = value;
      this.cellValueChange.emit(this.cells[row][col]);
    }
  }

  /**
   * Handles cell click based on current mode.
   */
  onCellClick(cell: IKarnaughMapCell): void {
    if (this.mode === EEditMode.Edit) {
      this.toggleCellValue(cell);
    } else {
      this.toggleCellSelection(cell);
    }

    this.focusedRow = cell.row;
    this.focusedCol = cell.column;
  }

  /**
   * Toggles the value of a cell in Edit mode.
   */
  private toggleCellValue(cell: IKarnaughMapCell): void {
    // Cycle: Undefined -> Zero -> One -> DontCare -> Undefined
    switch (cell.value) {
      case ECellValue.Undefined:
        cell.value = ECellValue.Zero;
        break;
      case ECellValue.Zero:
        cell.value = ECellValue.One;
        break;
      case ECellValue.One:
        cell.value = ECellValue.DontCare;
        break;
      case ECellValue.DontCare:
        cell.value = ECellValue.Undefined;
        break;
    }
    this.cellValueChange.emit(cell);
  }

  /**
   * Toggles the selection of a cell in Solve mode.
   */
  private toggleCellSelection(cell: IKarnaughMapCell): void {
    cell.isSelected = !cell.isSelected;
  }

  /**
   * Handles keyboard navigation and input.
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const rows = this.cells.length;
    const cols = this.cells[0]?.length || 0;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.focusedRow = (this.focusedRow - 1 + rows) % rows;
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusedRow = (this.focusedRow + 1) % rows;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusedCol = (this.focusedCol - 1 + cols) % cols;
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.focusedCol = (this.focusedCol + 1) % cols;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.onCellClick(this.cells[this.focusedRow][this.focusedCol]);
        break;
      case '0':
        event.preventDefault();
        this.setCellValueDirect(ECellValue.Zero);
        break;
      case '1':
        event.preventDefault();
        this.setCellValueDirect(ECellValue.One);
        break;
      case 'x':
      case 'X':
      case '-':
        event.preventDefault();
        this.setCellValueDirect(ECellValue.DontCare);
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.setCellValueDirect(ECellValue.Undefined);
        break;
    }
  }

  /**
   * Sets the value of the focused cell directly.
   */
  private setCellValueDirect(value: ECellValue): void {
    if (this.mode === EEditMode.Edit) {
      const cell = this.cells[this.focusedRow][this.focusedCol];
      cell.value = value;
      this.cellValueChange.emit(cell);
    }
  }

  /**
   * Solves the entire Karnaugh map automatically.
   */
  async solveAutomatically(): Promise<void> {
    const solverInstance = this.solver ?? createQuineMcCluskeySolver();

    // Collect minterms and don't cares
    const ones: number[] = [];
    const zeros: number[] = [];
    const dontcares: number[] = [];

    for (const row of this.cells) {
      for (const cell of row) {
        switch (cell.value) {
          case ECellValue.One:
            ones.push(cell.minterm);
            break;
          case ECellValue.Zero:
            zeros.push(cell.minterm);
            break;
          case ECellValue.DontCare:
            dontcares.push(cell.minterm);
            break;
        }
      }
    }

    // Solve for ones
    this.onesLoops =
      ones.length > 0
        ? await solverInstance.solve(ones, dontcares, this.inputVariables.length)
        : [];

    // Solve for zeros
    this.zerosLoops =
      zeros.length > 0
        ? await solverInstance.solve(
            zeros,
            dontcares,
            this.inputVariables.length
          )
        : [];

    // Emit events
    for (const loop of this.onesLoops) {
      this.loopAdded.emit({ loop, isForOnes: true });
    }
    for (const loop of this.zerosLoops) {
      this.loopAdded.emit({ loop, isForOnes: false });
    }

    this.solved.emit({
      onesLoops: this.onesLoops,
      zerosLoops: this.zerosLoops,
    });
  }

  /**
   * Solves only the selected cells.
   */
  async solveSelection(): Promise<IRequiredLoop[]> {
    const solverInstance = this.solver ?? createQuineMcCluskeySolver();

    // Collect selected minterms
    const selectedMinterms: number[] = [];
    const dontcares: number[] = [];

    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.isSelected) {
          selectedMinterms.push(cell.minterm);
        } else if (cell.value === ECellValue.DontCare) {
          dontcares.push(cell.minterm);
        }
      }
    }

    if (selectedMinterms.length === 0) {
      return [];
    }

    const loops = await solverInstance.solve(
      selectedMinterms,
      dontcares,
      this.inputVariables.length
    );

    for (const loop of loops) {
      this.loopAdded.emit({ loop, isForOnes: true });
    }

    return loops;
  }

  /**
   * Clears all cell selections.
   */
  clearSelection(): void {
    for (const row of this.cells) {
      for (const cell of row) {
        cell.isSelected = false;
      }
    }
  }

  /**
   * Resets the entire map to undefined values.
   */
  reset(): void {
    for (const row of this.cells) {
      for (const cell of row) {
        cell.value = ECellValue.Undefined;
        cell.isSelected = false;
      }
    }
    this.onesLoops = [];
    this.zerosLoops = [];
  }

  /**
   * Exports the current state of the map.
   */
  exportState(): IKarnaughMapState {
    const cellValues: { [minterm: number]: ECellValue } = {};

    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.value !== ECellValue.Undefined) {
          cellValues[cell.minterm] = cell.value;
        }
      }
    }

    return {
      inputVariables: [...this.inputVariables],
      outputVariable: this.outputVariable,
      cellValues,
    };
  }

  /**
   * Imports a previously exported state.
   */
  importState(state: IKarnaughMapState): void {
    this.inputVariables = [...state.inputVariables];
    this.outputVariable = state.outputVariable;
    this.initializeGrid();

    for (const [mintermStr, value] of Object.entries(state.cellValues)) {
      const minterm = parseInt(mintermStr, 10);
      this.setValue(minterm, value);
    }
  }

  /**
   * Adds a new variable to the map.
   */
  addVariable(name?: string): void {
    const newName = name ?? this.getNextVariableName();
    this.inputVariables = [...this.inputVariables, newName];
    this.initializeGrid();
  }

  /**
   * Removes the last variable from the map.
   */
  removeVariable(): void {
    if (this.inputVariables.length > 1) {
      this.inputVariables = this.inputVariables.slice(0, -1);
      this.initializeGrid();
    }
  }

  /**
   * Gets the next variable name in sequence (A, B, C, ..., Z, A1, B1, ...).
   */
  private getNextVariableName(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const index = this.inputVariables.length;
    if (index < 26) {
      return chars[index];
    }
    const suffix = Math.floor(index / 26);
    return chars[index % 26] + suffix;
  }

  /**
   * Formats a cell value for display.
   */
  formatCellValue(value: ECellValue): string {
    switch (value) {
      case ECellValue.Zero:
        return '0';
      case ECellValue.One:
        return '1';
      case ECellValue.DontCare:
        return 'X';
      default:
        return '';
    }
  }

  /**
   * Formats a Gray code value for display.
   */
  formatGrayCode(value: number, bits: number): string {
    return GrayCodeHelper.formatGrayCode(value, bits);
  }

  /**
   * Checks if a cell is the currently focused cell.
   */
  isFocused(row: number, col: number): boolean {
    return row === this.focusedRow && col === this.focusedCol;
  }

  /**
   * Gets the total number of cells (for scroll threshold).
   */
  get totalCells(): number {
    return this.cells.length * (this.cells[0]?.length || 0);
  }

  /**
   * Gets the scroll threshold (cells beyond which scrolling is enabled).
   */
  get scrollThreshold(): number {
    return 64; // 8x8 grid
  }

  /**
   * Gets the aria-label for a cell.
   */
  getCellAriaLabel(cell: IKarnaughMapCell): string {
    const valueName = this.formatCellValue(cell.value) || 'empty';
    return `Minterm ${cell.minterm}, row ${cell.row + 1}, column ${cell.column + 1}, value ${valueName}`;
  }

  /**
   * Sets the mode and emits the mode change event.
   */
  setMode(mode: EEditMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      this.modeChange.emit(mode);

      // Clear selections when switching to Edit mode
      if (mode === EEditMode.Edit) {
        this.clearSelection();
      }
    }
  }

  /**
   * Gets the Boolean expression for the ones (SOP form).
   */
  getOnesExpression(): string {
    if (this.onesLoops.length === 0) {
      return '0';
    }

    const terms = this.onesLoops.map((loop) =>
      loop.toString(this.inputVariables)
    );
    return `${this.outputVariable} = ${terms.join(' + ')}`;
  }

  /**
   * Gets the Boolean expression for the zeros (POS form).
   */
  getZerosExpression(): string {
    if (this.zerosLoops.length === 0) {
      return '1';
    }

    const terms = this.zerosLoops.map((loop) =>
      loop.toString(this.inputVariables)
    );
    return `${this.outputVariable}' = ${terms.join(' + ')}`;
  }
}
