import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import './App.css'

/* Import images and sounds */
const correctImages = import.meta.glob('./assets/images/correct/*.{jpg,jpeg,png}', { eager: true, as: 'url' })
const wrongImages = import.meta.glob('./assets/images/wrong/*.{jpg,jpeg,png}', { eager: true, as: 'url' })
const correctSounds = import.meta.glob('./assets/sounds/correct/*.{mp3,wav}', { eager: true, as: 'url' })
const wrongSounds = import.meta.glob('./assets/sounds/wrong/*.{mp3,wav}', { eager: true, as: 'url' })

const correctImageUrls = Object.values(correctImages).filter(Boolean)
const wrongImageUrls = Object.values(wrongImages).filter(Boolean)
const correctSoundUrls = Object.values(correctSounds).filter(Boolean)
const wrongSoundUrls = Object.values(wrongSounds).filter(Boolean)

/* Part 1 note images */
const part1Images = import.meta.glob('./assets/images/part-1/*.png', { eager: true, as: 'url' })
const part1ImgUrls = Object.fromEntries(
  Object.entries(part1Images).map(([path, url]) => {
    const name = path.split('/').pop().replace('.png', '').toLowerCase().replace(/\s+/g, '-')
    return [name, url]
  })
)
const part1Img = (name) => part1ImgUrls[name] || part1ImgUrls[name.replace(/\s+/g, '-')] || null

/* Hand-drawn wavy border path (organic squiggly rectangle, viewBox 0 0 100 130) */
const NOTE_BORDER_PATH = 'M 6,6 Q 14,3 23,7 Q 32,4 41,8 Q 50,3 59,7 Q 68,4 77,7 Q 86,3 94,6 Q 98,16 95,30 Q 97,44 94,58 Q 98,72 95,86 Q 97,100 94,114 Q 98,124 95,124 Q 85,127 76,123 Q 67,126 58,124 Q 49,127 40,124 Q 31,127 22,124 Q 13,126 6,124 Q 3,110 6,94 Q 2,78 6,62 Q 3,46 6,30 Q 2,14 6,6 Z'

/* Decorative bow at top center (double-line style, same viewBox) */
const NOTE_BOW_PATH = 'M 50,6.5 Q 34,1 50,6.5 M 50,6.5 Q 66,1 50,6.5 M 34,1 Q 32,5 34,8 M 66,1 Q 68,5 66,8'

const strokeProps = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.15', strokeLinejoin: 'round', strokeLinecap: 'round' }

function NoteBorder({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true">
      <path d={NOTE_BORDER_PATH} {...strokeProps} />
      <g transform="translate(50,65) scale(0.965) translate(-50,-65)">
        <path d={NOTE_BORDER_PATH} {...strokeProps} />
      </g>
      <path d={NOTE_BOW_PATH} {...strokeProps} strokeWidth="1.05" />
    </svg>
  )
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function Notification({ type, onClose }) {
  const [imageUrl, setImageUrl] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (type === 'correct') {
      // Get random image and sound from correct folders
      const image = correctImageUrls.length > 0 ? getRandomItem(correctImageUrls) : null
      const sound = correctSoundUrls.length > 0 ? getRandomItem(correctSoundUrls) : null
      
      setImageUrl(image)
      
      if (sound && audioRef.current) {
        audioRef.current.src = sound
        audioRef.current.play().catch(e => console.warn('Audio play failed:', e))
        
        // Wait for sound to finish before closing
        const handleEnded = () => {
          onClose()
        }
        
        audioRef.current.addEventListener('ended', handleEnded)
        
        // Fallback: close after 5 seconds if sound doesn't end (in case of issues)
        const fallbackTimer = setTimeout(() => {
          onClose()
        }, 5000)
        
        return () => {
          audioRef.current?.removeEventListener('ended', handleEnded)
          clearTimeout(fallbackTimer)
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
          }
        }
      } else {
        // No sound, close after 2 seconds
        const timer = setTimeout(() => {
          onClose()
        }, 2000)
        
        return () => {
          clearTimeout(timer)
        }
      }
    } else if (type === 'wrong') {
      // Get random image and sound from wrong folders
      const image = wrongImageUrls.length > 0 ? getRandomItem(wrongImageUrls) : null
      const sound = wrongSoundUrls.length > 0 ? getRandomItem(wrongSoundUrls) : null
      
      setImageUrl(image)
      
      if (sound && audioRef.current) {
        audioRef.current.src = sound
        audioRef.current.play().catch(e => console.warn('Audio play failed:', e))
        
        // Wait for sound to finish before closing
        const handleEnded = () => {
          onClose()
        }
        
        audioRef.current.addEventListener('ended', handleEnded)
        
        // Fallback: close after 5 seconds if sound doesn't end (in case of issues)
        const fallbackTimer = setTimeout(() => {
          onClose()
        }, 5000)
        
        return () => {
          audioRef.current?.removeEventListener('ended', handleEnded)
          clearTimeout(fallbackTimer)
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
          }
        }
      } else {
        // No sound, close after 2 seconds
        const timer = setTimeout(() => {
          onClose()
        }, 2000)
        
        return () => {
          clearTimeout(timer)
        }
      }
    }
  }, [type, onClose])

  return (
    <div className={`notification notification--${type}`}>
      <audio ref={audioRef} preload="auto" />
      <div className="notification__content">
        <p className="notification__text">
          {type === 'correct' ? 'You found a word!' : 'Try again'}
        </p>
        {imageUrl && (
          <img src={imageUrl} alt="" className="notification__image" />
        )}
      </div>
    </div>
  )
}

