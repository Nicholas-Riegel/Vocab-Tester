import { useEffect, useState } from 'react'

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

function VocabTable() {
  const [words, setWords] = useState<VocabWord[]>([])

  useEffect(() => {
    fetch('http://127.0.0.1:8000/vocab')
      .then(res => res.json())
      .then(data => setWords(data))
  }, [])

  return (
    <table>
      <thead>
        <tr>
          <th>Article</th>
          <th>Word</th>
          <th>Type</th>
          <th>Forms / Plural</th>
          <th>Notes</th>
          <th>English</th>
        </tr>
      </thead>
      <tbody>
        {words.map(w => (
          <tr key={w.id}>
            <td>{w.article ?? ''}</td>
            <td>{w.word}</td>
            <td>{w.word_type}</td>
            <td>{w.forms ?? w.plural ?? ''}</td>
            <td>{w.notes ?? ''}</td>
            <td>{w.english}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default VocabTable