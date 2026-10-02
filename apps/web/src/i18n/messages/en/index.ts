import type { Messages } from '../types'
import catalog from './catalog.json'
import common from './common.json'
import home from './home.json'
import project from './project.json'
import registry from './registry.json'
import viewer from './viewer.json'

const messages: Messages = { common, registry, home, catalog, project, viewer }

export default messages
