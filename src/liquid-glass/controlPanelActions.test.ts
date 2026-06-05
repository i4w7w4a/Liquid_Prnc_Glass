import { describe, expect, it } from 'vitest'
import { resolveControlPanelQuickAction } from './controlPanelActions'

describe('control panel quick actions', () => {
  it('collapses every control group for the lower rail action', () => {
    expect(resolveControlPanelQuickAction('collapse-all')).toEqual({
      collapseAll: true,
      openGroup: null,
    })
  })

  it('collapses the panel and opens only color controls for the upper rail action', () => {
    expect(resolveControlPanelQuickAction('color-only')).toEqual({
      collapseAll: true,
      openGroup: 'color',
    })
  })
})
