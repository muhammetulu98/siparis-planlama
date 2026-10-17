/**
 * Plan Önerisi kural motoru (Katman 1: öneri, Katman 2: uyarı + öncelik).
 *
 * Saf fonksiyonlar: veriyi parametre alır, dışarıya bağımlılığı yoktur. Backend'e aynen taşınabilir
 * (aynı girdi → aynı çıktı). Arayüz yalnızca bu dosyadaki tipleri ve fonksiyonları kullanır.
 * Ayrıntılar ve JSON sözleşmesi: PLAN-ONERISI.md
 */
import type { Satir, Siparis, Stok } from '~/composables/usePlanlama'

/** Ayarlanabilir kural parametreleri (iş birimiyle netleştirilecek). */
export const KURALLAR = {
  /** Onaylanalı bu kadar günden fazla bekleyen sipariş "eski bekleyen" sayılır. */
  eskiBekleyenGun: 7,
  /** Termine bu kadar gün (veya daha az) kalan satır "termin yakın" sayılır. */
  terminYakinGun: 3,
  /** Fiziksel depolar tercih sırasıyla (depo no). Mevcut depo yeterliyse o korunur. */
  depoSirasi: [3, 83],
  /** Sipariş öncelik puanları. */
  puan: { nakit: 3, eskiBekleyen: 3, terminGecmis: 3, terminYakin: 2, yesil: 1 },
  /** Toplam puan eşikleri. */
  yuksekEsik: 4,
  ortaEsik: 2,
}

export type Seviye = 'ok' | 'dikkat' | 'kritik'
export type OneriTuru = 'depo' | 'bol' | 'bekle' | 'sevk'

export type UyariKod = 'terminGecti' | 'terminRisk' | 'teslimYetismiyor' | 'nakitStoksuz' | 'terminYakin' | 'rekabet' | 'nakit' | 'yesil'
/** etiket: grid'deki kısa chip metni, metin: ayrıntılı açıklama (tooltip / modal) */
export interface Uyari { kod: UyariKod, etiket: string, metin: string, seviye: 'kritik' | 'dikkat' | 'bilgi' }

export interface Oneri {
  satirId: number
  tur: OneriTuru
  /** tur === 'depo' ise önerilen depo */
  depoNo?: number
  depoAd?: string
  /** Grid'de görünen kısa etiket */
  etiket: string
  /** Kullanıcıya gösterilen neden */
  gerekce: string
  seviye: Seviye
  /** Adet cinsinden eksik miktar (yetersiz durumlarda) */
  eksikAdet?: number
  /** tur === 'bol' ise ilk depoda kalacak miktar (satırın biriminde) */
  bolmeKalan?: number
  uyarilar: Uyari[]
}

export interface SiparisOncelik { puan: number, seviye: 'Yüksek' | 'Orta' | 'Normal', nedenler: string[] }

const DEPO_AD: Record<number, string> = { 3: 'İkitelli', 83: 'Plaza' }
const depoAdi = (no: number) => DEPO_AD[no] ?? `Depo ${no}`
const adet = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

const gunFarki = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

export function depoSerbest(st: Stok, depoNo: number): number {
  const d = st.depolar[depoNo]
  return d ? Math.max(0, d.miktar - d.planlanmis) : 0
}

/**
 * Satırın uyarıları (Katman 2).
 * İlke: tek başına anlamsız bilgiyi (ör. "termin yakın") uyarı yapmayız; sorun ancak başka bir durumla
 * birleşince uyarıdır. Termin yakınsa ve stok yetiyorsa sorun yok; stok yetmiyorsa "termin riski" olur.
 */
