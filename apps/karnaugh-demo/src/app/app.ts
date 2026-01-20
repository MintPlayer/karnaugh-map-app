import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgKarnaughMapComponent,
  ECellValue,
  EEditMode,
  IKarnaughMapSolvedEvent,
} from '@mintplayer/ng-karnaugh-map';
import { IRequiredLoop } from '@mintplayer/quine-mccluskey';
import { BsCardModule } from '@mintplayer/ng-bootstrap/card';
import { BsButtonGroupComponent } from '@mintplayer/ng-bootstrap/button-group';
import { BsContainerComponent } from '@mintplayer/ng-bootstrap/container';
import { BsGridModule } from '@mintplayer/ng-bootstrap/grid';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    NgKarnaughMapComponent,
    BsCardModule,
    BsButtonGroupComponent,
    BsContainerComponent,
    BsGridModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  @ViewChild('kmap') kmap!: NgKarnaughMapComponent;

  // Configuration
  inputVariables: string[] = ['A', 'B', 'C', 'D'];
  outputVariable = 'Y';
  mode: EEditMode = EEditMode.Edit;

  // Results
  onesExpression = '';
  zerosExpression = '';
  isSolved = false;

  // Loop data for interactive highlighting
  onesLoops: IRequiredLoop[] = [];
  zerosLoops: IRequiredLoop[] = [];
  onesTerms: string[] = [];
  zerosTerms: string[] = [];

  // Hover and selection state for term highlighting
  hoveredLoopIndex: number | null = null;
  hoveredLoopType: 'ones' | 'zeros' | null = null;
  selectedLoopIndex: number | null = null;
  selectedLoopType: 'ones' | 'zeros' | null = null;

  // Expose enums to template
  readonly EEditMode = EEditMode;

  /**
   * Adds a new variable to the map.
   */
  addVariable(): void {
    if (this.kmap) {
      this.kmap.addVariable();
      this.inputVariables = [...this.kmap.inputVariables];
      this.clearResults();
    }
  }

  /**
   * Removes the last variable from the map.
   */
  removeVariable(): void {
    if (this.kmap && this.inputVariables.length > 1) {
      this.kmap.removeVariable();
      this.inputVariables = [...this.kmap.inputVariables];
      this.clearResults();
    }
  }

  /**
   * Updates a variable name.
   */
  updateVariableName(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim() || this.inputVariables[index];
    this.inputVariables = this.inputVariables.map((v, i) =>
      i === index ? newName : v
    );
  }

  /**
   * Sets the editing mode.
   */
  setMode(mode: EEditMode): void {
    this.mode = mode;
    if (this.kmap) {
      this.kmap.setMode(mode);
    }
  }

  /**
   * Solves the Karnaugh map automatically.
   */
  async solve(): Promise<void> {
    if (this.kmap) {
      await this.kmap.solveAutomatically();
      this.onesExpression = this.kmap.getOnesExpression();
      this.zerosExpression = this.kmap.getZerosExpression();
      this.onesLoops = this.kmap.onesLoops;
      this.zerosLoops = this.kmap.zerosLoops;
      this.onesTerms = this.kmap.getOnesTerms();
      this.zerosTerms = this.kmap.getZerosTerms();
      this.isSolved = true;
      // Clear any previous selection
      this.clearHighlight();
    }
  }

  /**
   * Handles the solved event from the Karnaugh map.
   */
  onSolved(event: IKarnaughMapSolvedEvent): void {
    console.log('Karnaugh map solved:', event);
  }

  /**
   * Clears all cells in the map.
   */
  clear(): void {
    if (this.kmap) {
      this.kmap.reset();
      this.clearResults();
    }
  }

  /**
   * Fills the map with random values.
   */
  randomFill(): void {
    if (this.kmap) {
      const numCells = Math.pow(2, this.inputVariables.length);
      const values = [ECellValue.Zero, ECellValue.One, ECellValue.DontCare];
      for (let i = 0; i < numCells; i++) {
        const randomValue = values[Math.floor(Math.random() * values.length)];
        this.kmap.setValue(i, randomValue);
      }
      this.clearResults();
    }
  }

  /**
   * Clears the solution results.
   */
  private clearResults(): void {
    this.onesExpression = '';
    this.zerosExpression = '';
    this.onesLoops = [];
    this.zerosLoops = [];
    this.onesTerms = [];
    this.zerosTerms = [];
    this.isSolved = false;
    this.clearHighlight();
  }

  /**
   * Gets the effective highlight (selected takes precedence over hovered).
   */
  get effectiveLoopIndex(): number | null {
    return this.selectedLoopIndex !== null
      ? this.selectedLoopIndex
      : this.hoveredLoopIndex;
  }

  /**
   * Gets the effective loop type (selected takes precedence over hovered).
   */
  get effectiveLoopType(): 'ones' | 'zeros' | null {
    return this.selectedLoopIndex !== null
      ? this.selectedLoopType
      : this.hoveredLoopType;
  }

  /**
   * Handles mouse enter on a term.
   */
  hoverTerm(index: number, type: 'ones' | 'zeros'): void {
    this.hoveredLoopIndex = index;
    this.hoveredLoopType = type;
  }

  /**
   * Handles mouse leave on a term.
   */
  unhoverTerm(): void {
    this.hoveredLoopIndex = null;
    this.hoveredLoopType = null;
  }

  /**
   * Toggles the selection of a term.
   */
  toggleSelectTerm(index: number, type: 'ones' | 'zeros'): void {
    if (this.selectedLoopIndex === index && this.selectedLoopType === type) {
      // Deselect if already selected
      this.selectedLoopIndex = null;
      this.selectedLoopType = null;
    } else {
      // Select this term
      this.selectedLoopIndex = index;
      this.selectedLoopType = type;
    }
  }

  /**
   * Clears all highlight states.
   */
  clearHighlight(): void {
    this.hoveredLoopIndex = null;
    this.hoveredLoopType = null;
    this.selectedLoopIndex = null;
    this.selectedLoopType = null;
  }

  /**
   * Checks if a term is currently active (hovered or selected).
   */
  isTermActive(index: number, type: 'ones' | 'zeros'): boolean {
    return (
      (this.hoveredLoopIndex === index && this.hoveredLoopType === type) ||
      (this.selectedLoopIndex === index && this.selectedLoopType === type)
    );
  }

  /**
   * Checks if a term is currently selected (locked).
   */
  isTermSelected(index: number, type: 'ones' | 'zeros'): boolean {
    return this.selectedLoopIndex === index && this.selectedLoopType === type;
  }

  /**
   * Copies the expression to clipboard.
   */
  async copyExpression(expression: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(expression);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  /**
   * Exports the current state as JSON.
   */
  exportState(): void {
    if (this.kmap) {
      const state = this.kmap.exportState();
      const json = JSON.stringify(state, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'karnaugh-map.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Imports state from a JSON file.
   */
  importState(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.kmap) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target?.result as string);
          this.kmap.importState(state);
          this.inputVariables = [...this.kmap.inputVariables];
          this.outputVariable = state.outputVariable;
          this.clearResults();
        } catch (err) {
          console.error('Failed to import:', err);
        }
      };
      reader.readAsText(file);
    }
  }
}
