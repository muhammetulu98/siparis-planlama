# Plan Önerisi — Backend Entegrasyon Notu

Ekranda "Plan Önerisi" düğmesi, Detay'daki **Öneri / Uyarı** sütunları ve Özet'teki **Öncelik** sütunu bu kurallarla çalışır.
Kural motoru: `app/utils/planOneri.ts` (saf fonksiyonlar, dışarıya bağımlılığı yok). Backend aynı mantığı uygulayıp sonucu API ile verebilir.
Şu an hesap tarayıcıda yapılıyor; backend hazır olunca `satirOneri` / `siparisOncelik` çağrıları API cevabıyla değiştirilir.

## İlke
Yapay zeka/kural motoru **karar vermez, öneri üretir**. Öneri yalnızca depo alanını doldurur ve satırı seçer; planlamayı kullanıcı "Planla" ile onaylar. Her öneri gerekçesiyle gelir.

## Satır önerisi (sırayla ilk uyan kural)
Gerekli = miktar × birim katsayısı (adet). Serbest(depo) = depo miktarı − planlanmış siparişler. Tercih sırası: İkitelli(3), Plaza(83).
1. Mevcut depo yetiyorsa korunur → `depo` (ok)
2. Başka depo tek başına yetiyorsa o → `depo` (ok)
3. Tek depo yetmiyor ama toplam yetiyorsa → `bol` (dikkat), önerilen kalan miktar
4. Toplam yetmiyor, satınalma siparişi varsa → `bekle` (dikkat)
5. Toplam yetmiyor, satınalma yoksa → `sevk` = Yerinden/Transit (kritik)

## Uyarılar (satır)
İlke: tek başına anlamsız bilgi uyarı olmaz; sorun ancak başka bir durumla birleşince uyarıdır. Kod: `satirUyarilari`. Her uyarının kısa bir `etiket`i (grid'de chip) ve ayrıntılı `metin`i (tooltip) vardır.

| Kod | Ne zaman | Seviye |
|---|---|---|
| `terminGecti` | Termin geçmiş | kritik |
| `terminRisk` | Termin ≤ 3 gün **ve** iki depodaki toplam serbest stok satırı karşılamıyor (eksik miktar yazılır) | kritik |
| `teslimYetismiyor` | Stok yetmiyor, satınalma var ama teslim tarihi satır terminden sonra: beklemek terminı kaçırtır | kritik |
| `nakitStoksuz` | Nakit satır ve stok eksik: tahsilat bekliyor | kritik |
| `rekabet` ("Stok yarışı") | Bu stok için planlanmamış siparişler toplam serbest stoktan fazla | dikkat |
| `terminYakin` | Termin ≤ 3 gün ama stok yeterli: sorun yok | bilgi (grid'de gösterilmez) |
| `nakit`, `yesil` | Nakit / yeşil satır | bilgi |

Gerekli ek veri: stokun en yakın satınalma teslim tarihi (`satinalmaTeslim`).

## Sipariş önceliği (puan → Yüksek ≥4, Orta ≥2, Normal)
Nakit satır +3 · onaylanalı >7 gün +3 · termin geçmiş +3 (yoksa yaklaşan +2) · yeşil satır +1.
Eşikler ve puanlar `KURALLAR` sabitinde, iş birimiyle netleştirilecek.

## Önerilen API
`GET /planlama/siparisler/{seri}-{sira}/oneri` →
```json
{ "oncelik": { "puan": 6, "seviye": "Yüksek", "nedenler": ["Nakit satır var"] },
  "satirlar": [ { "satirId": 101, "tur": "depo|bol|bekle|sevk", "depoNo": 3, "etiket": "İkitelli ✓",
                  "gerekce": "...", "seviye": "ok|dikkat|kritik", "eksikAdet": 0, "bolmeKalan": 0,
                  "uyarilar": [ { "kod": "terminRisk", "etiket": "Termin riski · 16 eksik", "metin": "...", "seviye": "kritik" } ] } ] }
```
Gerekli veri: satır (miktar, birim, depo, termin, nakit/yeşil), stok (depo miktarı, planlanmış, planlanmamış toplam, satınalma, birim katsayıları), siparişin onaylanma zamanı.

## Sonraki adım (Katman 3, isteğe bağlı)
Dil modeli (Claude) ile doğal dil komutu ve gerekçe anlatımı; model veriye yalnızca yetkili API araçlarıyla erişir, kayıt yazmaz.

## Açık iş kuralları
Depo tercihi müşteriye göre değişiyor mu? Öncelik sırası (nakit/yeşil/eski/termin) doğru mu? Stok yetmediğinde gerçek uygulama (bekle/böl/sevk)? Puan ve eşikler.
