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
    const selectedIndexRef = useRef(0)
    const wordsRef = useRef<VocabWord[]>([])
    const statusRef = useRef('active')

    const moveTo = (newIndex: number) => {
        selectedIndexRef.current = newIndex
        setSelectedIndex(newIndex)
        rowRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }

    const fetchWords = () => {
        const params = new URLSearchParams()
        if (source) params.append('source', source)
        if (wordType) params.append('word_type', wordType)
        params.append('status', status)

        fetch(`http://127.0.0.1:8000/vocab?${params}`)
        .then(res => res.json())
        .then(data => {
            setWords(data)
            wordsRef.current = data
            moveTo(0)
        })
    }

    useEffect(() => {
        fetchWords()
    }, [source, wordType, status])

    useEffect(() => {
        let repeatInterval: number | null = null
        let repeatTimeout: number | null = null

        const handleKey = (key: string) => {
            const len = wordsRef.current.length
            if (key === 'ArrowDown') {
                moveTo(Math.min(selectedIndexRef.current + 1, len - 1))
            } else if (key === 'ArrowUp') {
                moveTo(Math.max(selectedIndexRef.current - 1, 0))
            } else if (key === 'ArrowRight') {
                setAnswerVisible(true)
            } else if (key === 'ArrowLeft') {
                setAnswerVisible(false)
            } else if (key === 'f' || key === 'F' || key === 'd' || key === 'D') {
                const word = wordsRef.current[selectedIndexRef.current]
                if (!word) return
                const isExcludeToggle = key === 'd' || key === 'D'
                const newFlag = isExcludeToggle ? (word.flagged === -1 ? 0 : -1) : (word.flagged === 1 ? 0 : 1)
                const currentStatus = statusRef.current
                const shouldRemove = isExcludeToggle && newFlag === -1 && currentStatus !== 'all'
                setWords(prev => {
                    const updated = shouldRemove
                        ? prev.filter(w => w.id !== word.id)
                        : prev.map(w => w.id === word.id ? { ...w, flagged: newFlag } : w)
                    wordsRef.current = updated
                    return updated
                })
                fetch(`http://127.0.0.1:8000/vocab/${word.id}/flag`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ flagged: newFlag }),
                })
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
            }
            if (e.repeat) return
            if (e.metaKey && e.key === 'ArrowDown') {
                moveTo(wordsRef.current.length - 1)
                return
            }
            if (e.metaKey && e.key === 'ArrowUp') {
                moveTo(0)
                return
            }
            if (e.key === 'PageDown') {
                e.preventDefault()
                moveTo(Math.min(selectedIndexRef.current + 20, wordsRef.current.length - 1))
                return
            }
            if (e.key === 'PageUp') {
                e.preventDefault()
                moveTo(Math.max(selectedIndexRef.current - 20, 0))
                return
            }
            handleKey(e.key)
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                repeatTimeout = window.setTimeout(() => {
                    repeatInterval = window.setInterval(() => handleKey(e.key), 50)
                }, 300)
            }
        }

        const handleKeyUp = () => {
            if (repeatTimeout) clearTimeout(repeatTimeout)
            if (repeatInterval) clearInterval(repeatInterval)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            if (repeatTimeout) clearTimeout(repeatTimeout)
            if (repeatInterval) clearInterval(repeatInterval)
        }
    }, [])

	const rowClass = (w: VocabWord, i: number) => {
		const classes = []
		if (i === selectedIndex) classes.push('row-selected')
		if (w.flagged === 1) classes.push('row-flagged')
		if (w.flagged === -1) classes.push('row-excluded')
		return classes.join(' ')
	}

	return (
		<div>
		<div className="toolbar">
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
				<select value={status} onChange={e => { statusRef.current = e.target.value; setStatus(e.target.value) }}>
					{STATUSES.map(s => (
					<option key={s.value} value={s.value}>{s.label}</option>
					))}
				</select>
				</label>
			</div>
			<div className="legend">
				<span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
				<span><kbd>→</kbd> show answer</span>
				<span><kbd>←</kbd> hide answer</span>
				<span><kbd>F</kbd> flag / unflag</span>
				<span><kbd>D</kbd> exclude / restore</span>
			</div>
		</div>

		<div className={`table-wrapper${answerVisible ? ' answer-visible' : ''}`}>
			<table className="header-table">
			<thead>
				<tr>
				<th className="row-num">#</th>
				<th className="article-col">Article</th>
				<th>Word</th>
				<th className="answer-col">Forms / Plural</th>
				<th className="answer-col">Notes</th>
				<th className="question-col">Example</th>
				<th className="answer-col">English</th>
				</tr>
			</thead>
			</table>
			<div className="table-container">
			<table>
			<tbody>
				{words.map((w, i) => (
				<tr key={w.id} ref={el => { rowRefs.current[i] = el }} className={rowClass(w, i)} onClick={() => moveTo(i)}>
					<td className="row-num">{i + 1}</td>
					<td className="article-col">{w.article ?? ''}</td>
					<td>{w.word}</td>
					<td className="answer-col">{i === selectedIndex ? (w.forms ?? w.plural ?? '') : ''}</td>
					<td className="answer-col">{i === selectedIndex ? (w.notes ?? '') : ''}</td>
					<td className="question-col">{w.example ?? ''}</td>
					<td className="answer-col">{i === selectedIndex ? w.english : ''}</td>
				</tr>
				))}
			</tbody>
			</table>
			</div>
		</div>
		</div>
	)
}

export default VocabTable