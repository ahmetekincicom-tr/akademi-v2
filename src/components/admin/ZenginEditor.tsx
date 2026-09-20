"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextSelection } from "@tiptap/pm/state";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { depoUrl } from "@/lib/depo";
import { LinkSecici, type LinkSecim } from "@/components/admin/LinkSecici";
import type { IcLinkHedef } from "@/lib/yazilar";
import { BlogBloklari, blokEkle, notEtiketiniGuncelle } from "@/components/admin/tiptap/BlogBloklari";
import { SlashKomut } from "@/components/admin/tiptap/SlashKomut";
import { BlogGorsel } from "@/components/admin/tiptap/BlogGorsel";
import { GorselPanel } from "@/components/admin/tiptap/GorselPanel";
import { BLOKLAR } from "@/lib/blog-bloklar";
import { optimizeGorsel, GorselHatasi, boyutMetni } from "@/lib/gorsel-optimize";
import { seoTabanAd, storageYolu } from "@/lib/gorsel-ad";

/**
 * Zengin metin editörü (TipTap).
 *
 * Kaynak belge JSON olarak tutuluyor (kayıpsız düzenleme), herkese açık render
 * için HTML de birlikte üretiliyor. İkisini de değişimde yukarı bildiriyor;
 * kaydeden form ikisini de veritabanına yazıyor.
 *
 * Araç çubuğu ikon yerine kısa metin etiketleri kullanıyor: projenin ikon seti
 * editör simgelerini (kalın, liste vb.) içermiyor ve 11 SVG eklemek yerine
 * yönetim ekranında net metin etiketleri yeterli.
 *
 * Next SSR ile hidrasyon uyuşmazlığı olmasın diye immediatelyRender: false.
 */

type Deger = { html: string; json: unknown };

