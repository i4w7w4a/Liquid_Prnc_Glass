export type ControlPanelQuickAction = 'collapse-all' | 'color-only'

export type ControlPanelQuickActionPlan = {
  collapseAll: boolean
  openGroup: 'color' | null
}

export function resolveControlPanelQuickAction(
  action: ControlPanelQuickAction,
): ControlPanelQuickActionPlan {
  return {
    collapseAll: true,
    openGroup: action === 'color-only' ? 'color' : null,
  }
}
