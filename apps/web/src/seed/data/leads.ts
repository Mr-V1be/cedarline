import type { LeadStatus } from '@/modules/leads/domain/lead'

/**
 * Sample leads of the demo stand, so that the sales manager's view is never empty after the
 * nightly reset. Each starts from the project's default configuration with the listed changes
 * (kept to what the render shows: the package and the building services).
 */
export const DEMO_LEADS: ReadonlyArray<{
  readonly name: string
  readonly phone: string
  readonly email: string
  readonly comment: string
  readonly project: string
  readonly render: string
  readonly changes: Readonly<Record<string, unknown>>
  readonly status: LeadStatus
  readonly notes: string
}> = [
  {
    name: 'Анна Смирнова',
    phone: '+7 921 555-12-34',
    email: 'anna@example.ru',
    comment: 'Участок в Рощино, 12 соток, хотим заехать к лету.',
    project: 'pikhta',
    render: 'pikhta-front',
    changes: { completeness: 'prefinish' },
    status: 'new',
    notes: '',
  },
  {
    name: 'Игорь Волков',
    phone: '+7 911 204-77-18',
    email: 'igor.volkov@example.ru',
    comment: 'Нужен дом для постоянного проживания, удобно звонить после 18:00.',
    project: 'sosny',
    render: 'sosny-front',
    changes: { completeness: 'turnkey' },
    status: 'in-progress',
    notes: 'Перезвонить в четверг, уточнить подъезд для грузовика и где будет септик.',
  },
  {
    name: 'Мария Лебедева',
    phone: '+7 952 380-41-09',
    email: 'maria.lebedeva@example.ru',
    comment: 'Баня на даче в Сосново, рядом с прудом.',
    project: 'olkha',
    render: 'olkha-front',
    changes: { completeness: 'shell' },
    status: 'won',
    notes: 'Договор подписан, сваи — на следующей неделе.',
  },
]