function AracDugmesi({
  aktif,
  onTikla,
  etiket,
  children,
}: {
  aktif?: boolean;
  onTikla: () => void;
  etiket: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onTikla}
      aria-label={etiket}
      title={etiket}
      className={`flex h-9 min-w-9 items-center justify-center rounded-[8px] border px-2 text-[13px] font-semibold transition ${
        aktif
          ? "border-brand bg-brand/10 text-brand"
          : "border-ink/12 bg-white text-[#5C6273] hover:border-brand hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Ayrac() {
  return <span className="mx-1 h-5 w-px bg-ink/12" />;
}

function htmlKacir(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function ZenginEditor({
  baslangicJson,
  baslangicHtml = "",
  icHedefler = [],
  yaziSlug,
  onDegisim,
}: {
  baslangicJson: unknown;
  /**
   * JSON boşsa/geçersizse başlangıç içeriği bu HTML'den kuruluyor. WordPress'ten
   * taşınan yazılarda icerik_json boş ('{}'); içerik yalnızca icerik_html'de
   * duruyor. Bu olmadan taşınan bir yazı editörde boş açılır ve kaydedince
   * içerik silinirdi.
   */
  baslangicHtml?: string;
  icHedefler?: IcLinkHedef[];
  /** Yeni görsellerin SEO dosya adı için yedek kaynak (yazının slug'ı). */
  yaziSlug?: string;
  onDegisim: (d: Deger) => void;
}) {
  const dosyaGirdi = useRef<HTMLInputElement>(null);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [gorselDurum, setGorselDurum] = useState<string | null>(null);
  // Aynı dosyanın çift eklenmesini engelleyen kilit (yükleme sürerken).
  const yuklemeKilit = useRef(false);
  const [linkAcik, setLinkAcik] = useState(false);
  const [blokMenu, setBlokMenu] = useState(false);
  const blokSarici = useRef<HTMLDivElement>(null);

  // Slash menüsündeki "Görsel" maddesi bir sayaç artırıyor; efekt dosya
  // seçiciyi açıyor. Böylece editör yapılandırmasına ref okuyan bir fonksiyon
  // GEÇİLMİYOR (render sırasında ref erişimi olmuyor).
  const [gorselIstek, setGorselIstek] = useState(0);
  const gorselAc = useCallback(() => setGorselIstek((n) => n + 1), []);
  useEffect(() => {
    if (gorselIstek > 0) dosyaGirdi.current?.click();
  }, [gorselIstek]);

  // "Blok Ekle" menüsü dışarı tıklanınca kapansın.
  useEffect(() => {
    if (!blokMenu) return;
    const kapat = (e: MouseEvent) => {
      if (!blokSarici.current?.contains(e.target as Node)) setBlokMenu(false);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [blokMenu]);

  // Geçerli bir ProseMirror belgesi varsa onu kullan; yoksa HTML'den kur.
  // TipTap `content` hem JSON belge hem HTML string kabul ediyor.
  const gecerliDoc =
    baslangicJson && typeof baslangicJson === "object" && (baslangicJson as { type?: string }).type
      ? (baslangicJson as object)
      : baslangicHtml || "";

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      // Base Image yalnızca TAŞINAN içerikteki düz <img>'ler için (round-trip).
      Image.configure({ HTMLAttributes: { class: "blog-gorsel" } }),
      // Yeni yüklemeler: metadata'lı figure görseli (alt, caption, boyut, lightbox).
      BlogGorsel,
      Placeholder.configure({ placeholder: "Yazmaya başla…" }),
      // Özel bloklar: Bilgi, Uyarı, İpucu, Prompt.
      ...BlogBloklari,
      // "/" slash menüsü: H2/H3/Görsel/Bilgi/Uyarı/Not/Prompt. Görsel maddesi
      // mevcut dosya seçiciyi tetikliyor (aynı yükleme akışı).
      SlashKomut.configure({ onGorsel: gorselAc }),
    ],
    content: gecerliDoc,
    editorProps: {
      attributes: { class: "blog-icerik min-h-[360px] px-4 py-4 outline-none" },
    },
    onUpdate: ({ editor }) => onDegisim({ html: editor.getHTML(), json: editor.getJSON() }),
  });

  const linkUygula = (s: LinkSecim) => {
    if (!editor) return;
    setLinkAcik(false);
    const bos = editor.state.selection.empty;
    if (bos) {
      // Seçili metin yoksa hedefin başlığını (ya da URL'yi) bağlı metin olarak ekle.
      const metin = s.baslik ?? s.url;
      const oz = s.ic ? "" : ' target="_blank" rel="noopener noreferrer"';
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${htmlKacir(s.url)}"${oz}>${htmlKacir(metin)}</a>`)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: s.url, target: s.ic ? null : "_blank", rel: s.ic ? null : "noopener noreferrer" })
        .run();
    }
  };

  const linkKaldir = () => {
    if (!editor) return;
    setLinkAcik(false);
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  };

  // React Compiler otomatik memoize ediyor; manuel useCallback kaldırıldı
  // (davranış aynı — yalnız derleyici uyarısı gidiyor).
  const gorselSec = async (dosya: File | undefined) => {
    {
      // Kilit: yükleme sürerken aynı dosya ikinci kez eklenmesin.
      if (!dosya || !editor || yuklemeKilit.current) return;
      yuklemeKilit.current = true;
      setGorselYukleniyor(true);
      try {
        // 1) Tarayıcıda optimize: resize + (mümkünse) WebP. Supabase'e yalnızca
        //    hazır dosya gidiyor.
        setGorselDurum("Görsel hazırlanıyor…");
        const sonuc = await optimizeGorsel(dosya);

        // 2) SEO uyumlu dosya adı + düzenli Storage yolu (blog/yıl/ay/ad-ek.uzanti).
        setGorselDurum("Optimize ediliyor…");
        const taban = seoTabanAd({ yaziSlug: yaziSlug ?? null });
        const yol = storageYolu(taban, sonuc.uzanti);

        // 3) Yükle.
        setGorselDurum("Yükleniyor…");
        const supabase = createClient();
        const { error } = await supabase.storage
          .from("kapaklar")
          .upload(yol, sonuc.blob, { cacheControl: "3600", contentType: sonuc.mime, upsert: false });
        if (error) throw new Error(error.message);

        const url = depoUrl("kapaklar", yol);
        if (!url) throw new Error("Görsel adresi üretilemedi.");

        // 4) Metadata'yı figure node'una yaz.
        editor
          .chain()
          .focus()
          .insertContent({
            type: "blogGorsel",
            attrs: {
              src: url,
              alt: "",
              caption: "",
              width: sonuc.genislik,
              height: sonuc.yukseklik,
              lightboxEnabled: true,
              decorative: false,
              originalFilename: dosya.name,
              mimeType: sonuc.mime,
              fileSize: sonuc.optimizeBoyut,
            },
          })
          .run();

        setGorselDurum(`Tamamlandı · ${boyutMetni(sonuc.orijinalBoyut)} → ${boyutMetni(sonuc.optimizeBoyut)}`);
        window.setTimeout(() => setGorselDurum(null), 2800);
      } catch (e) {
        // Kullanıcıya anlaşılır mesaj; teknik iz konsola. Editördeki içerik
        // korunuyor, kırık görsel node'u eklenmiyor.
        const mesaj =
          e instanceof GorselHatasi
            ? e.message
            : "Görsel yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.";
        setGorselDurum(null);
        console.error("[gorsel] yükleme hatası:", e);
        window.alert(mesaj);
      } finally {
        yuklemeKilit.current = false;
        setGorselYukleniyor(false);
      }
    }
  };

  if (!editor) {
    return <div className="min-h-[420px] rounded-[12px] border border-ink/12 bg-mist" />;
  }

  return (
    <div className="rounded-[12px] border border-ink/12 bg-white">
      {/*
        Sticky araç çubuğu: admin başlığının (66px + güvenli alan) hemen altında
        sabit kalır; uzun yazılarda araçlara ulaşmak için başa dönmek gerekmez.
        Sadece editör kolonu genişliğinde (sağ SEO sidebar'ına taşmaz, çünkü
        grid kolonu içinde). Kök kutuda overflow yok — sticky çalışsın diye;
        köşe yuvarlaklığı araç çubuğunun üst köşelerinde. z-30: sayfa
        başlığının (z-40) altında, içeriğin üstünde. Sayfanın doğal scroll'u
        korunur; editör içine ayrı scrollbar yok.
      */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+66px)] z-30 flex flex-wrap items-center gap-[6px] rounded-t-[12px] border-b border-ink/10 bg-mist/85 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-mist/70">
        <AracDugmesi etiket="Kalın" aktif={editor.isActive("bold")} onTikla={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </AracDugmesi>
        <AracDugmesi etiket="İtalik" aktif={editor.isActive("italic")} onTikla={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Başlık 2" aktif={editor.isActive("heading", { level: 2 })} onTikla={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </AracDugmesi>
        <AracDugmesi etiket="Başlık 3" aktif={editor.isActive("heading", { level: 3 })} onTikla={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Madde listesi" aktif={editor.isActive("bulletList")} onTikla={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </AracDugmesi>
        <AracDugmesi etiket="Numaralı liste" aktif={editor.isActive("orderedList")} onTikla={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </AracDugmesi>
        <AracDugmesi etiket="Alıntı" aktif={editor.isActive("blockquote")} onTikla={() => editor.chain().focus().toggleBlockquote().run()}>
          ❝
        </AracDugmesi>
        <Ayrac />
        <AracDugmesi etiket="Bağlantı" aktif={editor.isActive("link")} onTikla={() => setLinkAcik(true)}>
          🔗
        </AracDugmesi>
        <AracDugmesi etiket={gorselYukleniyor ? "Yükleniyor…" : "Görsel ekle"} onTikla={() => dosyaGirdi.current?.click()}>
          {gorselYukleniyor ? "…" : "🖼"}
        </AracDugmesi>
        <Ayrac />

        {/* Özel blok ekleme menüsü. Aynı bloklar `/bilgi`, `/uyari`, `/ipucu`,
            `/prompt` slash komutlarıyla da eklenebiliyor. */}
        <div className="relative" ref={blokSarici}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setBlokMenu((a) => !a)}
            aria-haspopup="menu"
            aria-expanded={blokMenu}
            className="flex h-9 items-center gap-1 rounded-[8px] border border-ink/12 bg-white px-2.5 text-[13px] font-semibold text-[#5C6273] transition hover:border-brand hover:text-brand"
          >
            Blok Ekle
            <span aria-hidden className="text-[10px]">▾</span>
          </button>
          {blokMenu && (
            <div
              role="menu"
              className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[160px] overflow-hidden rounded-[10px] border border-ink/12 bg-white py-1 shadow-[0_12px_30px_rgba(10,13,24,0.14)]"
            >
              {BLOKLAR.map((b) => (
                <button
                  key={b.tip}
                  type="button"
                  role="menuitem"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    blokEkle(editor, b.tip);
                    setBlokMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] text-ink transition hover:bg-mist"
                >
                  <span className={`aea-blok-ikon aea-blok-ikon--${b.data}`} aria-hidden />
                  {b.menu}
                  <span className="ml-auto font-mono text-[11px] text-[#9aa0ae]">/{b.komut}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {editor.isActive("tipBlock") && (
          <AracDugmesi
            etiket="Not etiketini düzenle"
            onTikla={() => {
              const mevcut = (editor.getAttributes("tipBlock").etiket as string) || "Ahmet'in Notu";
              const yeni = window.prompt("Not etiketi", mevcut);
              if (yeni != null) notEtiketiniGuncelle(editor, yeni);
            }}
          >
            Etiket
          </AracDugmesi>
        )}
        <Ayrac />
        <AracDugmesi etiket="Geri al" onTikla={() => editor.chain().focus().undo().run()}>
          ↶
        </AracDugmesi>
        <AracDugmesi etiket="Yinele" onTikla={() => editor.chain().focus().redo().run()}>
          ↷
        </AracDugmesi>
      </div>

      {/* Görsel yükleme durumu: hazırlanıyor → optimize → yükleniyor → tamam. */}
      {gorselDurum && (
        <div
          role="status"
          aria-live="polite"
          className="border-b border-ink/10 bg-brand/[0.05] px-3 py-2 text-[12.5px] font-medium text-brand"
        >
          {gorselDurum}
        </div>
      )}

      {/* Seçili görselin ayar paneli (alt, caption, dekoratif, lightbox, SEO). */}
      <GorselPanel editor={editor} />

      {/*
        Metin seçilince beliren küçük biçim menüsü (Kalın / İtalik / Bağlantı).
        Mevcut komutlara bağlı; bağlantı düğmesi zaten var olan LinkSecici'yi
        açıyor. Görsel/blok node seçimlerinde ve prompt/kod bloğunda gizli.
      */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 120, zIndex: 45 }}
        shouldShow={({ editor, state }) => {
          const { selection } = state;
          if (selection.empty) return false;
          if (!(selection instanceof TextSelection)) return false;
          if (editor.isActive("promptBlock") || editor.isActive("codeBlock")) return false;
          return true;
        }}
      >
        <div className="flex items-center gap-1 rounded-[10px] border border-ink/12 bg-white p-1 shadow-[0_10px_28px_rgba(10,13,24,0.16)]">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Kalın"
            title="Kalın"
            className={`flex h-8 min-w-8 items-center justify-center rounded-[7px] px-2 text-[13px] font-bold transition ${
              editor.isActive("bold") ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:bg-mist"
            }`}
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="İtalik"
            title="İtalik"
            className={`flex h-8 min-w-8 items-center justify-center rounded-[7px] px-2 text-[13px] italic transition ${
              editor.isActive("italic") ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:bg-mist"
            }`}
          >
            I
          </button>
          <span className="mx-0.5 h-5 w-px bg-ink/12" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setLinkAcik(true)}
            aria-label="Bağlantı"
            title="Bağlantı"
            className={`flex h-8 min-w-8 items-center justify-center rounded-[7px] px-2 text-[13px] transition ${
              editor.isActive("link") ? "bg-brand/10 text-brand" : "text-[#5C6273] hover:bg-mist"
            }`}
          >
            🔗
          </button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <input
        ref={dosyaGirdi}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          void gorselSec(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {linkAcik && (
        <LinkSecici
          hedefler={icHedefler}
          mevcutUrl={(editor.getAttributes("link").href as string | undefined) || undefined}
          onSec={linkUygula}
          onKaldir={linkKaldir}
          onKapat={() => setLinkAcik(false)}
        />
      )}
    </div>
  );
}
