
    (function () {
        "use strict";

        const HEADER_SOURCE = "SKANDI_CUSTOMER_HEADER_EXPANDBAR";
        const FOOTER_SOURCE = "SKANDI_CUSTOMER_FOOTER";
        const PARENT_SOURCE = "SKANDI_WIX_PARENT";

        const PARENT_ORIGIN = (() => {
            try {
                return document.referrer ? new URL(document.referrer).origin : "*";
            } catch (_) {
                return "*";
            }
        })();

        function postToParent(message) {
            window.parent.postMessage(message, PARENT_ORIGIN);
        }

        const I18N = {
            EN: {
                "nav.packages":"Packages","nav.destinations":"Destinations","nav.club":"SKANDI Club","nav.info":"Travel Info",
                "nav.search":"Search","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Sign in",
                "settings.language":"Language","settings.currency":"Currency","settings.apply":"Apply Settings",
                "welcome.title":"Welcome to SKANDI","welcome.copy":"Please confirm your preferred language and currency before continuing.","welcome.btn":"Continue to Site",
                "footer.news.title":"Get SKANDI offers and travel inspiration","footer.news.desc":"Receive destination guides, Signature Collection updates and member offers.",
                "footer.news.btn":"Sign up","footer.col1.title":"Book & Travel","footer.col1.l1":"Manage your booking","footer.col1.l2":"Book a trip",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinations","footer.col1.l5":"Hotels","footer.col1.l6":"Flights",
                "footer.col1.l7":"Tours & Activities","footer.col1.l8":"Car Rental","footer.col1.l9":"Offers","footer.col2.title":"Help & Travel Info",
                "footer.col2.l1":"Before you travel","footer.col2.l2":"Passport & visa","footer.col2.l3":"Baggage","footer.col2.l4":"Insurance",
                "footer.col2.l5":"Help Center","footer.col2.l6":"Contact us","footer.col2.l7":"Special assistance","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Join SKANDI Club","footer.col3.l2":"Member benefits","footer.col3.l3":"My Club Status",
                "footer.col3.l4":"Travel Wallet & Vouchers","footer.col4.title":"About","footer.col4.l1":"About SKANDI Travels",
                "footer.col4.l2":"Newsroom","footer.col4.l3":"Careers","footer.col4.l4":"Our Network",
                "footer.bottom.terms":"Payment methods, supplier terms and package travel conditions may vary by product.",
                "footer.bottom.l1":"Legal","footer.bottom.l8":"Terms of Use","footer.bottom.l2":"Accessibility","footer.bottom.l3":"Website disclaimer",
                "footer.bottom.l4":"Privacy Policy","footer.bottom.l5":"Cookies Policy","footer.bottom.l6":"Booking Terms","footer.bottom.l7":"Staff login"
            },
            SV: {
                "nav.packages":"Paketresor","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Reseinfo",
                "nav.search":"Sök","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logga in",
                "settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Spara inställningar",
                "welcome.title":"Välkommen till SKANDI","welcome.copy":"Välj språk och valuta innan du fortsätter.","welcome.btn":"Fortsätt till SKANDI TRAVELS",
                "footer.news.title":"Få de senaste SKANDI-resemålen och erbjudanden","footer.news.desc":"De bästa destinationsguiderna, först på uppdateringar om SKANDI Collections och medlemserbjudanden.",
                "footer.news.btn":"Börja Prenumerera","footer.col1.title":"Boka & Res","footer.col1.l1":"Hantera din bokning","footer.col1.l2":"Boka resa",
                "footer.col1.l3":"SKANDI Collections","footer.col1.l4":"Destinationer","footer.col1.l5":"Hotell","footer.col1.l6":"Flyg",
                "footer.col1.l7":"Guided Turer & Aktiviteter","footer.col1.l8":"Hyrbil","footer.col1.l9":"Erbjudanden","footer.col2.title":"Reseinfo",
                "footer.col2.l1":"Innan du reser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Försäkring",
                "footer.col2.l5":"Hjälpcenter","footer.col2.l6":"Kontakta oss","footer.col2.l7":"Assistans under Resan","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Gå med i SKANDI Club","footer.col3.l2":"Medlemsförmåner","footer.col3.l3":"Min klubbstatus",
                "footer.col3.l4":"Resekassa & värdebevis","footer.col4.title":"Om oss","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhetsrum","footer.col4.l3":"Jobba hos oss","footer.col4.l4":"Här finns SKANDI",
                "footer.bottom.terms":"Betalningsmetoderna, leverantörs- och paketresevilkoren kan variera mellan produkter.",
                "footer.bottom.l1":"Regler och villkor","footer.bottom.l8":"Användarvillkor","footer.bottom.l2":"Tillgänglighetsredogörelse","footer.bottom.l3":"Allmänna villkor:",
                "footer.bottom.l4":"Integritetspolicy","footer.bottom.l5":"Cookiepolicy","footer.bottom.l6":"Bokningsvillkor","footer.bottom.l7":"Personalinloggning"
            },
            NO: {
                "nav.packages":"Pakkereiser","nav.destinations":"Reisemål","nav.club":"Signature Club","nav.info":"Reiseinfo",
                "nav.search":"Søk","nav.clubBtn":"SKANDI Club","nav.menu":"MENY","nav.signIn":"Logg inn",
                "settings.language":"Språk","settings.currency":"Valuta","settings.apply":"Lagre innstillinger",
                "welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekreft ønsket språk og valuta før du fortsetter.","welcome.btn":"Fortsett til SKANDI TRAVELS",
                "footer.news.title":"Få SKANDI-tilbud og reiseinspirasjon","footer.news.desc":"Motta reisemålsguider, oppdateringer om Signature Collection og medlemstilbud.",
                "footer.news.btn":"Registrer deg","footer.col1.title":"Bestill & Reis","footer.col1.l1":"Administrer bestillingen","footer.col1.l2":"Bestill en reise",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Reisemål","footer.col1.l5":"Hotell","footer.col1.l6":"Fly",
                "footer.col1.l7":"Opplevelser og aktiviteter","footer.col1.l8":"Leiebil","footer.col1.l9":"Tilbud","footer.col2.title":"Hjelp & Reiseinfo",
                "footer.col2.l1":"Før du reiser","footer.col2.l2":"Pass & visum","footer.col2.l3":"Bagasje","footer.col2.l4":"Forsikring",
                "footer.col2.l5":"Hjelpesenter","footer.col2.l6":"Kontakt oss","footer.col2.l7":"Tilrettelagt assistanse","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Bli med i SKANDI Club","footer.col3.l2":"Medlemsfordeler","footer.col3.l3":"Min klubbstatus",
                "footer.col3.l4":"Reiselommebok & kuponger","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhetsrom","footer.col4.l3":"Karriere","footer.col4.l4":"Vårt nettverk",
                "footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkereisevilkår kan variere etter produkt.",
                "footer.bottom.l1":"Juridisk","footer.bottom.l8":"Brukervilkår","footer.bottom.l2":"Tilgjengelighet","footer.bottom.l3":"Ansvarsfraskrivelse",
                "footer.bottom.l4":"Personvern","footer.bottom.l5":"Cookies","footer.bottom.l6":"Bestillingsvilkår","footer.bottom.l7":"Ansattinnlogging"
            },
            DA: {
                "nav.packages":"Pakkerejser","nav.destinations":"Destinationer","nav.club":"Signature Club","nav.info":"Rejseinfo",
                "nav.search":"Søg","nav.clubBtn":"SKANDI Club","nav.menu":"MENU","nav.signIn":"Log ind",
                "settings.language":"Sprog","settings.currency":"Valuta","settings.apply":"Gem indstillinger",
                "welcome.title":"Velkommen til SKANDI","welcome.copy":"Bekræft dit foretrukne sprog og din valuta, før du fortsætter.","welcome.btn":"Fortsæt til hjemmesiden",
                "footer.news.title":"Få SKANDI-tilbud og rejseinspiration","footer.news.desc":"Modtag destinationsguider, Signature Collection-opdateringer og medlemstilbud.",
                "footer.news.btn":"Tilmeld dig","footer.col1.title":"Book & Rejs","footer.col1.l1":"Administrer din booking","footer.col1.l2":"Book en rejse",
                "footer.col1.l3":"Signature Collection","footer.col1.l4":"Destinationer","footer.col1.l5":"Hoteller","footer.col1.l6":"Fly",
                "footer.col1.l7":"Oplevelser & aktiviteter","footer.col1.l8":"Billeje","footer.col1.l9":"Tilbud","footer.col2.title":"Hjælp & Rejseinfo",
                "footer.col2.l1":"Før du rejser","footer.col2.l2":"Pas & visum","footer.col2.l3":"Bagage","footer.col2.l4":"Forsikring",
                "footer.col2.l5":"Hjælpecenter","footer.col2.l6":"Kontakt os","footer.col2.l7":"Særlig assistance","footer.col3.title":"SKANDI Club",
                "footer.col3.l1":"Bliv medlem af SKANDI Club","footer.col3.l2":"Medlemsfordele","footer.col3.l3":"Min klubstatus",
                "footer.col3.l4":"Rejsepung & værdibeviser","footer.col4.title":"Om","footer.col4.l1":"Om SKANDI Travels",
                "footer.col4.l2":"Nyhedsrum","footer.col4.l3":"Karriere","footer.col4.l4":"Vores netværk",
                "footer.bottom.terms":"Betalingsmetoder, leverandørvilkår og pakkerejsevilkår kan variere efter produkt.",
                "footer.bottom.l1":"Juridisk","footer.bottom.l8":"Brugsvilkår","footer.bottom.l2":"Tilgængelighed","footer.bottom.l3":"Ansvarsfraskrivelse",
                "footer.bottom.l4":"Behandling af persondata","footer.bottom.l5":"Cookiepolitik","footer.bottom.l6":"Bookingvilkår","footer.bottom.l7":"Medarbejderlogin"
            },
            TG: {
  "nav.packages": "แพ็กเกจท่องเที่ยว",
  "nav.destinations": "จุดหมายปลายทาง",
  "nav.club": "Signature Club",
  "nav.info": "ข้อมูลการเดินทาง",
  "nav.search": "ค้นหา",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "เมนู",
  "nav.signIn": "เข้าสู่ระบบ",
  "settings.language": "ภาษา",
  "settings.currency": "สกุลเงิน",
  "settings.apply": "บันทึกการตั้งค่า",
  "welcome.title": "ยินดีต้อนรับสู่ SKANDI",
  "welcome.copy": "กรุณายืนยันภาษาและสกุลเงินที่คุณต้องการก่อนดำเนินการต่อ",
  "welcome.btn": "เข้าสู่เว็บไซต์",
  "footer.news.title": "รับข้อเสนอพิเศษและแรงบันดาลใจในการท่องเที่ยวจาก SKANDI",
  "footer.news.desc": "รับคู่มือท่องเที่ยว อัปเดตล่าสุดจาก Signature Collection และข้อเสนอพิเศษสำหรับสมาชิก",
  "footer.news.btn": "ลงทะเบียน",
  "footer.col1.title": "จองและเดินทาง",
  "footer.col1.l1": "จัดการการจองของฉัน",
  "footer.col1.l2": "จองการเดินทาง",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "จุดหมายปลายทาง",
  "footer.col1.l5": "โรงแรม",
  "footer.col1.l6": "เที่ยวบิน",
  "footer.col1.l7": "ทัวร์และกิจกรรม",
  "footer.col1.l8": "บริการเช่ารถ",
  "footer.col1.l9": "ข้อเสนอพิเศษ",
  "footer.col2.title": "ความช่วยเหลือและข้อมูลการเดินทาง",
  "footer.col2.l1": "ก่อนการเดินทาง",
  "footer.col2.l2": "พาสปอร์ตและวีซ่า",
  "footer.col2.l3": "สัมภาระ",
  "footer.col2.l4": "ประกันภัย",
  "footer.col2.l5": "ศูนย์ช่วยเหลือ",
  "footer.col2.l6": "ติดต่อเรา",
  "footer.col2.l7": "ความช่วยเหลือพิเศษ",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "เข้าร่วม SKANDI Club",
  "footer.col3.l2": "สิทธิประโยชน์สำหรับสมาชิก",
  "footer.col3.l3": "สถานะสมาชิกของฉัน",
  "footer.col3.l4": "กระเป๋าเงินเดินทางและคูปอง",
  "footer.col4.title": "เกี่ยวกับเรา",
  "footer.col4.l1": "เกี่ยวกับ SKANDI Travels",
  "footer.col4.l2": "ห้องข่าวประชาสัมพันธ์",
  "footer.col4.l3": "ร่วมงานกับเรา",
  "footer.col4.l4": "เครือข่ายของเรา",
  "footer.bottom.terms": "วิธีการชำระเงิน ข้อกำหนดของผู้ให้บริการ และเงื่อนไขแพ็กเกจท่องเที่ยวอาจแตกต่างกันไปตามแต่ละผลิตภัณฑ์",
  "footer.bottom.l1": "ข้อมูลทางกฎหมาย",
  "footer.bottom.l8": "ข้อกำหนดการใช้งาน",
  "footer.bottom.l2": "การเข้าถึงที่เท่าเทียม",
  "footer.bottom.l3": "ข้อจำกัดความรับผิดชอบ",
  "footer.bottom.l4": "นโยบายความเป็นส่วนตัว",
  "footer.bottom.l5": "นโยบายคุกกี้",
  "footer.bottom.l6": "เงื่อนไขการจอง",
  "footer.bottom.l7": "เข้าสู่ระบบสำหรับพนักงาน"
},
            FI: {
  "nav.packages": "Pakettimatkat",
  "nav.destinations": "Kohteet",
  "nav.club": "Signature Club",
  "nav.info": "Matkatiedot",
  "nav.search": "Hae",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "VALIKKO",
  "nav.signIn": "Kirjaudu sisään",
  "settings.language": "Kieli",
  "settings.currency": "Valuutta",
  "settings.apply": "Tallenna asetukset",
  "welcome.title": "Tervetuloa SKANDIin",
  "welcome.copy": "Vahvista haluamasi kieli ja valuutta ennen kuin jatkat.",
  "welcome.btn": "Jatka sivustolle",
  "footer.news.title": "Löydä SKANDI-tarjoukset ja matkainspiraatio",
  "footer.news.desc": "Tilaa kohdeoppaat, Signature Collection -päivitykset sekä jäsentarjoukset.",
  "footer.news.btn": "Tilaa uutiskirje",
  "footer.col1.title": "Varaa & Matkusta",
  "footer.col1.l1": "Hallitse varaustasi",
  "footer.col1.l2": "Varaa matka",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Kohteet",
  "footer.col1.l5": "Hotellit",
  "footer.col1.l6": "Lennot",
  "footer.col1.l7": "Retket & Aktiviteetit",
  "footer.col1.l8": "Autonvuokraus",
  "footer.col1.l9": "Tarjoukset",
  "footer.col2.title": "Apua & Matkatiedot",
  "footer.col2.l1": "Ennen matkaa",
  "footer.col2.l2": "Passi & viisumi",
  "footer.col2.l3": "Matkatavarat",
  "footer.col2.l4": "Vakuutus",
  "footer.col2.l5": "Asiakaspalvelu",
  "footer.col2.l6": "Ota yhteyttä",
  "footer.col2.l7": "Avustettavat matkustajat",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Liity SKANDI Clubiin",
  "footer.col3.l2": "Jäsenedut",
  "footer.col3.l3": "Oma klubitaso",
  "footer.col3.l4": "Matkalompakko & etukupongit",
  "footer.col4.title": "Tietoa meistä",
  "footer.col4.l1": "Tietoa SKANDI Travelsista",
  "footer.col4.l2": "Medialle",
  "footer.col4.l3": "Urat",
  "footer.col4.l4": "Verkostomme",
  "footer.bottom.terms": "Maksutavat, palveluntarjoajien ehdot ja valmismatkaehdot voivat vaihdella tuotekohtaisesti.",
  "footer.bottom.l1": "Oikeudelliset tiedot",
  "footer.bottom.l8": "Käyttöehdot",
  "footer.bottom.l2": "Saavutettavuus",
  "footer.bottom.l3": "Vastuuvapauslauseke",
  "footer.bottom.l4": "Tietosuojaseloste",
  "footer.bottom.l5": "Evästekäytännöt",
  "footer.bottom.l6": "Varausehdot",
  "footer.bottom.l7": "Henkilökunnan sisäänkirjautuminen"
},
ES:{
  "nav.packages": "Paquetes de viaje",
  "nav.destinations": "Destinos",
  "nav.club": "Signature Club",
  "nav.info": "Información de viaje",
  "nav.search": "Buscar",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENÚ",
  "nav.signIn": "Iniciar sesión",
  "settings.language": "Idioma",
  "settings.currency": "Moneda",
  "settings.apply": "Guardar configuración",
  "welcome.title": "Bienvenido a SKANDI",
  "welcome.copy": "Confirma tu idioma y moneda preferidos antes de continuar.",
  "welcome.btn": "Continuar al sitio web",
  "footer.news.title": "Recibe ofertas de SKANDI e inspiración para viajar",
  "footer.news.desc": "Recibe guías de destinos, actualizaciones de Signature Collection y ofertas para miembros.",
  "footer.news.btn": "Registrarse",
  "footer.col1.title": "Reserva y viaja",
  "footer.col1.l1": "Gestionar mi reserva",
  "footer.col1.l2": "Reservar un viaje",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinos",
  "footer.col1.l5": "Hoteles",
  "footer.col1.l6": "Vuelos",
  "footer.col1.l7": "Excursiones y actividades",
  "footer.col1.l8": "Alquiler de coches",
  "footer.col1.l9": "Ofertas",
  "footer.col2.title": "Ayuda e información de viaje",
  "footer.col2.l1": "Antes de viajar",
  "footer.col2.l2": "Pasaporte y visados",
  "footer.col2.l3": "Equipaje",
  "footer.col2.l4": "Seguros",
  "footer.col2.l5": "Centro de ayuda",
  "footer.col2.l6": "Contacto",
  "footer.col2.l7": "Asistencia especial",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Únete a SKANDI Club",
  "footer.col3.l2": "Beneficios de membresía",
  "footer.col3.l3": "Mi estado del club",
  "footer.col3.l4": "Monedero de viaje y cupones",
  "footer.col4.title": "Acerca de",
  "footer.col4.l1": "Acerca de SKANDI Travels",
  "footer.col4.l2": "Sala de prensa",
  "footer.col4.l3": "Empleo",
  "footer.col4.l4": "Nuestra red",
  "footer.bottom.terms": "Los métodos de pago, las condiciones del proveedor y los términos de los paquetes de viaje pueden variar según el producto.",
  "footer.bottom.l1": "Información legal",
  "footer.bottom.l8": "Términos de uso",
  "footer.bottom.l2": "Accesibilidad",
  "footer.bottom.l3": "Aviso legal",
  "footer.bottom.l4": "Política de privacidad",
  "footer.bottom.l5": "Política de cookies",
  "footer.bottom.l6": "Condiciones de reserva",
  "footer.bottom.l7": "Acceso para empleados"
},
DE: {
  "nav.packages": "Pauschalreisen",
  "nav.destinations": "Reiseziele",
  "nav.club": "Signature Club",
  "nav.info": "Reiseinfos",
  "nav.search": "Suchen",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENÜ",
  "nav.signIn": "Anmelden",
  "settings.language": "Sprache",
  "settings.currency": "Währung",
  "settings.apply": "Einstellungen speichern",
  "welcome.title": "Willkommen bei SKANDI",
  "welcome.copy": "Bitte bestätigen Sie Ihre bevorzugte Sprache und Währung, bevor Sie fortfahren.",
  "welcome.btn": "Weiter zur Website",
  "footer.news.title": "Erhalten Sie SKANDI-Angebote und Reiseinspirationen",
  "footer.news.desc": "Erhalten Sie Reiseführer, Updates zur Signature Collection und Mitgliederangebote.",
  "footer.news.btn": "Registrieren",
  "footer.col1.title": "Buchen & Reisen",
  "footer.col1.l1": "Buchung verwalten",
  "footer.col1.l2": "Reise buchen",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Reiseziele",
  "footer.col1.l5": "Hotels",
  "footer.col1.l6": "Flüge",
  "footer.col1.l7": "Ausflüge & Aktivitäten",
  "footer.col1.l8": "Mietwagen",
  "footer.col1.l9": "Angebote",
  "footer.col2.title": "Hilfe & Reiseinfos",
  "footer.col2.l1": "Vor der Reise",
  "footer.col2.l2": "Reisepass & Visum",
  "footer.col2.l3": "Gepäck",
  "footer.col2.l4": "Versicherungen",
  "footer.col2.l5": "Hilfezentrum",
  "footer.col2.l6": "Kontakt",
  "footer.col2.l7": "Barrierefreies Reisen",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "SKANDI Club beitreten",
  "footer.col3.l2": "Mitgliedsvorteile",
  "footer.col3.l3": "Mein Clubstatus",
  "footer.col3.l4": "Reise-Geldbörse & Gutscheine",
  "footer.col4.title": "Über uns",
  "footer.col4.l1": "Über SKANDI Travels",
  "footer.col4.l2": "Pressebereich",
  "footer.col4.l3": "Karriere",
  "footer.col4.l4": "Unser Netzwerk",
  "footer.bottom.terms": "Zahlungsarten, Reisebedingungen der Leistungsträger und Pauschalreisebedingungen können je nach Produkt variieren.",
  "footer.bottom.l1": "Rechtliches",
  "footer.bottom.l8": "Nutzungsbedingungen",
  "footer.bottom.l2": "Barrierefreiheit",
  "footer.bottom.l3": "Haftungsausschluss",
  "footer.bottom.l4": "Datenschutzerklärung",
  "footer.bottom.l5": "Cookie-Richtlinie",
  "footer.bottom.l6": "Buchungsbedingungen",
  "footer.bottom.l7": "Mitarbeiter-Login"
},
"FR-FR": {
  "nav.packages": "Voyages organisés",
  "nav.destinations": "Destinations",
  "nav.club": "Signature Club",
  "nav.info": "Infos voyage",
  "nav.search": "Rechercher",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENUS",
  "nav.signIn": "Se connecter",
  "settings.language": "Langue",
  "settings.currency": "Devise",
  "settings.apply": "Enregistrer les paramètres",
  "welcome.title": "Bienvenue chez SKANDI",
  "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
  "welcome.btn": "Accéder au site web",
  "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
  "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
  "footer.news.btn": "S'inscrire",
  "footer.col1.title": "Réserver & Voyager",
  "footer.col1.l1": "Gérer ma réservation",
  "footer.col1.l2": "Réserver un voyage",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinations",
  "footer.col1.l5": "Hôtels",
  "footer.col1.l6": "Vols",
  "footer.col1.l7": "Excursions & Activités",
  "footer.col1.l8": "Location de voitures",
  "footer.col1.l9": "Offres",
  "footer.col2.title": "Aide & Infos voyage",
  "footer.col2.l1": "Avant de partir",
  "footer.col2.l2": "Passeport & visas",
  "footer.col2.l3": "Bagages",
  "footer.col2.l4": "Assurances",
  "footer.col2.l5": "Centre d'aide",
  "footer.col2.l6": "Nous contacter",
  "footer.col2.l7": "Assistance spéciale",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Rejoindre le SKANDI Club",
  "footer.col3.l2": "Avantages membres",
  "footer.col3.l3": "Mon statut club",
  "footer.col3.l4": "Portefeuille de voyage & bons",
  "footer.col4.title": "À propos",
  "footer.col4.l1": "À propos de SKANDI Travels",
  "footer.col4.l2": "Espace presse",
  "footer.col4.l3": "Carrières",
  "footer.col4.l4": "Notre réseau",
  "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
  "footer.bottom.l1": "Mentions légales",
  "footer.bottom.l8": "Conditions d'utilisation",
  "footer.bottom.l2": "Accessibilité",
  "footer.bottom.l3": "Avis de non-responsabilité",
  "footer.bottom.l4": "Politique de confidentialité",
  "footer.bottom.l5": "Politique de cookies",
  "footer.bottom.l6": "Conditions de réservation",
  "footer.bottom.l7": "Espace employés"
},
"FR-CA":{
  "nav.packages": "Forfaits Vacances",
  "nav.destinations": "Destinations",
  "nav.club": "Signature Club",
  "nav.info": "Infos voyage",
  "nav.search": "Rechercher",
  "nav.clubBtn": "SKANDI Club",
  "nav.menu": "MENU",
  "nav.signIn": "Se connecter",
  "settings.language": "Langue",
  "settings.currency": "Devise",
  "settings.apply": "Enregistrer les paramètres",
  "welcome.title": "Bienvenue chez SKANDI",
  "welcome.copy": "Veuillez confirmer votre langue et votre devise préférées avant de continuer.",
  "welcome.btn": "Accéder au site web",
  "footer.news.title": "Recevez les offres SKANDI et de l'inspiration pour voyager",
  "footer.news.desc": "Recevez des guides de voyage, les actualités de la Signature Collection et des offres membres.",
  "footer.news.btn": "S'inscrire",
  "footer.col1.title": "Réserver & Voyager",
  "footer.col1.l1": "Gérer ma réservation",
  "footer.col1.l2": "Réserver un voyage",
  "footer.col1.l3": "Signature Collection",
  "footer.col1.l4": "Destinations",
  "footer.col1.l5": "Hôtels",
  "footer.col1.l6": "Vols",
  "footer.col1.l7": "Excursions & Activités",
  "footer.col1.l8": "Location de voitures",
  "footer.col1.l9": "Offres",
  "footer.col2.title": "Aide & Infos voyage",
  "footer.col2.l1": "Avant de partir",
  "footer.col2.l2": "Passeport & visas",
  "footer.col2.l3": "Bagages",
  "footer.col2.l4": "Assurances",
  "footer.col2.l5": "Centre d'aide",
  "footer.col2.l6": "Nous contacter",
  "footer.col2.l7": "Assistance spéciale",
  "footer.col3.title": "SKANDI Club",
  "footer.col3.l1": "Rejoindre le SKANDI Club",
  "footer.col3.l2": "Avantages membres",
  "footer.col3.l3": "Mon statut club",
  "footer.col3.l4": "Portefeuille de voyage & coupons",
  "footer.col4.title": "À propos",
  "footer.col4.l1": "À propos de SKANDI Travels",
  "footer.col4.l2": "Salle de presse",
  "footer.col4.l3": "Carrières",
  "footer.col4.l4": "Notre réseau",
  "footer.bottom.terms": "Les modes de paiement, les conditions des fournisseurs et les conditions des forfaits de voyage peuvent varier selon le produit.",
  "footer.bottom.l1": "Avis juridiques",
  "footer.bottom.l8": "Conditions d'utilisation",
  "footer.bottom.l2": "Accessibilité",
  "footer.bottom.l3": "Exonération de responsabilité",
  "footer.bottom.l4": "Politique de confidentialité",
  "footer.bottom.l5": "Politique relative aux témoins",
  "footer.bottom.l6": "Conditions de réservation",
  "footer.bottom.l7": "Connexion employés"
}
        };

        let userSettings = { language: "EN", currency: "USD" };
        let settingsInitialized = false;

        const translationRoots = [
            document.getElementById("skandi-site-header"),
            document.getElementById("welcomeSettingsModal"),
            document.getElementById("mobileMenuLayer"),
            document.getElementById("skandi-site-footer")
        ].filter(Boolean);

        function translate(key, fallback = "") {
            const language = userSettings.language || "EN";
            return I18N[language]?.[key] || I18N.EN?.[key] || fallback || key;
        }

        function applyTranslations() {
            document.documentElement.lang = ({ EN: "en", SV: "sv", NO: "no", DA: "da", FI: "fi", "FR-FR": "fr-fr", "FR-CA": "fr-ca", DE: "de", ES: "es"})[userSettings.language] || "en";

            translationRoots.forEach((root) => {
                root.querySelectorAll("[data-i18n]").forEach((element) => {
                    const key = element.getAttribute("data-i18n");
                    const value = translate(key, element.textContent || "");
                    if (value) element.textContent = value;
                });

                root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
                    const key = element.getAttribute("data-i18n-placeholder");
                    const value = translate(key, element.getAttribute("placeholder") || "");
                    if (value) element.setAttribute("placeholder", value);
                });
            });
        }

        function updateSettingsControls() {
            ["langSelect", "mobileLangSelect", "welcomeLang"].forEach((id) => {
                const element = document.getElementById(id);
                if (element) element.value = userSettings.language;
            });

            ["currSelect", "mobileCurrSelect", "welcomeCurr"].forEach((id) => {
                const element = document.getElementById(id);
                if (element) element.value = userSettings.currency;
            });
        }

        function saveSettings(language, currency, notifyParent = true) {
            userSettings = {
                language: ["EN", "SV", "NO", "DA", "FR-FR", "FR-CA", "DE", "FI", "ES"].includes(language) ? language : "EN",
                currency: ["USD", "SEK", "NOK", "DKK", "EUR"].includes(currency) ? currency : "USD"
            };

            try {
                localStorage.setItem("skandi_user_settings", JSON.stringify(userSettings));
            } catch (_) {}

            updateSettingsControls();
            applyTranslations();

            if (notifyParent) {
                postToParent({
                    source: HEADER_SOURCE,
                    type: "UPDATE_SETTINGS",
                    payload: { ...userSettings }
                });
            }
        }

        function initializeSettings() {
            if (settingsInitialized) {
                updateSettingsControls();
                applyTranslations();
                return;
            }

            settingsInitialized = true;
            let stored = null;

            try {
                stored = JSON.parse(localStorage.getItem("skandi_user_settings") || "null");
            } catch (_) {
                stored = null;
            }

            if (stored && ["EN", "SV", "NO", "DA"].includes(stored.language)) {
                userSettings = {
                    language: stored.language,
                    currency: ["USD", "SEK", "NOK", "DKK", "EUR"].includes(stored.currency) ? stored.currency : "USD"
                };
            } else {
                userSettings = { language: "EN", currency: "USD" };
                const modal = document.getElementById("welcomeSettingsModal");
                modal?.classList.add("active");
                modal?.setAttribute("aria-hidden", "false");
            }

            updateSettingsControls();
            applyTranslations();
        }

        const HEADER_CONFIG = {
            nav: [
                { label: "Packages", i18n: "nav.packages", path: "/signature-collection" },
                { label: "Destinations", i18n: "nav.destinations", path: "/destinations" },
                { label: "Signature Club", i18n: "nav.club", path: "/skandi-club" },
                { label: "Travel Info", i18n: "nav.info", path: "/about/travel-info" }
            ],
            desktopMember: [
                { label: "My Profile", path: "/my-profile" }
            ],
            mobileExtra: [
                { label: "Help Center", path: "/about/help" }
            ],
            mobileMember: [
                { label: "My Profile", path: "/my-profile" },
                { label: "My Trips & Bookings", path: "/my-profile?tab=trips" },
                { label: "Club Rewards & Status", path: "/my-profile?tab=rewards" },
                { label: "Travel Wallet & Vouchers", path: "/my-profile?tab=wallet" },
                { label: "Help & Club Support", path: "/about/help" }
            ]
        };

        let session = { loggedIn: false, displayName: "", points: 0, tierName: "" };
        let mobileMenuOpen = false;
        let lastFocusedElement = null;
        const byId = (id) => document.getElementById(id);

        function headerPost(type, payload = {}) {
            postToParent({
                source: HEADER_SOURCE,
                type,
                payload,
                timestamp: new Date().toISOString()
            });
        }

        function footerPost(type, payload = {}) {
            postToParent({
                source: FOOTER_SOURCE,
                type,
                payload,
                timestamp: new Date().toISOString()
            });
        }

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;"
            })[character]);
        }

        function closeClub() {
            byId("clubPanel")?.classList.remove("open");
            byId("clubBackdrop")?.classList.remove("open");
            if (!mobileMenuOpen) document.documentElement.style.overflow = "";
        }

        function closeMobile({ restoreFocus = true } = {}) {
            const layer = byId("mobileMenuLayer");
            const button = byId("mobileBtn");
            if (!layer || !button) return;

            mobileMenuOpen = false;
            layer.classList.remove("open");
            layer.setAttribute("aria-hidden", "true");
            button.setAttribute("aria-expanded", "false");
            document.documentElement.classList.remove("mobile-menu-open");
            document.body.classList.remove("mobile-menu-open");

            if (restoreFocus && lastFocusedElement?.focus) {
                lastFocusedElement.focus({ preventScroll: true });
            }
            lastFocusedElement = null;
        }

        function navTo(path) {
            if (!path) return;
            closeMobile({ restoreFocus: false });
            closeClub();
            headerPost("HEADER_NAVIGATE", { path });
        }

        function renderDesktopNav() {
            const nav = byId("customerMainNav");
            if (!nav) return;
            const items = session.loggedIn ? [...HEADER_CONFIG.nav, ...HEADER_CONFIG.desktopMember] : [...HEADER_CONFIG.nav];

            nav.innerHTML = items.map((item) => (
                `<button class="nav-btn" type="button" data-path="${escapeHtml(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ""}>${escapeHtml(item.label)}</button>`
            )).join("");

            nav.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            applyTranslations();
        }

        function renderMobileNav() {
            const list = byId("mobileList");
            if (!list) return;
            const items = session.loggedIn ? HEADER_CONFIG.mobileMember : [...HEADER_CONFIG.nav, ...HEADER_CONFIG.mobileExtra];

            list.innerHTML = items.map((item) => (
                `<button class="mobile-menu-link" type="button" data-path="${escapeHtml(item.path)}" ${item.i18n ? `data-i18n="${item.i18n}"` : ""}>${escapeHtml(item.label)}</button>`
            )).join("");

            list.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            applyTranslations();
        }

        function updateMobileAccount() {
            const account = byId("mobileAccount");
            const button = byId("mobileAccountBtn");

            if (account) {
                account.textContent = session.loggedIn
                    ? `${session.displayName || "Member"} · ${Number(session.points || 0).toLocaleString()} pts`
                    : "Explore SKANDI Travels";
            }

            if (button) {
                button.textContent = session.loggedIn ? "My profile" : translate("nav.signIn", "Sign in");
            }
        }

        function renderClub(context = "") {
            const loggedIn = Boolean(session.loggedIn);
            const clubTitle = byId("clubTitle");
            const clubName = byId("clubName");
            const clubMeta = byId("clubMeta");
            const clubActions = byId("clubActions");
            const clubButton = byId("clubBtn");
            const accountMini = byId("accountMini");
            if (!clubTitle || !clubName || !clubMeta || !clubActions) return;

            clubTitle.textContent = loggedIn ? "Your SKANDI Club" : "Join SKANDI Club";

            if (loggedIn) {
                clubName.textContent = `Hi, ${session.displayName || "there"}`;
                clubMeta.textContent = `${Number(session.points || 0).toLocaleString()} points${session.tierName ? ` · ${session.tierName}` : ""}`;
                clubActions.innerHTML = `
                    <button class="shell-btn" type="button" data-path="/my-profile" style="width:100%;margin-bottom:12px">My Profile</button>
                    <button class="shell-btn secondary" type="button" data-action="logout" style="width:100%">Logout</button>
                `;
            } else {
                clubName.textContent = context === "favorites" ? "Save your favourites" : "Welcome Back";
                clubMeta.textContent = context === "favorites"
                    ? "Sign in to save destinations, offers and pages to your profile."
                    : "Sign in to access your trips, points and travel documents.";
                clubActions.innerHTML = `
                    <form id="inlineLoginForm" class="login-form">
                        <input type="email" id="loginEmail" placeholder="Email address" autocomplete="email">
                        <input type="password" id="loginPassword" placeholder="Password" autocomplete="current-password">
                        <button type="submit" class="shell-btn" style="width:100%">Log In</button>
                    </form>
                `;
            }

            clubActions.querySelectorAll("[data-path]").forEach((button) => {
                button.addEventListener("click", () => navTo(button.dataset.path));
            });
            clubActions.querySelectorAll("[data-action]").forEach((button) => {
                button.addEventListener("click", () => {
                    if (button.dataset.action === "logout") headerPost("HEADER_LOGOUT");
                });
            });

            byId("inlineLoginForm")?.addEventListener("submit", (event) => {
                event.preventDefault();
                closeClub();
                headerPost("HEADER_LOGIN");
            });

            if (clubButton) {
                clubButton.textContent = loggedIn ? (session.displayName || "My Profile") : translate("nav.clubBtn", "SKANDI Club");
            }
            if (accountMini) {
                accountMini.textContent = loggedIn
                    ? `${session.displayName || "Member"} · ${Number(session.points || 0).toLocaleString()} pts`
                    : "";
            }
            updateMobileAccount();
        }

        function openClub(context = "") {
            closeMobile({ restoreFocus: false });
            renderClub(context);
            byId("clubPanel")?.classList.add("open");
            byId("clubBackdrop")?.classList.add("open");
            document.documentElement.style.overflow = "hidden";
        }

        function openMobile() {
            closeClub();
            const layer = byId("mobileMenuLayer");
            const button = byId("mobileBtn");
            const drawer = byId("mobileDrawer");
            if (!layer || !button || !drawer || mobileMenuOpen) return;

            lastFocusedElement = document.activeElement;
            mobileMenuOpen = true;
            layer.classList.add("open");
            layer.setAttribute("aria-hidden", "false");
            button.setAttribute("aria-expanded", "true");
            document.documentElement.classList.add("mobile-menu-open");
            document.body.classList.add("mobile-menu-open");
            window.requestAnimationFrame(() => byId("mobileMenuClose")?.focus({ preventScroll: true }));
        }

        function trapMobileFocus(event) {
            if (!mobileMenuOpen || event.key !== "Tab") return;
            const drawer = byId("mobileDrawer");
            if (!drawer) return;

            const focusable = Array.from(
                drawer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')
            ).filter((element) => element.offsetParent !== null);
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function bindSettings() {
            const settingsButton = byId("settingsBtn");
            const settingsMenu = byId("settingsMenu");

            settingsButton?.addEventListener("click", (event) => {
                event.stopPropagation();
                const open = !settingsMenu?.classList.contains("open");
                settingsMenu?.classList.toggle("open", open);
                settingsButton.setAttribute("aria-expanded", String(open));
            });

            document.addEventListener("click", (event) => {
                if (settingsMenu && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
                    settingsMenu.classList.remove("open");
                    settingsButton?.setAttribute("aria-expanded", "false");
                }
            });

            byId("saveSettingsBtn")?.addEventListener("click", () => {
                saveSettings(byId("langSelect")?.value || "EN", byId("currSelect")?.value || "USD");
                settingsMenu?.classList.remove("open");
                settingsButton?.setAttribute("aria-expanded", "false");
            });

            const closeWelcome = () => {
                saveSettings(byId("welcomeLang")?.value || "EN", byId("welcomeCurr")?.value || "USD");
                const modal = byId("welcomeSettingsModal");
                modal?.classList.remove("active");
                modal?.setAttribute("aria-hidden", "true");
            };

            byId("welcomeSaveBtn")?.addEventListener("click", closeWelcome);
            byId("welcomeBackdrop")?.addEventListener("click", closeWelcome);
            byId("mobileLangSelect")?.addEventListener("change", (event) => {
                saveSettings(event.target.value, userSettings.currency);
            });
            byId("mobileCurrSelect")?.addEventListener("change", (event) => {
                saveSettings(userSettings.language, event.target.value);
            });
        }

        function bindHeader() {
            byId("logoBtn")?.addEventListener("click", () => navTo("/home"));
            byId("customerSearchBtn")?.addEventListener("click", () => headerPost("HEADER_SEARCH"));
            byId("favBtn")?.addEventListener("click", () => {
                session.loggedIn ? navTo("/my-profile?tab=favourites") : openClub("favorites");
            });
            byId("clubBtn")?.addEventListener("click", () => openClub());
            byId("clubClose")?.addEventListener("click", closeClub);
            byId("clubBackdrop")?.addEventListener("click", closeClub);
            byId("mobileBtn")?.addEventListener("click", () => mobileMenuOpen ? closeMobile() : openMobile());
            byId("mobileMenuBackdrop")?.addEventListener("click", () => closeMobile());
            byId("mobileMenuClose")?.addEventListener("click", () => closeMobile());
            byId("mobileSearchBtn")?.addEventListener("click", () => {
                closeMobile({ restoreFocus: false });
                headerPost("HEADER_SEARCH");
            });
            byId("mobileAccountBtn")?.addEventListener("click", () => {
                closeMobile({ restoreFocus: false });
                session.loggedIn ? navTo("/my-profile") : headerPost("HEADER_LOGIN");
            });

            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    closeMobile();
                    closeClub();
                    return;
                }
                trapMobileFocus(event);
            });
            window.addEventListener("resize", () => {
                if (window.innerWidth > 900) closeMobile({ restoreFocus: false });
            });
            bindSettings();
        }

        function showShellToast(message, isError = false) {
            const toast = byId("skandiShellToast");
            if (!toast) return;
            toast.textContent = message;
            toast.classList.toggle("error", isError);
            toast.classList.add("show");
            window.setTimeout(() => toast.classList.remove("show"), 3200);
        }

        function bindFooter() {
            const footerRoot = byId("skandi-site-footer");
            if (!footerRoot) return;

            const year = byId("customerFooterYear");
            if (year) year.textContent = new Date().getFullYear();

            footerRoot.querySelectorAll("[data-path]").forEach((element) => {
                element.addEventListener("click", () => {
                    footerPost("FOOTER_NAVIGATE", { path: element.getAttribute("data-path") });
                });
            });
            footerRoot.querySelectorAll(".social-btn[data-url]").forEach((button) => {
                button.addEventListener("click", () => {
                    const url = button.getAttribute("data-url");
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                });
            });

            const newsletterButton = byId("newsletterBtn");
            const newsletterEmail = byId("newsletterEmail");
            const subscribe = () => {
                footerPost("FOOTER_NEWSLETTER_SIGNUP", {
                    email: String(newsletterEmail?.value || "").trim(),
                    source: "Footer"
                });
            };

            newsletterButton?.addEventListener("click", subscribe);
            newsletterEmail?.addEventListener("keydown", (event) => {
                if (event.key === "Enter") subscribe();
            });
        }

        window.addEventListener("message", (event) => {
            const message = event.data || {};
            if (message.source && message.source !== PARENT_SOURCE) return;

            if (message.type === "CUSTOMER_HEADER_STATE") {
                session = {
                    loggedIn: Boolean(message.payload?.loggedIn),
                    displayName: message.payload?.displayName || "",
                    points: Number(message.payload?.points || 0),
                    tierName: message.payload?.tierName || ""
                };
                renderDesktopNav();
                renderMobileNav();
                renderClub();
            }

            if (message.type === "CLOSE_CUSTOMER_HEADER_PANELS") {
                closeMobile({ restoreFocus: false });
                closeClub();
            }

            if (message.type === "FOOTER_NEWSLETTER_RESULT") {
                const ok = Boolean(message.payload?.ok);
                showShellToast(
                    message.payload?.message || (ok ? "Thank you for subscribing." : "Newsletter signup failed."),
                    !ok
                );
            }
        });

        initializeSettings();
        renderDesktopNav();
        renderMobileNav();
        bindHeader();
        renderClub();
        bindFooter();
        applyTranslations();
        headerPost("HEADER_READY");
        footerPost("FOOTER_READY");
    })();
    