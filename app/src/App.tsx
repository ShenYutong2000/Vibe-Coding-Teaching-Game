import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  demoIdea,
  demoQuestion,
  mapElements,
  nextIdeas,
  ruleOptions,
  type MapElementId,
  type RuleChoice,
} from './demoScenario'

type Screen = 'idea' | 'map' | 'brief' | 'build' | 'playtest' | 'debug' | 'next'
type Evaluation = 'works' | 'different' | 'broken' | 'changed'
type DebugStep = 'observe' | 'guess' | 'test' | 'repair' | 'retest'
type Point = { x: number; y: number }
type GameState = { player: Point; collected: number[]; won: boolean }

const gameSize = { columns: 12, rows: 7 }
const starLocations: Point[] = [{ x: 2, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 5 }]
const meteorLocation: Point = { x: 6, y: 4 }
const startingPoint: Point = { x: 1, y: 5 }

const initialGame: GameState = { player: startingPoint, collected: [], won: false }

const steps: { id: Screen; label: string }[] = [
  { id: 'idea', label: 'Your idea' },
  { id: 'map', label: 'Design map' },
  { id: 'brief', label: 'Mission' },
  { id: 'build', label: 'Build' },
  { id: 'playtest', label: 'Playtest' },
  { id: 'debug', label: 'Detective' },
  { id: 'next', label: 'Next round' },
]

const screenIndex = (screen: Screen) => steps.findIndex((step) => step.id === screen)

