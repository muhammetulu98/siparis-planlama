// Sevkiyat Planlama — örnek veri ve tipler (veritabanı yok, her şey bellekte)

export const BUGUN = '2026-10-17'

export interface DepoBilgi { miktar: number, planlanmis: number }
export interface StokBirim { ad: string, katsayi: number }
export interface Stok {
  kod: string, ad: string, birimler: StokBirim[], tedarikci: string, anaKategori: string, urunSorumlusu: string,
  kaliteKontrol: string, fizikselDurum: string, birimFiyat: number, satinalma: number, planlanmamis: number,
  depolar: Record<number, DepoBilgi>, aciklamalar: [string, string, string, string]
}

export interface Satir {
  id: number
  sec: boolean
  stokKodu: string
  miktar: number
  birim: string
  depoNo: number
  iskonto: number
  iskonto2: number
  yesilmi: boolean
  nakitmi: boolean
  teklifmi: boolean
  terminTarihi: string
  aciklama1: string
  aciklama2: string
  planSonDurum: string
}

export interface Siparis {
  seri: string
  sira: number
  siparisTarihi: string
  cariKod: string
  cariUnvan: string
  teslimTuru: string
  teslimTarihi: string
  temsilci: string
  plasiyer: string
  aciklama1: string
  aciklama2: string
  aciklama3: string
  adres: string
  il: string
  ilce: string
  sube: string
  olusturan: string
  sonDegisiklik: string
  onaylayan: string
  onaylanmaZamani: string
  bolge: string
  stand: string
  proje: string
  depoSiparisi: boolean
  belgeNo: string
  teklifVar: boolean
  tekTeslimat: boolean
  satirlar: Satir[]
}

export const DEPOLAR: { no: number, ad: string }[] = [
  { no: 3, ad: 'İkitelli' },
  { no: 83, ad: 'Plaza' },
]
export const depoAd = (no: number) => DEPOLAR.find(d => d.no === no)?.ad ?? (no === 99 ? 'Yerinden' : no === 98 ? 'Transit' : '—')

export const URUN_SORUMLULARI = ['ALİ CEYHUN ARDUÇ', 'MUHAMMET ÖZDEMİR', 'AHMET ERİŞ']
/** Kalite Kontrol = satın alma asistanı (kişi) */
export const KALITE_KONTROLCULER = ['ELİF YILMAZ', 'CEREN KAYA', 'OĞUZ AKTAŞ']
export const KAPAMA_NEDENLERI = ['Müşteri vazgeçti', 'Stok bulunamadı', 'Ürün üretimden kalktı', 'Fiyat uyuşmazlığı', 'Mükerrer sipariş']

// ---------------------------------------------------------------- stoklar
const ST = (kod: string, ad: string, p: Partial<Stok> & { koli: number, ikitelli: number, plaza: number, planIk?: number, planPl?: number }): Stok => ({
  kod, ad,
  birimler: [{ ad: 'Adet', katsayi: 1 }, { ad: 'Koli', katsayi: p.koli }, { ad: 'Palet', katsayi: p.koli * 20 }],
  tedarikci: p.tedarikci ?? '', anaKategori: p.anaKategori ?? '', urunSorumlusu: p.urunSorumlusu ?? URUN_SORUMLULARI[0]!,
  kaliteKontrol: p.kaliteKontrol ?? KALITE_KONTROLCULER[0]!, fizikselDurum: p.fizikselDurum ?? 'Hazır',
  birimFiyat: p.birimFiyat ?? 0, satinalma: p.satinalma ?? 0, planlanmamis: p.planlanmamis ?? 0,
  depolar: {
    3: { miktar: p.ikitelli, planlanmis: p.planIk ?? 0 },
    83: { miktar: p.plaza, planlanmis: p.planPl ?? 0 },
  },
  aciklamalar: p.aciklamalar ?? ['', '', '', ''],
})