export function satirUyarilari(s: Satir, st: Stok, bugun: string): Uyari[] {
  const u: Uyari[] = []
  const katsayi = st.birimler.find(b => b.ad === s.birim)?.katsayi ?? 1
  const gerekli = s.miktar * katsayi
  const toplamSerbest = KURALLAR.depoSirasi.reduce((t, no) => t + depoSerbest(st, no), 0)
  const eksik = Math.max(0, gerekli - toplamSerbest)
  const fark = gunFarki(s.terminTarihi, bugun)
  const yakin = fark <= KURALLAR.terminYakinGun
  const gunMetni = fark === 0 ? 'bugün' : `${fark} gün sonra`

  if (fark < 0) u.push({ kod: 'terminGecti', etiket: `Termin ${Math.abs(fark)} gün geçti`, metin: `Termin ${Math.abs(fark)} gün önce geçti.`, seviye: 'kritik' })
  else if (yakin && eksik > 0) u.push({ kod: 'terminRisk', etiket: `Termin riski · ${adet(eksik)} eksik`, metin: `Termin ${gunMetni}, ama depolardaki serbest stok yetmiyor (${adet(eksik)} adet eksik).`, seviye: 'kritik' })
  else if (yakin) u.push({ kod: 'terminYakin', etiket: 'Termin yakın', metin: `Termin ${gunMetni}; stok yeterli, planlanabilir.`, seviye: 'bilgi' })

  // Stok yetmiyor ve gelecek satınalma termine yetişmiyor: bekleyerek çözülmez, Yerinden/Transit gerekir
  if (eksik > 0 && st.satinalma > 0 && st.satinalmaTeslim && st.satinalmaTeslim > s.terminTarihi) {
    u.push({ kod: 'teslimYetismiyor', etiket: 'Satınalma geç kalıyor', metin: `Satınalma teslimi ${st.satinalmaTeslim.split('-').reverse().join('.')}, satır termini ${s.terminTarihi.split('-').reverse().join('.')}. Beklemek termini kaçırtır.`, seviye: 'kritik' })
  }

  if (s.nakitmi && eksik > 0) u.push({ kod: 'nakitStoksuz', etiket: 'Nakit satır stoksuz', metin: `Nakit müşteri ve ${adet(eksik)} adet eksik: tahsilat bekliyor, önce bu satırın stoğu çözülmeli.`, seviye: 'kritik' })

  if (st.planlanmamis > toplamSerbest) {
    u.push({ kod: 'rekabet', etiket: 'Stok yarışı', metin: `Bu stok için bekleyen siparişler (${adet(st.planlanmamis)}) serbest stoktan (${adet(toplamSerbest)}) fazla: hepsi karşılanamaz.`, seviye: 'dikkat' })
  }
  if (s.nakitmi) u.push({ kod: 'nakit', etiket: 'Nakit', metin: 'Nakit satır: öncelikli', seviye: 'bilgi' })
  if (s.yesilmi) u.push({ kod: 'yesil', etiket: 'Yeşil', metin: 'Yeşil satır', seviye: 'bilgi' })
  return u
}