function App() {
  const [screen, setScreen] = useState<Screen>('idea')
  const [idea, setIdea] = useState(demoIdea)
  const [goalCount, setGoalCount] = useState(3)
  const [ruleChoice, setRuleChoice] = useState<RuleChoice>('lose-star')
  const [customRule, setCustomRule] = useState('')
  const [prediction, setPrediction] = useState('')
  const [predictionSkipped, setPredictionSkipped] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [editReason, setEditReason] = useState('')
  const [debugStep, setDebugStep] = useState<DebugStep>('observe')
  const [hypothesis, setHypothesis] = useState('collision')
  const [testDone, setTestDone] = useState(false)
  const [fixed, setFixed] = useState(false)
  const [game, setGame] = useState<GameState>(initialGame)
  const [gameMessage, setGameMessage] = useState('Use the arrow keys or the controls to collect 3 stars.')
  const [toast, setToast] = useState('')

  const activeStep = screenIndex(screen)

  const elementStatuses = useMemo(() => {
    const mapOpen = screenIndex(screen) >= screenIndex('map')
    const confirmed = screenIndex(screen) > screenIndex('map')
    const built = screenIndex(screen) >= screenIndex('playtest')
    const tested = screen === 'next'
    const result: Record<MapElementId, 'ready' | 'active' | 'confirmed' | 'built' | 'tested' | 'later'> = {
      players: mapOpen ? 'confirmed' : 'ready',
      objectives: mapOpen ? (tested ? 'tested' : built ? 'built' : 'confirmed') : 'ready',
      procedures: mapOpen ? (tested ? 'tested' : built ? 'built' : 'confirmed') : 'ready',
      rules: screen === 'map' ? 'active' : confirmed ? (tested ? 'tested' : built ? 'built' : 'confirmed') : 'ready',
      resources: 'later',
      conflict: 'ready',
      boundaries: 'later',
      outcome: mapOpen ? (tested ? 'tested' : built ? 'built' : 'confirmed') : 'ready',
    }
    return result
  }, [screen])

  const mapProgressCount = Object.values(elementStatuses).filter((status) => ['confirmed', 'built', 'tested'].includes(status)).length

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const startMap = () => {
    if (!idea.trim()) {
      showToast('Write down the game you want to make first.')
      return
    }
    setEvaluation(null)
    setScreen('map')
    if (idea.trim() !== demoIdea) showToast('This demo path uses the space-cat example. Your idea is saved here; AI idea analysis will come in a later version.')
  }

  const confirmRule = () => setScreen('brief')

  const beginBuild = () => {
    setPredictionSkipped(false)
    setGame(initialGame)
    setGameMessage(`Use the arrow keys or the controls to collect ${goalCount} ${goalCount === 1 ? 'star' : 'stars'}.`)
    setScreen('build')
  }

  const movePlayer = (dx: number, dy: number) => {
    if (game.won) return
    const next = {
      x: Math.max(0, Math.min(gameSize.columns - 1, game.player.x + dx)),
      y: Math.max(0, Math.min(gameSize.rows - 1, game.player.y + dy)),
    }
    const hitMeteor = next.x === meteorLocation.x && next.y === meteorLocation.y

    if (hitMeteor) {
      if (ruleChoice === 'lose-star') {
        const collected = game.collected.slice(0, -1)
        setGame({ ...game, player: next, collected })
        setGameMessage(game.collected.length ? 'Meteor hit! You lost 1 star.' : 'Meteor hit! There were no stars to lose.')
      } else if (ruleChoice === 'restart') {
        setGame({ ...game, player: startingPoint })
        setGameMessage('Meteor hit! Back to the starting point.')
      } else if (ruleChoice === 'custom') {
        setGame({ ...game, player: next })
        setGameMessage('Meteor hit! The custom rule is on your map; this demo treats it as no penalty.')
      } else {
        setGame({ ...game, player: next })
        setGameMessage('Meteor hit! Your rule says there is no penalty.')
      }
      return
    }

    const activeStars = starLocations.slice(0, goalCount)
    const starIndex = activeStars.findIndex((star, index) => star.x === next.x && star.y === next.y && !game.collected.includes(index))
    if (starIndex >= 0) {
      const collected = [...game.collected, starIndex]
      const won = collected.length >= goalCount
      setGame({ player: next, collected, won })
      setGameMessage(won ? `You reached your goal: ${goalCount} ${goalCount === 1 ? 'star' : 'stars'}. Mission complete!` : `Star collected! ${collected.length} of ${goalCount} stars.`)
      return
    }

    setGame({ ...game, player: next })
    setGameMessage(`Keep going. Collect ${goalCount} stars to win!`)
  }

  const resetPlaytestGame = () => {
    setGame(initialGame)
    setGameMessage(`Game reset. Collect ${goalCount} ${goalCount === 1 ? 'star' : 'stars'} to win.`)
  }

  useEffect(() => {
    if (screen !== 'playtest') return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      const directions: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      }
      const direction = directions[event.key]
      if (!direction) return
      event.preventDefault()
      movePlayer(direction.x, direction.y)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [screen, game, ruleChoice, customRule, goalCount])

  const handleEvaluation = (choice: Evaluation) => {
    setEvaluation(choice)
    if (choice === 'works') {
      setScreen('next')
      return
    }
    if (choice === 'broken') {
      setDebugStep('observe')
      setTestDone(false)
      setFixed(false)
      setScreen('debug')
      return
    }
    setEditReason(choice === 'different' ? 'Something different happened during the playtest, and I like it.' : 'I want to try a different design direction.')
    setScreen('map')
  }

  const resetDemo = () => {
    setScreen('idea')
    setIdea(demoIdea)
    setGoalCount(3)
    setRuleChoice('lose-star')
    setCustomRule('')
    setPrediction('')
    setPredictionSkipped(false)
    setEvaluation(null)
    setEditReason('')
    setDebugStep('observe')
    setHypothesis('collision')
    setTestDone(false)
    setFixed(false)
    setGame(initialGame)
    setGameMessage(`Use the arrow keys or the controls to collect ${goalCount} ${goalCount === 1 ? 'star' : 'stars'}.`)
    showToast('The demo has restarted.')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={resetDemo} aria-label="Restart the demo">
          <span className="brand-mark">✦</span>
          <span>Little Makers</span>
        </button>
        <div className="prototype-badge"><span className="pulse-dot" /> Prototype Demo</div>
        <button className="reset-button" type="button" onClick={resetDemo}>Start over <span aria-hidden="true">↺</span></button>
      </header>

      <div className="workspace">
        <aside className="rail" aria-label="Creative journey">
          <div className="rail-caption">Your creative journey</div>
          <ol className="journey-list">
            {steps.map((step, index) => {
              const state = index < activeStep ? 'done' : index === activeStep ? 'active' : 'upcoming'
              return (
                <li className={`journey-step ${state}`} key={step.id}>
                  <span className="journey-marker">{index < activeStep ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  <span>{step.label}</span>
                </li>
              )
            })}
          </ol>
          <div className="rail-note">
            <span className="note-orbit">✳</span>
            <p>Decide what you want to make, then let AI lend a hand.</p>
          </div>
        </aside>

        <main className="main-area">
          <div className="content-wrap">
            <div className="mobile-progress"><span style={{ width: `${Math.max(12, ((activeStep + 1) / steps.length) * 100)}%` }} /></div>
            {screen === 'idea' && (
              <section className="screen screen-idea" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Open creation · Stop 1</div>
                <h1 id="page-title">The game in your head<br /><span>starts with one idea.</span></h1>
                <p className="lead">You can start by saying what you want to make. Together, we’ll find one small goal you can play soon.</p>
                <div className="idea-card">
                  <div className="field-label"><span className="sparkle">✦</span> Your game idea</div>
                  <textarea
                    value={idea}
                    onChange={(event) => setIdea(event.target.value)}
                    maxLength={500}
                    placeholder="For example: I want to make an adventure game about a flying cat…"
                    aria-label="Describe the game you want to make"
                  />
                  <div className="idea-card-footer"><span>Write down the scene or game action you want to see most</span><span>{idea.length}/500</span></div>
                </div>
                <div className="idea-actions">
                  <button className="button button-primary" type="button" onClick={startMap}>Turn my idea into a map <span>→</span></button>
                  <span className="soft-hint"><span className="lock-icon">✦</span> Your idea, your choice</span>
                </div>
                <div className="idea-bottom"><span className="tiny-star">✦</span> This is a prototype experience. The current demo uses the space-cat example.</div>
              </section>
            )}

            {screen === 'map' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 2 · Design map</div>
                <div className="title-row"><div><h1 id="page-title">Give your idea<br /><span>a game plan.</span></h1><p className="lead">The map helps us see the parts of a game. Today, let’s light up the most important ones.</p></div><div className="map-count"><strong>{mapProgressCount}</strong><span> / 8 confirmed</span></div></div>
                {editReason && <div className="edit-banner"><span>↺</span><span><strong>Back to edit your design</strong>{editReason}</span><button type="button" onClick={() => setEditReason('')} aria-label="Close">×</button></div>}
                <div className="map-grid">
                  {mapElements.map((element) => {
                    const status = elementStatuses[element.id]
                    const isActive = element.id === 'rules'
                    return (
                      <article className={`map-card ${status} ${isActive ? 'map-card-focus' : ''}`} key={element.id}>
                        <div className="map-card-top"><span className="map-icon">{element.icon}</span><span className={`map-status ${status}`}>{statusLabel(status)}</span></div>
                        <h2>{element.title}</h2>
                        <p>{element.description}</p>
                        {element.id === 'objectives' && <div className="goal-sticker-group" role="group" aria-label="Choose the number of stars needed to win"><span>Collect</span>{[1, 2, 3].map((count) => <button key={count} type="button" aria-pressed={goalCount === count} className={`goal-sticker ${goalCount === count ? 'selected' : ''}`} onClick={() => { setGoalCount(count); setGame(initialGame); setGameMessage(`Goal updated. Collect ${count} ${count === 1 ? 'star' : 'stars'} to win.`) }}>{count}</button>)}<span>{goalCount === 1 ? 'star to win' : 'stars to win'}</span></div>}
                        {element.id === 'procedures' && <div className="sticker-line">Move with arrow keys</div>}
                        {element.id === 'players' && <div className="sticker-line">Space cat · 1 player</div>}
                        {element.id === 'rules' && <div className="sticker-line selected">{ruleLabel(ruleChoice, customRule)}</div>}
                        {element.id === 'conflict' && <div className="sticker-line">Stars / meteors</div>}
                      </article>
                    )
                  })}
                </div>
                <div className="question-card">
                  <div className="question-avatar">✦</div>
                  <div className="question-body">
                    <div className="question-overline">AI Sidekick · Let’s choose one key rule</div>
                    <h2>{demoQuestion}</h2>
                    <div className="choice-row">
                      {ruleOptions.map((option) => <button key={option.id} type="button" className={`choice-chip ${ruleChoice === option.id ? 'selected' : ''}`} onClick={() => setRuleChoice(option.id)}>{option.label}</button>)}
                    </div>
                    {ruleChoice === 'custom' && <input className="custom-rule" value={customRule} onChange={(event) => setCustomRule(event.target.value)} placeholder="Write your rule" aria-label="Create a custom meteor rule" />}
                  </div>
                  <div className="question-skill"><span>Practicing</span><strong>Defining rules</strong></div>
                </div>
                <div className="screen-actions"><button className="button button-quiet" type="button" onClick={() => setScreen('idea')}>← Back to idea</button><button className="button button-primary" type="button" onClick={confirmRule}>Confirm map <span>→</span></button></div>
              </section>
            )}

            {screen === 'brief' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 3 · This round’s mission</div>
                <h1 id="page-title">Start with a small version<br /><span>you can play.</span></h1>
                <p className="lead">Big ideas can grow over time. This round, we’ll build just the game’s core loop.</p>
                <div className="mission-card">
                  <div className="mission-top"><span className="mission-icon">🚀</span><div><span className="mini-label">Mission card</span><h2>Space Cat’s Star Quest</h2></div><span className="scope-pill">Small goal set</span></div>
                  <div className="mission-loop"><div><span className="loop-number">01</span><strong>Move the space cat</strong><small>Use the arrow keys</small></div><span className="loop-arrow">→</span><div><span className="loop-number">02</span><strong>Collect stars</strong><small>Touch a star to score</small></div><span className="loop-arrow">→</span><div><span className="loop-number">03</span><strong>Reach the goal</strong><small>Collect {goalCount} {goalCount === 1 ? 'star' : 'stars'} to win</small></div></div>
                  <div className="mission-rule"><span>✳</span><div><strong>When the cat touches a meteor</strong><p>{ruleLabel(ruleChoice, customRule)}</p></div><button type="button" onClick={() => setScreen('map')}>Edit</button></div>
                </div>
                <div className="scope-note"><span className="scope-check">✓</span><span><strong>This round will build:</strong> a movable character, star scoring, a meteor rule, and a win message.</span></div>
                <div className="screen-actions"><button className="button button-quiet" type="button" onClick={() => setScreen('map')}>← Back to map</button><button className="button button-primary" type="button" onClick={beginBuild}>Confirm and build <span>→</span></button></div>
              </section>
            )}

            {screen === 'build' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 4 · Build and predict</div>
                <h1 id="page-title">Building<br /><span>your space mission.</span></h1>
                <p className="lead">Think about what you expect to happen. You can check it during the playtest.</p>
                <div className="build-layout">
                  <div className="build-card">
                    <div className="build-orbit"><span className="orbit-star">✦</span><span className="orbit-planet">🐱‍🚀</span><span className="orbit-meteor">☄</span></div>
                    <div className="build-progress-copy"><span className="status-live"><i /> Demo build in progress</span><strong>Turning your confirmed rules<br />into a version you can play</strong><span>Character · Star scoring · Collision rules · Win message</span></div>
                    <div className="build-progress"><span /></div><div className="build-progress-label"><span>Mission confirmed</span><span>Demo flow</span></div>
                  </div>
                  <div className="prediction-card">
                    <div className="prediction-label"><span>🔮</span> Make a prediction</div>
                    <h2>What do you think will happen when the space cat touches a star?</h2>
                    <div className="prediction-options">
                      {['The score goes up by 1', 'The cat gets bigger', 'Nothing happens'].map((answer) => <button type="button" key={answer} className={`prediction-option ${prediction === answer ? 'selected' : ''}`} onClick={() => { setPrediction(answer); setPredictionSkipped(false) }}><span className="radio-dot" />{answer}</button>)}
                    </div>
                    <button className="text-button" type="button" onClick={() => { setPredictionSkipped(true); setPrediction('') }}>Skip this prediction</button>
                  </div>
                </div>
                <div className="prediction-reflection">{predictionSkipped ? 'Prediction skipped. You can still watch what happens during the playtest.' : prediction ? `Your guess: ${prediction}. See how it compares after the playtest.` : 'This is not a test. It’s a chance to share what you think.'}</div>
                <div className="screen-actions"><button className="button button-quiet" type="button" onClick={() => setScreen('brief')}>← Back to mission</button><button className="button button-primary" type="button" onClick={() => setScreen('playtest')}>Playtest <span>→</span></button></div>
              </section>
            )}

            {screen === 'playtest' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 5 · Playtest and review</div>
                <div className="title-row play-title"><div><h1 id="page-title">Give it a try.<br /><span>Does it work as you planned?</span></h1><p className="lead">Move the space cat, collect stars, and test the meteor rule you chose on your map.</p></div><span className="preview-tag"><i /> Playable demo</span></div>
                <div className="game-preview">
                  <div className="game-topline"><span><i className="green-dot" /> Space Cat’s Star Quest</span><div className="game-hud"><span className="score-pill">⭐ <strong>{game.collected.length}</strong> / {goalCount}</span><button className="game-reset" type="button" onClick={resetPlaytestGame}>Reset game</button></div></div>
                  <div className="game-field" aria-label="Space Cat game board">
                    <div className="field-grid" />
                    {starLocations.slice(0, goalCount).map((star, index) => !game.collected.includes(index) && <span className="field-star" key={index} style={{ left: `${((star.x + 0.5) / gameSize.columns) * 100}%`, top: `${((star.y + 0.5) / gameSize.rows) * 100}%` }} aria-label="Star">✦</span>)}
                    <span className="field-meteor" style={{ left: `${((meteorLocation.x + 0.5) / gameSize.columns) * 100}%`, top: `${((meteorLocation.y + 0.5) / gameSize.rows) * 100}%` }} aria-label="Meteor">☄</span>
                    <span className="field-cat" style={{ left: `${((game.player.x + 0.5) / gameSize.columns) * 100}%`, top: `${((game.player.y + 0.5) / gameSize.rows) * 100}%` }} aria-label="Space cat">🐱‍🚀</span>
                    <div className="field-caption">Collect {goalCount} {goalCount === 1 ? 'star' : 'stars'} and avoid the meteor</div>
                  </div>
                  <div className="game-controls">
                    <div className="direction-pad" aria-label="Movement controls">
                      <button type="button" aria-label="Move up" onClick={() => movePlayer(0, -1)}>↑</button>
                      <div><button type="button" aria-label="Move left" onClick={() => movePlayer(-1, 0)}>←</button><button type="button" aria-label="Move down" onClick={() => movePlayer(0, 1)}>↓</button><button type="button" aria-label="Move right" onClick={() => movePlayer(1, 0)}>→</button></div>
                    </div>
                    <span className="game-message" role="status">{gameMessage}</span>
                  </div>
                </div>
                <div className="evaluate-heading"><div><span className="mini-label">After you play</span><h2>How did it go?</h2></div><span className="evaluate-skill">Practice: compare your guess with the result</span></div>
                <div className="evaluation-grid">
                  <button className="evaluation-card good" type="button" onClick={() => handleEvaluation('works')}><span className="eval-emoji">🎉</span><strong>As expected</strong><small>It worked the way I wanted</small></button>
                  <button className="evaluation-card curious" type="button" onClick={() => handleEvaluation('different')}><span className="eval-emoji">✨</span><strong>Different, but I like it</strong><small>I want to keep this new idea</small></button>
                  <button className="evaluation-card problem" type="button" onClick={() => handleEvaluation('broken')}><span className="eval-emoji">🕵️</span><strong>It didn’t work</strong><small>I want to find out why</small></button>
                  <button className="evaluation-card rethink" type="button" onClick={() => handleEvaluation('changed')}><span className="eval-emoji">💭</span><strong>I changed my mind</strong><small>I want to edit the design map</small></button>
                </div>
                <div className="prediction-result">Your prediction: <strong>{predictionSkipped ? 'Skipped this time' : prediction || 'No choice yet'}</strong><span>·</span>Watch how the score changes during the playtest.</div>
                <div className="screen-actions"><button className="button button-quiet" type="button" onClick={() => setScreen('build')}>← Back to build</button><button className="button button-quiet" type="button" onClick={() => setScreen('map')}>View design map</button></div>
              </section>
            )}

            {screen === 'debug' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 6 · Debugging detective</div>
                <h1 id="page-title">Detective, let’s go.<br /><span>Look for clues.</span></h1>
                <p className="lead">First, observe what happened. Then use a small test to check your guess.</p>
                <div className="detective-steps">
                  {(['observe', 'guess', 'test', 'repair', 'retest'] as DebugStep[]).map((step, index) => <div className={`detective-step ${debugStep === step ? 'current' : isStepDone(debugStep, step) ? 'done' : ''}`} key={step}><span>{isStepDone(debugStep, step) ? '✓' : index + 1}</span><small>{['Observe', 'Make a guess', 'Test it', 'Fix it', 'Test again'][index]}</small></div>)}
                </div>
                <div className="detective-card">
                  {debugStep === 'observe' && <><div className="clue-stamp">Clue 01</div><h2>The cat touched a star, but the score did not go up.</h2><p>What you saw does not match the rule “touch a star to score.” That’s our clue to investigate.</p><div className="observation-strip"><span>Expected</span><strong>⭐ +1 point</strong><span className="strip-arrow">→</span><span>Actual</span><strong>⭐ 0 points</strong></div><button className="button button-primary" type="button" onClick={() => setDebugStep('guess')}>I see it. Let’s find the cause <span>→</span></button></>}
                  {debugStep === 'guess' && <><div className="clue-stamp">Make a guess</div><h2>What do you think might have gone wrong?</h2><p>Choose the reason that seems most likely. It’s okay if it’s wrong—we’ll use a test to check.</p><div className="hypothesis-list">{[{ id: 'collision', text: 'The game did not notice when the star and cat touched.', icon: '💥' }, { id: 'score', text: 'The game noticed the touch, but the scoring rule did not run.', icon: '🔢' }, { id: 'goal', text: 'The goal was accidentally set to collect 0 stars.', icon: '🎯' }].map((item) => <button type="button" key={item.id} className={`hypothesis-option ${hypothesis === item.id ? 'selected' : ''}`} onClick={() => setHypothesis(item.id)}><span>{item.icon}</span><strong>{item.text}</strong><i>{hypothesis === item.id ? '✓' : ''}</i></button>)}</div><button className="button button-primary" type="button" onClick={() => { setTestDone(false); setDebugStep('test') }}>Check with a small test <span>→</span></button></>}
                  {debugStep === 'test' && <><div className="clue-stamp">Run a small test</div><h2>Test just one thing: the cat touches one star.</h2><p>Keep the other rules the same and watch the score. This makes it easier to check your guess.</p><div className="test-card"><span className="test-icon">🧪</span><div><strong>Test setup</strong><small>Touch 1 star · Watch the score</small></div><button type="button" className="button button-small" onClick={() => setTestDone(true)}>{testDone ? 'Test complete ✓' : 'Run test'}</button></div>{testDone && <div className="test-result"><span>Result</span><strong>The touch was detected, but the scoring rule did not run.</strong><small>{hypothesis === 'collision' ? 'This rules out “the touch was not detected.” Next, check the scoring rule.' : hypothesis === 'score' ? 'This supports your guess: the scoring rule did not run.' : 'The goal count is set correctly. Next, check the scoring rule.'}</small></div>}<button className="button button-primary" type="button" disabled={!testDone} onClick={() => setDebugStep('repair')}>See the test result <span>→</span></button></>}
                  {debugStep === 'repair' && <><div className="clue-stamp">Try a fix</div><h2>Connect “touch a star” to “score +1.”</h2><p>You chose a small change. We’ll leave the other game rules as they are.</p><div className="rule-connection"><span>Touch a star</span><b>→</b><span className="rule-result">Score +1</span></div><button className="button button-primary" type="button" onClick={() => { setFixed(true); setDebugStep('retest') }}>Apply this fix <span>→</span></button></>}
                  {debugStep === 'retest' && <><div className="clue-stamp success">Retest result</div><h2>{fixed ? 'Star collected!' : 'Ready to test it again?'}</h2><p>Try the same setup again and see whether the change fixed the problem.</p><div className="retest-result"><span>🐱‍🚀</span><b>Touch a star</b><i>→</i><strong>⭐ Score +1</strong><em>Pass</em></div><div className="lesson-note"><span>🧠</span><span>You described what happened, made a guess, then found the problem with a test and a retest.</span></div><button className="button button-primary" type="button" onClick={() => setScreen('next')}>Continue with your discovery <span>→</span></button></>}
                </div>
                <div className="screen-actions"><button className="button button-quiet" type="button" onClick={() => setScreen('playtest')}>← Back to playtest</button><span className="debug-context">AI offers clues. You decide what to test and change.</span></div>
              </section>
            )}

            {screen === 'next' && (
              <section className="screen" aria-labelledby="page-title">
                <div className="eyebrow"><span className="eyebrow-icon">✧</span> Stop 7 · Your next round</div>
                <div className="celebration-mark">✦</div>
                <h1 id="page-title">Space mission,<br /><span>first version complete!</span></h1>
                <p className="lead">You turned an idea into game rules you can try, and learned how to look for clues.</p>
                {evaluation === 'works' && <div className="success-summary"><span>🌟</span><div><strong>This round passed your review</strong><p>You checked the game against your goal and confirmed that the core play worked as expected.</p></div><span className="done-pill">Done</span></div>}
                {fixed && <div className="success-summary"><span>🕵️</span><div><strong>The bug was found and retested</strong><p>The touch was detected. You fixed the scoring rule and confirmed that the score goes up by 1.</p></div><span className="done-pill">Fixed</span></div>}
                <div className="next-heading"><div><span className="mini-label">More possibilities on your map</span><h2>What would you like to do next?</h2></div><span className="not-required">Choose one or add your own idea</span></div>
                <div className="next-grid">{nextIdeas.map((item, index) => <button key={item.title} className="next-card" type="button" onClick={() => { setEditReason(`Next-round idea: ${item.title}`); setScreen('map'); showToast('This idea has been added to your design map.') }}><span className="next-card-number">0{index + 1}</span><span className="next-card-icon">{item.icon}</span><strong>{item.title}</strong><small>{item.description}</small><span className="next-card-arrow">↗</span></button>)}<button className="next-card own-idea" type="button" onClick={() => { setIdea('I want to add this to Space Cat:'); setScreen('idea') }}><span className="next-card-number">✦</span><span className="next-card-icon">💡</span><strong>My new idea</strong><small>You choose what to make next</small><span className="next-card-arrow">↗</span></button></div>
                <div className="reflection-strip"><span>✧</span><p><strong>You practiced:</strong> setting a goal, making rules, predicting, reviewing, and debugging.</p><button type="button" onClick={resetDemo}>Try it again →</button></div>
              </section>
            )}
          </div>
          <footer className="page-footer"><span>Little Makers <i>·</i> Turn curiosity into creations</span><span>Prototype experience · Sample flow</span></footer>
        </main>

        <aside className="mentor-rail">
          <div className="mentor-card">
            <div className="mentor-card-header"><span className="mentor-avatar">✦</span><div><strong>AI Sidekick</strong><small><i /> Here to think with you</small></div></div>
            <div className="mentor-speech">{mentorCopy(screen, evaluation, debugStep)}</div>
            <div className="mentor-footer"><span>Your idea, your choice</span><span>✧</span></div>
          </div>
          <div className="skill-card"><span className="skill-card-label">Engineering thinking at this stop</span><strong>{skillFor(screen, debugStep)}</strong><p>{skillDescription(screen, debugStep)}</p><div className="skill-progress"><span style={{ width: `${Math.max(12, ((activeStep + 1) / steps.length) * 100)}%` }} /></div><small>Creative journey {activeStep + 1} / {steps.length}</small></div>
          <button className="help-link" type="button" onClick={() => showToast('This prototype uses a fixed example and does not save personal information.')}>ⓘ About this prototype</button>
        </aside>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function statusLabel(status: 'ready' | 'active' | 'confirmed' | 'built' | 'tested' | 'later') {
  return { ready: 'On the map', active: 'Choosing now', confirmed: 'Confirmed', built: 'Built', tested: 'Playtested', later: 'Explore later' }[status]
}

