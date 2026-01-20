import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgKarnaughMapComponent,
  ECellValue,
  EEditMode,
  IKarnaughMapSolvedEvent,
} from '@mintplayer/ng-karnaugh-map';
import { BsCardModule } from '@mintplayer/ng-bootstrap/card';
import { BsButtonGroupComponent } from '@mintplayer/ng-bootstrap/button-group';
import { BsContainerComponent } from '@mintplayer/ng-bootstrap/container';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    NgKarnaughMapComponent,
    BsCardModule,
    BsButtonGroupComponent,
    BsContainerComponent,
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
      this.isSolved = true;
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
    this.isSolved = false;
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