/* Word search: words and placements [word, row, col, dRow, dCol] */
const WORD_SEARCH_LIST = ['BAKING', 'STICKERS', 'BURGER', 'MATCHA', 'CHEESECAKE']
const WORD_PLACEMENTS = [
  ['BURGER', 0, 0, 0, 1],
  ['BAKING', 1, 2, 0, 1],
  ['STICKERS', 2, 0, 1, 0],
  ['MATCHA', 3, 1, 0, 1],
  ['CHEESECAKE', 0, 8, 1, 0],
]

function buildWordSearchGrid() {
  const R = 10, C = 10
  const grid = Array(R).fill(null).map(() => Array(C).fill(null))
  const RANDOM = 'AEIORSTLNCDUGPMKHBFVWXYZ'
  for (const [word, r, c, dr, dc] of WORD_PLACEMENTS) {
    for (let i = 0; i < word.length; i++) {
      grid[r + i * dr][c + i * dc] = word[i]
    }
  }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = RANDOM[Math.floor(Math.random() * RANDOM.length)]
      }
    }
  }
  return grid
}

function getLine(start, end) {
  const dr = end.r - start.r
  const dc = end.c - start.c
  let stepR = 0, stepC = 0, n = 0
  if (dr === 0 && dc === 0) return [start]
  if (dr === 0) { stepC = dc > 0 ? 1 : -1; n = Math.abs(dc) }
  else if (dc === 0) { stepR = dr > 0 ? 1 : -1; n = Math.abs(dr) }
  else if (Math.abs(dr) === Math.abs(dc)) {
    stepR = dr > 0 ? 1 : -1
    stepC = dc > 0 ? 1 : -1
    n = Math.abs(dr)
  } else {
    if (Math.abs(dr) >= Math.abs(dc)) { stepR = dr > 0 ? 1 : -1; n = Math.abs(dr) }
    else { stepC = dc > 0 ? 1 : -1; n = Math.abs(dc) }
  }
  const out = []
  for (let i = 0; i <= n; i++) {
    const r = start.r + i * stepR
    const c = start.c + i * stepC
    if (r >= 0 && r < 10 && c >= 0 && c < 10) out.push({ r, c })
  }
  return out
}

