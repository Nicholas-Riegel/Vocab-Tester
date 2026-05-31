import { useEffect, useRef, useState } from 'react'

interface VocabWord {
  id: number
  word: string
  article: string | null
  english: string
  word_type: string
  source: string
  chapter: number
  forms: string | null
  plural: string | null
  notes: string | null
  example: string | null
  flagged: number
}

const SOURCES = [
  { label: 'All', value: '' },
  { label: 'A1', value: 'Deutsch Intensiv A1' },
  { label: 'A2', value: 'Deutsch Intensiv A2' },
  { label: 'B1', value: 'Deutsch Intensiv B1' },
  { label: 'B2', value: 'Deutsch Intensiv B2' },
  { label: 'Reading', value: 'Reading' },
]

const WORD_TYPES = [
  { label: 'All', value: '' },
  { label: 'Noun', value: 'noun' },
  { label: 'Verb', value: 'verb' },
  { label: 'Phrase', value: 'phrase' },
  { label: 'Other', value: 'other' },
]

const STATUSES = [
  { label: 'Active', value: 'active' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'All', value: 'all' },
]

function VocabTable() {
  const [words, setWords] = useState<VocabWord[]>([])
  const [source, setSource] = useState('')
  const [wordType, setWordType] = useState('')
  const [status, setStatus] = useState('active')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [answerVisible, setAnswerVisible] = useState(false)
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  const fetchWords = () => {
    const params = new URLSearchParams()
    if (source) params.append('source', source)
    if (wordType) params.append('word_type', wordType)
    params.append('status', status)

    fetch(`http://127.0.0.1:8000/vocab?${params}`)
      .then(res => res.json())
      .then(data => {
        setWords(data)
        setSelectedIndex(0)
      })
  }

  useEffect(() => {
    fetchWords()
  }, [source, wordType, status])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, words.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setAnswerVisible(true)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setAnswerVisible(false)
      } else if (e.key === '0' || e.key === '1' || e.key === 'x' || e.key === 'X') {
        const word = words[selectedIndex]
        if (!word) return
        const newFlag = e.key === '0' ? 0 : e.key === '1' ? 1 : -1
        setWords(prev =>
          prev.map(w => w.id === word.id ? { ...w, flagged: newFlag } : w)
        )
        fetch(`http://127.0.0.1:8000/vocab/${word.id}/flag`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flagged: newFlag }),
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [words, selectedIndex])

  useEffect(() => {
    rowRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [selectedIndex])

  const rowClass = (w: VocabWord, i: number) => {
    const classes = []
    if (i === selectedIndex) classes.push('row-selected')
    if (w.flagged === 1) classes.push('row-flagged')
    if (w.flagged === -1) classes.push('row-excluded')
    return classes.join(' ')
  }

  return (
    <div>
      <div className="filters">
        <label>
          Section:
          <select value={source} onChange={e => setSource(e.target.value)}>
            {SOURCES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          Word type:
          <select value={wordType} onChange={e => setWordType(e.target.value)}>
            {WORD_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label>
          Status:
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={`table-container${answerVisible ? ' answer-visible' : ''}`}>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Word</th>
              <th>Type</th>
              <th>Forms / Plural</th>
              <th>Notes</th>
              <th>Example</th>
              <th className="answer-col">English</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={w.id} ref={el => { rowRefs.current[i] = el }} className={rowClass(w, i)}>
                <td>{w.article ?? ''}</td>
                <td>{w.word}</td>
                <td>{w.word_type}</td>
                <td>{w.forms ?? w.plural ?? ''}</td>
                <td>{w.notes ?? ''}</td>
                <td>{w.example ?? ''}</td>
                <td className="answer-col">{w.english}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default VocabTable