import { QuineMcCluskeySolver, createQuineMcCluskeySolver } from './quine-mccluskey-solver';
import { IRequiredLoop } from './interfaces';

describe('QuineMcCluskeySolver', () => {
  let solver: QuineMcCluskeySolver;

  beforeEach(() => {
    solver = new QuineMcCluskeySolver();
  });

  describe('solve', () => {
    it('should return empty array for empty minterms', async () => {
      const result = await solver.solve([], []);
      expect(result).toEqual([]);
    });

    it('should solve simple 2-variable function', async () => {
      // f(A,B) = Σm(1,3) = B
      const result = await solver.solve([1, 3], [], 2);

      expect(result.length).toBe(1);
      expect(result[0].toString(['A', 'B'])).toBe('B');
    });

    it('should solve 3-variable function', async () => {
      // f(A,B,C) = Σm(0,1,2,3) = A'
      const result = await solver.solve([0, 1, 2, 3], [], 3);

      expect(result.length).toBe(1);
      expect(result[0].toString(['A', 'B', 'C'])).toBe("A'");
    });

    it('should solve 4-variable function with multiple prime implicants', async () => {
      // f(A,B,C,D) = Σm(0,2,8,10) = B'D'
      const result = await solver.solve([0, 2, 8, 10], [], 4);

      expect(result.length).toBe(1);
      expect(result[0].toString(['A', 'B', 'C', 'D'])).toBe("B'D'");
    });

    it('should handle dont cares', async () => {
      // f(A,B,C) = Σm(1,2) + Σd(0,3)
      // With don't cares, optimal is: A'
      const result = await solver.solve([1, 2], [0, 3], 3);

      expect(result.length).toBe(1);
    });

    it('should solve function requiring multiple prime implicants', async () => {
      // f(A,B,C,D) = Σm(0,1,2,5,6,7,8,9,10,14)
      const result = await solver.solve([0, 1, 2, 5, 6, 7, 8, 9, 10, 14], [], 4);

      // Should have multiple prime implicants covering all minterms
      expect(result.length).toBeGreaterThan(0);

      // Verify all minterms are covered
      const coveredMinterms = new Set<number>();
      for (const loop of result) {
        for (const m of loop.minterms) {
          coveredMinterms.add(m);
        }
      }

      for (const m of [0, 1, 2, 5, 6, 7, 8, 9, 10, 14]) {
        expect(coveredMinterms.has(m)).toBe(true);
      }
    });

    it('should auto-detect number of variables', async () => {
      // Minterm 15 requires at least 4 variables
      const result = await solver.solve([15], []);

      expect(result.length).toBe(1);
      expect(result[0].minterms).toContain(15);
    });

    it('should handle single minterm', async () => {
      // f(A,B) = Σm(2) = AB'
      const result = await solver.solve([2], [], 2);

      expect(result.length).toBe(1);
      expect(result[0].toString(['A', 'B'])).toBe("AB'");
    });

    it('should handle all minterms (tautology)', async () => {
      // f(A,B) = Σm(0,1,2,3) = 1
      const result = await solver.solve([0, 1, 2, 3], [], 2);

      expect(result.length).toBe(1);
      expect(result[0].toString(['A', 'B'])).toBe('1');
    });
  });

  describe('createQuineMcCluskeySolver', () => {
    it('should create a solver instance', () => {
      const solver = createQuineMcCluskeySolver();
      expect(solver).toBeInstanceOf(QuineMcCluskeySolver);
    });
  });
});
