import * as migration_20261002_175733_initial from './20261002_175733_initial';
import * as migration_20261002_200527_advertised_price_rounding from './20261002_200527_advertised_price_rounding';

export const migrations = [
  {
    up: migration_20261002_175733_initial.up,
    down: migration_20261002_175733_initial.down,
    name: '20261002_175733_initial',
  },
  {
    up: migration_20261002_200527_advertised_price_rounding.up,
    down: migration_20261002_200527_advertised_price_rounding.down,
    name: '20261002_200527_advertised_price_rounding'
  },
];
