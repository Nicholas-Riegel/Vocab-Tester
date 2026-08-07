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
	noun_flagged: number
	level: string | null
	realm_ids: string | null  // Comma-separated realm IDs
}

interface Realm {
	id: number
	name: string
}

interface EditModalProps {
	word: VocabWord
	realms: Realm[]
	onSave: (updated: VocabWord) => void
	onDelete: () => void
	onClose: () => void
}

const SOURCES = [
	'Deutsch Intensiv A1',
	'Deutsch Intensiv A2',
	'Deutsch Intensiv B1',
	'Deutsch Intensiv B2',
	'Reading',
]

const WORD_TYPES = ['noun', 'verb', 'phrase', 'other']

function EditModal({ word, realms, onSave, onDelete, onClose }: EditModalProps) {
	// Parse realm_ids (comma-separated IDs) to create object for checkboxes
	const parseRealmIds = (realmIdsStr: string | null): Record<number, boolean> => {
		try {
			if (!realmIdsStr) {
				return Object.fromEntries(realms.map(r => [r.id, false]))
			}
			const ids = realmIdsStr.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
			const obj: Record<number, boolean> = {}
			realms.forEach(r => {
				obj[r.id] = ids.includes(r.id)
			})
			return obj
		} catch (e) {
			console.error('Error parsing realm IDs:', e)
			return Object.fromEntries(realms.map(r => [r.id, false]))
		}
	}

	const [form, setForm] = useState({
		word: word.word,
		article: word.article ?? '',
		english: word.english,
		word_type: word.word_type,
		source: word.source,
		chapter: word.chapter,
		forms: word.forms ?? '',
		plural: word.plural ?? '',
		notes: word.notes ?? '',
		example: word.example ?? '',
		realm_ids: parseRealmIds(word.realm_ids),
	})

	const dialogRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
		setForm(prev => {
			if (field === 'realm-checkbox' && e.target instanceof HTMLInputElement) {
				// Handle realm checkbox
				const realmId = Number(e.target.value)
				return {
					...prev,
					realm_ids: {
						...prev.realm_ids,
						[realmId]: e.target.checked,
					},
				}
			}
			return { ...prev, [field]: e.target.value }
		})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Convert realm_ids object back to comma-separated string
		const realmIdArray = Object.entries(form.realm_ids)
			.filter(([, checked]) => checked)
			.map(([id]) => id)
		
		onSave({
			...word,
			word: form.word,
			article: form.article || null,
			english: form.english,
			word_type: form.word_type,
			source: form.source,
			chapter: Number(form.chapter),
			forms: form.forms || null,
			plural: form.plural || null,
			notes: form.notes || null,
			example: form.example || null,
			realm_ids: realmIdArray.length > 0 ? realmIdArray.join(',') : '',
		})
	}

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (!dialogRef.current?.contains(e.target as Node)) onClose()
	}

	return (
		<div className="modal-overlay" onMouseDown={handleOverlayClick}>
			<div className="modal-dialog" ref={dialogRef}>
				<h2>Edit Entry</h2>
				<form onSubmit={handleSubmit}>
					<div className="modal-fields">
						<div className="modal-row">
							<div className="modal-field modal-field-sm">
								<label>Article</label>
								<input value={form.article} onChange={set('article')} />
							</div>
							<div className="modal-field modal-field-grow">
								<label>Word</label>
								<input value={form.word} onChange={set('word')} required autoFocus />
							</div>
						</div>

						<div className="modal-field">
							<label>English</label>
							<input value={form.english} onChange={set('english')} required />
						</div>

						<div className="modal-row">
							<div className="modal-field modal-field-grow">
								<label>Word type</label>
								<select value={form.word_type} onChange={set('word_type')}>
									{WORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
								</select>
							</div>
							<div className="modal-field modal-field-grow">
								<label>Source</label>
								<select value={form.source} onChange={set('source')}>
									{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
								</select>
							</div>
							<div className="modal-field modal-field-sm">
								<label>Chapter</label>
								<input type="number" value={form.chapter} onChange={set('chapter')} required />
							</div>
						</div>

						<div className="modal-row">
							<div className="modal-field modal-field-grow">
								<label>Forms</label>
								<input value={form.forms} onChange={set('forms')} />
							</div>
							<div className="modal-field modal-field-grow">
								<label>Plural</label>
								<input value={form.plural} onChange={set('plural')} />
							</div>
						</div>

						<div className="modal-field">
							<label>Realms</label>
							<div className="realm-checkboxes">
								{realms.map(r => (
									<label key={r.id} className="realm-checkbox">
										<input
											type="checkbox"
											value={r.id.toString()}
											checked={form.realm_ids[r.id] || false}
											onChange={set('realm-checkbox')}
										/>
									{r.name}
									</label>
								))}
							</div>
						</div>

						<div className="modal-field">
							<label>Notes</label>
							<textarea value={form.notes} onChange={set('notes')} rows={2} />
						</div>

						<div className="modal-field">
							<label>Example</label>
							<textarea value={form.example} onChange={set('example')} rows={2} />
						</div>
					</div>

					<div className="modal-actions">
						<button type="button" className="btn-danger" onClick={onDelete}>Delete</button>
						<div style={{ flex: 1 }} />
						<button type="button" onClick={onClose}>Cancel</button>
						<button type="submit" className="btn-primary">Save</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default EditModal
