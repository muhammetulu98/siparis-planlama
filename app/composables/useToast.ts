let seq = 0
export function useToast() {
  const mesajlar = useState<{ id: number; tip: 'ok' | 'hata'; metin: string }[]>('toast', () => [])
  const goster = (metin: string, tip: 'ok' | 'hata' = 'ok') => {
    const id = ++seq
    mesajlar.value.push({ id, tip, metin })
    setTimeout(() => { mesajlar.value = mesajlar.value.filter(m => m.id !== id) }, 3800)
  }
  return { mesajlar, goster }
}
