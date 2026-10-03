import catalog from './catalog.json'
import common from './common.json'
import configurator from './configurator.json'
import home from './home.json'
import lead from './lead.json'
import mail from './mail.json'
import calculator from './pages/calculator.json'
import contacts from './pages/contacts.json'
import objects from './pages/objects.json'
import privacy from './pages/privacy.json'
import project from './project.json'
import proposal from './proposal.json'
import registry from './registry.json'
import viewer from './viewer.json'

/** The Russian catalog is the reference: its shape types every other locale. */
const messages = {
  common,
  registry,
  home,
  catalog,
  project,
  viewer,
  configurator,
  lead,
  mail,
  proposal,
  privacy,
  objects,
  contacts,
  calculator,
}

export default messages
