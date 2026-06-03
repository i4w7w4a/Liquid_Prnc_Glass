import { useMemo, useState } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  WebGLVideoEdgeGlass,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  liquidGlassControls,
  serializeLiquidGlassPreset,
} from './liquid-glass'
import type { LiquidGlassSettingKey, LiquidGlassSettings } from './liquid-glass'

function App() {
  const [settings, setSettings] = useState<LiquidGlassSettings>(defaultLiquidGlassSettings)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const presetJson = useMemo(() => serializeLiquidGlassPreset(settings), [settings])

  const handleSettingChange = (key: LiquidGlassSettingKey, value: number) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
    setCopyState('idle')
  }

  const copyPreset = async () => {
    try {
      await navigator.clipboard.writeText(presetJson)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <main className="app-shell" aria-label="Liquid Prnc Glass lab">
      <section className="preview-stage" aria-label="WebGL video glass preview">
        <WebGLVideoEdgeGlass
          className="preview-stage__glass"
          poster={demoPoster}
          settings={settings}
          src={demoVideo}
        />
      </section>
      <aside className="control-panel" aria-label="Glass controls">
        <div className="control-panel__head">
          <p>Liquid_Prnc_Glass</p>
          <span>WebGL / VideoTexture / SDF / GLSL</span>
        </div>
        <div className="control-panel__controls">
          {liquidGlassControls.map((control) => {
            const inputId = `glass-${control.key}`

            return (
              <div className="glass-control" key={control.key}>
                <span className="glass-control__row">
                  <label htmlFor={inputId} title={control.help}>
                    {control.label}
                  </label>
                  <output aria-hidden="true" htmlFor={inputId}>
                    {formatLiquidGlassValue(control.key, settings[control.key])}
                  </output>
                </span>
                <input
                  id={inputId}
                  max={control.max}
                  min={control.min}
                  onChange={(event) =>
                    handleSettingChange(control.key, Number(event.currentTarget.value))
                  }
                  step={control.step}
                  type="range"
                  value={settings[control.key]}
                />
                <small>{control.help}</small>
              </div>
            )
          })}
        </div>
        <div className="preset-box">
          <div className="preset-box__head">
            <span>Current preset</span>
            <button onClick={copyPreset} type="button">
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
            </button>
          </div>
          <pre aria-label="Current Liquid_Prnc_Glass preset">{presetJson}</pre>
        </div>
      </aside>
    </main>
  )
}

export default App
