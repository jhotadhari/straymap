import journal from './meta/_journal.json';
import m0000 from './0000_elite_nitro.sql';
import m0001 from './0001_initSpatial.sql';
import m0002 from './0002_spatialIndex.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