function ruleLabel(choice: RuleChoice, custom: string) {
  if (choice === 'lose-star') return 'Touch a meteor and lose 1 star'
  if (choice === 'restart') return 'Touch a meteor and return to start'
  if (choice === 'nothing') return 'Touch a meteor with no penalty'
  return custom.trim() || 'I’ll design the collision rule'
}

function isStepDone(current: DebugStep, step: DebugStep) {
  const order: DebugStep[] = ['observe', 'guess', 'test', 'repair', 'retest']
  return order.indexOf(current) > order.indexOf(step)
}

function mentorCopy(screen: Screen, evaluation: Evaluation | null, debugStep: DebugStep) {
  if (screen === 'idea') return 'A good idea does not need to be complete at the start. Tell me what game you most want to make.'
  if (screen === 'map') return 'Let’s map the core gameplay first. The other parts will stay here for you to add later.'
  if (screen === 'brief') return 'Break the big idea into one small round, and you’ll be able to try it soon.'
  if (screen === 'build') return 'I’ll use the mission you confirmed. Make a prediction, and we’ll check it during the playtest.'
  if (screen === 'playtest') return 'Watch what actually happens. A different result is not always a mistake.'
  if (screen === 'debug') return debugStep === 'observe' ? 'Describe what you saw first. We do not need to change any code yet.' : debugStep === 'guess' ? 'A guess helps us find a cause we can check. You do not have to get it right on the first try.' : 'Change one thing, then test again with the same setup.'
  if (screen === 'next') return evaluation === 'works' ? 'Great work! You checked that the game met its goal. Now you can choose what to add next.' : 'You used observations and tests to fix a rule. You choose what comes next.'
  return 'You choose what comes next.'
}

