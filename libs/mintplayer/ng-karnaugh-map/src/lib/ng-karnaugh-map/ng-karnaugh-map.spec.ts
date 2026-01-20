import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgKarnaughMapComponent } from './ng-karnaugh-map';
import { ECellValue, EEditMode } from '../enums';

describe('NgKarnaughMapComponent', () => {
  let component: NgKarnaughMapComponent;
  let fixture: ComponentFixture<NgKarnaughMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgKarnaughMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgKarnaughMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default 2 variables', () => {
      expect(component.inputVariables).toEqual(['A', 'B']);
      expect(component.cells.length).toBe(2); // 2 rows
      expect(component.cells[0].length).toBe(2); // 2 columns
    });

    it('should create correct grid for 3 variables', () => {
      component.inputVariables = ['A', 'B', 'C'];
      component.ngOnChanges({
        inputVariables: {
          currentValue: ['A', 'B', 'C'],
          previousValue: ['A', 'B'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.cells.length).toBe(2); // 2 rows
      expect(component.cells[0].length).toBe(4); // 4 columns
    });

    it('should create correct grid for 4 variables', () => {
      component.inputVariables = ['A', 'B', 'C', 'D'];
      component.ngOnChanges({
        inputVariables: {
          currentValue: ['A', 'B', 'C', 'D'],
          previousValue: ['A', 'B'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.cells.length).toBe(4); // 4 rows
      expect(component.cells[0].length).toBe(4); // 4 columns
    });
  });

  describe('cell operations', () => {
    it('should get and set cell values', () => {
      component.setValue(0, ECellValue.One);
      expect(component.getValue(0)).toBe(ECellValue.One);

      component.setValue(0, ECellValue.Zero);
      expect(component.getValue(0)).toBe(ECellValue.Zero);
    });

    it('should toggle cell value in Edit mode', () => {
      const cell = component.cells[0][0];
      expect(cell.value).toBe(ECellValue.Undefined);

      component.onCellClick(cell);
      expect(cell.value).toBe(ECellValue.Zero);

      component.onCellClick(cell);
      expect(cell.value).toBe(ECellValue.One);

      component.onCellClick(cell);
      expect(cell.value).toBe(ECellValue.DontCare);

      component.onCellClick(cell);
      expect(cell.value).toBe(ECellValue.Undefined);
    });

    it('should toggle cell selection in Solve mode', () => {
      component.mode = EEditMode.Solve;
      const cell = component.cells[0][0];

      expect(cell.isSelected).toBe(false);
      component.onCellClick(cell);
      expect(cell.isSelected).toBe(true);
      component.onCellClick(cell);
      expect(cell.isSelected).toBe(false);
    });
  });

  describe('solving', () => {
    it('should solve automatically', async () => {
      // Set up a simple function: f(A,B) = Σm(1,3) = B
      component.setValue(1, ECellValue.One);
      component.setValue(3, ECellValue.One);
      component.setValue(0, ECellValue.Zero);
      component.setValue(2, ECellValue.Zero);

      await component.solveAutomatically();

      expect(component.onesLoops.length).toBe(1);
      expect(component.onesLoops[0].toString(['A', 'B'])).toBe('B');
    });
  });

  describe('state management', () => {
    it('should export and import state', () => {
      component.setValue(0, ECellValue.One);
      component.setValue(3, ECellValue.DontCare);

      const state = component.exportState();

      component.reset();
      expect(component.getValue(0)).toBe(ECellValue.Undefined);

      component.importState(state);
      expect(component.getValue(0)).toBe(ECellValue.One);
      expect(component.getValue(3)).toBe(ECellValue.DontCare);
    });

    it('should reset the map', () => {
      component.setValue(0, ECellValue.One);
      component.setValue(1, ECellValue.Zero);

      component.reset();

      expect(component.getValue(0)).toBe(ECellValue.Undefined);
      expect(component.getValue(1)).toBe(ECellValue.Undefined);
    });
  });

  describe('variable management', () => {
    it('should add a variable', () => {
      expect(component.inputVariables.length).toBe(2);

      component.addVariable();

      expect(component.inputVariables.length).toBe(3);
      expect(component.inputVariables[2]).toBe('C');
    });

    it('should remove a variable', () => {
      component.inputVariables = ['A', 'B', 'C'];
      component.ngOnChanges({
        inputVariables: {
          currentValue: ['A', 'B', 'C'],
          previousValue: ['A', 'B'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      component.removeVariable();

      expect(component.inputVariables.length).toBe(2);
    });

    it('should not remove variable when only one remains', () => {
      component.inputVariables = ['A'];
      component.ngOnChanges({
        inputVariables: {
          currentValue: ['A'],
          previousValue: ['A', 'B'],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      component.removeVariable();

      expect(component.inputVariables.length).toBe(1);
    });
  });
});
