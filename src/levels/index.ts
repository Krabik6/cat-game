import type { LevelData } from '../sim/types';
import { level1 } from './l1';
import { level2 } from './l2';
import { level3 } from './l3';
import { level4 } from './l4';
import { level5 } from './l5';
import { level6 } from './l6';
import { level7 } from './l7';
import { level8 } from './l8';

export const LEVELS: (() => LevelData)[] = [level1, level2, level3, level4, level5, level6, level7, level8];