function skillFor(screen: Screen, debugStep: DebugStep) {
  if (screen === 'idea') return 'Define the problem'
  if (screen === 'map') return 'Turn ideas into rules'
  if (screen === 'brief') return 'Limit this round’s scope'
  if (screen === 'build') return 'Predict system behavior'
  if (screen === 'playtest') return 'Review against a goal'
  if (screen === 'debug') return debugStep === 'observe' ? 'Describe what happened' : debugStep === 'guess' ? 'Make a hypothesis' : debugStep === 'test' ? 'Design a small test' : debugStep === 'repair' ? 'Limit the change' : 'Retest to verify'
  return 'Reflect and iterate'
}

function skillDescription(screen: Screen, debugStep: DebugStep) {
  if (screen === 'idea') return 'Describing the scene in your head is the first step in starting a project.'
  if (screen === 'map') return 'State the goal, actions, and rules so the game knows how to work.'
  if (screen === 'brief') return 'Finish one small loop first, then grow the game with more ideas.'
  if (screen === 'build') return 'Predicting the result helps you play with a purpose.'
  if (screen === 'playtest') return 'Compare what happened with the goal you set.'
  if (screen === 'debug') return debugStep === 'observe' ? 'Separate “what I saw” from “what I think caused it.”' : debugStep === 'guess' ? 'There may be several causes. Start with one you can check.' : debugStep === 'test' ? 'Change one condition at a time to make the cause easier to find.' : debugStep === 'repair' ? 'A small change helps protect the parts that already work.' : 'Try the same setup again to confirm that the fix worked.'
  return 'Use what you saw during the playtest to decide what to keep and improve.'
}

export default App