export const STOKLAR: Stok[] = [
  ST('1001001', 'Cam Kavanoz 500 ml Kapaklı', { koli: 24, ikitelli: 4800, plaza: 960, planIk: 1500, planPl: 200, tedarikci: 'GÜNEŞ CAM VE PORSELEN SAN. A.Ş.', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[0], birimFiyat: 29.9, satinalma: 3600, planlanmamis: 1200 }),
  ST('1001002', 'Cam Kavanoz 1 lt Kapaklı', { koli: 12, ikitelli: 2200, plaza: 480, planIk: 900, planPl: 120, tedarikci: 'GÜNEŞ CAM VE PORSELEN SAN. A.Ş.', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[0], birimFiyat: 42.5, satinalma: 0, planlanmamis: 600 }),
  ST('1002001', 'Çelik Çaydanlık 2 lt', { koli: 6, ikitelli: 420, plaza: 96, planIk: 300, planPl: 24, tedarikci: 'ARC GÜVEN METAL SAN. VE TİC. LTD. ŞTİ.', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[1], kaliteKontrol: KALITE_KONTROLCULER[2], birimFiyat: 249, satinalma: 600, planlanmamis: 180, aciklamalar: ['Kutu hasara açık', '', '', ''] }),
  ST('1002002', 'Piknik Tüpü Seti', { koli: 4, ikitelli: 0, plaza: 36, planPl: 12, tedarikci: 'ARC GÜVEN METAL SAN. VE TİC. LTD. ŞTİ.', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[1], kaliteKontrol: KALITE_KONTROLCULER[2], birimFiyat: 359, satinalma: 400, planlanmamis: 90 }),
  ST('1003001', 'Plastik Saklama Kabı 1 lt', { koli: 48, ikitelli: 9600, plaza: 2400, planIk: 3000, planPl: 600, tedarikci: 'AKAY PLASTİK VE SAN. TİC. LTD. ŞTİ.', anaKategori: 'PLASTİK ÜRÜNLER', urunSorumlusu: URUN_SORUMLULARI[2], kaliteKontrol: KALITE_KONTROLCULER[1], birimFiyat: 21.9, satinalma: 9600, planlanmamis: 2400 }),
  ST('1003002', "Saklama Kabı Seti 3'lü", { koli: 24, ikitelli: 1200, plaza: 0, planIk: 800, tedarikci: 'AKAY PLASTİK VE SAN. TİC. LTD. ŞTİ.', anaKategori: 'PLASTİK ÜRÜNLER', urunSorumlusu: URUN_SORUMLULARI[2], kaliteKontrol: KALITE_KONTROLCULER[1], birimFiyat: 59, satinalma: 2400, planlanmamis: 960 }),
  ST('1004001', 'Mutfak Havlusu 40x60', { koli: 60, ikitelli: 7200, plaza: 1800, planIk: 2400, planPl: 300, tedarikci: 'ANEMONS TEKSTİL İTH. İHR. SAN. VE TİC. LTD. ŞTİ.', anaKategori: 'EV TEKSTİLİ', urunSorumlusu: URUN_SORUMLULARI[1], birimFiyat: 39.9, satinalma: 0, planlanmamis: 1800 }),
  ST('1005001', 'Plastik Sepet Orta', { koli: 36, ikitelli: 3600, plaza: 720, planIk: 1800, planPl: 144, tedarikci: 'ASRIN PLASTİK VE KALIP SANAYİ A.Ş.', anaKategori: 'PLASTİK ÜRÜNLER', urunSorumlusu: URUN_SORUMLULARI[2], birimFiyat: 27.5, satinalma: 3600, planlanmamis: 720 }),
  ST('1006001', 'Ahşap Kesme Tahtası', { koli: 20, ikitelli: 800, plaza: 200, planIk: 640, planPl: 40, tedarikci: 'KARDEŞLER AHŞAP MUTFAK ÜRÜNLERİ', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[0], kaliteKontrol: KALITE_KONTROLCULER[1], birimFiyat: 65, satinalma: 1000, planlanmamis: 400 }),
  ST('1007001', 'Streç Film 30 cm', { koli: 24, ikitelli: 2400, plaza: 480, planIk: 600, tedarikci: 'NEHİR AMBALAJ SAN. VE TİC. LTD. ŞTİ.', anaKategori: 'AMBALAJ', urunSorumlusu: URUN_SORUMLULARI[1], birimFiyat: 45, satinalma: 0, planlanmamis: 240 }),
  ST('1008001', 'Çelik Süzgeç 24 cm', { koli: 12, ikitelli: 144, plaza: 0, tedarikci: 'FİDAN ÇELİK EŞYA SAN. VE TİC. LTD. ŞTİ.', anaKategori: 'MUTFAK GEREÇLERİ', urunSorumlusu: URUN_SORUMLULARI[1], kaliteKontrol: KALITE_KONTROLCULER[2], fizikselDurum: 'Drop', birimFiyat: 79, satinalma: 480, planlanmamis: 96 }),
]
export const stokBul = (kod: string) => STOKLAR.find(s => s.kod === kod)!