function WordSearch({ onComplete }) {
  const grid = useMemo(buildWordSearchGrid, [])
  const [foundWords, setFoundWords] = useState(() => new Set())
  const [startCell, setStartCell] = useState(null)
  const [endCell, setEndCell] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const [notification, setNotification] = useState(null)
  const startRef = useRef(null)
  const endRef = useRef(null)
  const gridEl = useRef(null)


  useEffect(() => { startRef.current = startCell; endRef.current = endCell }, [startCell, endCell])

  const getCellFromTarget = useCallback((target) => {
    const cell = target?.closest?.('.word-search-cell')
    if (!cell) return null
    const r = parseInt(cell.getAttribute('data-row'), 10)
    const c = parseInt(cell.getAttribute('data-col'), 10)
    if (Number.isNaN(r) || Number.isNaN(c)) return null
    return { r, c }
  }, [])

  const handleSelectionEnd = useCallback(() => {
    if (!selecting) return
    const start = startRef.current
    const end = endRef.current
    setSelecting(false)
    setStartCell(null)
    setEndCell(null)
    if (!start || !end) return
    const cells = getLine(start, end)
    const word = cells.map(({ r, c }) => grid[r][c]).join('')
    const rev = word.split('').reverse().join('')
    const match = WORD_SEARCH_LIST.find((w) => w === word || w === rev)
    if (match) {
      setFoundWords((prev) => {
        if (prev.has(match)) return prev
        const next = new Set(prev)
        next.add(match)
        // Show alert with random image and sound for found word
        setNotification('correct')
        if (next.size === WORD_SEARCH_LIST.length) {
          // Call onComplete after notification closes
          setTimeout(() => onComplete(), 2500)
        }
        return next
      })
    } else if (cells.length >= 3) {
      // Show wrong notification for incorrect selections (minimum 3 letters)
      setNotification('wrong')
    }
  }, [selecting, grid, onComplete, notification])

  useEffect(() => {
    if (!selecting) return
    const h = handleSelectionEnd
    window.addEventListener('mouseup', h)
    return () => window.removeEventListener('mouseup', h)
  }, [selecting, handleSelectionEnd])

  const onPointerDown = (e) => {
    // Don't allow selection when notification is active
    if (notification) return
    const cell = getCellFromTarget(e.target)
    if (!cell) return
    e.preventDefault?.()
    setStartCell(cell)
    setEndCell(cell)
    setSelecting(true)
  }

  const onPointerMove = (e) => {
    // Don't allow selection when notification is active
    if (notification || !selecting) return
    const cell = getCellFromTarget(e.target)
    if (cell) setEndCell(cell)
  }

  const onPointerUp = (e) => {
    // Don't allow selection when notification is active
    if (notification) {
      setSelecting(false)
      setStartCell(null)
      setEndCell(null)
      return
    }
    if (selecting) handleSelectionEnd()
  }

  const onTouchMove = (e) => {
    // Don't allow selection when notification is active
    if (notification || !selecting) return
    e.preventDefault()
    const t = e.touches?.[0]
    if (!t) return
    const cell = document.elementFromPoint(t.clientX, t.clientY)?.closest?.('.word-search-cell')
    if (!cell) return
    const r = parseInt(cell.getAttribute('data-row'), 10)
    const c = parseInt(cell.getAttribute('data-col'), 10)
    if (!Number.isNaN(r) && !Number.isNaN(c)) setEndCell({ r, c })
  }

  const selCells = useMemo(() => {
    if (!startCell || !endCell) return new Set()
    const line = getLine(startCell, endCell)
    return new Set(line.map(({ r, c }) => `${r},${c}`))
  }, [startCell, endCell])

  const foundCells = useMemo(() => {
    const set = new Set()
    for (const [word, r, c, dr, dc] of WORD_PLACEMENTS) {
      if (!foundWords.has(word)) continue
      for (let i = 0; i < word.length; i++) set.add(`${r + i * dr},${c + i * dc}`)
    }
    return set
  }, [foundWords])

  return (
    <>
      {notification && (
        <Notification type={notification} onClose={() => setNotification(null)} />
      )}
      <div className="word-search-card">
        <NoteBorder className="note__border word-search-card__border" />
        <p className="word-search-counter">Finish the game to unlock</p>
        <p className="word-search-progress">Word Find: {foundWords.size}/{WORD_SEARCH_LIST.length}</p>
        <div
          className={`word-search-grid${notification ? ' word-search-grid--disabled' : ''}`}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onTouchMove}
          onTouchEnd={onPointerUp}
          role="application"
          aria-label="Word search. Click and drag to select words."
          style={{ pointerEvents: notification ? 'none' : 'auto' }}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r},${c}`
              const selected = selCells.has(key)
              const found = foundCells.has(key)
              return (
                <div
                  key={key}
                  className={`word-search-cell${selected ? ' word-search-cell--selected' : ''}${found ? ' word-search-cell--found' : ''}`}
                  data-row={r}
                  data-col={c}
                >
                  {letter}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

/* Soft heart path – symmetrical, works well with blur */
const heartPath =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"

function Heart({ className, size }) {
  return (
    <svg
      className={`heart ${className}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d={heartPath} fill="currentColor" />
    </svg>
  )
}

