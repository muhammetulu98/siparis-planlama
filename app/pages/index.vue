<script setup lang="ts">
import { para, sayi, tarih } from '~/utils/format'
import type { Satir, Siparis, Kolon } from '~/composables/usePlanlama'

const { goster } = useToast()
const siparisler = useState<Siparis[]>('siparisler', siparisUret)
const anahtar = siparisAnahtar

// ---------------------------------------------------------------- filtreler (Listele ile uygulanır)
interface Filtre { sorumlular: string[], kaliteler: string[] }
const bosFiltre = (): Filtre => ({ sorumlular: [], kaliteler: [] })
const filtre = reactive<Filtre>(bosFiltre())
const aktif = ref<Filtre>(bosFiltre())
// Panelde Listele düğmesi yok: işaretler anında uygulanır
watch(filtre, () => listele(false), { deep: true })
function listele(mesaj = true) {
  aktif.value = JSON.parse(JSON.stringify(filtre))
  if (mesaj) goster('Liste yenilendi.')
}

function gorunenSatirlar(o: Siparis): Satir[] {
  const f = aktif.value
  return o.satirlar.filter((s) => {
    const x = satirStok(s)
    if (f.sorumlular.length && !f.sorumlular.includes(x.st.urunSorumlusu)) return false
    if (f.kaliteler.length && !f.kaliteler.includes(x.st.kaliteKontrol)) return false
    return true
  })
}

// ---------------------------------------------------------------- sütunlar
const ozetKol = ref<Kolon[]>(OZET_KOLONLARI())
const detayKol = ref<Kolon[]>(DETAY_KOLONLARI())
const gorunurOzet = computed(() => ozetKol.value.filter(k => k.vis))
const gorunurDetay = computed(() => detayKol.value.filter(k => k.vis))

// ---------------------------------------------------------------- liste ve seçim
const secKey = ref('')
const odakSatir = ref<number | null>(null)

// ---------------------------------------------------------------- arama ve sıralama (Sipariş Özeti)
const ara = ref('')
const kucuk = (v: unknown) => String(v ?? '').toLocaleLowerCase('tr')
const sirala = ref<{ k: string, yon: 1 | -1 }>({ k: 'onaylanmaZamani', yon: 1 })
function siralaDegis(k: string) { sirala.value = sirala.value.k === k ? { k, yon: sirala.value.yon === 1 ? -1 : 1 } : { k, yon: 1 } }

const ozetListesi = computed(() => {
  const terimler = kucuk(ara.value).split(/\s+/).filter(Boolean)
  const l = siparisler.value
    .map(o => ({ o, g: gorunenSatirlar(o) }))
    .filter(x => x.g.length)
    .filter(({ o, g }) => {
      if (!terimler.length) return true
      const metin = kucuk([`${o.seri}-${o.sira}`, o.cariUnvan, o.cariKod, o.il, o.ilce, o.temsilci, o.plasiyer, o.proje, o.bolge,
        ...g.flatMap(s => [s.stokKodu, stokBul(s.stokKodu).ad])].join(' '))
      return terimler.every(t => metin.includes(t))
    })
    .map(({ o, g }) => ({
      ...o, nettutar: g.reduce((t, s) => t + satirTutar(s), 0), satirSayisi: g.length, _o: o, _oncelik: siparisOncelik(o, BUGUN),
    }))
  const { k, yon } = sirala.value
  return l.sort((a, b) => {
    const x = k === 'oncelik' ? a._oncelik.puan : (a as Record<string, any>)[k], z = k === 'oncelik' ? b._oncelik.puan : (b as Record<string, any>)[k]
    return (typeof x === 'number' && typeof z === 'number' ? x - z : String(x ?? '').localeCompare(String(z ?? ''), 'tr')) * yon
  })
})
const seciliSiparis = computed(() => siparisler.value.find(o => anahtar(o) === secKey.value) ?? null)
watch(ozetListesi, (l) => {
  if (!l.length) { secKey.value = ''; return }
  if (!l.some(x => anahtar(x._o) === secKey.value)) { secKey.value = anahtar(l[0]!._o) }
}, { immediate: true })

const detaySatirlari = computed(() => (seciliSiparis.value
  ? gorunenSatirlar(seciliSiparis.value).map(s => ({ ...detayKaydi(s), _oneri: satirOneri(s, stokBul(s.stokKodu), BUGUN) }))
  : []))
const hepsiSecili = computed(() => detaySatirlari.value.length > 0 && detaySatirlari.value.every(s => s.sec))
const secilenSatirlar = computed(() => detaySatirlari.value.filter(s => s.sec))
const odakKayit = computed(() => detaySatirlari.value.find(s => s.id === odakSatir.value) ?? null)
const satirBul = (id: number) => seciliSiparis.value?.satirlar.find(s => s.id === id)

const eskiMi = (o: { onaylanmaZamani: string }) => new Date(o.onaylanmaZamani) < new Date(new Date(BUGUN).getTime() - 7 * 86400000)
function siparisSec(o: Siparis) { secKey.value = anahtar(o) }
// Sipariş değişince ilk satır odaklanır; sağdaki stok panelleri dolu gelir
watch(secKey, () => nextTick(() => { odakSatir.value = detaySatirlari.value[0]?.id ?? null }), { immediate: true, flush: 'post' })

// Seçili satırın stok bilgileri (sağ paneller)
const miktarSatirlari = computed(() => {
  const k = odakKayit.value
  if (!k) return []
  const st = stokBul(k.stokKodu)
  return DEPOLAR.map(d => ({ depo: d.ad, miktar: st.depolar[d.no]!.miktar, planlanmis: st.depolar[d.no]!.planlanmis, serbest: Math.max(0, st.depolar[d.no]!.miktar - st.depolar[d.no]!.planlanmis) }))
})

// Odaktaki satırın miktarının stoktaki tüm birimlerdeki karşılığı (2 koli = 3 palet gibi)
const birimKarsiliklari = computed(() => {
  const k = odakKayit.value
  if (!k) return []
  const birimler = stokBul(k.stokKodu).birimler
  const adet = k.miktar * (birimler.find(b => b.ad === k.birim)?.katsayi ?? 1)
  return birimler.map(b => ({ ad: b.ad, miktar: adet / b.katsayi, kendisi: b.ad === k.birim, katsayi: b.katsayi }))
})