// ---------------------------------------------------------------- siparişler
let sid = 100
const L = (stokKodu: string, miktar: number, birim = 'Adet', p: Partial<Satir> = {}): Satir => ({
  id: ++sid, sec: false, stokKodu, miktar, birim, depoNo: 3, iskonto: 0, iskonto2: 0, yesilmi: false, nakitmi: false, teklifmi: false,
  terminTarihi: '2026-10-20', aciklama1: '', aciklama2: '', planSonDurum: '', ...p,
})

type SipTohum = Pick<Siparis, 'seri' | 'sira' | 'cariKod' | 'cariUnvan' | 'il' | 'ilce' | 'temsilci' | 'plasiyer' | 'satirlar'> & Partial<Siparis>
const S = (p: SipTohum): Siparis => ({
  siparisTarihi: '2026-10-14', teslimTuru: 'Nakliye', teslimTarihi: '2026-10-21', aciklama1: '', aciklama2: '', aciklama3: '',
  adres: 'Merkez Mah. Sanayi Cad. No:12', sube: 'MERKEZ', olusturan: 'SATIŞ DESTEK', sonDegisiklik: '2026-10-16T10:20:00',
  onaylayan: 'SATIŞ DESTEK', onaylanmaZamani: '2026-10-16T09:00:00', bolge: 'MARMARA', stand: '', proje: '', depoSiparisi: false,
  belgeNo: '', teklifVar: false, tekTeslimat: false, ...p,
})

