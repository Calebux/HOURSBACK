
    import { mockPlaybooks } from '../src/data/playbooks.ts';
    import { writeFileSync } from 'fs';
    writeFileSync('./scripts/extracted.json', JSON.stringify(mockPlaybooks));
  