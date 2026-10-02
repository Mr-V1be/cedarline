import type { GlobalConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { label } from '../fields/labels'

const MAX_FEATURED_PROJECTS = 6
const MAX_FEATURED_OBJECTS = 5

/** Editorial choices of the home page; texts live in the translation catalog. */
export const Home: GlobalConfig = {
  slug: 'home',
  label: label('Главная страница', 'Home page'),
  admin: { group: label('Контент', 'Content') },
  access: { read: anyone, update: requireCapability('content.write') },
  fields: [
    {
      name: 'heroProject',
      type: 'relationship',
      relationTo: 'projects',
      label: label('Проект на первом экране', 'Hero project'),
      required: true,
    },
    {
      name: 'featuredProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      maxRows: MAX_FEATURED_PROJECTS,
      label: label('Подборка проектов', 'Featured projects'),
    },
    {
      name: 'builtObjects',
      type: 'relationship',
      relationTo: 'built-objects',
      hasMany: true,
      maxRows: MAX_FEATURED_OBJECTS,
      label: label('Построенные объекты', 'Built houses'),
    },
  ],
}
