import { useEffect, useMemo, useState } from 'react'
import demoPoster from './assets/demo-poster.png'
import demoVideo from './assets/demo-video.web.mp4'
import {
  WebGLVideoEdgeGlass,
  defaultLiquidGlassSettings,
  formatLiquidGlassValue,
  liquidGlassControls,
  normalizeLiquidGlassSettings,
  parseLiquidGlassPreset,
  serializeLiquidGlassPreset,
} from './liquid-glass'
import type { LiquidGlassSettingKey, LiquidGlassSettings } from './liquid-glass'

const coreControls = liquidGlassControls.filter((control) => control.section === 'core')
const fieldControls = liquidGlassControls.filter((control) => control.section === 'field')

function App() {
  const [settings, setSettings] = useState<LiquidGlassSettings>(defaultLiquidGlassSettings)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [importState, setImportState] = useState<'idle' | 'imported' | 'invalid'>('idle')
  const activeSettings = useMemo(() => normalizeLiquidGlassSettings(settings), [settings])
  const presetJson = useMemo(() => serializeLiquidGlassPreset(activeSettings), [activeSettings])
  const [presetDraft, setPresetDraft] = useState(presetJson)

  useEffect(() => {
    setPresetDraft(presetJson)
  }, [presetJson])

  const handleSettingChange = (key: LiquidGlassSettingKey, value: number) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      [key]: value,
    }))
    setCopyState('idle')
    setImportState('idle')
  }

  const handleFieldEnabledChange = (value: boolean) => {
    setSettings((currentSettings) => ({
      ...normalizeLiquidGlassSettings(currentSettings),
      fieldEnabled: value,
    }))
    setCopyState('idle')
    setImportState('idle')
  }

  const copyPreset = async () => {
    try {
      await navigator.clipboard.writeText(presetJson)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const importPreset = () => {
    try {
      setSettings(parseLiquidGlassPreset(presetDraft))
      setCopyState('idle')
      setImportState('imported')
    } catch {
      setImportState('invalid')
    }
  }

  const resetPreset = () => {
    setSettings(defaultLiquidGlassSettings)
    setCopyState('idle')
    setImportState('idle')
  }

  return (
    <main className="app-shell" aria-label="Liquid Prnc Glass lab">
      <section className="preview-stage" aria-label="WebGL video glass preview">
        <WebGLVideoEdgeGlass
          className="preview-stage__glass"
          poster={demoPoster}
          settings={activeSettings}
          src={demoVideo}
        />
      </section>
      <aside className="control-panel" aria-label="Glass controls">
        <div className="control-panel__head">
          <p>Liquid_Prnc_Glass</p>
          <span>WebGL / VideoTexture / SDF / GLSL</span>
        </div>
        <div className="control-panel__controls">
          <details className="control-group" open>
            <summary>Core optics</summary>
            {coreControls.map((control) => {
              const inputId = `glass-${control.key}`

              return (
                <div className="glass-control" key={control.key}>
                  <span className="glass-control__row">
                    <label htmlFor={inputId} title={control.help}>
                      {control.label}
                    </label>
                    <output aria-hidden="true" htmlFor={inputId}>
                      {formatLiquidGlassValue(control.key, activeSettings[control.key])}
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
                    value={activeSettings[control.key]}
                  />
                  <small>{control.help}</small>
                </div>
              )
            })}
          </details>
          <details className="control-group" open>
            <summary>Center field</summary>
            <label className="field-toggle">
              <input
              checked={activeSettings.fieldEnabled}
                onChange={(event) => handleFieldEnabledChange(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>Enable center-to-edge field</span>
            </label>
            <small className="field-toggle__hint">
              The center stays clean; refraction grows by curve toward the image edge.
            </small>
            {activeSettings.fieldEnabled ? (
              fieldControls.map((control) => {
                const inputId = `glass-${control.key}`

                return (
                  <div className="glass-control" key={control.key}>
                    <span className="glass-control__row">
                      <label htmlFor={inputId} title={control.help}>
                        {control.label}
                      </label>
                      <output aria-hidden="true" htmlFor={inputId}>
                        {formatLiquidGlassValue(control.key, activeSettings[control.key])}
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
                      value={activeSettings[control.key]}
                    />
                    <small>{control.help}</small>
                  </div>
                )
              })
            ) : (
              <p className="control-group__empty">Field controls are hidden until enabled.</p>
            )}
          </details>
        </div>
        <div className="preset-box">
          <div className="preset-box__head">
            <span>Current preset</span>
            <span className="preset-box__actions">
              <button onClick={importPreset} type="button">
                {importState === 'imported' ? 'Imported' : importState === 'invalid' ? 'Invalid' : 'Import'}
              </button>
              <button onClick={resetPreset} type="button">
                Reset
              </button>
              <button onClick={copyPreset} type="button">
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
              </button>
            </span>
          </div>
          <textarea
            aria-label="Current Liquid_Prnc_Glass preset"
            onChange={(event) => {
              setPresetDraft(event.currentTarget.value)
              setImportState('idle')
            }}
            spellCheck={false}
            value={presetDraft}
          />
        </div>
      </aside>
    </main>
  )
}

export default App