export function siparisUret(): Siparis[] {
  return [
    S({ seri: 'B2B', sira: 4821, siparisTarihi: '2026-10-16', teslimTarihi: '2026-10-21', cariKod: '120.B4B.00117', cariUnvan: 'GÜZELLİK DÜNYASI KOZMETİK LTD. ŞTİ.', il: 'İSTANBUL', ilce: 'BAHÇELİEVLER', temsilci: 'Ayşe Demir', plasiyer: 'Kerem Aydın', proje: 'PRJ-B2B-2026', teslimTuru: 'Kargo', aciklama1: 'Hafta içi teslimat', onaylanmaZamani: '2026-10-17T08:40:00',
      satirlar: [L('1001001', 960, 'Adet', { terminTarihi: '2026-10-19' }), L('1003001', 480, 'Adet', { depoNo: 83 }), L('1005001', 360, 'Adet', { yesilmi: true }), L('1007001', 72, 'Adet', { terminTarihi: '2026-10-18' })] }),
    S({ seri: 'B2B', sira: 4822, siparisTarihi: '2026-10-15', teslimTarihi: '2026-10-22', cariKod: '120.B4B.00118', cariUnvan: 'ANKA ECZA DEPOSU A.Ş.', il: 'ANKARA', ilce: 'ÇANKAYA', temsilci: 'Mehmet Kaya', plasiyer: 'Burak Şahin', proje: 'PRJ-B2B-2026', bolge: 'İÇ ANADOLU', onaylanmaZamani: '2026-10-16T15:10:00',
      satirlar: [L('1002001', 150, 'Adet', { nakitmi: true }), L('1003002', 600, 'Adet', { iskonto2: 5 }), L('1006001', 400, 'Adet', { depoNo: 83, terminTarihi: '2026-10-25' })] }),
    S({ seri: 'FUAR', sira: 1207, siparisTarihi: '2026-10-05', teslimTarihi: '2026-10-28', cariKod: '120.01.04.0233', cariUnvan: 'YILDIZ MARKET GIDA SAN. TİC. LTD. ŞTİ.', il: 'BURSA', ilce: 'NİLÜFER', temsilci: 'Burak Şahin', plasiyer: 'Kerem Aydın', proje: 'PRJ-FUAR-2610', stand: 'STAND-14', teslimTuru: 'Yerinden', bolge: 'MARMARA', onaylanmaZamani: '2026-10-05T11:00:00', belgeNo: 'FR-2610-0144', tekTeslimat: true,
      satirlar: [L('1001002', 1800, 'Adet', { terminTarihi: '2026-10-28' }), L('1004001', 1800, 'Adet', { depoNo: 83, terminTarihi: '2026-10-28', aciklama1: 'Stand teslimi' })] }),
    S({ seri: 'B2B', sira: 4823, siparisTarihi: '2026-10-17', teslimTarihi: '2026-10-23', cariKod: '120.B4B.00116', cariUnvan: 'SİNEM ÇELİKKESER', il: 'DÜZCE', ilce: 'MERKEZ', temsilci: 'Ayşe Demir', plasiyer: 'Kerem Aydın', teslimTuru: 'Kargo', bolge: 'KARADENİZ', onaylanmaZamani: '2026-10-17T07:55:00',
      satirlar: [L('1003001', 96, 'Adet', { nakitmi: true }), L('1007001', 24, 'Adet')] }),
    S({ seri: 'B2B', sira: 4824, siparisTarihi: '2026-10-09', teslimTarihi: '2026-10-19', cariKod: '120.01.02.0871', cariUnvan: 'ÖZGÜR TOPTAN TEMİZLİK ÜRÜNLERİ A.Ş.', il: 'İZMİR', ilce: 'BORNOVA', temsilci: 'Ayşe Demir', plasiyer: 'Kerem Aydın', proje: 'PRJ-B2B-2026', bolge: 'EGE', onaylanmaZamani: '2026-10-09T13:30:00',
      satirlar: [L('1005001', 720, 'Adet'), L('1006001', 200, 'Adet'), L('1001001', 480, 'Adet', { depoNo: 83 }), L('1002002', 40, 'Adet', { depoNo: 83, teklifmi: true })] }),
    S({ seri: 'B2B', sira: 4825, siparisTarihi: '2026-10-16', teslimTarihi: '2026-10-26', cariKod: '120.01.03.0412', cariUnvan: 'DENİZ KIRTASİYE VE OFİS MALZ. LTD. ŞTİ.', il: 'ANTALYA', ilce: 'MURATPAŞA', temsilci: 'Mehmet Kaya', plasiyer: 'Burak Şahin', proje: 'PRJ-KAMPANYA-10', bolge: 'AKDENİZ', onaylanmaZamani: '2026-10-16T17:45:00',
      satirlar: [L('1008001', 96, 'Adet', { depoNo: 3 }), L('1007001', 120, 'Adet')] }),
    S({ seri: 'DEPO', sira: 912, siparisTarihi: '2026-10-17', teslimTarihi: '2026-10-20', cariKod: '120.DEPO.001', cariUnvan: 'PLAZA MAĞAZA DEPO SİPARİŞİ', il: 'İSTANBUL', ilce: 'ESENYURT', temsilci: 'Depo', plasiyer: '—', teslimTuru: 'Depo', depoSiparisi: true, sube: 'PLAZA', bolge: 'MARMARA', onaylanmaZamani: '2026-10-17T06:30:00',
      satirlar: [L('1001001', 960, 'Adet', { depoNo: 83 }), L('1003001', 1200, 'Adet', { depoNo: 83 })] }),
    S({ seri: 'B2B', sira: 4827, siparisTarihi: '2026-10-14', teslimTarihi: '2026-11-04', cariKod: '120.B4B.00203', cariUnvan: 'KARDEŞLER YAPI MARKET', il: 'KOCAELİ', ilce: 'İZMİT', temsilci: 'Mehmet Kaya', plasiyer: 'Burak Şahin', proje: 'PRJ-B2B-2026', bolge: 'MARMARA', onaylanmaZamani: '2026-10-17T09:20:00', teklifVar: true,
      satirlar: [L('1004001', 600, 'Adet', { terminTarihi: '2026-11-04' }), L('1005001', 360, 'Adet', { terminTarihi: '2026-11-04' }), L('1003002', 240, 'Adet')] }),
  ]
}

