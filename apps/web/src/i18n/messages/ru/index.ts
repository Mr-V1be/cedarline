import catalog from './catalog.json'
import common from './common.json'
import home from './home.json'
import project from './project.json'
import registry from './registry.json'
import viewer from './viewer.json'

/** The Russian catalog is the reference: its shape types every other locale. */
const messages = { common, registry, home, catalog, project, viewer }

export default messages
