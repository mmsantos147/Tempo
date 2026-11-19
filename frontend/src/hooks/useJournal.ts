import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { journalApi } from '../api/journal'
import type { JournalItem, JournalTexts } from '../types'
import { useNotify } from './useNotify'

const SAVE_DELAY_MS = 800

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const EMPTY_TEXTS: JournalTexts = { whatIDid: '', howIFelt: '' }

function isBlank(texts: JournalTexts): boolean {
  return texts.whatIDid.trim() === '' && texts.howIFelt.trim() === ''
}

export function useJournal(date: string) {
  const { notifyError } = useNotify()
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [exists, setExists] = useState(false)
  const [texts, setTexts] = useState<JournalTexts>(EMPTY_TEXTS)
  const [items, setItems] = useState<JournalItem[]>([])
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const latestTexts = useRef<JournalTexts>(EMPTY_TEXTS)
  const existsRef = useRef(false)
  const timer = useRef<number | null>(null)
  const queue = useRef<Promise<void>>(Promise.resolve())

  const markExists = useCallback(() => {
    existsRef.current = true
    setExists(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    journalApi
      .get(date)
      .then((entry) => {
        if (cancelled) return
        const loaded = { whatIDid: entry.whatIDid ?? '', howIFelt: entry.howIFelt ?? '' }
        latestTexts.current = loaded
        setTexts(loaded)
        setItems(entry.items)
        markExists()
      })
      .catch((error) => {
        if (cancelled || (error instanceof ApiError && error.status === 404)) return
        setFailed(true)
        notifyError(error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [date, markExists, notifyError])

  const reloadItems = useCallback(async () => {
    try {
      setItems((await journalApi.get(date)).items)
    } catch (error) {
      notifyError(error)
    }
  }, [date, notifyError])

  const persist = useCallback(() => {
    timer.current = null
    const body = latestTexts.current
    if (!existsRef.current && isBlank(body)) {
      setSaveStatus('idle')
      return
    }
    setSaveStatus('saving')
    queue.current = queue.current.then(async () => {
      try {
        await journalApi.save(date, body)
        markExists()
        if (timer.current === null) setSaveStatus('saved')
      } catch (error) {
        setSaveStatus('error')
        notifyError(error)
      }
    })
  }, [date, markExists, notifyError])

  const changeText = useCallback(
    (field: keyof JournalTexts, value: string) => {
      const next = { ...latestTexts.current, [field]: value }
      latestTexts.current = next
      setTexts(next)
      setSaveStatus('pending')
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(persist, SAVE_DELAY_MS)
    },
    [persist],
  )

  const flush = useCallback(() => {
    if (timer.current === null) return
    window.clearTimeout(timer.current)
    persist()
  }, [persist])

  useEffect(() => flush, [flush])

  useEffect(() => {
    if (saveStatus !== 'pending' && saveStatus !== 'saving') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [saveStatus])

  const addItem = useCallback(
    async (text: string) => {
      try {
        const item = await journalApi.addItem(date, text)
        setItems((current) => [...current, item])
        markExists()
        return true
      } catch (error) {
        notifyError(error)
        return false
      }
    },
    [date, markExists, notifyError],
  )

  const updateItem = useCallback(
    async (id: number, text: string) => {
      try {
        const updated = await journalApi.updateItem(id, text)
        setItems((current) => current.map((item) => (item.id === id ? updated : item)))
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError],
  )

  const moveItem = useCallback(
    async (id: number, position: number) => {
      setItems((current) => {
        const moving = current.find((item) => item.id === id)
        if (!moving) return current
        const rest = current.filter((item) => item.id !== id)
        rest.splice(position, 0, moving)
        return rest.map((item, index) => ({ ...item, position: index }))
      })
      try {
        await journalApi.moveItem(id, position)
      } catch (error) {
        notifyError(error)
        await reloadItems()
      }
    },
    [notifyError, reloadItems],
  )

  const removeItem = useCallback(
    async (id: number) => {
      try {
        await journalApi.removeItem(id)
        setItems((current) =>
          current.filter((item) => item.id !== id).map((item, index) => ({ ...item, position: index })),
        )
      } catch (error) {
        notifyError(error)
      }
    },
    [notifyError],
  )

  const createCard = useCallback(async (id: number, columnId: number) => {
    const updated = await journalApi.createCard(id, columnId)
    setItems((current) => current.map((item) => (item.id === id ? updated : item)))
  }, [])

  return {
    loading,
    failed,
    exists,
    texts,
    saveStatus,
    items,
    changeText,
    flush,
    addItem,
    updateItem,
    moveItem,
    removeItem,
    createCard,
  }
}