function Envelope({ className, open, onClick, children, letter }) {
  return (
    <div className={`envelope-outer ${className}`}>
      {children && (
        <span className="envelope-label" aria-hidden="true">{children}</span>
      )}
      <div
        className={`envelope-inner${open ? ' envelope--open' : ''}`}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
        aria-label={open ? 'Close envelope' : 'Open envelope'}
      >
        <div className="envelope-mech">
          <div className="envelope-back" aria-hidden="true" />
          <div className="envelope-lid envelope-lid--one">
            <span className="envelope-seal" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28"><path d={heartPath} fill="#d85a78" /></svg>
            </span>
          </div>
          <div className="envelope-lid envelope-lid--two" />
          <div className="envelope-body" />
          <div className="envelope-letter">{letter ?? '❤'}</div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [tapped, setTapped] = useState(false)
  const [yesClicked, setYesClicked] = useState(false)
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(false)
  const [exited, setExited] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [wordSearchPassed, setWordSearchPassed] = useState(false)
  const [part1ContentUnlocked, setPart1ContentUnlocked] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [flippingBack, setFlippingBack] = useState(false)
  const tripleClickRef = useRef({ count: 0, lastTime: 0, envelopeKey: null })
  const wordSearchBackTapRef = useRef({ count: 0, lastTime: 0 })
  const part1BackTapRef = useRef({ count: 0, lastTime: 0 })
  const gateBackTapRef = useRef({ count: 0, lastTime: 0 })

  const handleWordSearchBackTap = (e) => {
    if (e.target.closest('.word-search-card')) return
    const now = Date.now()
    const r = wordSearchBackTapRef.current
    if (now - r.lastTime > 500) r.count = 0
    r.count += 1
    r.lastTime = now
    if (r.count >= 3) {
      r.count = 0
      goBack()
    }
  }

  const handlePart1BackTap = (e) => {
    if (e.target.closest('.note')) return
    const now = Date.now()
    const r = part1BackTapRef.current
    if (now - r.lastTime > 500) r.count = 0
    r.count += 1
    r.lastTime = now
    if (r.count >= 3) {
      r.count = 0
      handlePart1BackClick(e)
    }
  }

  const handleGateBackTap = (e) => {
    if (e.target.closest('.note')) return
    const now = Date.now()
    const r = gateBackTapRef.current
    if (now - r.lastTime > 500) r.count = 0
    r.count += 1
    r.lastTime = now
    if (r.count >= 3) {
      r.count = 0
      goBack()
    }
  }

  const handleOpenClick = (e) => {
    e.stopPropagation()
    setPart1ContentUnlocked(true)
    setFlipping(true)
    setTimeout(() => setFlipping(false), 700)
  }

  const handlePart1BackClick = (e) => {
    e.stopPropagation()
    setFlippingBack(true)
    setTimeout(() => {
      setPart1ContentUnlocked(false)
      setFlippingBack(false)
    }, 700)
  }

  const triggerExit = () => {
    setExiting(true)
    // Set exited immediately so content appears right away
    setExited(true)
    setTimeout(() => {
      setExiting(false)
    }, 500)
  }

  const handleEnvelopeClick = (envelopeKey, singleAction) => () => {
    const now = Date.now()
    const r = tripleClickRef.current
    if (r.envelopeKey === envelopeKey && now - r.lastTime < 400) {
      r.count++
      r.lastTime = now
      if (r.count >= 3) {
        r.count = 0
        r.lastTime = 0
        r.envelopeKey = null
        // Only Part 1 envelope unlocks the word search; Part 2 does nothing on triple-click
        if (envelopeKey === 1) {
          triggerExit()
        }
        return
      }
    } else {
      r.count = 1
      r.lastTime = now
      r.envelopeKey = envelopeKey
    }
    singleAction()
  }

  const handleScreenTap = () => {
    if (!tapped) setTapped(true)
  }

  const handleYesClick = (e) => {
    e.stopPropagation()
    setYesClicked(true)
  }

  const goBack = () => {
    setExited(false)
    setWordSearchPassed(false)
    setPart1ContentUnlocked(false)
  }

  return (
    <div className="homepage">
      <div className="hearts-bg" aria-hidden="true">
        <Heart className="heart--large" size={420} />
        <Heart className="heart--small heart--top-left" size={100} />
        <Heart className="heart--small heart--top-right" size={100} />
        <Heart className="heart--small heart--bottom-left" size={100} />
        <Heart className="heart--small heart--bottom-right" size={100} />
        <Heart className="heart--small heart--left-mid" size={80} />
        {/* Blurred floating hearts */}
        <Heart className="heart--float heart--float-1" size={70} />
        <Heart className="heart--float heart--float-2" size={55} />
        <Heart className="heart--float heart--float-3" size={90} />
        <Heart className="heart--float heart--float-4" size={45} />
        <Heart className="heart--float heart--float-5" size={65} />
        <Heart className="heart--float heart--float-6" size={50} />
        <Heart className="heart--float heart--float-7" size={60} />
        <Heart className="heart--float heart--float-8" size={40} />
      </div>

      <main
        className={`homepage__content${tapped ? ' homepage__content--step2' : ''}${yesClicked ? ' homepage__content--envelopes' : ''}`}
        onClick={handleScreenTap}
        onTouchEnd={handleScreenTap}
        role="button"
        tabIndex={0}
        aria-label={!tapped ? 'Tap to continue' : undefined}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !tapped) { e.preventDefault(); setTapped(true); } }}
      >
        <div className={`intro${tapped ? ' intro--step2' : ''}${yesClicked ? ' intro--envelopes' : ''}`}>
          {yesClicked ? (
            exited && wordSearchPassed && part1ContentUnlocked && flipping ? (
              <div className="back-page note-page-turn">
                <div className="note note-page-turn__under">
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__body">
                    <section className="note__col note__col--left">
                      <div className="note__top-section" aria-hidden="true" />
                      <div className="note__activities-block">
                        <h3 className="note__section-title">What are we gonna do?</h3>
                        <div className="note__activities-grid">
                        <div className="note__activity note__activity--c1-r1">
                          <span className="note__activity-icons">{part1ImgUrls['baking'] && <img src={part1ImgUrls['baking']} alt="" className="note__activity-icon" />}</span>
                          <span>Bake at IDIM</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r1">
                          <span>Mandatory photobooth!</span>
                          <span className="note__activity-icons">{part1ImgUrls['pb-strip'] && <img src={part1ImgUrls['pb-strip']} alt="" className="note__activity-icon" />}</span>
                        </div>
                        <div className="note__activity note__activity--c1-r2">
                          <span className="note__activity-icons note__activity-icons--overlap">
                            {part1ImgUrls['matcha'] && <img src={part1ImgUrls['matcha']} alt="" className="note__activity-icon" />}
                            {part1ImgUrls['cookies'] && <img src={part1ImgUrls['cookies']} alt="" className="note__activity-icon" />}
                          </span>
                          <span>Matcha Fest + twenty four bakeshop</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r2">
                          <span>Dinner at Grifoni&apos;s</span>
                          <span className="note__activity-icons">{part1ImgUrls['dinner'] && <img src={part1ImgUrls['dinner']} alt="" className="note__activity-icon" />}</span>
                        </div>
                      </div>
                      </div>
                    </section>
                    <svg className="note__divider" viewBox="0 0 20 200" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M 10 0 Q 4 25 10 50 Q 16 75 10 100 Q 4 125 10 150 Q 16 175 10 200" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <section className="note__col note__col--right">
                      <h3 className="note__section-title">What do we wear?</h3>
                      {part1ImgUrls['clothes'] && <img src={part1ImgUrls['clothes']} alt="" className="note__clothes-img" />}
                      <p className="note__comfy">anything comfy!</p>
                    </section>
                  </div>
                </div>
                <div className="note note--gate note--flip-out" aria-hidden="true">
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__gate-body">
                    <span className="note__gate-btn" style={{ pointerEvents: 'none' }}>Open</span>
                  </div>
                </div>
              </div>
            ) : exited && wordSearchPassed && part1ContentUnlocked && flippingBack ? (
              <div className="back-page note-page-turn">
                <div className="note note-page-turn__under">
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__gate-body">
                    <span className="note__gate-btn" style={{ pointerEvents: 'none' }}>Open</span>
                  </div>
                </div>
                <div className="note note--flip-out" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__body">
                    <section className="note__col note__col--left">
                      <div className="note__top-section" aria-hidden="true" />
                      <div className="note__activities-block">
                        <h3 className="note__section-title">What are we gonna do?</h3>
                        <div className="note__activities-grid">
                        <div className="note__activity note__activity--c1-r1">
                          <span className="note__activity-icons">{part1ImgUrls['baking'] && <img src={part1ImgUrls['baking']} alt="" className="note__activity-icon" />}</span>
                          <span>Bake at IDIM</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r1">
                          <span>Mandatory photobooth!</span>
                          <span className="note__activity-icons">{part1ImgUrls['pb-strip'] && <img src={part1ImgUrls['pb-strip']} alt="" className="note__activity-icon" />}</span>
                        </div>
                        <div className="note__activity note__activity--c1-r2">
                          <span className="note__activity-icons note__activity-icons--overlap">
                            {part1ImgUrls['matcha'] && <img src={part1ImgUrls['matcha']} alt="" className="note__activity-icon" />}
                            {part1ImgUrls['cookies'] && <img src={part1ImgUrls['cookies']} alt="" className="note__activity-icon" />}
                          </span>
                          <span>Matcha Fest + twenty four bakeshop</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r2">
                          <span>Dinner at Grifoni&apos;s</span>
                          <span className="note__activity-icons">{part1ImgUrls['dinner'] && <img src={part1ImgUrls['dinner']} alt="" className="note__activity-icon" />}</span>
                        </div>
                      </div>
                      </div>
                    </section>
                    <svg className="note__divider" viewBox="0 0 20 200" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M 10 0 Q 4 25 10 50 Q 16 75 10 100 Q 4 125 10 150 Q 16 175 10 200" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <section className="note__col note__col--right">
                      <h3 className="note__section-title">What do we wear?</h3>
                      {part1ImgUrls['clothes'] && <img src={part1ImgUrls['clothes']} alt="" className="note__clothes-img" />}
                      <p className="note__comfy">anything comfy!</p>
                    </section>
                  </div>
                </div>
              </div>
            ) : exited && wordSearchPassed && part1ContentUnlocked ? (
              <div className="back-page back-page--part1" onClick={handlePart1BackTap} role="button" tabIndex={0} aria-label="Triple-tap background to go back">
                <div className="note" onClick={(e) => e.stopPropagation()}>
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__body">
                    <section className="note__col note__col--left">
                      <div className="note__top-section" aria-hidden="true" />
                      <div className="note__activities-block">
                        <h3 className="note__section-title">What are we gonna do?</h3>
                        <div className="note__activities-grid">
                        <div className="note__activity note__activity--c1-r1">
                          <span className="note__activity-icons">
                            {part1ImgUrls['baking'] && <img src={part1ImgUrls['baking']} alt="" className="note__activity-icon" />}
                          </span>
                          <span>Bake at IDIM</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r1">
                          <span>Mandatory photobooth!</span>
                          <span className="note__activity-icons">
                            {part1ImgUrls['pb-strip'] && <img src={part1ImgUrls['pb-strip']} alt="" className="note__activity-icon" />}
                          </span>
                        </div>
                        <div className="note__activity note__activity--c1-r2">
                          <span className="note__activity-icons note__activity-icons--overlap">
                            {part1ImgUrls['matcha'] && <img src={part1ImgUrls['matcha']} alt="" className="note__activity-icon" />}
                            {part1ImgUrls['cookies'] && <img src={part1ImgUrls['cookies']} alt="" className="note__activity-icon" />}
                          </span>
                          <span>Matcha Fest + twenty four bakeshop</span>
                        </div>
                        <div className="note__activity note__activity--icon-right note__activity--c2-r2">
                          <span>Dinner at Grifoni&apos;s</span>
                          <span className="note__activity-icons">
                            {part1ImgUrls['dinner'] && <img src={part1ImgUrls['dinner']} alt="" className="note__activity-icon" />}
                          </span>
                        </div>
                        </div>
                      </div>
                    </section>
                    <svg className="note__divider" viewBox="0 0 20 200" preserveAspectRatio="none" aria-hidden="true">
                      <path
                        d="M 10 0 Q 4 25 10 50 Q 16 75 10 100 Q 4 125 10 150 Q 16 175 10 200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <section className="note__col note__col--right">
                      <h3 className="note__section-title">What do we wear?</h3>
                      {part1ImgUrls['clothes'] && (
                        <img src={part1ImgUrls['clothes']} alt="" className="note__clothes-img" />
                      )}
                      <p className="note__comfy">anything comfy!</p>
                    </section>
                  </div>
                </div>
              </div>
            ) : exited && wordSearchPassed ? (
              <div className="back-page back-page--gate" onClick={handleGateBackTap} role="button" tabIndex={0} aria-label="Triple-tap background to go back">
                <div className="note note--gate" onClick={(e) => e.stopPropagation()}>
                  <NoteBorder className="note__border" />
                  <h2 className="note__title"><span className="note__title-bold">Part <span className="note__title-num">I</span>:</span><span className="note__title-sub-wrap"><span className="note__title-sub">First date,</span><span className="note__title-sub note__title-sub--second">take two</span></span></h2>
                  <div className="note__gate-body">
                    <button type="button" className="note__gate-btn" onClick={handleOpenClick}>
                      Open
                    </button>
                  </div>
                </div>
              </div>
            ) : exited ? (
              <div
                className="back-page back-page--word-search"
                style={{ width: '100%', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={handleWordSearchBackTap}
                role="button"
                tabIndex={0}
                aria-label="Triple-tap background to go back"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleWordSearchBackTap(e); } }}
              >
                <button
                  type="button"
                  className="word-search-skip-btn"
                  onClick={(e) => { e.stopPropagation(); setWordSearchPassed(true); }}
                  aria-label="Skip word search (temporary)"
                >
                  Skip (temp)
                </button>
                <WordSearch onComplete={() => setWordSearchPassed(true)} />
              </div>
            ) : (
              <div className={`envelopes-section${exiting ? ' envelopes-section--exiting' : ''}`}>
                <svg className="arch-text" viewBox="0 0 320 70" aria-hidden="true">
                  <defs>
                    <path id="archPath" d="M 15,52 Q 160,2 305,52" />
                  </defs>
                  <text fill="currentColor" fontFamily="Great Vibes, cursive" fontSize="28">
                    <textPath href="#archPath" startOffset="50%" textAnchor="middle">
                      Our valentines consists of..
                    </textPath>
                  </text>
                </svg>
                <div className="envelopes">
                  <Envelope className="envelope envelope--1" open={open1} onClick={handleEnvelopeClick(1, () => { if (open2) setOpen2(false); setOpen1(o => !o); })} letter={<div className="envelope-letter__inner"><span>Feb 7 or 8</span><span className="envelope-letter__heart">❤</span></div>}>Part 1</Envelope>
                  <Envelope className="envelope envelope--2" open={open2} onClick={handleEnvelopeClick(2, () => { if (open1) setOpen1(false); setOpen2(o => !o); })} letter={<div className="envelope-letter__inner"><span>Choose a date</span><span className="envelope-letter__heart">❤</span></div>}>Part 2</Envelope>
                </div>
              </div>
            )
          ) : (
            <>
              <div className="intro__title-block">
                <h1 className={`intro__heading${tapped ? ' intro__heading--step2' : ''}`}>
                  {tapped ? "Let me show you what I have planned" : "Happy Valentines Day,"}
                </h1>
                {!tapped && <span className="intro__name">My Micole (*ᴗ͈ˬᴗ͈)♡ *.ﾟ</span>}
              </div>
              {tapped && (
                <button type="button" className="heart-btn" aria-label="Okay" onClick={handleYesClick}>
                  <svg className="heart-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient id="heartBtnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f0b4c8" />
                        <stop offset="50%" stopColor="#e07a94" />
                        <stop offset="100%" stopColor="#d85a78" />
                      </linearGradient>
                    </defs>
                    <path d={heartPath} fill="url(#heartBtnGrad)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />
                    <text x="12" y="12" textAnchor="middle" dominantBaseline="middle" className="heart-btn__text">Okay</text>
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
