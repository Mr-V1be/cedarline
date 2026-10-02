import type { Messages } from '../types'
import catalog from './catalog.json'
import common from './common.json'
import configurator from './configurator.json'
import home from './home.json'
import lead from './lead.json'
import mail from './mail.json'
import project from './project.json'
import proposal from './proposal.json'
import registry from './registry.json'
import viewer from './viewer.json'

const messages: Messages = {
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
}

export default messages