export const siparisAnahtar = (o: Siparis) => `${o.seri}-${o.sira}`

/** Satırın bağlı olduğu depodaki miktar bilgileri. */
export function satirStok(s: Satir) {
  const st = stokBul(s.stokKodu)
  const d = st.depolar[s.depoNo] ?? { miktar: 0, planlanmis: 0 }
  const koef = st.birimler.find(b => b.ad === s.birim)?.katsayi ?? 1
  return { st, depoMiktari: d.miktar, planlanmis: d.planlanmis, serbest: Math.max(0, d.miktar - d.planlanmis), katsayi: koef }
}
export const satirTutar = (s: Satir) => s.miktar * stokBul(s.stokKodu).birimFiyat * (1 - s.iskonto / 100) * (1 - s.iskonto2 / 100)
export const siparisTutar = (o: Siparis) => o.satirlar.reduce((t, s) => t + satirTutar(s), 0)

// ---------------------------------------------------------------- sütun tanımları
export type KolonTip = 'metin' | 'sayi' | 'tutar' | 'tarih' | 'zaman' | 'bool'
export interface Kolon { k: string, ad: string, tip?: KolonTip, vis: boolean, w?: number }

export const OZET_KOLONLARI = (): Kolon[] => [
  { k: 'seri', ad: 'Seri', vis: true, w: 64 }, { k: 'sira', ad: 'Sıra', vis: true, w: 60 },
  { k: 'siparisTarihi', ad: 'Sipariş Tarihi', tip: 'tarih', vis: true, w: 100 },
  { k: 'cariKod', ad: 'Cari Kod', vis: false, w: 120 }, { k: 'cariUnvan', ad: 'Cari Unvan', vis: true, w: 300 },
  { k: 'teslimTuru', ad: 'Teslim Türü', vis: true, w: 90 }, { k: 'teslimTarihi', ad: 'Teslim Tarihi', tip: 'tarih', vis: true, w: 100 },
  { k: 'temsilci', ad: 'Temsilci', vis: true, w: 110 }, { k: 'plasiyer', ad: 'Plasiyer', vis: false, w: 110 },
  { k: 'nettutar', ad: 'Net Tutar', tip: 'tutar', vis: true, w: 110 },
  { k: 'satirSayisi', ad: 'Satır Sayısı', tip: 'sayi', vis: true, w: 80 },
  { k: 'oncelik', ad: 'Öncelik', vis: true, w: 90 },
  { k: 'proje', ad: 'Proje', vis: true, w: 130 },
  { k: 'depoSiparisi', ad: 'Depo Siparişi', tip: 'bool', vis: true, w: 80 },
  { k: 'onaylayan', ad: 'Onaylayan', vis: false, w: 110 }, { k: 'onaylanmaZamani', ad: 'Onaylanma Zamanı', tip: 'zaman', vis: true, w: 130 },
  { k: 'aciklama1', ad: 'Açıklama 1', vis: true, w: 150 }, { k: 'aciklama2', ad: 'Açıklama 2', vis: false, w: 150 }, { k: 'aciklama3', ad: 'Açıklama 3', vis: false, w: 150 },
  { k: 'il', ad: 'İl', vis: true, w: 90 }, { k: 'ilce', ad: 'İlçe', vis: false, w: 90 }, { k: 'bolge', ad: 'Bölge', vis: false, w: 100 },
  { k: 'sube', ad: 'Şube', vis: false, w: 80 }, { k: 'belgeNo', ad: 'Belge No', vis: false, w: 110 },
  { k: 'tekTeslimat', ad: 'Tek Teslimat', tip: 'bool', vis: false, w: 80 },
  { k: 'olusturan', ad: 'Oluşturan Kullanıcı', vis: false, w: 120 }, { k: 'sonDegisiklik', ad: 'Son Değişiklik Zamanı', tip: 'zaman', vis: false, w: 130 },
]

