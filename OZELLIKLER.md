# Sipariş Planlama — Ekran ve Özellikler

Onaylanmış satış siparişlerini depolara (İkitelli, Plaza) ya da depo dışı tedarikçiye (Yerinden, Transit) planlayan ekranın web prototipi. Eski masaüstü formun (Sevkiyat Planlama) yerine geçer.
**Durum:** yalnızca frontend, backend yok. Tüm veri bellekte (örnek veri); sayfa yenilenince başa döner. Nuxt 4, port 3477.

İlgili belge: `PLAN-ONERISI.md` (öneri ve uyarı kuralları, backend API taslağı).

## Ekranın bölümleri

Yukarıdan aşağıya:

1. **Komut çubuğu** (eylemler, filtreler, araçlar)
2. **Sipariş Özeti**: planlanmayı bekleyen siparişlerin tablosu
3. **Sipariş Detayı**: seçili siparişin satırları (solda) ve **Stok** kutusu (sağda)
4. **Durum çubuğu**: sayılar ve kısayol ipuçları

İki tablo arasındaki bölücüyü sürükleyerek üst tablonun yüksekliği ayarlanır.

## 1. Komut çubuğu

| Öğe | Ne yapar |
|---|---|
| **Planla** (kırmızı, Ctrl+Enter) | Seçili satırları, her satırda seçili depoya planlar. Serbest miktar yetersizse "Yine de planlansın mı?" diye sorar. Planlanan satırlar listeden çıkar, depoya iş emri atandığı bildirilir. |
| **Plan Önerisi** | Seçili siparişin her satırı için depo önerisi, gerekçe ve uyarıları gösterir. Önerileri uygulayınca yalnızca depo alanı doldurulur ve satırlar seçilir; planlamayı kullanıcı yapar. |
| **Onaya Düşür** | Siparişi (tamamını ya da seçili satırları) tekrar onaya gönderir. Aşağıda ayrıntı. |
| **Filtre: Ürün Sorumlusu / Kalite Kontrol** | Çoklu seçimli açılır liste. İşaretler anında uygulanır; seçilen kişilerin sorumlu olduğu stokları içeren satırlar listelenir. Aktif filtrede sayaç görünür. |
| Yenile (F5) | Listeyi yeniler. |
| Sütunlar | Sütun penceresini açar (aşağıda). |
| Excel | Sipariş listesini CSV (Excel'de açılır) olarak indirir. Gerçek `.xlsx` değildir. |
| PDF | Tarayıcının yazdır penceresini açar; "PDF olarak kaydet" ile seçili siparişin planı PDF olur. |

## 2. Sipariş Özeti (üst tablo)

- Başlıkta bekleyen sipariş sayısı.
- **Arama kutusu** tek kutudur: seri-sıra, cari unvan/kod, il, ilçe, temsilci, plasiyer, proje, bölge ve siparişteki stok kodu/adında arar. Boşlukla ayrılan her kelime ayrı aranır, hepsi eşleşmelidir ("ankara kaya").
- **Başlığa tıklayınca sıralar.** Öncelik sütunu puana göre sıralanır.
- Satıra tıklamak siparişi seçer; alttaki detay değişir. Seçili sipariş kırmızı sol çubukla işaretlenir. ↑ ↓ tuşları da siparişler arasında gezdirir.
- **Öncelik** sütunu (Yüksek / Orta / Normal) puanla hesaplanır: nakit satır +3, onaylanalı 7 günden fazla +3, termin geçmiş +3 (yoksa yaklaşan +2), yeşil satır +1. Yüksek ≥ 4, Orta ≥ 2. Nedenler chip'in üzerine gelince görünür.
- Onaylanalı 7 günden fazla bekleyen siparişin seçili hali mavi vurgulanır; depo siparişlerinde sıra numarası mor yazılır.
- Açıklama 1/2/3 hücreleri doğrudan düzenlenebilir.

## 3. Sipariş Detayı (alt tablo)

Seçili siparişin satırları. Sütunlar: stok kodu/adı, miktar, birim, **Depo** (satır içi açılır liste), **Öneri**, **Uyarı**, tedarikçi, tutar, termin tarihi (satır içi tarih), plan son durum ve diğerleri (Sütunlar penceresinden açılır).

- **Seçim:** her satırda onay kutusu, başlıkta "tümünü seç" kutusu. Kısayollar: Boşluk (odaktaki satırı seç), Ctrl+A tümünü seç, Ctrl+Shift+A kaldır, Ctrl+I seçimi ters çevir.
- **Satır renkleri:** seçili satır mavi zemin + mavi sol çubuk + kalın yazı; nakit, "yeşil mi" işaretli ve İskonto 2 olan satır yeşil; serbest stoğu olan ama seçilmemiş satırda solda mor nokta. Odaktaki satır kalın yazı ve kırmızı alt çizgi ile belirir. Renk açıklaması tablonun altında.
- **Öneri** sütunu: "İkitelli ✓", "Plaza", "Böl", "Bekle", "Yerinden/Transit" (kuralları `PLAN-ONERISI.md`'de).
- **Uyarı** sütunu: yalnızca gerçek sorunları gösterir (örn. "Termin riski · 16 eksik", "Satınalma geç kalıyor", "Nakit satır stoksuz", "Stok yarışı"). Her chip'in üzerine gelince tam cümle görünür. Termin yakın ama stok yeterliyse uyarı çıkmaz.
- Satıra çift tıklayınca stok kartı penceresi açılır (tedarikçi, ürün sorumlusu, kalite kontrol, fiziksel durum, stok açıklamaları).

## Stok kutusu (sağ)

Odaktaki satırın stoğuna göre canlıdır; satıra tıklayınca güncellenir.

- **Serbest yetmiyor uyarısı:** satırın miktarı depodaki serbest miktardan fazlaysa kutunun üstünde sarı uyarı, eksik miktar ve varsa en yakın satınalma teslimi ("En yakın satınalma teslimi 24.10.2026, 480 adet").
- **Sekmeler**, sayı rozetiyle:
  - **Depo:** depo bazında miktar, planlanmış, serbest; altında **birim karşılıkları** (örn. 1.800 adet = 150 koli = 7,5 palet) ve dönüşüm notu.
  - **Bekleyen:** aynı stoğu bekleyen siparişler (cari, miktar, depo, termin).
  - **Planlanmış:** planlanmış miktarın hangi siparişlere ayrıldığı.
  - **Satınalma:** gelecek satınalma siparişleri (tedarikçi, adet, teslim).

## Seçim kutusu (sağ, satır seçilince çıkar)

Seçili satır yokken görünmez. Satır seçilince:

- **Depo ata:** İkitelli / Plaza düğmeleri, seçili satırların deposunu toplu değiştirir. Tek satır için tablodaki Depo listesi kullanılır.
- **Tedarikçiden: Yerinden / Transit:** seçili satırları depo dışı sevke çevirir. Açılan pencere hangi tedarikçiye kaç satırlık ve ne tutarda alış siparişi açılacağını gösterir; termin tarihi sorulur (bugünden önce olamaz). Onaylanınca tedarikçilere alış siparişi açılır ve mail gider (prototipte bildirim olarak gösterilir). Yerinden: mal tedarikçiden müşteriye doğrudan gider; Transit: depoya uğrar. *(Bu tanım süreç notundan çıkarıldı, iş birimiyle teyit edilmedi.)*
- **Seçilenleri Kapat:** kapama nedeni seçtirir (Müşteri vazgeçti, Stok bulunamadı, Ürün üretimden kalktı, Fiyat uyuşmazlığı, Mükerrer sipariş) ve satırları listeden çıkarır.
- **Miktar Böl** (yalnızca tek satır seçiliyken): "kalacak miktar" girilir, satır iki satıra bölünür; ayrılan miktar diğer birimlerdeki karşılığıyla gösterilir. İki depoya paylaştırmak için kullanılır.

## Onaya Düşür

Siparişi onay aşamasına geri gönderir (Satış Destek'e döner). Pencere "Tüm fişi mi yoksa satırları mı tekrar onaya göndermek istiyorsunuz?" diye sorar:

- **Tüm fiş** ya da **yalnızca seçili satırlar** (satır seçili değilse pasif).
- Sarı uyarı: onaya gönderilirse sipariş **onaysız sipariş** olur.
- Sebep yazmak zorunludur. Depo siparişlerinde bu işlem yapılamaz.

## Sütunlar penceresi

Üst tablo ve alt tablo için sekme. Sütunlar kutuyla gösterilir/gizlenir; seçimler **otomatik kaydedilir** (tarayıcıda, sayfa yenilense de korunur), kaydet düğmesi yoktur.

## Plan Önerisi penceresi

Siparişin önceliği ve nedenleri, ardından her satır için öneri, gerekçe, uyarılar. "Uygula" önerilen depoları doldurur ve satırları seçer. Kurallar: mevcut depo yetiyorsa korunur → başka depo tek başına yetiyorsa o → toplam yetiyorsa böl → satınalma varsa bekle → hiçbiri değilse Yerinden/Transit. Ayrıntı: `PLAN-ONERISI.md`.

## Durum çubuğu

Toplam sipariş ve satır sayısı, seçili sipariş ve seçili satır sayısı, kısayol ipuçları (F5, Ctrl+Enter, ↑↓, Boşluk, Ctrl+A).

## Kısayollar

| Tuş | İşlem |
|---|---|
| F5 | Listeyi yenile |
| Ctrl+Enter | Planla |
| ↑ / ↓ | Önceki / sonraki sipariş |
| Boşluk | Odaktaki satırı seç / bırak |
| Ctrl+A / Ctrl+Shift+A / Ctrl+I | Tümünü seç / kaldır / ters çevir |
| Esc | Açık pencereyi kapat |

## Prototipte olmayanlar ve açık noktalar

- Backend, gerçek stok/satınalma/sipariş verisi ve kimlik doğrulama yok; Planlanmış ve Satınalma sekmelerindeki kayıtlar ve satınalma teslim tarihi örnek veridir.
- Excel çıktısı CSV'dir; PDF tarayıcı yazdırmasıyla alınır.
- Mail ve depo iş emri gerçekte gönderilmez, yalnızca bildirim gösterilir.
- Öneri/uyarı kural eşikleri (3 gün, 7 gün, puanlar) iş birimiyle netleştirilecek (`KURALLAR`, `app/utils/planOneri.ts`).
- Doğrulanacak: Plaza deposunun ekranda "İstoç" olarak anılması, Yerinden ile Transit'in iş farkı, depo tercihinin müşteriye göre değişip değişmediği.
