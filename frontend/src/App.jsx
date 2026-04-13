import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('improve')
  const [localProfile, setLocalProfile] = useState('normal')
  const [currentStep, setCurrentStep] = useState(0)
  const [model, setModel] = useState('')
  const [transaction, setTransaction] = useState(null)
  const [proof, setProof] = useState(null)
  const [error, setError] = useState('')
  const [degraded, setDegraded] = useState(false)
  const [warnings, setWarnings] = useState([])
  const [demoMode, setDemoMode] = useState(true)
  const [scalingNote, setScalingNote] = useState('')
  const [agentRuntimeNote, setAgentRuntimeNote] = useState('')
  const [localProfiles, setLocalProfiles] = useState([])
  const [providerStatus, setProviderStatus] = useState(null)
  const [executionReport, setExecutionReport] = useState(null)

  const specialistProfile = localProfiles.find((profile) => profile.key === 'specialist')

  const steps = [
    'Analyzing input...',
    demoMode ? 'Planning transformation...' : 'Selecting optimal execution path...',
    'Executing writing task...',
    'Finalizing output...'
  ]

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const [configResponse, healthResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/config`),
          fetch(`${API_BASE_URL}/health?check=providers`),
        ])

        if (configResponse.ok) {
          const configData = await configResponse.json()
          setDemoMode(Boolean(configData.demoMode))
          setScalingNote(configData.scalingNote || '')
          setAgentRuntimeNote(configData.agentRuntimeNote || '')
          setLocalProfiles(configData.localProfiles || [])
        }

        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          setProviderStatus(healthData.providerChecks || null)
        }
      } catch {
        setProviderStatus(null)
      }
    }

    loadStatus()
    const intervalId = window.setInterval(loadStatus, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const handleRunAgent = async () => {
    if (!input.trim()) {
      setError('Please enter some text to process.')
      return
    }

    setLoading(true)
    setOutput('')
    setTransaction(null)
    setProof(null)
    setModel('')
    setError('')
    setDegraded(false)
    setWarnings([])
    setExecutionReport(null)
    setCurrentStep(0)

    const stepTimer = window.setInterval(() => {
      setCurrentStep((current) => {
        if (current >= steps.length) {
          window.clearInterval(stepTimer)
          return current
        }
        return current + 1
      })
    }, 450)

    try {
      const response = await fetch(`${API_BASE_URL}/run-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input, mode, localProfile }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setOutput(data.output)
        setModel(data.model)
        setTransaction(data.transaction)
        setProof(data.proof)
        setDegraded(data.degraded || false)
        setWarnings(data.warnings || [])
        setDemoMode(Boolean(data.demoMode))
        setScalingNote(data.scalingNote || scalingNote)
        setAgentRuntimeNote(data.agentRuntimeNote || agentRuntimeNote)
        setExecutionReport(data.executionReport || null)
      } else {
        setError(data.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(`Connection error: ${err.message}. Make sure backend is running and VITE_API_BASE_URL is correct.`)
    } finally {
      window.clearInterval(stepTimer)
      setCurrentStep(steps.length)
      setLoading(false)
    }
  }

  const getModelBadge = () => {
    const badges = {
      'gemini-2.0-flash': { label: 'Gemini 2.0 Flash', color: '#2563eb' },
      'gemma-3-27b': { label: 'Gemma 3 27B', color: '#6366f1' },
      'hermes-3-405b': { label: 'Hermes 3 405B', color: '#a855f7' },
      'local-mistral': { label: 'Local Mistral', color: '#22c55e' },
      'local-specialist-writer': { label: 'Specialized Writer', color: '#f97316' },
      'demo-fallback': { label: 'Demo Fallback', color: '#f59e0b' },
    }
    return badges[model] || { label: model, color: '#888' }
  }

  const providerLabel = (name, provider) => {
    if (!provider) return `${name} unavailable`
    if (provider.reachable) return `${name} available`
    if (provider.configured) return `${name} rate-limited`
    return `${name} not configured`
  }

  const providerTone = (provider) => {
    if (!provider) return 'neutral'
    if (provider.reachable) return 'good'
    if (provider.configured) return 'warn'
    return 'neutral'
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }
    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  return (
    <div className="container">
      <header className="header">
        <h1>InkAgent</h1>
        <p className="subtitle">Autonomous Writing Agent with Paid Execution</p>
      </header>

      <main className="main">
        <div className="status-banner">
          <div className="status-banner-title">Demo Mode</div>
          <p>
            We are running on local models for reliability during the demo.
            {' '}
            {scalingNote || 'When scaling, we will opportunistically route into API-based inference for stronger output quality.'}
          </p>
          {agentRuntimeNote && <div className="status-subnote">{agentRuntimeNote}</div>}
        </div>

        <div className="status-grid">
          <div className="status-card">
            <div className="status-card-title">Local Profiles</div>
            <div className="profile-toggle">
              <button
                className={`profile-btn ${localProfile === 'normal' ? 'active' : ''}`}
                onClick={() => setLocalProfile('normal')}
                disabled={loading}
              >
                Normal
              </button>
              <button
                className={`profile-btn ${localProfile === 'specialist' ? 'active' : ''}`}
                onClick={() => setLocalProfile('specialist')}
                disabled={loading}
              >
                Specialized
              </button>
            </div>
            <div className="profile-list">
              {localProfiles.map((profile) => (
                <div key={profile.key} className="profile-block">
                  <div className="profile-row">
                    <span>{profile.label}</span>
                    <span className={`status-pill ${profile.available ? 'good' : 'warn'}`}>
                      {profile.downloadReady ? 'Ready' : profile.available ? 'Fallback Ready' : 'Pending'}
                    </span>
                  </div>
                  {profile.key === 'specialist' && !profile.downloadReady && profile.minimumBytes > 0 && (
                    <>
                      <div className="profile-note">
                        Specialist model downloading: {formatBytes(profile.requestedSize)} / {formatBytes(profile.minimumBytes)} ({profile.downloadPercent}%)
                      </div>
                      <div className="progress-track" aria-label="Specialist model download progress">
                        <div
                          className="progress-fill"
                          style={{ width: `${profile.downloadPercent}%` }}
                        />
                      </div>
                    </>
                  )}
                  {profile.key === 'specialist' && profile.usingFallbackPath && (
                    <div className="profile-note">
                      Using fallback local model until the specialist GGUF finishes downloading.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="status-card">
            <div className="status-card-title">Provider Status</div>
            <div className="provider-list">
              <div className="provider-row">
                <span>Gemini</span>
                <span className={`status-pill ${providerTone(providerStatus?.gemini)}`}>
                  {providerLabel('Gemini', providerStatus?.gemini)}
                </span>
              </div>
              <div className="provider-row">
                <span>OpenRouter</span>
                <span className={`status-pill ${providerTone(providerStatus?.openrouter)}`}>
                  {providerLabel('OpenRouter', providerStatus?.openrouter)}
                </span>
              </div>
              <div className="provider-row">
                <span>Local</span>
                <span className="status-pill good">Local available</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'improve' ? 'active' : ''}`}
            onClick={() => setMode('improve')}
          >
            Improve
          </button>
          <button
            className={`mode-btn ${mode === 'continue' ? 'active' : ''}`}
            onClick={() => setMode('continue')}
          >
            Continue
          </button>
        </div>

        <div className="input-section">
          <label htmlFor="input-text">Task Input</label>
          <textarea
            id="input-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'improve'
              ? 'Paste text to improve...'
              : 'Paste text to continue...'}
            rows={8}
            disabled={loading}
          />
        </div>

        <button
          className={`run-button ${loading ? 'loading' : ''}`}
          onClick={handleRunAgent}
          disabled={loading}
        >
          {loading ? (
            <span className="btn-content">
              <span className="spinner"></span>
              Executing Agent...
            </span>
          ) : (
            'Execute Writing Task'
          )}
        </button>

        {loading && (
          <div className="steps-container">
            <div className="steps-header">Execution Pipeline</div>
            <div className="steps-list">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
                >
                  <span className="step-icon">
                    {index < currentStep ? '✓' : index === currentStep ? '●' : '○'}
                  </span>
                  <span className="step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="warning-box">
            <div className="warning-title">Execution Notes</div>
            {warnings.map((warning) => (
              <div key={warning} className="warning-item">
                {warning}
              </div>
            ))}
          </div>
        )}

        {executionReport && (
          <div className="report-grid">
            <div className="report-card">
              <div className="report-title">Execution Policy</div>
              <div className="report-row">
                <span>Mode</span>
                <span>{executionReport.policyMode}</span>
              </div>
              <div className="report-row">
                <span>Specialization</span>
                <span>{executionReport.specialization?.profileLabel || 'Unknown'}</span>
              </div>
              <div className="report-row">
                <span>Goal</span>
                <span>{executionReport.specialization?.goal || 'Writing task execution'}</span>
              </div>
            </div>

            <div className="report-card">
              <div className="report-title">Guardrails</div>
              <div className="report-row">
                <span>Input Length</span>
                <span>{executionReport.requestMetrics?.normalizedLength || 0} chars</span>
              </div>
              <div className="report-row">
                <span>Truncated</span>
                <span>{executionReport.requestMetrics?.truncated ? 'Yes' : 'No'}</span>
              </div>
              <div className="report-note">
                {executionReport.guardrailIssues?.length
                  ? executionReport.guardrailIssues.join(' • ')
                  : 'No major request guardrail issues detected.'}
              </div>
            </div>

            <div className="report-card">
              <div className="report-title">Verification</div>
              <div className="report-row">
                <span>Status</span>
                <span>{executionReport.verification?.valid ? 'Passed' : 'Recovered'}</span>
              </div>
              <div className="report-row">
                <span>Output Words</span>
                <span>{executionReport.verification?.metrics?.outputWords || 0}</span>
              </div>
              <div className="report-note">
                {executionReport.verification?.warnings?.length
                  ? executionReport.verification.warnings.join(' • ')
                  : 'Output verification completed successfully.'}
              </div>
            </div>
          </div>
        )}

        {executionReport?.providersTried?.length > 0 && (
          <div className="attempts-box">
            <div className="warning-title">Provider Attempts</div>
            {executionReport.providersTried.map((attempt) => (
              <div key={`${attempt.provider}-${attempt.label}`} className="attempt-row">
                <span>{attempt.label}</span>
                <span className={`status-pill ${attempt.success ? 'good' : 'warn'}`}>
                  {attempt.success ? 'Accepted' : 'Skipped'}
                </span>
              </div>
            ))}
          </div>
        )}

        {specialistProfile && !specialistProfile.downloadReady && (
          <div className="download-box">
            <div className="warning-title">Specialist Download</div>
            <div className="warning-item">
              Run <code>bash scripts/download_specialist_model.sh</code> in an external terminal to continue or resume the specialist GGUF download.
            </div>
          </div>
        )}

        {output && (
          <div className="output-section">
            <label>
              Execution Result
              {degraded && (
                <span className="degraded-badge">Demo Local</span>
              )}
              {model && (
                <span
                  className="model-badge"
                  style={{ backgroundColor: getModelBadge().color }}
                >
                  {getModelBadge().label}
                </span>
              )}
            </label>
            <div className="task-complete">Task completed successfully.</div>
            <div className="output-box">{output}</div>
          </div>
        )}

        {transaction && (
          <div className="payment-section">
            <div className="payment-header">
              <span className="payment-icon">💳</span>
              Execution Transaction
            </div>
            <div className="payment-details">
              <div className="payment-row">
                <span className="payment-label">Status</span>
                <span className="payment-value success">✓ Settled</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Cost</span>
                <span className="payment-value">{transaction.cost}</span>
              </div>
              <div className="payment-row">
                <span className="payment-label">Transaction ID</span>
                <span className="payment-value tx-id">{transaction.id}</span>
              </div>
              {transaction.kite && (
                <div className="payment-row">
                  <span className="payment-label">Kite Network</span>
                  <span className="payment-value">{transaction.kite.chainName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {proof && (
          <div className="proof-section">
            <div className="proof-header">
              <span className="proof-icon">⛓</span>
              Execution Proof
            </div>
            <div className="proof-details">
              <div className="proof-row">
                <span className="proof-label">Input Hash (SHA-256)</span>
                <span className="proof-value">{proof.inputHash}</span>
              </div>
              <div className="proof-row">
                <span className="proof-label">Output Hash (SHA-256)</span>
                <span className="proof-value">{proof.outputHash}</span>
              </div>
              <div className="proof-row">
                <span className="proof-label">Algorithm</span>
                <span className="proof-value">{proof.algorithm}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Demo Mode • Local-first reliability now, API-enhanced scaling later</p>
      </footer>
    </div>
  )
}

export default App