export const DETAY_KOLONLARI = (): Kolon[] => [
  { k: 'sec', ad: 'Seç', tip: 'bool', vis: true, w: 44 },
  { k: 'stokKodu', ad: 'Stok Kodu', vis: true, w: 90 }, { k: 'stokAdi', ad: 'Stok Adı', vis: true, w: 220 },
  { k: 'miktar', ad: 'Miktar', tip: 'sayi', vis: true, w: 80 }, { k: 'birim', ad: 'Birim', vis: true, w: 60 },
  { k: 'depoNo', ad: 'Depo', vis: true, w: 100 },
  { k: 'oneri', ad: 'Öneri', vis: true, w: 140 },
  { k: 'uyari', ad: 'Uyarı', vis: true, w: 180 },
  { k: 'depoMiktari', ad: 'Depo Miktarı', tip: 'sayi', vis: false, w: 90 },
  { k: 'tedarikci', ad: 'Tedarikçi Adı', vis: true, w: 200 }, { k: 'anaKategori', ad: 'Ana Kategori', vis: false, w: 130 },
  { k: 'urunSorumlusu', ad: 'Ürün Sorumlusu', vis: false, w: 130 }, { k: 'kaliteKontrol', ad: 'Kalite Kontrol', vis: false, w: 130 },
  { k: 'aciklama1', ad: 'Açıklama 1', vis: false, w: 140 }, { k: 'aciklama2', ad: 'Açıklama 2', vis: false, w: 140 },
  { k: 'miktar2', ad: 'Miktar 2', tip: 'sayi', vis: false, w: 70 }, { k: 'birim2', ad: 'Birim 2', vis: false, w: 60 },
  { k: 'miktar3', ad: 'Miktar 3', tip: 'sayi', vis: false, w: 70 }, { k: 'birim3', ad: 'Birim 3', vis: false, w: 60 },
  { k: 'tutar', ad: 'Tutar', tip: 'tutar', vis: true, w: 100 }, { k: 'iskonto', ad: 'İskonto', tip: 'sayi', vis: false, w: 60 }, { k: 'iskonto2', ad: 'İskonto 2', tip: 'sayi', vis: false, w: 70 },
  { k: 'birimFiyat', ad: 'Birim Fiyat', tip: 'tutar', vis: false, w: 90 },
  { k: 'fizikselDurum', ad: 'Fiziksel Durum', vis: false, w: 90 },
  { k: 'terminTarihi', ad: 'Termin Tarihi', tip: 'tarih', vis: true, w: 120 }, { k: 'planSonDurum', ad: 'Plan Son Durum', vis: true, w: 160 },
  { k: 'stokAciklama1', ad: 'Stok Açıklama - 1', vis: false, w: 140 }, { k: 'stokAciklama2', ad: 'Stok Açıklama - 2', vis: false, w: 140 },
]

/** Satır + stok bilgisinden grid'in gösterdiği düz kayıt. */
export function detayKaydi(s: Satir) {
  const x = satirStok(s)
  const st = x.st
  const b2 = st.birimler[1]
  const b3 = st.birimler[2]
  const adet = s.miktar * x.katsayi
  return {
    ...s,
    stokAdi: st.ad, depoMiktari: x.depoMiktari, planlanmis: x.planlanmis, planlanmamis: st.planlanmamis, serbest: x.serbest,
    satinalma: st.satinalma, tedarikci: st.tedarikci, anaKategori: st.anaKategori, urunSorumlusu: st.urunSorumlusu, kaliteKontrol: st.kaliteKontrol,
    miktar2: b2 ? Math.round((adet / b2.katsayi) * 100) / 100 : 0, birim2: b2?.ad ?? '', miktar3: b3 ? Math.round((adet / b3.katsayi) * 100) / 100 : 0, birim3: b3?.ad ?? '',
    tutar: satirTutar(s), birimFiyat: st.birimFiyat, fizikselDurum: st.fizikselDurum,
    stokAciklama1: st.aciklamalar[0], stokAciklama2: st.aciklamalar[1],
  }
}
