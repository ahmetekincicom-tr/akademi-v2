/**
 * Veritabanı şemasının TypeScript karşılığı.
 *
 * BU DOSYA ELLE DÜZENLENMEZ — şema değiştiğinde yeniden üretilir:
 *   npm run tipler
 *
 * Neden var: sorgu sonuçları şimdiye kadar tipsiz geliyordu ve kod
 * `as unknown as { baslik: string }` gibi elle yazılmış iddialarla
 * ilerliyordu. O iddialar derleyici tarafından DOĞRULANMIYOR: bir sütun adı
 * değiştiğinde ya da bir alan null olabilir hale geldiğinde hata çalışma
 * zamanına kalıyor. Bu dosya istemcilere bağlandığında sorgular gerçek satır
 * tipini döndürüyor ve o hatalar derlemede çıkıyor.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" };
  public: {
    Tables: {
      courses: {
        Row: {
          aciklama: string | null;
          baslik: string;
          baslik_vurgu: string;
          content: Json;
          created_at: string;
          durum: Database["public"]["Enums"]["course_durum"];
          fiyat_gorunur: boolean;
          format: string | null;
          hero_aciklama: string | null;
          id: string;
          kapak_gorsel: string | null;
          satisa_acik: boolean;
          seviye: string | null;
          sitede_gorunur: boolean;
          slug: string;
          sure: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          baslik: string;
          baslik_vurgu: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          baslik: string;
          boyut: number | null;
          course_id: string | null;
          created_at: string;
          dosya_tipi: string | null;
          dosya_yolu: string;
          id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          baslik: string;
          dosya_yolu: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "documents_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      duyurular: {
        Row: {
          baslik: string;
          bildirim_gonderildi_tarihi: string | null;
          created_at: string;
          durum: string;
          icerik: string;
          id: string;
          kategori: string;
          onem: string;
          ozet: string;
          slug: string;
          updated_at: string;
          yayin_tarihi: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["duyurular"]["Row"]> & {
          baslik: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["duyurular"]["Row"]>;
        Relationships: [];
      };
      egitim_kayit_arsivi: {
        Row: {
          aciklama: string | null;
          baslik: string | null;
          course_id: string | null;
          created_at: string;
          id: string;
          link: string;
          sira: number;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["egitim_kayit_arsivi"]["Row"]> & {
          link: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["egitim_kayit_arsivi"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "egitim_kayit_arsivi_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "egitim_kayit_arsivi_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      egitim_oturumlari: {
        Row: {
          baslangic: string;
          bildirim_gonderildi_tarihi: string | null;
          course_id: string | null;
          created_at: string;
          durum: Database["public"]["Enums"]["seans_durum"];
          id: string;
          kayit_link: string | null;
          konu: string | null;
          notlar: string | null;
          sure_dk: number;
          toplanti_link: string | null;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["egitim_oturumlari"]["Row"]> & {
          baslangic: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["egitim_oturumlari"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "egitim_oturumlari_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "egitim_oturumlari_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          admin_notu: string | null;
          atanma_tarihi: string;
          course_id: string;
          durum: Database["public"]["Enums"]["enrollment_durum"];
          id: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enrollments"]["Row"]> & {
          course_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      eposta_akislari: {
        Row: { acik: boolean; anahtar: string; guncelleme: string; not_metni: string | null };
        Insert: Partial<Database["public"]["Tables"]["eposta_akislari"]["Row"]> & { anahtar: string };
        Update: Partial<Database["public"]["Tables"]["eposta_akislari"]["Row"]>;
        Relationships: [];
      };
      eposta_gunlugu: {
        Row: {
          akis: string;
          alici: string | null;
          created_at: string;
          durum: string;
          id: string;
          konu: string | null;
          sebep: string | null;
          user_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["eposta_gunlugu"]["Row"]> & {
          akis: string;
          durum: string;
        };
        Update: Partial<Database["public"]["Tables"]["eposta_gunlugu"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "eposta_gunlugu_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      gorusme_ayarlari: {
        Row: {
          aktif: boolean;
          id: boolean;
          odeme_aciklamasi: string | null;
          sure_dk: number;
          ucret: number;
          ucretsiz_hak: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["gorusme_ayarlari"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["gorusme_ayarlari"]["Row"]>;
        Relationships: [];
      };
      gorusmeler: {
        Row: {
          aciklama: string | null;
          admin_notu: string | null;
          baslangic: string | null;
          created_at: string;
          durum: Database["public"]["Enums"]["gorusme_durum"];
          id: string;
          konu: string;
          odeme_referansi: string | null;
          odeme_yontemi: string | null;
          odendi: boolean;
          odendi_at: string | null;
          payment_id: string | null;
          sure_dk: number;
          tercih_zaman: string | null;
          toplanti_link: string | null;
          ucret: number | null;
          ucretsiz: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["gorusmeler"]["Row"]> & {
          konu: string;
          ucretsiz: boolean;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["gorusmeler"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "gorusmeler_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gorusmeler_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      hakkimizda_icerik: {
        Row: {
          akademi_baslik: string | null;
          akademi_etiket: string | null;
          akademi_metin: string | null;
          hero_baslik: string | null;
          hero_etiket: string | null;
          hero_metin: string | null;
          hero_vurgu: string | null;
          id: boolean;
          kisi_baslik: string | null;
          kisi_etiket: string | null;
          kisi_gorsel: string | null;
          kisi_metin: string | null;
          kisi_unvan: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["hakkimizda_icerik"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["hakkimizda_icerik"]["Row"]>;
        Relationships: [];
      };
      iletisim_mesajlari: {
        Row: {
          ad: string;
          course_id: string | null;
          created_at: string;
          email: string;
          id: string;
          konu: string | null;
          mesaj: string;
          okundu: boolean;
          sirket: string | null;
          telefon: string | null;
          tur: Database["public"]["Enums"]["mesaj_turu"];
        };
        Insert: Partial<Database["public"]["Tables"]["iletisim_mesajlari"]["Row"]> & {
          ad: string;
          email: string;
          mesaj: string;
        };
        Update: Partial<Database["public"]["Tables"]["iletisim_mesajlari"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "iletisim_mesajlari_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: { lesson_id: string; tamamlandi: boolean; updated_at: string; user_id: string };
        Insert: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]> & {
          lesson_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          aciklama: string | null;
          baslik: string;
          id: string;
          module_id: string;
          sira: number;
          sure: string | null;
          video_url: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]> & {
          baslik: string;
          module_id: string;
          sira: number;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      marka: {
        Row: {
          eposta_logo: string | null;
          favicon: string | null;
          id: boolean;
          logo_acik_zemin: string | null;
          logo_koyu_zemin: string | null;
          logo_yuksekligi: number;
          og_genislik: number | null;
          og_gorsel: string | null;
          og_yukseklik: number | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["marka"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["marka"]["Row"]>;
        Relationships: [];
      };
      meta_akislari: {
        Row: { acik: boolean; anahtar: string; guncelleme: string };
        Insert: Partial<Database["public"]["Tables"]["meta_akislari"]["Row"]> & { anahtar: string };
        Update: Partial<Database["public"]["Tables"]["meta_akislari"]["Row"]>;
        Relationships: [];
      };
      meta_olaylari: {
        Row: {
          aksiyon: string;
          created_at: string;
          deneme: number;
          durum: string;
          event_id: string;
          gonderim_zamani: string | null;
          id: string;
          kaynak_url: string | null;
          kimlik: Json;
          olay: string;
          olay_zamani: string;
          ozel: Json;
          sebep: string | null;
          user_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["meta_olaylari"]["Row"]> & {
          event_id: string;
          olay: string;
        };
        Update: Partial<Database["public"]["Tables"]["meta_olaylari"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "meta_olaylari_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: { baslik: string; course_id: string; id: string; meta: string | null; sira: number };
        Insert: Partial<Database["public"]["Tables"]["modules"]["Row"]> & {
          baslik: string;
          course_id: string;
          sira: number;
        };
        Update: Partial<Database["public"]["Tables"]["modules"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      odeme_denemeleri: {
        Row: {
          callback_at: string | null;
          conversation_id: string;
          created_at: string;
          durum: string;
          ham_yanit: Json | null;
          hata_kodu: string | null;
          hata_mesaji: string | null;
          id: string;
          kart_ailesi: string | null;
          kart_son4: string | null;
          payment_id: string;
          saglayici_odeme_id: string | null;
          taksit: number | null;
          token: string | null;
          tutar: number;
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["odeme_denemeleri"]["Row"]> & {
          conversation_id: string;
          payment_id: string;
          tutar: number;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["odeme_denemeleri"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "odeme_denemeleri_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "odeme_denemeleri_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      oturum_kayitlari: {
        Row: {
          bolge: string | null;
          cihaz: string | null;
          created_at: string;
          id: string;
          ip: unknown;
          isletim_sistemi: string | null;
          sehir: string | null;
          tarayici: string | null;
          ulke: string | null;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["oturum_kayitlari"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["oturum_kayitlari"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "oturum_kayitlari_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_gorulme: {
        Row: { alan: string; gorulme: string; user_id: string };
        Insert: Partial<Database["public"]["Tables"]["panel_gorulme"]["Row"]> & {
          alan: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["panel_gorulme"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "panel_gorulme_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          admin_notu: string | null;
          course_id: string | null;
          created_at: string;
          durum: Database["public"]["Enums"]["payment_durum"];
          fatura_no: string | null;
          havale_bildirimi_tarihi: string | null;
          id: string;
          odeme_tarihi: string;
          online_odeme: boolean;
          tutar: number;
          user_id: string;
          yontem: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          tutar: number;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          ad: string | null;
          created_at: string;
          email: string | null;
          fbc: string | null;
          fbp: string | null;
          hosgeldin_tarihi: string | null;
          id: string;
          ileti_izni: boolean;
          ileti_izni_tarihi: string | null;
          ilk_ip: string | null;
          ilk_ua: string | null;
          kaynak: string | null;
          on_degerlendirme_tarihi: string | null;
          reklam_izni: boolean | null;
          reklam_izni_tarihi: string | null;
          role: Database["public"]["Enums"]["user_role"];
          silme_talebi_tarihi: string | null;
          sirket: string | null;
          soyad: string | null;
          sozlesme_onayi_tarihi: string | null;
          telefon: string | null;
          temas_kodu: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      push_cihazlar: {
        Row: {
          created_at: string;
          gecersiz_tarihi: string | null;
          id: string;
          platform: string;
          son_gorulme: string;
          token: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_cihazlar"]["Row"]> & {
          token: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_cihazlar"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "push_cihazlar_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      push_gonderimler: {
        Row: {
          basarili: number;
          baslik: string;
          cihaz_sayisi: number;
          created_at: string;
          gonderen_id: string | null;
          govde: string;
          hata_metni: string | null;
          hedef_user_id: string | null;
          id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["push_gonderimler"]["Row"]> & {
          baslik: string;
          govde: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_gonderimler"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "push_gonderimler_gonderen_id_fkey";
            columns: ["gonderen_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "push_gonderimler_hedef_user_id_fkey";
            columns: ["hedef_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      referanslar: {
        Row: {
          ad: string;
          created_at: string;
          id: string;
          logo_yolu: string | null;
          sektor: string | null;
          sira: number;
          site_url: string | null;
          yayinda: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["referanslar"]["Row"]> & { ad: string };
        Update: Partial<Database["public"]["Tables"]["referanslar"]["Row"]>;
        Relationships: [];
      };
      riza_kayitlari: {
        Row: {
          baglam: string;
          belge: string;
          belge_basligi: string | null;
          belge_guncelleme: string | null;
          belge_ozeti: string | null;
          created_at: string;
          id: string;
          ip: unknown;
          payment_id: string | null;
          tarayici: string | null;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["riza_kayitlari"]["Row"]> & {
          baglam: string;
          belge: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["riza_kayitlari"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "riza_kayitlari_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "riza_kayitlari_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      seanslar: {
        Row: {
          baslangic: string;
          course_id: string | null;
          created_at: string;
          durum: Database["public"]["Enums"]["seans_durum"];
          id: string;
          kayit_link: string | null;
          konu: string | null;
          notlar: string | null;
          sure_dk: number;
          toplanti_link: string | null;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["seanslar"]["Row"]> & {
          baslangic: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["seanslar"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "seanslar_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seanslar_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: { anahtar: string; deger: Json; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["settings"]["Row"]> & { anahtar: string };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [];
      };
      site_icerik: {
        Row: {
          duyuru_stili: string;
          egitmen_ad: string | null;
          egitmen_biyografi: string | null;
          egitmen_unvan: string | null;
          id: boolean;
          kayit_duyurusu: string | null;
          kayit_duyurusu_aktif: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_icerik"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_icerik"]["Row"]>;
        Relationships: [];
      };
      support_messages: {
        Row: { created_at: string; gonderen_id: string; id: string; metin: string; ticket_id: string };
        Insert: Partial<Database["public"]["Tables"]["support_messages"]["Row"]> & {
          gonderen_id: string;
          metin: string;
          ticket_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "support_messages_gonderen_id_fkey";
            columns: ["gonderen_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          baslik: string;
          course_id: string | null;
          created_at: string;
          durum: Database["public"]["Enums"]["ticket_durum"];
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & {
          baslik: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "support_tickets_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      temaslar: {
        Row: {
          created_at: string;
          eslesme_zamani: string | null;
          fbc: string | null;
          fbp: string | null;
          hedef: string | null;
          id: string;
          ip: string | null;
          izin: boolean;
          kod: string;
          referrer: string | null;
          ua: string | null;
          user_id: string | null;
          yer: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["temaslar"]["Row"]> & { kod: string };
        Update: Partial<Database["public"]["Tables"]["temaslar"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "temaslar_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      yasal_sayfalar: {
        Row: {
          baslik: string;
          guncelleme: string | null;
          icerik: string;
          ozet: string | null;
          sira: number;
          slug: string;
          updated_at: string;
          yayinda: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["yasal_sayfalar"]["Row"]> & {
          baslik: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["yasal_sayfalar"]["Row"]>;
        Relationships: [];
      };
      yorumlar: {
        Row: {
          course_id: string | null;
          created_at: string;
          id: string;
          isim: string;
          metin: string;
          rol: string | null;
          sira: number;
          yayinda: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["yorumlar"]["Row"]> & {
          isim: string;
          metin: string;
        };
        Update: Partial<Database["public"]["Tables"]["yorumlar"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "yorumlar_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      banka_ayarlari: {
        Row: {
          aciklama: string | null;
          banka: string | null;
          iban: string | null;
          unvan: string | null;
        };
        Relationships: [];
      };
      form_ayarlari: {
        Row: { on_degerlendirme: string | null };
        Relationships: [];
      };
      meta_pixel_ayari: {
        Row: { pixel_id: string | null };
        Relationships: [];
      };
      olcumleme_ayarlari: {
        Row: {
          ads_etiket: string | null;
          ads_id: string | null;
          ga4: string | null;
          gtm: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      egitime_katildi_mi: { Args: { p_user?: string }; Returns: boolean };
      eski_oturum_kayitlarini_sil: { Args: never; Returns: undefined };
      gorusme_iptal: { Args: { p_id: string }; Returns: undefined };
      gorusme_talep_olustur: {
        Args: { p_aciklama?: string; p_konu: string; p_tercih_zaman?: string };
        Returns: string;
      };
      gorev_sagligi: {
        Args: never;
        Returns: {
          toplam: number;
          basarili: number;
          basarisiz: number;
          son_durum: number | null;
          son_zaman: string | null;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      is_enrolled: { Args: { target_course_id: string }; Returns: boolean };
      oturum_kaydet: {
        Args: {
          p_bolge?: string;
          p_cihaz?: string;
          p_ip?: string;
          p_isletim_sistemi?: string;
          p_sehir?: string;
          p_tarayici?: string;
          p_ulke?: string;
        };
        Returns: undefined;
      };
      rol_ata: {
        Args: { hedef_kullanici: string; yeni_rol: Database["public"]["Enums"]["user_role"] };
        Returns: undefined;
      };
    };
    Enums: {
      course_durum: "taslak" | "yayinda" | "arsivlendi";
      enrollment_durum: "aktif" | "tamamlandi" | "iptal";
      gorusme_durum: "talep" | "odeme_bekliyor" | "planlandi" | "tamamlandi" | "iptal";
      mesaj_turu: "iletisim" | "teklif";
      payment_durum: "odendi" | "bekliyor" | "iade";
      seans_durum: "planlandi" | "tamamlandi" | "iptal";
      ticket_durum: "acik" | "inceleniyor" | "yanitlandi" | "kapandi";
      user_role: "ogrenci" | "admin";
    };
    CompositeTypes: Record<never, never>;
  };
};

type Genel = Database["public"];

/** Bir tablonun ya da görünümün satır tipi: Satir<"payments"> gibi. */
export type Satir<T extends keyof (Genel["Tables"] & Genel["Views"])> =
  (Genel["Tables"] & Genel["Views"])[T] extends { Row: infer R } ? R : never;

/** Bir enum'ın değerleri: EnumDeger<"payment_durum"> gibi. */
export type EnumDeger<T extends keyof Genel["Enums"]> = Genel["Enums"][T];

/** Ekleme gövdesinin tipi: Ekle<"referanslar"> gibi. */
export type Ekle<T extends keyof Genel["Tables"]> = Genel["Tables"][T]["Insert"];

/** Güncelleme gövdesinin tipi. */
export type Guncelle<T extends keyof Genel["Tables"]> = Genel["Tables"][T]["Update"];

/** Tablo adları; adı değişkende taşıyan yerler için. */
export type TabloAdi = keyof Genel["Tables"];
