import * as migration_20261002_175733_initial from './20261002_175733_initial';
import * as migration_20261002_200527_advertised_price_rounding from './20261002_200527_advertised_price_rounding';
import * as migration_20261002_204453_gallery_evening_view from './20261002_204453_gallery_evening_view';
import * as migration_20261002_210606_media_import_origin from './20261002_210606_media_import_origin';
import * as migration_20261002_212717_configurator_leads from './20261002_212717_configurator_leads';
import * as migration_20261002_222613_lead_link from './20261002_222613_lead_link';
import * as migration_20261003_071441_entrance_landings from './20261003_071441_entrance_landings';

export const migrations = [
  {
    up: migration_20261002_175733_initial.up,
    down: migration_20261002_175733_initial.down,
    name: '20261002_175733_initial',
  },
  {
    up: migration_20261002_200527_advertised_price_rounding.up,
    down: migration_20261002_200527_advertised_price_rounding.down,
    name: '20261002_200527_advertised_price_rounding',
  },
  {
    up: migration_20261002_204453_gallery_evening_view.up,
    down: migration_20261002_204453_gallery_evening_view.down,
    name: '20261002_204453_gallery_evening_view',
  },
  {
    up: migration_20261002_210606_media_import_origin.up,
    down: migration_20261002_210606_media_import_origin.down,
    name: '20261002_210606_media_import_origin',
  },
  {
    up: migration_20261002_212717_configurator_leads.up,
    down: migration_20261002_212717_configurator_leads.down,
    name: '20261002_212717_configurator_leads',
  },
  {
    up: migration_20261002_222613_lead_link.up,
    down: migration_20261002_222613_lead_link.down,
    name: '20261002_222613_lead_link',
  },
  {
    up: migration_20261003_071441_entrance_landings.up,
    down: migration_20261003_071441_entrance_landings.down,
    name: '20261003_071441_entrance_landings'
  },
];