/** Satır için depo/aksiyon önerisi (Katman 1). */
export function satirOneri(s: Satir, st: Stok, bugun: string): Oneri {
  const katsayi = st.birimler.find(b => b.ad === s.birim)?.katsayi ?? 1
  const gerekli = s.miktar * katsayi
  const uyarilar = satirUyarilari(s, st, bugun)
  const temel = { satirId: s.id, uyarilar }
  const mevcutSerbest = depoSerbest(st, s.depoNo)

  // 1) Mevcut depo yetiyorsa korunur (kararlılık: plancının seçimi bozulmaz)
  if (KURALLAR.depoSirasi.includes(s.depoNo) && mevcutSerbest >= gerekli) {
    return { ...temel, tur: 'depo', depoNo: s.depoNo, depoAd: depoAdi(s.depoNo), etiket: `${depoAdi(s.depoNo)} ✓`, seviye: 'ok',
      gerekce: `${depoAdi(s.depoNo)}: ${adet(mevcutSerbest)} serbest, ${adet(gerekli)} gerekli.` }
  }

  // 2) Başka bir depo tek başına yetiyorsa o önerilir (tercih sırasına göre)
  for (const no of KURALLAR.depoSirasi) {
    if (no === s.depoNo) continue
    const serbest = depoSerbest(st, no)
    if (serbest >= gerekli) {
      const mevcutNot = KURALLAR.depoSirasi.includes(s.depoNo) ? `${depoAdi(s.depoNo)}'nde ${adet(mevcutSerbest)} serbest, ${adet(gerekli - mevcutSerbest)} eksik; ` : ''
      return { ...temel, tur: 'depo', depoNo: no, depoAd: depoAdi(no), etiket: depoAdi(no), seviye: 'ok',
        gerekce: `${mevcutNot}${depoAdi(no)}'nde ${adet(serbest)} serbest, ${adet(gerekli)} gerekli.` }
    }
  }

  // 3) Hiçbir depo tek başına yetmiyor ama toplam yetiyorsa bölme önerilir
  const serbestler = KURALLAR.depoSirasi.map(no => ({ no, serbest: depoSerbest(st, no) })).sort((a, b) => b.serbest - a.serbest)
  const toplam = serbestler.reduce((t, x) => t + x.serbest, 0)
  if (toplam >= gerekli) {
    const [a, b] = serbestler
    const kalan = Math.floor(a!.serbest / katsayi)
    return { ...temel, tur: 'bol', depoNo: a!.no, depoAd: depoAdi(a!.no), etiket: 'Böl', seviye: 'dikkat', bolmeKalan: kalan,
      gerekce: `Tek depoda yetmiyor: ${depoAdi(a!.no)} ${adet(a!.serbest)}, ${depoAdi(b!.no)} ${adet(b!.serbest)} serbest. Miktar Böl ile ${adet(kalan)} ${s.birim} ${depoAdi(a!.no)}'ne, kalanı ${depoAdi(b!.no)}'ya planlayın.` }
  }

  // 4) Stok yetersiz: satınalma geliyorsa bekle, yoksa Yerinden/Transit
  const eksik = gerekli - toplam
  if (st.satinalma > 0) {
    return { ...temel, tur: 'bekle', etiket: 'Bekle', seviye: 'dikkat', eksikAdet: eksik,
      gerekce: `Serbest stok yetersiz (${adet(toplam)} / ${adet(gerekli)}, ${adet(eksik)} eksik). ${adet(st.satinalma)} adet satınalma siparişi bekleniyor; gelene kadar bekletin veya Yerinden/Transit sevk edin.` }
  }
  return { ...temel, tur: 'sevk', etiket: 'Yerinden/Transit', seviye: 'kritik', eksikAdet: eksik,
    gerekce: `Serbest stok yetersiz (${adet(toplam)} / ${adet(gerekli)}, ${adet(eksik)} eksik) ve bekleyen satınalma siparişi yok. Yerinden veya Transit sevk önerilir.` }
}

/** Siparişin planlama önceliği (Katman 2). Yüksek puan = önce planlanmalı. */
export function siparisOncelik(o: Siparis, bugun: string): SiparisOncelik {
  const nedenler: string[] = []
  let puan = 0
  const ekle = (p: number, n: string) => { puan += p; nedenler.push(n) }
  if (o.satirlar.some(s => s.nakitmi)) ekle(KURALLAR.puan.nakit, 'Nakit satır var')
  const bekleyenGun = gunFarki(bugun, o.onaylanmaZamani.slice(0, 10))
  if (bekleyenGun > KURALLAR.eskiBekleyenGun) ekle(KURALLAR.puan.eskiBekleyen, `${bekleyenGun} gündür bekliyor`)
  const farklar = o.satirlar.map(s => gunFarki(s.terminTarihi, bugun))
  if (farklar.some(f => f < 0)) ekle(KURALLAR.puan.terminGecmis, 'Termini geçmiş satır var')
  else if (farklar.some(f => f <= KURALLAR.terminYakinGun)) ekle(KURALLAR.puan.terminYakin, 'Termini yaklaşan satır var')
  if (o.satirlar.some(s => s.yesilmi)) ekle(KURALLAR.puan.yesil, 'Yeşil satır var')
  const seviye = puan >= KURALLAR.yuksekEsik ? 'Yüksek' : puan >= KURALLAR.ortaEsik ? 'Orta' : 'Normal'
  return { puan, seviye, nedenler }
}
