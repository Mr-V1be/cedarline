import * as migration_20261002_175733_initial from './20261002_175733_initial';
import * as migration_20261002_200527_advertised_price_rounding from './20261002_200527_advertised_price_rounding';
import * as migration_20261002_204453_gallery_evening_view from './20261002_204453_gallery_evening_view';
import * as migration_20261002_210606_media_import_origin from './20261002_210606_media_import_origin';
import * as migration_20261002_212717_configurator_leads from './20261002_212717_configurator_leads';
import * as migration_20261002_222613_lead_link from './20261002_222613_lead_link';
import * as migration_20261003_071441_entrance_landings from './20261003_071441_entrance_landings';
import * as migration_20261003_083147_site_location_and_legal from './20261003_083147_site_location_and_legal';
import * as migration_20261003_085408_financing_and_key_rate from './20261003_085408_financing_and_key_rate';
import * as migration_20261003_091553_articles from './20261003_091553_articles';
import * as migration_20261003_091942_production_page from './20261003_091942_production_page';
import * as migration_20261003_093631_mailbox_and_jobs from './20261003_093631_mailbox_and_jobs';
import * as migration_20261003_131530_site_demo_details from './20261003_131530_site_demo_details';
import * as migration_20261003_170740_demo_reset_job from './20261003_170740_demo_reset_job';
import * as migration_20261025_154657_display_currency from './20261025_154657_display_currency';

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
    name: '20261003_071441_entrance_landings',
  },
  {
    up: migration_20261003_083147_site_location_and_legal.up,
    down: migration_20261003_083147_site_location_and_legal.down,
    name: '20261003_083147_site_location_and_legal',
  },
  {
    up: migration_20261003_085408_financing_and_key_rate.up,
    down: migration_20261003_085408_financing_and_key_rate.down,
    name: '20261003_085408_financing_and_key_rate',
  },
  {
    up: migration_20261003_091553_articles.up,
    down: migration_20261003_091553_articles.down,
    name: '20261003_091553_articles',
  },
  {
    up: migration_20261003_091942_production_page.up,
    down: migration_20261003_091942_production_page.down,
    name: '20261003_091942_production_page',
  },
  {
    up: migration_20261003_093631_mailbox_and_jobs.up,
    down: migration_20261003_093631_mailbox_and_jobs.down,
    name: '20261003_093631_mailbox_and_jobs',
  },
  {
    up: migration_20261003_131530_site_demo_details.up,
    down: migration_20261003_131530_site_demo_details.down,
    name: '20261003_131530_site_demo_details',
  },
  {
    up: migration_20261003_170740_demo_reset_job.up,
    down: migration_20261003_170740_demo_reset_job.down,
    name: '20261003_170740_demo_reset_job',
  },
  {
    up: migration_20261025_154657_display_currency.up,
    down: migration_20261025_154657_display_currency.down,
    name: '20261025_154657_display_currency'
  },
];