// ---------------------------------------------------------------- hücre biçimleri
function hucre(k: Kolon, r: Record<string, any>): string {
  const v = r[k.k]
  if (v == null || v === '') return ''
  switch (k.tip) {
    case 'tutar': return para(Number(v))
    case 'sayi': return sayi(Number(v))
    case 'tarih': return tarih(String(v))
    case 'zaman': { const d = new Date(String(v)); return `${tarih(String(v))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
    default: return String(v)
  }
}
const sagaMi = (k: Kolon) => k.tip === 'sayi' || k.tip === 'tutar'

// ---------------------------------------------------------------- seçim komutları
function tumunuSec(v: boolean | 'ters') {
  detaySatirlari.value.forEach((d) => { const s = satirBul(d.id)!; s.sec = v === 'ters' ? !s.sec : v })
}
function depoAta(no: number) {
  if (!secimGerek()) return
  secilenSatirlar.value.forEach((d) => { satirBul(d.id)!.depoNo = no })
  goster(`${secilenSatirlar.value.length} satırın deposu ${depoAd(no)} yapıldı.`)
}

// ---------------------------------------------------------------- pencereler
type Dlg =
  | null
  | { tip: 'onay', baslik: string, mesaj: string, evet: string, coz: (v: boolean) => void }
  | { tip: 'kapat', neden: string }
  | { tip: 'bol', kalan: number }
  | { tip: 'iptal', neden: string, kapsam: 'fis' | 'satir' }
  | { tip: 'sevk', tur: 'Yerinden' | 'Transit', termin: string }
  | { tip: 'liste', baslik: string, kolonlar: string[], satirlar: (string | number)[][] }
  | { tip: 'sutun', sekme: 'ozet' | 'detay' }
  | { tip: 'stok' }
  | { tip: 'oneri' }
const dlg = ref<Dlg>(null)
const kapatDlg = () => { if (dlg.value?.tip === 'onay') dlg.value.coz(false); dlg.value = null }
function sor(baslik: string, mesaj: string, evet = 'Evet'): Promise<boolean> {
  return new Promise((coz) => { dlg.value = { tip: 'onay', baslik, mesaj, evet, coz } })
}
function onayCevap(v: boolean) { if (dlg.value?.tip === 'onay') { const c = dlg.value.coz; dlg.value = null; c(v) } }

// ---------------------------------------------------------------- iş kuralları
function satirlariCikar(ids: number[]) {
  const o = seciliSiparis.value
  if (!o) return
  o.satirlar = o.satirlar.filter(s => !ids.includes(s.id))
  if (!o.satirlar.length) siparisler.value = siparisler.value.filter(x => x !== o)
}
const secimGerek = () => { if (!secilenSatirlar.value.length) { goster('Önce satırları seçin.', 'hata'); return false } return true }

async function planla() {
  const o = seciliSiparis.value
  if (!o || !secimGerek()) return
  const yetersiz = secilenSatirlar.value.filter((d) => { const x = satirStok(d); return d.miktar * x.katsayi > x.serbest })
  if (yetersiz.length) {
    const ilk = yetersiz[0]!
    const ok = await sor('Serbest miktar yetersiz',
      `${yetersiz.length} satırda serbest miktar yetersiz (örn. ${ilk.stokAdi}: ${sayi(ilk.miktar)} ${ilk.birim} istenen, ${sayi(ilk.serbest)} serbest). Yine de planlansın mı?`, 'Yine de planla')
    if (!ok) return
  }
  const ozet: Record<string, number> = {}
  for (const d of secilenSatirlar.value) {
    const x = satirStok(d)
    x.st.depolar[d.depoNo]!.planlanmis += d.miktar * x.katsayi
    ozet[depoAd(d.depoNo)] = (ozet[depoAd(d.depoNo)] ?? 0) + 1
  }
  const n = secilenSatirlar.value.length
  satirlariCikar(secilenSatirlar.value.map(d => d.id))
  goster(`${n} satır planlandı (${Object.entries(ozet).map(([k, v]) => `${k}: ${v}`).join(', ')}). Depoya iş emri atandı.`)
}

function satirKapatAc() {
  if (!secimGerek()) return
  dlg.value = { tip: 'kapat', neden: KAPAMA_NEDENLERI[0]! }
}
function satirKapatTamam() {
  const d = dlg.value
  if (d?.tip !== 'kapat') return
  const n = secilenSatirlar.value.length
  satirlariCikar(secilenSatirlar.value.map(x => x.id))
  dlg.value = null
  goster(`${n} satır kapatıldı (${d.neden}).`)
}

function miktarBolAc() {
  const k = odakKayit.value
  if (!k) return goster('Önce bölmek istediğiniz satırın üzerine tıklayın.', 'hata')
  dlg.value = { tip: 'bol', kalan: k.miktar }
}
function miktarBolTamam() {
  const d = dlg.value
  const k = odakKayit.value
  if (d?.tip !== 'bol' || !k) return
  if (!(d.kalan > 0 && d.kalan < k.miktar)) return goster(`Kalan miktar 0 ile ${sayi(k.miktar)} arasında olmalı.`, 'hata')
  const o = seciliSiparis.value!
  const s = satirBul(k.id)!
  const yeni: Satir = { ...s, id: Math.max(...siparisler.value.flatMap(x => x.satirlar.map(y => y.id))) + 1, miktar: s.miktar - d.kalan, sec: false }
  s.miktar = d.kalan
  o.satirlar.splice(o.satirlar.indexOf(s) + 1, 0, yeni)
  dlg.value = null
  goster(`Satır bölündü: ${sayi(s.miktar)} + ${sayi(yeni.miktar)} ${s.birim}.`)
}

function onayIptalAc() {
  const o = seciliSiparis.value
  if (!o) return
  if (o.depoSiparisi) return goster('Depo siparişine bu işlem yapılamaz!', 'hata')
  dlg.value = { tip: 'iptal', neden: '', kapsam: secilenSatirlar.value.length ? 'satir' : 'fis' }
}
function onayIptalTamam() {
  const d = dlg.value
  if (d?.tip !== 'iptal') return
  if (!d.neden.trim()) return goster('Sebep yazılmalı.', 'hata')
  const o = seciliSiparis.value!
  const ids = d.kapsam === 'fis' ? o.satirlar.map(x => x.id) : secilenSatirlar.value.map(x => x.id)
  if (!ids.length) return goster('Önce satırları seçin.', 'hata')
  satirlariCikar(ids)
  dlg.value = null
  goster(d.kapsam === 'fis' ? 'Tüm fiş onaya düşürüldü, sipariş onaysız sipariş oldu.' : `${ids.length} satır onaya düşürüldü, onaysız sipariş oldu.`)
}

function sevkAc(tur: 'Yerinden' | 'Transit') {
  const o = seciliSiparis.value
  if (!o) return
  if (o.depoSiparisi) return goster('Depo siparişine bu işlem yapılamaz!', 'hata')
  if (!secimGerek()) return
  dlg.value = { tip: 'sevk', tur, termin: '2026-10-18' }
}
const sevkTedarikciler = computed(() => {
  const m = new Map<string, { ad: string, satir: number, tutar: number }>()
  for (const x of secilenSatirlar.value) {
    const t = m.get(x.tedarikci) ?? { ad: x.tedarikci, satir: 0, tutar: 0 }
    t.satir++; t.tutar += x.tutar
    m.set(x.tedarikci, t)
  }
  return [...m.values()]
})
function sevkTamam() {
  const d = dlg.value
  if (d?.tip !== 'sevk') return
  if (!d.termin || d.termin < BUGUN) return goster('Termin tarihi bugünden önce olamaz.', 'hata')
  const tedarikciler = new Set(secilenSatirlar.value.map(x => x.tedarikci))
  const n = secilenSatirlar.value.length
  satirlariCikar(secilenSatirlar.value.map(x => x.id))
  dlg.value = null
  goster(`${n} satır ${d.tur.toLocaleLowerCase('tr')} sevke çevrildi. ${tedarikciler.size} tedarikçiye alış siparişi açıldı ve mail gönderilecek.`)
}

// ---------------------------------------------------------------- raporlar
// Sağ kutudaki sekmeler: odaktaki satırın stokuna göre canlı listeler
type SagSekme = 'depo' | 'bekleyen' | 'planli' | 'satinalma'
const sagSekme = ref<SagSekme>('depo')
const SEKMELER: { k: SagSekme, ad: string }[] = [
  { k: 'depo', ad: 'Depo' }, { k: 'bekleyen', ad: 'Bekleyen' }, { k: 'planli', ad: 'Planlanmış' }, { k: 'satinalma', ad: 'Satınalma' },
]
const bekleyenListe = computed(() => {
  const k = odakKayit.value
  if (!k) return []
  return siparisler.value.flatMap(o => o.satirlar.filter(s => s.stokKodu === k.stokKodu).map(s => [anahtar(o), o.cariUnvan, `${sayi(s.miktar)} ${s.birim}`, depoAd(s.depoNo), tarih(s.terminTarihi)]))
})
const planliListe = computed(() => {
  const k = odakKayit.value
  if (!k) return []
  const st = stokBul(k.stokKodu)
  const musteriler = ['MAVİ ZİNCİR MARKETLER A.Ş.', 'ÇINAR TOPTAN GIDA LTD. ŞTİ.', 'EGE EV GEREÇLERİ SAN. TİC.']
  const satirlar: (string | number)[][] = []
  DEPOLAR.forEach((d) => {
    const toplam = st.depolar[d.no]!.planlanmis
    if (!toplam) return
    const ilk = Math.round(toplam * 0.6)
    satirlar.push([`B2B-47${10 + d.no % 7}`, musteriler[d.no % 3]!, d.ad, sayi(ilk), '14.10.2026'], [`B2B-47${20 + d.no % 5}`, musteriler[(d.no + 1) % 3]!, d.ad, sayi(toplam - ilk), '15.10.2026'])
  })
  return satirlar
})
const satinalmaKayitlari = computed(() => {
  const k = odakKayit.value
  if (!k) return []
  const st = stokBul(k.stokKodu)
  return st.satinalma ? [
    { no: `SAS-26-${st.kod.slice(-3)}1`, miktar: Math.round(st.satinalma * 0.6), teslim: '24.10.2026' },
    { no: `SAS-26-${st.kod.slice(-3)}2`, miktar: Math.round(st.satinalma * 0.4), teslim: '05.11.2026' },
  ] : []
})
const satinalmaListe = computed(() => satinalmaKayitlari.value.map(x => [x.no, odakKayit.value!.tedarikci, sayi(x.miktar), x.teslim]))
const SEKME_KOLON: Record<Exclude<SagSekme, 'depo'>, string[]> = {
  bekleyen: ['Sipariş', 'Cari', 'Miktar', 'Depo', 'Termin'],
  planli: ['Sipariş', 'Cari', 'Depo', 'Adet', 'Plan'],
  satinalma: ['Sipariş', 'Tedarikçi', 'Adet', 'Teslim'],
}
const sekmeSatirlari = computed(() => (sagSekme.value === 'bekleyen' ? bekleyenListe.value : sagSekme.value === 'planli' ? planliListe.value : sagSekme.value === 'satinalma' ? satinalmaListe.value : []))
const sekmeSayisi = (k: SagSekme) => (k === 'bekleyen' ? bekleyenListe.value.length : k === 'planli' ? planliListe.value.length : k === 'satinalma' ? satinalmaListe.value.length : 0)

// Serbest miktar satırı karşılamıyorsa en yakın satınalma teslimini göster
const stokUyarisi = computed(() => {
  const k = odakKayit.value
  if (!k) return null
  const ihtiyac = k.miktar * (stokBul(k.stokKodu).birimler.find(b => b.ad === k.birim)?.katsayi ?? 1)
  const eksik = ihtiyac - k.serbest
  if (eksik <= 0) return null
  const gelen = satinalmaKayitlari.value[0]
  return { eksik, depo: depoAd(k.depoNo), gelen }
})

function yazdir() {
  const o = seciliSiparis.value; if (!o) return
  const eski = document.title
  document.title = `Siparis-Plani-${anahtar(o)}`
  window.addEventListener('afterprint', () => { document.title = eski }, { once: true })
  nextTick(() => window.print())
}
function csvIndir(ad: string, kolonlar: Kolon[], satirlar: Record<string, any>[]) {
  const kacis = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const metin = [kolonlar.map(k => kacis(k.ad)).join(';'), ...satirlar.map(r => kolonlar.map(k => kacis(k.tip === 'bool' ? (r[k.k] ? 'Evet' : 'Hayır') : hucre(k, r))).join(';'))].join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿' + metin], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = `${ad}.csv`; a.click(); URL.revokeObjectURL(url)
  goster(`${ad}.csv indirildi.`)
}
const excelOzet = () => csvIndir('Siparis-Planlama-Ozet', gorunurOzet.value, ozetListesi.value)

// ---------------------------------------------------------------- sütun seçimi (otomatik kaydedilir)
const GORUNUM_ANAHTAR = 'siparis-planlama-sutunlar'
function gorunumYukle() {
  try {
    const ham = localStorage.getItem(GORUNUM_ANAHTAR)
    if (!ham) return
    const g = JSON.parse(ham) as { ozet: [string, boolean][], detay: [string, boolean][] }
    for (const [k, v] of g.ozet) { const c = ozetKol.value.find(x => x.k === k); if (c) c.vis = v }
    for (const [k, v] of g.detay) { const c = detayKol.value.find(x => x.k === k); if (c) c.vis = v }
  } catch { /* kayıt okunamazsa varsayılan sütunlarla devam */ }
}
function gorunumKaydet() {
  try {
    localStorage.setItem(GORUNUM_ANAHTAR, JSON.stringify({ ozet: ozetKol.value.map(k => [k.k, k.vis]), detay: detayKol.value.map(k => [k.k, k.vis]) }))
  } catch { /* depolama kapalıysa sessizce geç */ }
}
watch([ozetKol, detayKol], gorunumKaydet, { deep: true })

// ---------------------------------------------------------------- klavye
function tus(e: KeyboardEvent) {
  if (e.key === 'Escape' && dlg.value) { kapatDlg(); return }
  if (dlg.value) return
  const alan = (e.target as HTMLElement)?.tagName
  const yaziyor = alan === 'INPUT' || alan === 'SELECT' || alan === 'TEXTAREA'
  const ctrl = e.ctrlKey || e.metaKey
  if (e.key === 'F5') { e.preventDefault(); listele(); return }
  if (ctrl && e.key === 'Enter') { e.preventDefault(); planla(); return }
  if (yaziyor) return
  if (ctrl && e.key.toLowerCase() === 'a') { e.preventDefault(); tumunuSec(e.shiftKey ? false : true); return }
  if (ctrl && e.key.toLowerCase() === 'i') { e.preventDefault(); tumunuSec('ters'); return }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const l = ozetListesi.value
    const i = l.findIndex(x => anahtar(x._o) === secKey.value)
    const j = Math.min(l.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))
    if (l[j]) siparisSec(l[j]._o)
    return
  }
  if (e.key === ' ' && odakSatir.value != null) {
    e.preventDefault()
    const s = satirBul(odakSatir.value); if (s) s.sec = !s.sec
  }
}
// ---------------------------------------------------------------- bölücü
const ustYukseklik = ref(230)
function bolucuSurukle(e: MouseEvent) {
  const y0 = e.clientY; const h0 = ustYukseklik.value
  const hareket = (ev: MouseEvent) => { ustYukseklik.value = Math.min(520, Math.max(110, h0 + ev.clientY - y0)) }
  const birak = () => { window.removeEventListener('mousemove', hareket); window.removeEventListener('mouseup', birak) }
  window.addEventListener('mousemove', hareket); window.addEventListener('mouseup', birak)
}

onMounted(() => { window.addEventListener('keydown', tus); document.addEventListener('click', menuKapat); gorunumYukle(); listele(false) })
onBeforeUnmount(() => { window.removeEventListener('keydown', tus); document.removeEventListener('click', menuKapat) })

const seviyeSinif = (v: string) => (v === 'ok' ? 'ok' : v === 'dikkat' ? 'warn' : 'bad')
const oncelikSinif = (v: string) => (v === 'Yüksek' ? 'bad' : v === 'Orta' ? 'warn' : '')

/** Plan Önerisi penceresi: öneriyi uygular (depoyu atar, uygun satırları seçer); planlamayı plancı yapar. */
const oneriOzeti = computed(() => {
  const l = detaySatirlari.value.map(d => d._oneri)
  return { toplam: l.length, uygun: l.filter(x => x.tur === 'depo').length, bol: l.filter(x => x.tur === 'bol').length, bekle: l.filter(x => x.tur === 'bekle').length, sevk: l.filter(x => x.tur === 'sevk').length }
})
const seciliOncelik = computed(() => (seciliSiparis.value ? siparisOncelik(seciliSiparis.value, BUGUN) : null))
function oneriAc() { if (seciliSiparis.value) dlg.value = { tip: 'oneri' } }
function oneriUygula() {
  let n = 0
  for (const d of detaySatirlari.value) {
    const s = satirBul(d.id)!
    if (d._oneri.tur === 'depo') { s.depoNo = d._oneri.depoNo!; s.sec = true; n++ } else { s.sec = false }
  }
  dlg.value = null
  const kalan = detaySatirlari.value.length - n
  goster(`${n} satırın deposu önerilene çekildi ve seçildi.${kalan ? ` ${kalan} satır için elle işlem gerekiyor (Böl / Bekle / Sevk).` : ''} Planlamak için Planla'ya basın.`)
}

const acikMenu = ref('')
const menuDegis = (ad: string) => { acikMenu.value = acikMenu.value === ad ? '' : ad }
const m = (fn: () => unknown) => { acikMenu.value = ''; fn() }
const menuKapat = () => { acikMenu.value = '' }

const toplamSatir = computed(() => ozetListesi.value.reduce((t, o) => t + o.satirSayisi, 0))
const sutunlar = (sekme: 'ozet' | 'detay') => (sekme === 'ozet' ? ozetKol.value : detayKol.value)
</script>

<template>
  <!-- komut çubuğu -->
  <div class="cmdbar" @click.stop>
    <button class="btn red" :disabled="!seciliSiparis" title="Ctrl+Enter" @click="planla()"><Ikon ad="planla" :boyut="15" /> Planla</button>
    <button class="btn line oneri-btn" :disabled="!seciliSiparis" title="Seçili sipariş için depo önerisi ve uyarılar" @click="oneriAc"><Ikon ad="oneri" :boyut="15" /> Plan Önerisi</button>
    <button class="btn ghost" :disabled="!seciliSiparis" title="Siparişi tekrar onaya gönder" @click="onayIptalAc"><Ikon ad="geri" :boyut="15" /> Onaya Düşür</button>

    <span class="vr" />
    <span class="filtre-etiket">Filtre</span>
      <div class="menu">
        <button class="btn chip-f" :class="{ aktif: filtre.sorumlular.length }" @click="menuDegis('sorumlu')">Ürün Sorumlusu <span v-if="filtre.sorumlular.length" class="sayac">{{ filtre.sorumlular.length }}</span><Ikon ad="asagi" :boyut="14" /></button>
        <div v-if="acikMenu === 'sorumlu'" class="pop filtre-pop">
          <div class="h">Ürün Sorumlusu</div>
          <label v-for="u in URUN_SORUMLULARI" :key="u"><input v-model="filtre.sorumlular" type="checkbox" class="chk" :value="u" /> {{ u }}</label>
          <hr />
          <button :disabled="!filtre.sorumlular.length" @click="filtre.sorumlular = []">Temizle</button>
        </div>
      </div>
      <div class="menu">
        <button class="btn chip-f" :class="{ aktif: filtre.kaliteler.length }" @click="menuDegis('kalite')">Kalite Kontrol <span v-if="filtre.kaliteler.length" class="sayac">{{ filtre.kaliteler.length }}</span><Ikon ad="asagi" :boyut="14" /></button>
        <div v-if="acikMenu === 'kalite'" class="pop filtre-pop">
          <div class="h">Kalite Kontrol (Satın Alma Asistanı)</div>
          <label v-for="u in KALITE_KONTROLCULER" :key="u"><input v-model="filtre.kaliteler" type="checkbox" class="chk" :value="u" /> {{ u }}</label>
          <hr />
          <button :disabled="!filtre.kaliteler.length" @click="filtre.kaliteler = []">Temizle</button>
        </div>
      </div>

    <div class="sp" />
    <div class="arac">
      <button class="ikon-btn yenile" title="Yenile (F5)" @click="listele()"><Ikon ad="yenile" :boyut="17" /></button>
      <button class="ikon-btn" title="Sütunları düzenle" @click="dlg = { tip: 'sutun', sekme: 'ozet' }"><Ikon ad="sutunlar" :boyut="17" /></button>
      <button class="ikon-btn excel" title="Excel'e aktar (sipariş listesi)" @click="excelOzet"><Ikon ad="excel" :boyut="18" /></button>
      <button class="ikon-btn pdf" title="PDF olarak kaydet / yazdır" @click="yazdir"><Ikon ad="pdf" :boyut="18" /></button>
    </div>
  </div>

  <!-- ana alan: üst özet, alt detay -->
  <div class="alan">
    <section class="kutu ust" :style="{ height: ustYukseklik + 'px' }">
      <div class="kbar">
        <span class="kt">Sipariş Özeti <small><b>{{ ozetListesi.length }}</b> bekleyen sipariş</small></span>
        <div class="ara"><Ikon ad="ara" :boyut="14" /><input v-model="ara" class="in" placeholder="Ara: seri-sıra, cari, il, temsilci, stok…" /></div>
        <button v-if="ara" class="temizle" @click="ara = ''">Aramayı temizle</button>
      </div>
      <div class="gwrap">
        <table class="grid">
          <thead><tr><th v-for="k in gorunurOzet" :key="k.k" :style="{ minWidth: (k.w ?? 90) + 'px' }" :class="{ sag: sagaMi(k), siralanir: true }" @click="siralaDegis(k.k === 'nettutar' ? 'nettutar' : k.k)">{{ k.ad }}<span v-if="sirala.k === k.k" class="ok">{{ sirala.yon === 1 ? '▲' : '▼' }}</span></th></tr></thead>
          <tbody>
            <tr v-for="r in ozetListesi" :key="anahtar(r._o)" :class="{ on: secKey === anahtar(r._o), eski: secKey === anahtar(r._o) && eskiMi(r), depoSip: r.depoSiparisi }" @click="siparisSec(r._o)">
              <td v-for="k in gorunurOzet" :key="k.k" :class="{ sag: sagaMi(k), mono: k.tip === 'tutar' || k.k === 'sira' }">
                <input v-if="k.k === 'aciklama1' || k.k === 'aciklama2' || k.k === 'aciklama3'" v-model="r._o[k.k]" class="cin" @click.stop />
                <span v-else-if="k.k === 'oncelik'" class="chip" :class="oncelikSinif(r._oncelik.seviye)" :title="r._oncelik.nedenler.join(' · ') || 'Öncelik gerektiren durum yok'">{{ r._oncelik.seviye }}</span>
                <input v-else-if="k.tip === 'bool'" type="checkbox" class="chk" :checked="!!(r as any)[k.k]" disabled />
                <template v-else>{{ hucre(k, r) }}</template>
              </td>
            </tr>
            <tr v-if="!ozetListesi.length"><td :colspan="gorunurOzet.length" class="bos">{{ ara ? 'Aramaya uyan sipariş yok' : 'Planlanacak sipariş yok' }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <div class="bolucu" title="Sürükleyerek yeniden boyutlandırın" @mousedown.prevent="bolucuSurukle" />

    <div class="alt">
      <section class="kutu detay">
        <div class="kbas">Sipariş Detayı <small v-if="seciliSiparis">{{ anahtar(seciliSiparis) }} · {{ seciliSiparis.cariUnvan }} · {{ detaySatirlari.length }} satır · {{ secilenSatirlar.length }} seçili</small>
        </div>
        <div class="gwrap">
          <table class="grid">
            <thead><tr><th v-for="k in gorunurDetay" :key="k.k" :style="{ minWidth: (k.w ?? 90) + 'px' }" :class="{ sag: sagaMi(k) }"><template v-if="k.k === 'sec'"><input type="checkbox" class="chk" title="Tümünü seç" :checked="hepsiSecili" :disabled="!detaySatirlari.length" @change="tumunuSec(($event.target as HTMLInputElement).checked)" /></template><template v-else>{{ k.ad }}</template></th></tr></thead>
            <tbody>
              <tr v-for="r in detaySatirlari" :key="r.id"
                  :class="{ odak: odakSatir === r.id, yesil: r.yesilmi || r.iskonto2 > 0, nakit: r.nakitmi, serbest: r.serbest > 0 && !r.sec }"
                  @click="odakSatir = r.id" @dblclick="dlg = { tip: 'stok' }">
                <td v-for="k in gorunurDetay" :key="k.k" :class="{ sag: sagaMi(k), mono: k.tip === 'tutar' }">
                  <input v-if="k.k === 'sec'" type="checkbox" class="chk" :checked="r.sec" @change="satirBul(r.id)!.sec = ($event.target as HTMLInputElement).checked" @click.stop />
                  <input v-else-if="k.k === 'nakitmi'" type="checkbox" class="chk" :checked="r.nakitmi" @change="satirBul(r.id)!.nakitmi = ($event.target as HTMLInputElement).checked" @click.stop />
                  <input v-else-if="k.tip === 'bool'" type="checkbox" class="chk" :checked="!!(r as any)[k.k]" disabled />
                  <select v-else-if="k.k === 'depoNo'" class="cin" :value="r.depoNo" @change="satirBul(r.id)!.depoNo = Number(($event.target as HTMLSelectElement).value)" @click.stop>
                    <option v-for="d in DEPOLAR" :key="d.no" :value="d.no">{{ d.ad }}</option>
                  </select>
                  <input v-else-if="k.k === 'terminTarihi'" type="date" class="cin" :value="r.terminTarihi" @change="satirBul(r.id)!.terminTarihi = ($event.target as HTMLInputElement).value" @click.stop />
                  <span v-else-if="k.k === 'oneri'" class="chip" :class="seviyeSinif(r._oneri.seviye)" :title="r._oneri.gerekce">{{ r._oneri.etiket }}</span>
                  <span v-else-if="k.k === 'uyari'" class="uyarilar">
                    <span v-for="u in r._oneri.uyarilar.filter(x => x.seviye !== 'bilgi')" :key="u.kod" class="chip" :class="u.seviye === 'kritik' ? 'bad' : 'warn'" :title="u.metin">{{ u.kod === 'terminGecti' ? 'Termin geçti' : u.kod === 'terminYakin' ? 'Termin yakın' : 'Stok yarışı' }}</span>
                  </span>
                  <template v-else>{{ hucre(k, r) }}</template>
                </td>
              </tr>
              <tr v-if="!detaySatirlari.length"><td :colspan="gorunurDetay.length" class="bos">{{ seciliSiparis ? 'Bu siparişte gösterilecek satır yok' : 'Sipariş seçin' }}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="renkler"><span class="rk nakit" />Nakit <span class="rk serbest" />Serbest stok var, seçilmemiş</div>
      </section>

      <div class="sag-kol">
        <section class="kutu">
          <div class="kbas">Stok <small v-if="odakKayit">{{ odakKayit.stokAdi }}</small></div>
          <div v-if="stokUyarisi" class="stok-uyari">
            <b>Serbest yetmiyor</b> · {{ stokUyarisi.depo }} deposunda {{ sayi(stokUyarisi.eksik) }} adet eksik.
            <template v-if="stokUyarisi.gelen">En yakın satınalma teslimi <b>{{ stokUyarisi.gelen.teslim }}</b>, {{ sayi(stokUyarisi.gelen.miktar) }} adet.</template>
            <template v-else>Planlı bir satınalma yok.</template>
          </div>
          <div class="stok-sekme">
            <button v-for="t in SEKMELER" :key="t.k" :class="{ on: sagSekme === t.k }" @click="sagSekme = t.k">{{ t.ad }}<span v-if="t.k !== 'depo' && odakKayit" class="say">{{ sekmeSayisi(t.k) }}</span></button>
          </div>
          <div class="gwrap">
            <template v-if="sagSekme === 'depo'">
              <table class="grid">
                <thead><tr><th>Depo</th><th class="sag">Miktar</th><th class="sag">Planlanmış</th><th class="sag">Serbest</th></tr></thead>
                <tbody>
                  <tr v-for="m in miktarSatirlari" :key="m.depo"><td>{{ m.depo }}</td><td class="sag">{{ sayi(m.miktar) }}</td><td class="sag">{{ sayi(m.planlanmis) }}</td><td class="sag"><b>{{ sayi(m.serbest) }}</b></td></tr>
                  <tr v-if="!miktarSatirlari.length"><td colspan="4" class="bos">Satıra tıklayın</td></tr>
                </tbody>
              </table>
              <div v-if="odakKayit" class="birim-kar">
                <div class="bk-baslik">Birim karşılıkları</div>
                <div v-for="b in birimKarsiliklari" :key="b.ad" class="bk-satir" :class="{ kendisi: b.kendisi }"><span>{{ b.ad }}</span><b>{{ sayi(b.miktar) }}</b></div>
                <div v-if="birimKarsiliklari.length > 1" class="bk-not">
                  {{ birimKarsiliklari.filter(b => b.katsayi > 1).map(b => `1 ${b.ad} = ${sayi(b.katsayi)} Adet`).join(' · ') }}
                </div>
              </div>
            </template>
            <table v-else class="grid">
              <thead><tr><th v-for="c in SEKME_KOLON[sagSekme]" :key="c">{{ c }}</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in sekmeSatirlari" :key="i"><td v-for="(h, j) in r" :key="j">{{ h }}</td></tr>
                <tr v-if="!sekmeSatirlari.length"><td :colspan="SEKME_KOLON[sagSekme].length" class="bos">{{ odakKayit ? 'Kayıt yok' : 'Satıra tıklayın' }}</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <div v-if="secilenSatirlar.length" class="sec-islem">
          <div class="sec-bilgi"><b>{{ secilenSatirlar.length }}</b> satır seçili</div>
          <div class="depo-ata">
            <span>Depo ata</span>
            <button v-for="d in DEPOLAR" :key="d.no" class="btn line" @click="depoAta(d.no)">{{ d.ad }}</button>
          </div>
          <div class="depo-ata">
            <span>Tedarikçiden</span>
            <button class="btn line" title="Mal tedarikçiden depomuza uğramadan müşteriye gider" @click="sevkAc('Yerinden')">Yerinden</button>
            <button class="btn line" title="Mal tedarikçiden depomuza gelir, oradan müşteriye çıkar" @click="sevkAc('Transit')">Transit</button>
          </div>
          <button class="btn red" @click="satirKapatAc"><Ikon ad="kapat" :boyut="15" /> Seçilenleri Kapat</button>
          <button v-if="secilenSatirlar.length === 1" class="btn line" title="Seçili satırı iki parçaya böl" @click="odakSatir = secilenSatirlar[0]!.id; miktarBolAc()"><Ikon ad="bol" :boyut="15" /> Miktar Böl</button>
        </div>
      </div>
    </div>
  </div>

  <footer class="durum">
    <span>{{ ozetListesi.length }} sipariş · {{ toplamSatir }} satır</span>
    <span v-if="seciliSiparis">· Seçili sipariş <b>{{ anahtar(seciliSiparis) }}</b> · {{ secilenSatirlar.length }} satır seçili</span>
    <span class="sp" />
    <span class="ipucu">F5 yenile · Ctrl+Enter planla · ↑↓ sipariş · Boşluk satır seç · Ctrl+A tümünü seç</span>
  </footer>

  <!-- pencereler -->
  <Pencere v-if="dlg?.tip === 'onay'" :baslik="dlg.baslik" @kapat="kapatDlg">
    <div class="pad">{{ dlg.mesaj }}</div>
    <template #alt><button class="btn line" @click="onayCevap(false)">Vazgeç</button><button class="btn red" @click="onayCevap(true)">{{ dlg.evet }}</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'kapat'" baslik="Satırı Kapat" @kapat="kapatDlg">
    <div class="pad">{{ secilenSatirlar.length }} satır kapatılacak. Kapama nedenini seçin.</div>
    <label v-for="n in KAPAMA_NEDENLERI" :key="n" class="sec-it" :class="{ on: dlg.neden === n }"><input v-model="dlg.neden" type="radio" class="chk" :value="n" /> {{ n }}</label>
    <template #alt><button class="btn line" @click="kapatDlg">Vazgeç</button><button class="btn red" @click="satirKapatTamam">Kapat</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'bol' && odakKayit" baslik="Miktar Böl" @kapat="kapatDlg">
    <div class="pad">
      <b>{{ odakKayit.stokAdi }}</b> — toplam {{ sayi(odakKayit.miktar) }} {{ odakKayit.birim }}<br />
      Bu satırda <b>kalacak</b> miktarı girin; kalanı yeni satır olarak ayrılır.
      <div class="alanlar"><label>Kalacak miktar ({{ odakKayit.birim }})<input v-model.number="dlg.kalan" type="number" min="1" :max="odakKayit.miktar - 1" class="in wide" @keyup.enter="miktarBolTamam" /></label></div>
      <div class="muted kucuk-yazi">Ayrılacak: {{ sayi(Math.max(0, odakKayit.miktar - (dlg.kalan || 0))) }} {{ odakKayit.birim }}
        · {{ stokBul(odakKayit.stokKodu).birimler.slice(1).map(b => `${sayi(Math.round(((dlg?.kalan || 0) * (satirStok(satirBul(odakKayit!.id)!).katsayi) / b.katsayi) * 100) / 100)} ${b.ad}`).join(' · ') }} kalacak</div>
    </div>
    <template #alt><button class="btn line" @click="kapatDlg">Vazgeç</button><button class="btn red" @click="miktarBolTamam">Böl</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'iptal'" baslik="Onaya Düşür" @kapat="kapatDlg">
    <div class="pad">
      <b>Tüm fişi mi yoksa satırları mı tekrar onaya göndermek istiyorsunuz?</b>
      <div class="kapsam">
        <label><input v-model="dlg.kapsam" type="radio" value="fis" /> Tüm fiş <small>({{ seciliSiparis?.satirlar.length }} satır)</small></label>
        <label :class="{ pasif: !secilenSatirlar.length }"><input v-model="dlg.kapsam" type="radio" value="satir" :disabled="!secilenSatirlar.length" /> Yalnızca seçili satırlar <small>({{ secilenSatirlar.length }} satır)</small></label>
      </div>
      <div class="uyari-kutu">Onaya gönderirseniz sipariş <b>onaysız sipariş</b> olur ve Satış Destek'e geri döner.</div>
      <div class="alanlar"><input v-model="dlg.neden" class="in wide" placeholder="Sebep" @keyup.enter="onayIptalTamam" /></div>
    </div>
    <template #alt><button class="btn line" @click="kapatDlg">Vazgeç</button><button class="btn red" @click="onayIptalTamam">Onaya Düşür</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'sevk'" :baslik="`${dlg.tur} Sevk`" @kapat="kapatDlg">
    <div class="pad">{{ secilenSatirlar.length }} satır {{ dlg.tur.toLocaleLowerCase('tr') }} sevke çevrilecek. Depodan karşılanmaz; aşağıdaki tedarikçilere otomatik alış siparişi açılır ve mail gider.
      <table class="grid sevk-ozet">
        <thead><tr><th>Tedarikçi</th><th class="sag">Satır</th><th class="sag">Tutar</th></tr></thead>
        <tbody><tr v-for="t in sevkTedarikciler" :key="t.ad"><td>{{ t.ad }}</td><td class="sag">{{ t.satir }}</td><td class="sag">{{ para(t.tutar) }}</td></tr></tbody>
      </table>
      <div class="alanlar"><label>Termin tarihi<input v-model="dlg.termin" type="date" class="in wide" :min="BUGUN" /></label></div></div>
    <template #alt><button class="btn line" @click="kapatDlg">Vazgeç</button><button class="btn red" @click="sevkTamam">Sevke Çevir</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'liste'" :baslik="dlg.baslik" genis @kapat="kapatDlg">
    <table class="grid">
      <thead><tr><th v-for="k in dlg.kolonlar" :key="k">{{ k }}</th></tr></thead>
      <tbody>
        <tr v-for="(r, i) in dlg.satirlar" :key="i"><td v-for="(h, j) in r" :key="j" :class="{ sag: typeof h === 'number' }">{{ typeof h === 'number' ? sayi(h) : h }}</td></tr>
        <tr v-if="!dlg.satirlar.length"><td :colspan="dlg.kolonlar.length" class="bos">Kayıt yok</td></tr>
      </tbody>
    </table>
    <template #alt><button class="btn line" @click="kapatDlg">Kapat</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'sutun'" baslik="Sütunlar" @kapat="kapatDlg">
    <div class="sekmeler"><button :class="{ on: dlg.sekme === 'ozet' }" @click="dlg.sekme = 'ozet'">Sipariş Özeti</button><button :class="{ on: dlg.sekme === 'detay' }" @click="dlg.sekme = 'detay'">Sipariş Detayı</button></div>
    <div class="sutunlar"><label v-for="k in sutunlar(dlg.sekme)" :key="k.k"><input v-model="k.vis" type="checkbox" class="chk" /> {{ k.ad }}</label></div>
    <template #alt><span class="muted kucuk-yazi">Seçimler otomatik kaydedilir.</span><button class="btn red" @click="kapatDlg">Tamam</button></template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'oneri' && seciliSiparis && seciliOncelik" :baslik="`Plan Önerisi · ${anahtar(seciliSiparis)}`" genis @kapat="kapatDlg">
    <div class="oneri-ust">
      <div><span class="muted">Öncelik</span> <span class="chip" :class="oncelikSinif(seciliOncelik.seviye)">{{ seciliOncelik.seviye }}</span>
        <span class="muted nedenler">{{ seciliOncelik.nedenler.join(' · ') || 'Öncelik gerektiren durum yok' }}</span></div>
      <div class="muted">{{ oneriOzeti.uygun }} satıra depo önerilebiliyor
        <template v-if="oneriOzeti.bol"> · {{ oneriOzeti.bol }} böl</template><template v-if="oneriOzeti.bekle"> · {{ oneriOzeti.bekle }} bekle</template><template v-if="oneriOzeti.sevk"> · {{ oneriOzeti.sevk }} yerinden/transit</template></div>
    </div>
    <table class="grid">
      <thead><tr><th>Stok</th><th class="sag">Miktar</th><th>Mevcut Depo</th><th>Öneri</th><th>Gerekçe</th></tr></thead>
      <tbody>
        <tr v-for="r in detaySatirlari" :key="r.id">
          <td>{{ r.stokAdi }}<div class="uyarilar alt"><span v-for="u in r._oneri.uyarilar" :key="u.kod" class="chip" :class="u.seviye === 'kritik' ? 'bad' : u.seviye === 'dikkat' ? 'warn' : ''" :title="u.metin">{{ u.metin }}</span></div></td>
          <td class="sag">{{ sayi(r.miktar) }} {{ r.birim }}</td>
          <td>{{ depoAd(r.depoNo) }}</td>
          <td><span class="chip" :class="seviyeSinif(r._oneri.seviye)">{{ r._oneri.etiket }}</span></td>
          <td class="gerekce">{{ r._oneri.gerekce }}</td>
        </tr>
      </tbody>
    </table>
    <template #alt>
      <span class="muted yaz">Öneri yalnızca depoyu doldurur ve satırları seçer; planlamayı siz onaylarsınız.</span>
      <button class="btn line" @click="kapatDlg">Kapat</button>
      <button class="btn red" :disabled="!oneriOzeti.uygun" @click="oneriUygula">Öneriyi Uygula ({{ oneriOzeti.uygun }})</button>
    </template>
  </Pencere>

  <Pencere v-else-if="dlg?.tip === 'stok' && odakKayit" :baslik="odakKayit.stokAdi" @kapat="kapatDlg">
    <div class="pad">
      <div class="kv"><span>Stok kodu</span><b>{{ odakKayit.stokKodu }}</b></div>
      <div class="kv"><span>Tedarikçi</span><b>{{ odakKayit.tedarikci }}</b></div>
      <div class="kv"><span>Ürün sorumlusu</span><b>{{ odakKayit.urunSorumlusu }}</b></div>
      <div class="kv"><span>Kalite kontrol</span><b>{{ odakKayit.kaliteKontrol }}</b></div>
      <div class="kv"><span>Fiziksel durum</span><b>{{ odakKayit.fizikselDurum }}</b></div>
      <div v-for="(a, i) in stokBul(odakKayit.stokKodu).aciklamalar" :key="i" class="kv"><span>Stok açıklama {{ i + 1 }}</span><b>{{ a || '—' }}</b></div>
    </div>
    <template #alt><button class="btn line" @click="kapatDlg">Kapat</button></template>
  </Pencere>

  <!-- yazdırma şablonu -->
  <div v-if="seciliSiparis" class="print-sheet">
    <h1>Sevkiyat Planı · {{ anahtar(seciliSiparis) }}</h1>
    <p>{{ seciliSiparis.cariUnvan }} · {{ seciliSiparis.il }} / {{ seciliSiparis.ilce }} · Teslim {{ tarih(seciliSiparis.teslimTarihi) }} · {{ seciliSiparis.temsilci }}</p>
    <table>
      <thead><tr><th>Stok Kodu</th><th>Stok Adı</th><th class="r">Miktar</th><th>Birim</th><th>Depo</th><th>Termin</th><th class="r">Serbest</th></tr></thead>
      <tbody><tr v-for="r in detaySatirlari" :key="r.id"><td>{{ r.stokKodu }}</td><td>{{ r.stokAdi }}</td><td class="r">{{ sayi(r.miktar) }}</td><td>{{ r.birim }}</td><td>{{ depoAd(r.depoNo) }}</td><td>{{ tarih(r.terminTarihi) }}</td><td class="r">{{ sayi(r.serbest) }}</td></tr></tbody>
    </table>
  </div>
</template>
