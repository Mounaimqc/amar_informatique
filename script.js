/**
 * Amar Informatique - Premium Tech Store
 * script.js - Version 5.0 Redesigned & Enhanced Front-End Core
 */

// ========== 🌐 VARIABLES GLOBALES ==========
let products = [];
let cart = [];
let wishlist = [];
let compareList = [];
let searchHistory = [];
let currentProductId = null;
let displayedProductsCount = 0;
let filteredProducts = [];
let sliderInterval = null;
let couponCode = null;
let couponDiscountRate = 0;

const PRODUCTS_PER_PAGE = 8;
const LATEST_ORDER_COUNT_KEY = 'orderCount';
const WISHLIST_STORAGE_KEY = 'wishlist';
const SEARCH_HISTORY_KEY = 'searchHistory';
const THEME_PREF_KEY = 'theme';

// Wilaya & Commune lists and shipping rates are shared with the form validation.
const wilayasList = [
    "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
    "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
    "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
    "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
    "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
    "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
    "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
    "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
    "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
    "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane", "49 - Timimoun", "50 - Bordj Badji Mokhtar",
    "51 - Ouled Djellal", "52 - Béni Abbès", "53 - In Salah", "54 - In Guezzam", "55 - Touggourt",
    "56 - Djanet", "57 - El M'Ghair", "58 - El Meniaa"
];

const wilayasData = {
    "01 - Adrar": ["Adrar", "Aoulef", "Charouine", "Reggane", "Tamentit", "Tsabit", "Zaouiet Kounta"],
    "02 - Chlef": ["Chlef", "Abou", "Ain Merane", "Boukadir", "El Karimia", "Oued Fodda", "Tadjena", "Zeboudja"],
    "03 - Laghouat": ["Laghouat", "Ain Madhi", "Brida", "El Ghicha", "Hassi Delaa", "Ksar El Hirane", "Sidi Makhlouf"],
    "04 - Oum El Bouaghi": ["Oum El Bouaghi", "Ain Beida", "Ain M'lila", "Behir Chergui", "El Amiria", "Sigus", "Souk Naamane"],
    "05 - Batna": ["Batna", "Ain Touta", "Arris", "Barika", "Bouzina", "El Madher", "Fesdis", "Ghassira", "Merouana", "N'Gaous", "Ras El Aioun", "Tazoult", "Timgad"],
    "06 - Béjaïa": ["Béjaïa", "Akbou", "Amizour", "Chemini", "Darguina", "El Kseur", "Ifnayen", "Kherrata", "Seddouk", "Tichy", "Tifra", "Timezrit"],
    "07 - Biskra": ["Biskra", "Ain Naga", "Bordj Ben Azzouz", "Chetma", "El Kantara", "El Outaya", "M'Chouneche", "Ouled Djellal", "Sidi Okba", "Zeribet El Oued"],
    "08 - Béchar": ["Béchar", "Abadla", "Beni Ounif", "Kenadsa", "Lahmar", "Mechraa Houari Boumedienne", "Taghit"],
    "09 - Blida": ["Blida", "Boufarik", "Bougara", "Chebli", "Chiffa", "El Affroun", "Mouzaia", "Oued Alleug", "Souhane"],
    "10 - Bouira": ["Bouira", "Ain Bessem", "Bechloul", "Bordj Okhriss", "El Adjiba", "Haizer", "Lakhdaria", "M'Chedallah", "Sour El Ghozlane"],
    "11 - Tamanrasset": ["Tamanrasset", "Abalessa", "Foggaret Ezzaouia", "Idles", "In Amguel", "In Ghar", "In Salah", "Tazrouk"],
    "12 - Tébessa": ["Tébessa", "Ain Zerga", "Bir El Ater", "Cheria", "El Aouinet", "El Ogla", "Morsott", "Negrine", "Ouenza", "Stah Guentis"],
    "13 - Tlemcen": ["Tlemcen", "Ain Fezza", "Ain Youcef", "Beni Bahdel", "Beni Snous", "Bensekrane", "El Aricha", "El Fehoul", "Ghazaouet", "Hennaya", "Maghnia", "Mansourah", "Nedroma", "Remchi", "Sebdou", "Zenata"],
    "14 - Tiaret": ["Tiaret", "Ain Deheb", "Ain Kermes", "Djillali Ben Amar", "Frenda", "Hamadia", "Ksar Chellala", "Mahdia", "Mechraa Safa", "Medroussa", "Oued Lili", "Rahouia", "Sougueur"],
    "15 - Tizi Ouzou": ["Tizi Ouzou", "Ain El Hammam", "Akbil", "Azeffoun", "Boghni", "Boudjima", "Draa El Mizan", "Iferhounene", "Larbaa Nath Irathen", "Maatkas", "Makouda", "Mizrana", "Ouacif", "Ouadhia", "Tigzirt", "Timizart"],
    "16 - Alger": ["Alger Centre", "Bab El Oued", "Birkhadem", "Bouzareah", "Dar El Beida", "El Biar", "Hussein Dey", "Kouba", "Mohamed Belouizdad", "Oued Koriche", "Sidi M'Hamed"],
    "17 - Djelfa": ["Djelfa", "Ain Chouhada", "Ain El Ibel", "Birine", "Charef", "El Idrissia", "Faidh El Botma", "Guernini", "Hassi Bahbah", "Hassi El Euch", "Messaad", "Sidi Ladjel"],
    "18 - Jijel": ["Jijel", "Ain Taya", "Boucif Ouled Askeur", "Chahna", "El Ancer", "El Milia", "Emir Abdelkader", "Ghebala", "Kaous", "Ouled Rabah", "Taher", "Texenna", "Ziama Mansouriah"],
    "19 - Sétif": ["Sétif", "Ain Abessa", "Ain Arnat", "Ain Azel", "Ain El Kebira", "Ain Oulmene", "Amoucha", "Babor", "Bazer Sakhra", "Beidha Bordj", "Beni Aziz", "Bir El Arch", "Bouandas", "Bouga", "Djemila", "El Eulma", "Guenzet", "Guidjel", "Hammam Guergour", "Harbil", "Maaouia", "Maoklane", "Salah Bey", "Serdj El Ghoul", "Tachouda", "Tamazirt", "Tella", "Zerdaza"],
    "20 - Saïda": ["Saïda", "Ain El Hadjar", "Ain Sekhouna", "Doui Thabet", "El Hassasna", "Hounet", "Maamora", "Moulay Larbi", "Ouled Brahim", "Ouled Khaled", "Youb"],
    "21 - Skikda": ["Skikda", "Ain Kechra", "Azzaba", "Ben Azzouz", "Collo", "El Harrouch", "Oued Zehour", "Ramdane Djamel", "Sidi Mezghiche", "Tamalous", "Zitouna"],
    "22 - Sidi Bel Abbès": ["Sidi Bel Abbès", "Ain Adden", "Ain Thrid", "Ben Badis", "Marhoum", "Mérine", "Mostefa Ben Brahim", "Moulay Slissen", "Oued Taourira", "Ras El Ma", "Sfisef", "Tafraoui", "Telagh", "Ténira"],
    "23 - Annaba": ["Annaba", "Ain Berda", "Berrahal", "Chorfa", "El Bouni", "El Hadjar", "Oued El Aneb", "Seraidi", "Treat"],
    "24 - Guelma": ["Guelma", "Ain Ben Beida", "Ain Reggada", "Bou Hamdane", "Bouati Mahmoud", "Dahoua", "El Fedjoudj Boughrara", "Hammam Debagh", "Hammam N'Bails", "Heliopolis", "Khezaras", "Oued Zenati", "Ras El Agba", "Salaoua Announa", "Zemmoura"],
    "25 - Constantine": ["Constantine", "Ain Smara", "Didouche Mourad", "El Khroub", "Hamma Bouziane", "Ibn Ziad", "Messaouda", "Zighoud Youcef"],
    "26 - Médéa": ["Médéa", "Ain Boucif", "Ain Ouksir", "Aziz", "Berrouaghia", "Chahbounia", "Chelif", "Deux Bassins", "Djouab", "El Azizia", "El Omaria", "Guelb El Kebir", "Ksar El Boukhari", "Mihoub", "Oued Harbil", "Ouled Deid", "Ouled Hellal", "Ouled Maaref", "Seghouane", "Si Mahdjoub", "Souagui", "Tablat"],
    "27 - Mostaganem": ["Mostaganem", "Ain Tedles", "Ain Sidi Cherif", "Bouguirat", "Hassi Mamèche", "Kheir Eddine", "Mesra", "Ouled Boughalem", "Ouled Malah", "Sidi Ali", "Sidi Lakhdar", "Sirat", "Stidia", "Tazgait"],
    "28 - M'Sila": ["M'Sila", "Ain El Melh", "Ben Srour", "Bou Saada", "Chellal", "Djebel Messaad", "El Hamel", "El Houamed", "Hammam Dhalaâ", "Khoubana", "Maadid", "Magra", "Medjedel", "Ouanougha", "Ouled Derradj", "Ouled Sidi Brahim", "Sidi Aissa", "Sidi Hadjeres", "Sidi M'hamed", "Souamaa", "Tarmount", "Zarzit"],
    "29 - Mascara": ["Mascara", "Ain Farès", "Ain Fekroun", "Ain Fekan", "Aouf", "El Bordj", "El Gaada", "El Ghomri", "El Keurt", "El Menaouer", "Froha", "Ghriss", "Hachem", "Hacine", "Maoussa", "Mohammadia", "Mocta Douz", "Nesmoth", "Oggaz", "Oued El Abtal", "Oued Taria", "Ras Ain Amirouche", "Sidi Abdeldjebar", "Sidi Kada", "Sidi Zahar", "Tighennif", "Tizi", "Zahana"],
    "30 - Ouargla": ["Ouargla", "Ain Beida", "El Allia", "El Hadjira", "El Hajeb", "Hassi Ben Abdellah", "Hassi Messaoud", "N'Goussa", "Rouissat", "Sidi Khouiled", "Taibet", "Tebesbest", "Touggourt", "Zaouia El Abidia"],
    "31 - Oran": ["Oran", "Arzew", "Bethioua", "Bir El Djir", "Es Senia", "Gdyel", "Hassi Bounif", "Marsat El Hadjadj", "Mers El Kebir", "Misserghin", "Oued Tlelat", "Sidi Ben Yebka", "Sidi Chami"],
    "32 - El Bayadh": ["El Bayadh", "Ain El Orak", "Bougtoub", "Brézina", "Chellala", "El Abiodh Sidi Cheikh", "El Bnoud", "Ghassoul", "Kef El Ahmar", "Rogassa", "Sidi Slimane", "Stitten"],
    "33 - Illizi": ["Illizi", "Bordj Omar Driss", "Djanet", "Debdeb", "El Borma", "In Amenas", "In Guezzam", "In Salah", "Tin Zaouatine"],
    "34 - Bordj Bou Arréridj": ["Bordj Bou Arréridj", "Ain Taghrout", "Belimour", "Bir Kasdali", "Bordj Ghdir", "Bordj Zemmoura", "Colla", "El Achir", "El Anser", "El Hamadia", "El Main", "El M'hir", "Ghilassa", "Haraza", "Hasnaoua", "Ksour", "Mansourah", "Medjana", "Ouled Brahem", "Ouled Dahmane", "Ouled Sidi Brahim", "Ras El Oued", "Righa", "Taglait", "Teniet En Nasr"],
    "35 - Boumerdès": ["Boumerdès", "Ammal", "Baghlia", "Bordj Menaiel", "Boudouaou", "Boudouaou El Bahri", "Chabet El Ameur", "Dellys", "Isser", "Khemis El Khechna", "Legata", "Naciria", "Ouled Aissa", "Ouled Fayet", "Si Mustapha", "Souk El Had", "Thénia"],
    "36 - El Tarf": ["El Tarf", "Ain Kercha", "Ben M'Hidi", "Besbes", "Bouhadjar", "Boutheldja", "Dréan", "El Kala", "Lac des Oiseaux", "Souarekh"],
    "37 - Tindouf": ["Tindouf", "Aouinet Bel Egrâ", "Fenoughil", "Oum El Assel"],
    "38 - Tissemsilt": ["Tissemsilt", "Ammari", "Belaassel Bouzegza", "Beni Chaib", "Boucaid", "Bouhatem", "Boukhanafis", "Khemisti", "Lazharia", "Layoune", "Maacem", "Sidi Abed", "Sidi Boutouchent", "Sidi Lantri", "Tamalaht", "Theniet El Had"],
    "39 - El Oued": ["El Oued", "Bayadha", "Debila", "El Ogla", "Guemar", "Hassi Khelifa", "Magrane", "Mih Ouensa", "Oued Souf", "Reguiba", "Robbah", "Taleb Larbi", "Trifaoui"],
    "40 - Khenchela": ["Khenchela", "Ain Touila", "Babar", "Bouhmama", "Chechar", "El Hamma", "El Mahmal", "El Mahres", "El Ouenza", "Hammam Essalihine", "Kais", "Ouled Rechache", "Remila", "Yabous"],
    "41 - Souk Ahras": ["Souk Ahras", "Ain Zana", "Bir Bouhouche", "Heddada", "Khedara", "M'Daourouch", "Mechroha", "Merahna", "Ouled Driss", "Oum El Adhaïm", "Sedrata", "Taoura", "Zouabi"],
    "42 - Tipaza": ["Tipaza", "Ahmar El Ain", "Bou Ismail", "Cherchell", "Damous", "Fouka", "Gouraya", "Hadjout", "Koléa", "Menaceur", "Nador", "Sidi Amar", "Sidi Ghiles", "Sidi Rached", "Sidi Semiane", "Tipasa"],
    "43 - Mila": ["Mila", "Ain Beida", "Ain Mellouk", "Chelghoum Laid", "El Ayadi Barbes", "El Barka", "El Eulma", "Ferdjioua", "Grarem Gouga", "Hamala", "Oued Athmania", "Oued Endja", "Oued Seguen", "Rouached", "Sidi Khelifa", "Tassadane Haddada", "Teleghma", "Terrai Bainen", "Yahia Beniguecha"],
    "44 - Aïn Defla": ["Aïn Defla", "Arib", "Bathia", "Belaas", "Bir Ould Khelifa", "Birbal", "Birhoum", "Boumedfaa", "Djelida", "Djemaa Ouled Cheikh", "El Amra", "El Attaf", "El Hassania", "El Maine", "Hammam Righa", "Hoceinia", "Khemis Miliana", "Miliana", "Oued Chorfa", "Oued Djemaa", "Rouina", "Tarik Ibn Ziad", "Tiberkanine", "Zeddine"],
    "45 - Naâma": ["Naâma", "Ain Ben Khelil", "Ain Sefra", "Asla", "Djeniene Bourezg", "El Bier", "Makmen Ben Amer", "Mecheria", "Moghrar", "Sfissifa", "Tiout"],
    "46 - Aïn Témouchent": ["Aïn Témouchent", "Ain Kihel", "Aoubellil", "Beni Saf", "Bouzedjar", "El Amria", "El Malah", "Hammam Bouhadjar", "Hassasna", "Oued Berkeche", "Oued Sabah", "Sidi Ben Adda", "Sidi Ourial", "Terga", "Tlemcen"],
    "47 - Ghardaïa": ["Ghardaïa", "Berriane", "Bounoura", "Dhayet Bendhahoua", "El Atteuf", "El Guerrara", "El Meniaa", "Metlili", "Sebseb", "Zelfana"],
    "48 - Relizane": ["Relizane", "Ain Rahma", "Ain Tarek", "Ammi Moussa", "Belassel Bouzegza", "Beni Dergoun", "Beni Zentis", "Djidiouia", "El Hamadna", "El Matmar", "El Ouldja", "Had Echkalla", "Hamri", "Kalaa", "Mazouna", "Mendes", "Oued Rhiou", "Oued Sly", "Ramka", "Sidi Khettab", "Sidi Lazreg", "Souk El Had", "Yellel"],
    "49 - Timimoun": ["Timimoun", "Aougrout", "Bordj Badji Mokhtar", "Charouine", "Ouled Said", "Talmine", "Tinerkouk", "Touggourt"],
    "50 - Bordj Badji Mokhtar": ["Bordj Badji Mokhtar", "Tin Zaouatine"],
    "51 - Ouled Djellal": ["Ouled Djellal", "Chaiba", "Sidi Khaled"],
    "52 - Béni Abbès": ["Béni Abbès", "Kerzaz", "Ouled Khodeir", "Tabelbala"],
    "53 - In Salah": ["In Salah", "Abalessa", "Foggaret Ezzaouia", "Idles", "In Ghar", "Tazrouk"],
    "54 - In Guezzam": ["In Guezzam", "Tin Zaouatine"],
    "55 - Touggourt": ["Touggourt", "El Hadjira", "El Ogla", "Nezla", "Tebesbest", "Zaouia El Abidia"],
    "56 - Djanet": ["Djanet", "Bordj Omar Driss"],
    "57 - El M'Ghair": ["El M'Ghair", "Djamaa", "Oum Touyour", "Sidi Khellil"],
    "58 - El Meniaa": ["El Meniaa", "Hassi Gara", "Hassi Fehal"]
};

const shippingPrices = {
    "01 - Adrar": 1500, "02 - Chlef": 700, "03 - Laghouat": 900, "04 - Oum El Bouaghi": 800,
    "05 - Batna": 700, "06 - Béjaïa": 700, "07 - Biskra": 900, "08 - Béchar": 1200,
    "09 - Blida": 700, "10 - Bouira": 700, "11 - Tamanrasset": 2000, "12 - Tébessa": 850,
    "13 - Tlemcen": 800, "14 - Tiaret": 800, "15 - Tizi Ouzou": 700, "16 - Alger": 600,
    "17 - Djelfa": 900, "18 - Jijel": 700, "19 - Sétif": 550, "20 - Saïda": 900,
    "21 - Skikda": 800, "22 - Sidi Bel Abbès": 800, "23 - Annaba": 700, "24 - Guelma": 850,
    "25 - Constantine": 650, "26 - Médéa": 800, "27 - Mostaganem": 800, "28 - M'Sila": 700,
    "29 - Mascara": 800, "30 - Ouargla": 1000, "31 - Oran": 700, "32 - El Bayadh": 1200,
    "33 - Illizi": 1900, "34 - Bordj Bou Arréridj": 600, "35 - Boumerdès": 700, "36 - El Tarf": 850,
    "37 - Tindouf": 1700, "38 - Tissemsilt": 850, "39 - El Oued": 1000, "40 - Khenchela": 600,
    "41 - Souk Ahras": 850, "42 - Tipaza": 600, "43 - Mila": 600, "44 - Aïn Defla": 800,
    "45 - Naâma": 1200, "46 - Aïn Témouchent": 800, "47 - Ghardaïa": 1000, "48 - Relizane": 800,
    "49 - Timimoun": 1500, "50 - Bordj Badji Mokhtar": 600, "51 - Ouled Djellal": 900,
    "52 - Béni Abbès": 1200, "53 - In Salah": 1800, "54 - In Guezzam": 3500,
    "55 - Touggourt": 1000, "56 - Djanet": 3500, "57 - El M'Ghair": 1800, "58 - El Meniaa": 1000
};

const stopDeskPrices = {
    "01 - Adrar": 1000, "02 - Chlef": 450, "03 - Laghouat": 600, "04 - Oum El Bouaghi": 500,
    "05 - Batna": 450, "06 - Béjaïa": 450, "07 - Biskra": 500, "08 - Béchar": 800,
    "09 - Blida": 450, "10 - Bouira": 450, "11 - Tamanrasset": 1500, "12 - Tébessa": 500,
    "13 - Tlemcen": 500, "14 - Tiaret": 500, "15 - Tizi Ouzou": 450, "16 - Alger": 400,
    "17 - Djelfa": 600, "18 - Jijel": 450, "19 - Sétif": 300, "20 - Saïda": 500,
    "21 - Skikda": 500, "22 - Sidi Bel Abbès": 500, "23 - Annaba": 450, "24 - Guelma": 500,
    "25 - Constantine": 400, "26 - Médéa": 500, "27 - Mostaganem": 500, "28 - M'Sila": 450,
    "29 - Mascara": 500, "30 - Ouargla": 600, "31 - Oran": 450, "32 - El Bayadh": 800,
    "33 - Illizi": 1500, "34 - Bordj Bou Arréridj": 400, "35 - Boumerdès": 450, "36 - El Tarf": 500,
    "37 - Tindouf": 1000, "38 - Tissemsilt": 500, "39 - El Oued": 600, "40 - Khenchela": 500,
    "41 - Souk Ahras": 500, "42 - Tipaza": 450, "43 - Mila": 500, "44 - Aïn Defla": 500,
    "45 - Naâma": 800, "46 - Aïn Témouchent": 500, "47 - Ghardaïa": 600, "48 - Relizane": 500,
    "49 - Timimoun": 1000, "50 - Bordj Badji Mokhtar": 1500, "51 - Ouled Djellal": 500,
    "52 - Béni Abbès": 800, "53 - In Salah": 1200, "54 - In Guezzam": 3500,
    "55 - Touggourt": 600, "56 - Djanet": 3500, "57 - El M'Ghair": 1800, "58 - El Meniaa": 600
};

// ========== 🚀 INITIALISATION ==========
document.addEventListener('DOMContentLoaded', async function () {
    // 🎨 Basculer Dark Mode s'il existe une préférence enregistrée
    initDarkModeTheme();

    // Rendre les squelettes de chargement
    renderProductSkeletons();

    // Charger les produits de Firebase
    if (typeof window.db !== 'undefined') {
        await loadProductsFromFirebase();
    } else {
        console.error("❌ Firebase non connecté.");
    }

    // Charger les caches du localStorage
    loadCartFromStorage();
    loadWishlistFromStorage();
    loadSearchHistoryFromStorage();
    
    // Configurer les écouteurs d'événements UI
    setupEventListeners();

    // Activer Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Activer l'horloge Promotion
    startPromoCountdown();

    // Charger les avis réels depuis Firestore
    loadAllHomepageTestimonials();
});

// ========== 🎨 THEME DARK MODE ==========
function initDarkModeTheme() {
    const isDark = localStorage.getItem(THEME_PREF_KEY) === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.querySelector('#darkModeToggle .dark-icon').style.display = 'none';
        document.querySelector('#darkModeToggle .light-icon').style.display = 'block';
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_PREF_KEY, isDark);
    const darkIcon = document.querySelector('#darkModeToggle .dark-icon');
    const lightIcon = document.querySelector('#darkModeToggle .light-icon');
    if (isDark) {
        darkIcon.style.display = 'none';
        lightIcon.style.display = 'block';
    } else {
        darkIcon.style.display = 'block';
        lightIcon.style.display = 'none';
    }
}

// ========== 📦 SKELETON LOADERS ==========
function renderProductSkeletons() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = Array(4).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-line title"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line price" style="margin-top:auto;"></div>
        </div>
    `).join('');
}

// ========== 🔥 FIREBASE PRODUCTS ==========
async function loadProductsFromFirebase() {
    try {
        console.log("🔄 Récupération de Firestore...");
        const snapshot = await db.collection("produits").get();
        
        products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name || 'Produit sans nom',
                category: data.category || '',
                description: data.description || '',
                price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
                image: data.image || '',
                oldPrice: data.oldPrice ? (typeof data.oldPrice === 'number' ? data.oldPrice : parseFloat(data.oldPrice)) : null,
                promo: data.promo || false,
                featured: data.featured || false,
                createdAt: data.createdAt || new Date()
            });
        });

        // Tri local chronologique inverse
        products.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        // Extraire les marques et processeurs pour remplir les filtres dynamiquement
        buildDynamicSidebarFilters();
        
        // Rendre les catégories
        updateCatCounts();

        // Rendre les produits
        filterProducts();

        // Rendre le slider principal
        initHeroSlider();

        // Check for active promotional campaigns for the banner
        if (typeof checkActiveCampaigns === 'function') checkActiveCampaigns();

    } catch (error) {
        console.error("❌ Erreur de chargement Firestore:", error);
        const grid = document.getElementById('productsGrid');
        if (grid) grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--danger)">Impossible de récupérer les articles (${error.message})</p>`;
    }
}

// ========== 🗂️ AUTO FILTRES GENERATION ==========
function buildDynamicSidebarFilters() {
    // 1. Extraire les marques uniques (le premier mot du titre du produit)
    const brandsSet = new Set();
    products.forEach(p => {
        const firstWord = p.name.split(' ')[0];
        if (firstWord && firstWord.length > 1 && !firstWord.includes('(')) {
            brandsSet.add(firstWord);
        }
    });

    const brandList = document.getElementById('brandFilterList');
    if (brandList) {
        brandList.innerHTML = Array.from(brandsSet).sort().map(brand => `
            <label class="filter-checkbox-item">
                <input type="checkbox" value="${brand.toLowerCase()}" class="brand-filter-cb" onchange="filterProducts()">
                <span>${brand}</span>
            </label>
        `).join('');
    }

    // 2. Extraire les processeurs uniques
    const cpus = ["i7", "i5", "i3", "Ryzen", "Xeon", "Celeron"];
    const cpuList = document.getElementById('cpuFilterList');
    if (cpuList) {
        cpuList.innerHTML = cpus.map(cpu => `
            <label class="filter-checkbox-item">
                <input type="checkbox" value="${cpu.toLowerCase()}" class="cpu-filter-cb" onchange="filterProducts()">
                <span>${cpu}</span>
            </label>
        `).join('');
    }

    // 3. Extraire les puces GPU
    const gpus = ["RTX", "GTX", "Intel", "Radeon", "Quadro"];
    const gpuList = document.getElementById('gpuFilterList');
    if (gpuList) {
        gpuList.innerHTML = gpus.map(gpu => `
            <label class="filter-checkbox-item">
                <input type="checkbox" value="${gpu.toLowerCase()}" class="gpu-filter-cb" onchange="filterProducts()">
                <span>${gpu}</span>
            </label>
        `).join('');
    }
}

// ========== 🏷️ FILTRE ET RECHERCHE MOTEUR ==========
function filterProducts(productsToDisplay = null, resetPagination = true) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (resetPagination) {
        displayedProductsCount = 0;
        grid.innerHTML = '';
    }

    let searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    let minPrice = parseFloat(document.getElementById('priceMinInput')?.value) || 0;
    let maxPrice = parseFloat(document.getElementById('priceMaxInput')?.value) || Infinity;
    let category = document.querySelector('.cat-nav-item.active, .featured-cat-card.active')?.id || '';
    
    // Category mapping
    let categoryFilter = '';
    if (category.includes('Laptop')) categoryFilter = 'laptop';
    else if (category.includes('Imprimantes')) categoryFilter = 'imprimantes';
    else if (category.includes('Accessoires')) categoryFilter = 'accessoires';

    // Lire les filtres de la sidebar
    let activeBrands = Array.from(document.querySelectorAll('.brand-filter-cb:checked')).map(cb => cb.value);
    let activeCPUs = Array.from(document.querySelectorAll('.cpu-filter-cb:checked')).map(cb => cb.value);
    let activeGPUs = Array.from(document.querySelectorAll('.gpu-filter-cb:checked')).map(cb => cb.value);

    // Filtrer localement
    filteredProducts = products.filter(product => {
        // Recherche textuelle
        const matchesSearch = !searchVal || 
            product.name.toLowerCase().includes(searchVal) || 
            product.description.toLowerCase().includes(searchVal) ||
            product.category.toLowerCase().includes(searchVal);

        // Catégorie
        const matchesCategory = !categoryFilter || product.category === categoryFilter;

        // Prix min/max
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

        // Marques ciblées
        const matchesBrand = activeBrands.length === 0 || activeBrands.includes(product.name.split(' ')[0].toLowerCase());

        // CPU ciblés
        const matchesCPU = activeCPUs.length === 0 || activeCPUs.some(cpu => product.name.toLowerCase().includes(cpu) || product.description.toLowerCase().includes(cpu));

        // GPU ciblés
        const matchesGPU = activeGPUs.length === 0 || activeGPUs.some(gpu => product.name.toLowerCase().includes(gpu) || product.description.toLowerCase().includes(gpu));

        return matchesSearch && matchesCategory && matchesPrice && matchesBrand && matchesCPU && matchesGPU;
    });

    // Tri de tri
    const sortBy = document.getElementById('sortSelect')?.value || 'featured';
    if (sortBy === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'date-new') {
        filteredProducts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
    }

    // Affichage des résultats
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = filteredProducts.length;

    const sliceToShow = filteredProducts.slice(displayedProductsCount, displayedProductsCount + PRODUCTS_PER_PAGE);
    
    if (sliceToShow.length === 0 && displayedProductsCount === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; color:var(--text-secondary);">
                <i data-lucide="package-search" style="width: 48px; height: 48px; margin: 0 auto 15px; opacity:0.5;"></i>
                <p>Aucun produit ne correspond à vos filtres.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        document.getElementById('loadMoreBtn').style.display = 'none';
        return;
    }

    sliceToShow.forEach(product => {
        const isFav = wishlist.includes(product.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-id', product.id);
        card.onclick = () => window.location.href = `produit.html?id=${product.id}`;

        // Calculer l'économie
        let savingsHTML = '';
        if (product.oldPrice && product.oldPrice > product.price) {
            const savings = product.oldPrice - product.price;
            savingsHTML = `<span class="savings-tag">Épargnez ${savings.toLocaleString('fr-FR')} DA</span>`;
        }

        // Taux de notation stars simulé
        const rating = 4.5 + Math.random() * 0.5;

        card.innerHTML = `
            <div class="product-card-head">
                <div class="card-badges">
                    ${product.promo ? '<span class="card-badge promo">PROMO</span>' : ''}
                    <span class="card-badge stock-green">En Stock</span>
                </div>
                <div class="card-actions-overlay">
                    <button class="card-action-btn wishlist-btn-toggle ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlistItem('${product.id}')" title="Ajouter aux favoris">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="card-action-btn" onclick="event.stopPropagation(); openQuickView('${product.id}')" title="Aperçu rapide">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <img src="${product.image || 'logo.jpg'}" alt="${product.name}" class="product-card-img" loading="lazy">
            </div>
            <div class="product-card-body">
                <span class="product-card-brand">${product.name.split(' ')[0]}</span>
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-rating">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                    <span>${rating.toFixed(1)}</span>
                </div>
                <div class="product-card-installment">
                    <i class="fas fa-credit-card"></i> Facilités de paiement dispo.
                </div>
                <div class="product-card-prices">
                    <div class="card-price-block">
                        ${product.oldPrice ? `<span class="old-price-line">${product.oldPrice.toLocaleString('fr-FR')} DA ${savingsHTML}</span>` : ''}
                        <span class="card-current-price">${product.price.toLocaleString('fr-FR')} <span>DA</span></span>
                    </div>
                    <button class="btn-card-buy" onclick="event.stopPropagation(); handleAddToCart('${product.id}')" title="Ajouter au panier">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
                <label class="compare-checkbox-label" onclick="event.stopPropagation();">
                    <input type="checkbox" onchange="toggleCompareProduct('${product.id}', this)" ${compareList.some(p => p.id === product.id) ? 'checked' : ''}>
                    <span>Comparer cet article</span>
                </label>
            </div>
        `;
        grid.appendChild(card);
    });

    displayedProductsCount += sliceToShow.length;

    // Load more button visibility
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (displayedProductsCount >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-flex';
        }
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

function loadMoreProducts() {
    filterProducts(filteredProducts, false);
}

function resetAllFilters() {
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    const minInput = document.getElementById('priceMinInput');
    const maxInput = document.getElementById('priceMaxInput');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    filterProducts();
}

// ========== 🎠 HERO SLIDER ==========
function initHeroSlider() {
    const wrapper = document.getElementById('sliderWrapper');
    const dots = document.getElementById('sliderDots');
    if (!wrapper || !dots) return;

    // Filtrer les laptops ou produits "featured" pour le slider principal (limité à 4)
    let sliderProducts = products.filter(p => p.featured || p.promo).slice(0, 4);
    if (sliderProducts.length === 0) {
        sliderProducts = products.slice(0, 4);
    }
    if (sliderProducts.length === 0) return;

    wrapper.innerHTML = '';
    dots.innerHTML = '';

    sliderProducts.forEach((p, idx) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect fill="%230F172A" width="800" height="400"/></svg>')`;
        slide.innerHTML = `
            <div class="slide-content">
                <span class="slide-badge">${p.promo ? 'Promotion' : 'Nouveauté'}</span>
                <h2 class="slide-title">${p.name}</h2>
                <p class="slide-desc">${p.description.substring(0, 110)}...</p>
                <div class="slide-price">
                    ${p.oldPrice ? `<old>${p.oldPrice.toLocaleString('fr-FR')} DA</old>` : ''}
                    <span>${p.price.toLocaleString('fr-FR')} DA</span>
                </div>
                <a href="produit.html?id=${p.id}" class="btn-slider-cta">Acheter Maintenant <i data-lucide="arrow-right"></i></a>
            </div>
            <div class="slide-image-wrapper">
                <img src="${p.image || 'logo.jpg'}" alt="${p.name}" class="slide-image" onerror="this.src='logo.jpg'">
            </div>
        `;
        wrapper.appendChild(slide);

        // Dot button
        const dot = document.createElement('div');
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
        dot.onclick = () => {
            goToSlide(idx);
        };
        dots.appendChild(dot);
    });

    let currentSlide = 0;
    const totalSlides = sliderProducts.length;

    window.goToSlide = function(slideIdx) {
        currentSlide = slideIdx;
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        document.querySelectorAll('.slider-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    };

    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    nextBtn?.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        goToSlide(currentSlide);
    });

    prevBtn?.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        goToSlide(currentSlide);
    });

    // Auto loop slide Interval
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        goToSlide(currentSlide);
    }, 6000);

    if (window.lucide) lucide.createIcons();
}

// ========== 🏷️ ACTIONS QUICK FILTERS IN HEADER MENU ==========
window.applyQuickFilter = function(filterType, value) {
    resetAllFilters();
    if (filterType === 'brand') {
        const cb = Array.from(document.querySelectorAll('.brand-filter-cb')).find(el => el.value === value.toLowerCase());
        if (cb) cb.checked = true;
    } else if (filterType === 'desc') {
        const input = document.getElementById('searchInput');
        if (input) input.value = value;
    } else if (filterType === 'promo') {
        // Tri ou cibler promo
        document.getElementById('sortSelect').value = 'price-asc'; // tri
    }
    
    // Aller à la section catalogue
    document.querySelector('.main-store-layout')?.scrollIntoView({ behavior: 'smooth' });
    filterProducts();
};

// ========== ⏳ HORLOGE DE VENTES FLASH ==========
function startPromoCountdown() {
    const daysBox = document.getElementById('daysBox');
    const hoursBox = document.getElementById('hoursBox');
    const minsBox = document.getElementById('minsBox');
    const secsBox = document.getElementById('secsBox');

    if (!daysBox) return;

    // Définir une date cible à 3 jours d'aujourd'hui
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);

    function updateTimer() {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            clearInterval(timerInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        daysBox.textContent = String(days).padStart(2, '0');
        hoursBox.textContent = String(hours).padStart(2, '0');
        minsBox.textContent = String(minutes).padStart(2, '0');
        secsBox.textContent = String(seconds).padStart(2, '0');
    }

    const timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}



// ========== 🔍 RECHERCHES HISTORIQUE MANAGEMENT ==========
function loadSearchHistoryFromStorage() {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    searchHistory = saved ? JSON.parse(saved) : ["Dell Latitude", "Lenovo ThinkPad", "Imprimante Epson"];
    renderSearchHistory();
}

function renderSearchHistory() {
    const list = document.getElementById('searchHistoryList');
    if (!list) return;

    list.innerHTML = searchHistory.map(term => `
        <span class="search-history-item" onclick="applyHistorySearch('${term}')">
            ${term} <i class="fas fa-times" onclick="event.stopPropagation(); removeHistoryTerm('${term}')"></i>
        </span>
    `).join('');
}

window.applyHistorySearch = function(term) {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = term;
        filterProducts();
    }
    document.getElementById('searchHistoryPanel').classList.remove('active');
};

window.removeHistoryTerm = function(term) {
    searchHistory = searchHistory.filter(t => t !== term);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    renderSearchHistory();
};

window.clearSearchHistory = function() {
    searchHistory = [];
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    renderSearchHistory();
};

function saveCurrentSearchTerm(term) {
    if (!term) return;
    searchHistory = searchHistory.filter(t => t.toLowerCase() !== term.toLowerCase());
    searchHistory.unshift(term);
    searchHistory = searchHistory.slice(0, 6); // Max 6 items
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
    renderSearchHistory();
}

// ========== ⚖️ COMPARATEUR DE PRODUITS ==========
window.toggleCompareProduct = function(productId, checkbox) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (checkbox.checked) {
        if (compareList.length >= 4) {
            alert("Vous pouvez comparer au maximum 4 produits en même temps.");
            checkbox.checked = false;
            return;
        }
        if (!compareList.some(p => p.id === productId)) {
            compareList.push(product);
        }
    } else {
        compareList = compareList.filter(p => p.id !== productId);
    }
    
    updateCompareDrawer();
};

function updateCompareDrawer() {
    const drawer = document.getElementById('compareDrawer');
    const countEl = document.getElementById('compareCount');
    const row = document.getElementById('compareItemsRow');

    if (!drawer) return;

    countEl.textContent = compareList.length;

    if (compareList.length > 0) {
        drawer.classList.add('active');
        row.innerHTML = compareList.map(p => `
            <div class="compare-drawer-card">
                <img src="${p.image || 'logo.png'}" alt="${p.name}">
                <div>
                    <h4>${p.name.substring(0, 20)}...</h4>
                    <span style="font-weight:700; color:var(--accent); font-size:0.75rem;">${p.price.toLocaleString('fr-FR')} DA</span>
                </div>
                <button class="compare-drawer-remove" onclick="removeCompareItem('${p.id}')"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    } else {
        drawer.classList.remove('active');
    }
}

window.removeCompareItem = function(productId) {
    compareList = compareList.filter(p => p.id !== productId);
    // Uncheck in products grid if rendered
    const cardCheckbox = document.querySelector(`.product-card[data-id="${productId}"] input[type="checkbox"]`);
    if (cardCheckbox) cardCheckbox.checked = false;
    updateCompareDrawer();
};

window.clearComparison = function() {
    compareList = [];
    document.querySelectorAll('.product-card input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateCompareDrawer();
};

window.openComparisonPage = function() {
    const modal = document.getElementById('comparisonModal');
    const table = document.getElementById('comparisonTable');
    if (!modal || !table) return;

    if (compareList.length === 0) return;

    // Rendre la table de comparaison
    let tableHTML = `
        <thead>
            <tr>
                <th style="width:200px;">Caractéristiques</th>
                ${compareList.map(p => `<th><img src="${p.image || 'logo.png'}" style="height:80px; object-fit:contain; display:block; margin:0 auto 10px;">${p.name}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Prix de vente</strong></td>
                ${compareList.map(p => `<td><strong style="color:var(--accent); font-size:1.15rem;">${p.price.toLocaleString('fr-FR')} DA</strong></td>`).join('')}
            </tr>
            <tr>
                <td><strong>Catégorie</strong></td>
                ${compareList.map(p => `<td>${p.category || 'Général'}</td>`).join('')}
            </tr>
            <tr>
                <td><strong>Processeur & GPU</strong></td>
                ${compareList.map(p => `<td>${p.description.substring(0, 100)}...</td>`).join('')}
            </tr>
            <tr>
                <td><strong>Ajout au panier</strong></td>
                ${compareList.map(p => `<td><button class="btn-checkout" style="padding:8px 15px; font-size:0.85rem;" onclick="handleAddToCart('${p.id}')">Acheter</button></td>`).join('')}
            </tr>
        </tbody>
    `;

    table.innerHTML = tableHTML;
    modal.classList.add('active');
};

// ========== ❤️ WISHLIST LOCAL STORAGE ==========
function loadWishlistFromStorage() {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    wishlist = saved ? JSON.parse(saved) : [];
    updateWishlistUI();
}

window.toggleWishlistItem = function(productId) {
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showNotification("Retiré de votre liste de favoris.", "info");
    } else {
        wishlist.push(productId);
        showNotification("Ajouté à votre liste de favoris !", "success");
    }
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistUI();
    
    // Toggle class on card buttons dynamically
    const cardBtns = document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-btn-toggle`);
    cardBtns.forEach(btn => btn.classList.toggle('active', wishlist.includes(productId)));
};

function updateWishlistUI() {
    const countEl = document.getElementById('wishlistCount');
    const container = document.getElementById('wishlistItemsContainer');

    if (countEl) countEl.textContent = wishlist.length;
    if (!container) return;

    if (wishlist.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:30px;">Votre liste de souhaits est vide.</p>`;
        return;
    }

    const favProducts = products.filter(p => wishlist.includes(p.id));
    container.innerHTML = favProducts.map(p => `
        <div class="wishlist-drawer-item">
            <img src="${p.image || 'logo.png'}" alt="${p.name}">
            <div class="wishlist-drawer-item-info">
                <h4>${p.name.substring(0, 32)}...</h4>
                <span>${p.price.toLocaleString('fr-FR')} DA</span>
            </div>
            <button class="btn-remove" onclick="toggleWishlistItem('${p.id}')" title="Retirer"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

window.addAllWishlistToCart = function() {
    if (wishlist.length === 0) return;
    wishlist.forEach(productId => {
        const prod = products.find(p => p.id === productId);
        if (prod) {
            const existing = cart.find(item => item.id === productId);
            if (existing) existing.quantity++;
            else cart.push({ ...prod, quantity: 1 });
        }
    });
    saveCartToStorage();
    updateCartCount();
    displayCart();
    wishlist = [];
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([]));
    updateWishlistUI();
    document.getElementById('wishlistDrawer').classList.remove('active');
    showNotification("Tous vos favoris ont été transférés au panier !", "success");
};

// ========== 🛒 PANIER LOCAL STORAGE ==========
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        try {
            cart = JSON.parse(saved).map(item => ({
                ...item,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1
            }));
            updateCartCount();
        } catch (e) {
            cart = [];
        }
    }
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

window.handleAddToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCartToStorage();
    updateCartCount();
    showNotification(`A ajouté "${product.name.substring(0, 30)}..." au panier !`, "success");
};

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function displayCart() {
    const container = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('couponDiscountVal');
    const discountRow = document.getElementById('couponDiscountRow');
    const totalEl = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align:center; padding:40px 10px; color:var(--text-muted);">
            <i class="fas fa-shopping-basket" style="font-size:3rem; margin-bottom:15px;"></i>
            <p>Votre panier est vide</p>
        </div>`;
        if (subtotalEl) subtotalEl.textContent = '0.00';
        if (totalEl) totalEl.textContent = '0.00';
        if (discountRow) discountRow.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <img src="${item.image || 'logo.png'}" alt="${item.name}">
            <div style="flex:1;">
                <h4 class="cart-item-name">${item.name.substring(0, 35)}...</h4>
                <div style="color:var(--accent); font-weight:700; font-size:0.9rem;">${item.price.toLocaleString('fr-FR')} DA</div>
            </div>
            <div class="cart-item-actions" style="display:flex; align-items:center; gap:10px;">
                <div class="qty-input-group">
                    <button class="qty-btn" onclick="modifyQty('${item.id}', -1)">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="modifyQty('${item.id}', 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        container.appendChild(el);
    });

    // Remises codes promo
    let discount = 0;
    if (window.appliedPromo) {
        discount = calculatePromoDiscount(window.appliedPromo, subtotal);
    }
    let grandTotal = subtotal - discount;

    if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    if (totalEl) totalEl.textContent = grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    
    if (discount > 0) {
        if (discountEl) discountEl.textContent = discount.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        if (discountRow) discountRow.style.display = 'flex';
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    if (checkoutBtn) checkoutBtn.disabled = false;
}

window.modifyQty = function(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCartToStorage();
            updateCartCount();
            displayCart();
        }
    }
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartCount();
    displayCart();
};

// ========== 🎟️ CODE PROMO LOGIC ==========
window.applyCouponCode = function() {
    const input = document.getElementById('couponInput');
    const code = input?.value.trim().toUpperCase();

    if (code === 'AMAR19') {
        couponCode = code;
        couponDiscountRate = 0.05; // 5% de réduction
        showNotification("Code promo valide ! Vous bénéficiez de -5% de réduction.", "success");
    } else {
        couponCode = null;
        couponDiscountRate = 0;
        showNotification("Code promo invalide.", "error");
    }

    displayCart();
};

// ========== 📋 DEVIS / COMMANDES STEPPER PANELS ==========
window.goToCheckoutStep = function(stepNum) {
    const step1 = document.getElementById('checkoutStep1');
    const step2 = document.getElementById('checkoutStep2');
    const step3 = document.getElementById('checkoutStep3');

    const ind1 = document.getElementById('stepIndicator1');
    const ind2 = document.getElementById('stepIndicator2');
    const ind3 = document.getElementById('stepIndicator3');

    if (stepNum === 2) {
        // Valider l'étape 1 Coordonnées
        const fname = document.getElementById('firstName').value.trim();
        const lname = document.getElementById('lastName').value.trim();
        const ph = document.getElementById('phone1').value.trim();

        if (!fname || !lname || !ph) {
            alert("Veuillez remplir vos coordonnées obligatoires.");
            return;
        }

        step1.style.display = 'none';
        step2.style.display = 'block';
        step3.style.display = 'none';

        ind1.className = 'step-item completed';
        ind2.className = 'step-item active';
        ind3.className = 'step-item';

        initializeWilayasSelect();

    } else if (stepNum === 3) {
        // Valider l'étape 2 Livraison
        const type = document.getElementById('orderType').value;
        const wilaya = document.getElementById('wilaya').value;
        const commune = document.getElementById('commune').value;

        if (!type || !wilaya || !commune) {
            alert("Veuillez remplir les informations de livraison.");
            return;
        }

        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'block';

        ind1.className = 'step-item completed';
        ind2.className = 'step-item completed';
        ind3.className = 'step-item active';

        // Mettre à jour le résumé de l'étape 3
        updateCheckoutSummaryTotals();

    } else {
        // Étape 1
        step1.style.display = 'block';
        step2.style.display = 'none';
        step3.style.display = 'none';

        ind1.className = 'step-item active';
        ind2.className = 'step-item';
        ind3.className = 'step-item';
    }
};

window.appliedPromo = null;

window.applyPromoCode = async function() {
    const input = document.getElementById('promoCodeInput');
    const btn = document.getElementById('applyPromoBtn');
    const statusMsg = document.getElementById('promoStatusMessage');
    
    if (!input || !btn) return;

    // If a coupon is already applied, clicking should remove it
    if (window.appliedPromo) {
        window.appliedPromo = null;
        input.value = '';
        input.disabled = false;
        btn.textContent = 'Appliquer';
        btn.style.backgroundColor = 'var(--primary)';
        if (statusMsg) {
            statusMsg.style.display = 'none';
        }
        showNotification("Coupon retiré avec succès.", "success");
        // Recalculate summary totals
        updateCheckoutSummaryTotals();
        return;
    }

    const code = input.value.trim().toUpperCase();
    if (!code) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const snapshot = await db.collection('codes_promo')
            .where('code', '==', code)
            .where('isActive', '==', true)
            .limit(1)
            .get();

        if (snapshot.empty) {
            showPromoError("❌ Code promo invalide ou inexistant.");
            return;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        const now = new Date().toISOString().split('T')[0];

        // Validate expiration
        if (data.startDate > now) {
            showPromoError("❌ Ce code promo n'est pas encore actif.");
            return;
        }
        if (data.endDate < now) {
            showPromoError("❌ Code promo expiré.");
            return;
        }

        // Validate usage limits
        if ((data.usedCount || 0) >= (data.maxUses || 0)) {
            showPromoError("❌ Ce code promo a expiré ou atteint sa limite d'utilisations.");
            return;
        }

        // Validate min order amount
        const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (cartSubtotal < (data.minOrderAmount || 0)) {
            showPromoError(`❌ Le montant minimum de commande est de ${(data.minOrderAmount).toLocaleString('fr-FR')} DA.`);
            return;
        }

        // Validate category eligibility
        if (data.applicableCategory !== 'all') {
            const hasEligibleItem = cart.some(item => {
                const prod = products.find(p => p.id === item.id);
                return prod && prod.category === data.applicableCategory;
            });

            if (!hasEligibleItem) {
                showPromoError(`❌ Ce code est uniquement applicable sur la catégorie : ${data.applicableCategory}.`);
                return;
            }
        }

        // If valid!
        window.appliedPromo = { id: doc.id, ...data };
        input.disabled = true;
        btn.textContent = 'Retirer';
        btn.style.backgroundColor = 'var(--danger)';
        
        if (statusMsg) {
            statusMsg.textContent = `✅ Code promo "${code}" appliqué !`;
            statusMsg.style.color = 'var(--success)';
            statusMsg.style.display = 'block';
        }

        const savedAmount = calculatePromoDiscount(window.appliedPromo, cartSubtotal);
        const savedText = data.discountType === 'percentage' ? `${data.discountValue}%` : `${savedAmount.toLocaleString('fr-FR')} DA`;
        showNotification(`✅ Code promo appliqué. Vous économisez ${savedText} !`, "success");

        // Recalculate totals
        updateCheckoutSummaryTotals();

    } catch (err) {
        console.error("Error applying promo code:", err);
        showPromoError("❌ Erreur de connexion. Impossible d'appliquer le code.");
    } finally {
        btn.disabled = false;
    }

    function showPromoError(msg) {
        if (statusMsg) {
            statusMsg.textContent = msg;
            statusMsg.style.color = 'var(--danger)';
            statusMsg.style.display = 'block';
        }
        showNotification(msg, "error");
        window.appliedPromo = null;
        updateCheckoutSummaryTotals();
    }
};

function calculatePromoDiscount(promo, cartSubtotal) {
    if (!promo) return 0;
    if (promo.discountType === 'percentage') {
        if (promo.applicableCategory === 'all') {
            return cartSubtotal * (promo.discountValue / 100);
        } else {
            // Apply only to items in the eligible category
            const eligibleTotal = cart.reduce((sum, item) => {
                const prod = products.find(p => p.id === item.id);
                return (prod && prod.category === promo.applicableCategory) ? sum + (item.price * item.quantity) : sum;
            }, 0);
            return eligibleTotal * (promo.discountValue / 100);
        }
    } else {
        // Fixed discount
        return Math.min(promo.discountValue, cartSubtotal);
    }
}

function updateCheckoutSummaryTotals() {
    const type = document.getElementById('orderType').value;
    const wilaya = document.getElementById('wilaya').value;
    if (!type || !wilaya) return;

    const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = computeShippingCost(type, wilaya);
    
    let discount = 0;
    if (window.appliedPromo) {
        discount = calculatePromoDiscount(window.appliedPromo, cartSubtotal);
    }

    const grandTotal = cartSubtotal - discount + shipping;

    document.getElementById('summaryCartTotal').textContent = cartSubtotal.toLocaleString('fr-FR') + ' DA';
    document.getElementById('summaryShippingPrice').textContent = shipping.toLocaleString('fr-FR') + ' DA';
    document.getElementById('summaryGrandTotal').textContent = grandTotal.toLocaleString('fr-FR') + ' DA';

    const discRow = document.getElementById('summaryDiscountRow');
    const discVal = document.getElementById('summaryDiscountVal');
    if (discount > 0) {
        discVal.textContent = `-${discount.toLocaleString('fr-FR')} DA`;
        discRow.style.display = 'flex';
    } else {
        discRow.style.display = 'none';
    }
}

function initializeWilayasSelect() {
    const select = document.getElementById('wilaya');
    if (!select || select.children.length > 1) return;

    select.innerHTML = '<option value="">Choisir wilaya</option>';
    wilayasList.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        select.appendChild(opt);
    });

    select.addEventListener('change', function () {
        const w = this.value;
        const commSelect = document.getElementById('commune');
        if (commSelect) commSelect.innerHTML = '<option value="">Choisir commune</option>';
        
        if (w && wilayasData[w]) {
            wilayasData[w].forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                commSelect.appendChild(opt);
            });
        }
        updateFormShippingCost();
    });

    document.getElementById('orderType')?.addEventListener('change', updateFormShippingCost);
}

function updateFormShippingCost() {
    const type = document.getElementById('orderType').value;
    const wilaya = document.getElementById('wilaya').value;
    const cost = computeShippingCost(type, wilaya);
    const display = document.getElementById('shippingPrice');
    if (display) display.textContent = cost + ' DA';
}

function computeShippingCost(type, wilaya) {
    if (!wilaya || !type) return 0;
    if (type === 'domicile') return shippingPrices[wilaya] || 0;
    if (type === 'stopdesk') return stopDeskPrices[wilaya] || 0;
    return 0;
}

function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let count = localStorage.getItem(LATEST_ORDER_COUNT_KEY) || '0';
    count = String(parseInt(count) + 1).padStart(3, '0');
    localStorage.setItem(LATEST_ORDER_COUNT_KEY, count);
    return `AM-${year}${month}${day}-${count}`;
}

async function submitOrderForm(e) {
    e.preventDefault();
    const form = document.getElementById('orderForm');
    const orderType = document.getElementById('orderType').value;
    const wilaya = document.getElementById('wilaya').value;
    const commune = document.getElementById('commune').value;

    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;
    let appliedCodeName = null;

    if (window.appliedPromo) {
        try {
            // Secure validation against usage limits in database
            const promoRef = db.collection('codes_promo').doc(window.appliedPromo.id);
            const promoSnap = await promoRef.get();
            if (promoSnap.exists) {
                const promoData = promoSnap.data();
                if ((promoData.usedCount || 0) >= (promoData.maxUses || 0)) {
                    alert("❌ Désolé, ce code promo a atteint sa limite d'utilisation maximale juste avant votre validation.");
                    window.appliedPromo = null;
                    updateCheckoutSummaryTotals();
                    return;
                }
                // Atomically increment usage
                await promoRef.update({
                    usedCount: firebase.firestore.FieldValue.increment(1)
                });
                discount = calculatePromoDiscount(window.appliedPromo, cartTotal);
                appliedCodeName = window.appliedPromo.code;
            }
        } catch (err) {
            console.error("Error updating promo code usage:", err);
        }
    }

    const shippingPrice = computeShippingCost(orderType, wilaya);
    const grandTotal = cartTotal - discount + shippingPrice;

    const orderNumber = generateOrderNumber();

    const orderDoc = {
        orderNumber,
        status: 'pending',
        orderType,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        phone1: document.getElementById('phone1').value.trim(),
        phone2: document.getElementById('phone2').value.trim() || null,
        wilaya,
        commune,
        cartItems: [...cart],
        cartTotal,
        promoCode: appliedCodeName,
        discountAmount: discount,
        shippingPrice,
        grandTotal,
        date: new Date().toISOString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

        await db.collection("commandes").add(orderDoc);

        // Fermer le formulaire de commande
        document.getElementById('orderFormModal').classList.remove('active');
        
        // Ouvrir le modal de confirmation
        const confirmModal = document.getElementById('confirmModal');
        const orderNumEl = document.getElementById('orderNumber');
        const trackBtn = document.getElementById('trackOrderDirectBtn');
        const whatsappBtn = document.getElementById('confirmWhatsappBtn');

        if (orderNumEl) orderNumEl.textContent = orderNumber;
        if (trackBtn) trackBtn.href = `tracking.html?id=${orderNumber}`;
        if (whatsappBtn) {
            const firstItemName = cart[0] ? cart[0].name : "Produits";
            const message = encodeURIComponent(`Bonjour Amar Informatique, je viens de valider mon panier.\nNuméro de commande : ${orderNumber}\nArticles : ${firstItemName}...`);
            whatsappBtn.href = `https://wa.me/213559469956?text=${message}`;
        }

        if (confirmModal) confirmModal.classList.add('active');
        if (window.lucide) lucide.createIcons();

        // Vider le panier
        cart = [];
        window.appliedPromo = null;
        const promoInput = document.getElementById('promoCodeInput');
        if (promoInput) {
            promoInput.value = '';
            promoInput.disabled = false;
        }
        const promoBtn = document.getElementById('applyPromoBtn');
        if (promoBtn) {
            promoBtn.textContent = 'Appliquer';
            promoBtn.style.backgroundColor = 'var(--primary)';
        }
        const promoMsg = document.getElementById('promoStatusMessage');
        if (promoMsg) {
            promoMsg.style.display = 'none';
        }
        saveCartToStorage();
        updateCartCount();
        form.reset();

    } catch (err) {
        console.error("❌ Erreur Firebase:", err);
        alert("Une erreur s'est produite lors de l'enregistrement de votre commande. Veuillez vérifier votre connexion.");
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Confirmer Commande <i class="fas fa-check"></i>';
        }
    }
}

window.copyOrderNumberToClipboard = function() {
    const text = document.getElementById('orderNumber').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert("📋 Numéro de suivi copié dans le presse-papier !");
    });
};

// ========== 🔍 DETAILED QUICK VIEW MODAL ==========
window.openQuickView = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    
    const modal = document.getElementById('productDetailModal');
    const title = document.getElementById('productModalTitle');
    const img = document.getElementById('detailImage');
    const cat = document.getElementById('detailCategory');
    const desc = document.getElementById('detailDescription');
    const price = document.getElementById('detailPrice');
    const link = document.getElementById('detailModalLink');

    if (title) title.textContent = product.name;
    if (img) img.src = product.image || 'logo.jpg';
    if (cat) cat.textContent = product.category || 'Général';
    if (desc) desc.textContent = product.description;
    if (price) price.textContent = product.price.toLocaleString('fr-FR') + ' DA';
    if (link) link.href = `produit.html?id=${product.id}`;

    if (modal) modal.classList.add('active');
};

// ========== 🔔 NOTIFICATIONS TOAST SYSTEM ==========
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)';
    
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background-color: ${bgColor}; color: white;
        padding: 14px 24px; border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg); z-index: 10000;
        font-weight: 600; font-size: 0.9rem;
        animation: slideIn 300ms ease;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideOut 300ms ease';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}

// ========== 🗂️ CATEGORY BADGES COUNT ==========
function updateCatCounts() {
    const total = products.length;
    const setEl = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = count;
    };

    setEl('countAll', total);
    setEl('countLaptop', products.filter(p => p.category === 'laptop').length);
    setEl('countImprimantes', products.filter(p => p.category === 'imprimantes').length);
    setEl('countAccessoires', products.filter(p => p.category === 'accessoires').length);
    setEl('countGaming', products.filter(p => p.description.toLowerCase().includes('gaming') || p.name.toLowerCase().includes('gaming')).length);
    setEl('countComponents', products.filter(p => p.description.toLowerCase().includes('ram') || p.name.toLowerCase().includes('intel')).length);
}

// ========== ⚙️ EVENTS CONNECTORS ==========
function setupEventListeners() {
    // 🎨 Basculeur Dark Mode
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);

    // 🔔 Panneau de notification
    const notifBtn = document.getElementById('notificationsBtn');
    const notifDrawer = document.getElementById('notificationsDrawer');
    const closeNotif = document.getElementById('closeNotificationsBtn');

    notifBtn?.addEventListener('click', () => {
        notifDrawer?.classList.add('active');
        // Vider la bulle rouge
        notifBtn.querySelector('.badge-count').style.display = 'none';
    });
    closeNotif?.addEventListener('click', () => notifDrawer?.classList.remove('active'));

    // ❤️ Wishlist
    const wishBtn = document.getElementById('wishlistBtn');
    const wishDrawer = document.getElementById('wishlistDrawer');
    const closeWish = document.getElementById('closeWishlistBtn');

    wishBtn?.addEventListener('click', () => wishDrawer?.classList.add('active'));
    closeWish?.addEventListener('click', () => wishDrawer?.classList.remove('active'));

    // 🛒 Panier modal
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCartModalBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    cartBtn?.addEventListener('click', () => {
        if (cartModal) {
            cartModal.classList.add('active');
            displayCart();
        }
    });
    closeCart?.addEventListener('click', () => cartModal?.classList.remove('active'));

    checkoutBtn?.addEventListener('click', () => {
        cartModal?.classList.remove('active');
        document.getElementById('orderFormModal')?.classList.add('active');
        goToCheckoutStep(1);
    });

    document.getElementById('closeOrderModalBtn')?.addEventListener('click', () => {
        document.getElementById('orderFormModal')?.classList.remove('active');
    });

    // Formulaire d'envoi final
    document.getElementById('orderForm')?.addEventListener('submit', submitOrderForm);

    // Quick view add-to-cart
    document.getElementById('modalAddToCartBtn')?.addEventListener('click', () => {
        if (currentProductId) {
            handleAddToCart(currentProductId);
            document.getElementById('productDetailModal')?.classList.remove('active');
        }
    });
    document.getElementById('closeDetailModalBtn')?.addEventListener('click', () => {
        document.getElementById('productDetailModal')?.classList.remove('active');
    });

    // Comparateur modal
    document.getElementById('closeComparisonModalBtn')?.addEventListener('click', () => {
        document.getElementById('comparisonModal')?.classList.remove('active');
    });

    // Recherches Recentes Input Actions
    const searchInput = document.getElementById('searchInput');
    const searchPanel = document.getElementById('searchHistoryPanel');

    searchInput?.addEventListener('focus', () => {
        if (searchHistory.length > 0) searchPanel?.classList.add('active');
    });
    
    searchInput?.addEventListener('input', () => {
        filterProducts();
    });

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const term = searchInput.value.trim();
            saveCurrentSearchTerm(term);
            searchPanel?.classList.remove('active');
        }
    });

    // Clic en dehors des boîtes
    document.addEventListener('click', (e) => {
        if (searchPanel && !searchPanel.contains(e.target) && e.target !== searchInput) {
            searchPanel.classList.remove('active');
        }
        if (cartModal && e.target === cartModal) cartModal.classList.remove('active');
        const detailModal = document.getElementById('productDetailModal');
        if (detailModal && e.target === detailModal) detailModal.classList.remove('active');
        const compareModal = document.getElementById('comparisonModal');
        if (compareModal && e.target === compareModal) compareModal.classList.remove('active');
    });

    // Clavier Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cartModal?.classList.remove('active');
            notifDrawer?.classList.remove('active');
            wishDrawer?.classList.remove('active');
            document.getElementById('orderFormModal')?.classList.remove('active');
            document.getElementById('productDetailModal')?.classList.remove('active');
            document.getElementById('comparisonModal')?.classList.remove('active');
        }
    });

    // Mode Grid vs List
    document.getElementById('viewGridBtn')?.addEventListener('click', function() {
        document.getElementById('productsGrid').style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
        document.querySelectorAll('.view-mode-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
    document.getElementById('viewListBtn')?.addEventListener('click', function() {
        document.getElementById('productsGrid').style.gridTemplateColumns = '1fr';
        document.querySelectorAll('.view-mode-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });

    // Float Back to Top
    const b2t = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) b2t?.classList.add('show');
        else b2t?.classList.remove('show');
    });
    b2t?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== 🏷️ CATEGORY CLICS ==========
window.selectCat = function(categoryCode, element) {
    document.querySelectorAll('.cat-nav-item, .featured-cat-card').forEach(item => item.classList.remove('active'));
    
    // Activer l'élément concerné
    element?.classList.add('active');

    // Mettre à jour la catégorie correspondante dans la grille en vedette
    if (categoryCode === '') {
        document.getElementById('featCatAll')?.classList.add('active');
    } else if (categoryCode === 'laptop') {
        document.getElementById('featCatLaptop')?.classList.add('active');
    } else if (categoryCode === 'imprimantes') {
        document.getElementById('featCatImprimantes')?.classList.add('active');
    } else if (categoryCode === 'accessoires') {
        document.getElementById('featCatAccessoires')?.classList.add('active');
    }

    filterProducts();
};

// FAQ collapsible accordion
window.toggleFaq = function(element) {
    const desc = element.querySelector('p');
    const icon = element.querySelector('i');
    if (desc.style.display === 'none' || !desc.style.display) {
        desc.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        desc.style.display = 'none';
        icon.style.transform = 'rotate(0)';
    }
};

window.subscribeNewsletter = function() {
    const input = document.getElementById('newsletterEmail');
    if (input && input.value.includes('@')) {
        showNotification("Merci ! Vous êtes inscrit à notre newsletter.", "success");
        input.value = '';
    } else {
        alert("Veuillez entrer une adresse e-mail valide.");
    }
};

// ========== 💬 DYNAMIC HOMEPAGE TESTIMONIALS SYSTEM ==========
async function loadAllHomepageTestimonials() {
    const grid = document.getElementById('homepageTestimonialsGrid');
    if (!grid) return;

    grid.innerHTML = Array(3).fill(0).map(() => `
        <div class="skeleton-card" style="height: 180px;">
            <div class="skeleton-line title" style="width: 50%;"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line desc"></div>
            <div class="skeleton-line price" style="width: 30%; margin-top: auto;"></div>
        </div>
    `).join('');

    try {
        const snapshot = await db.collection('avis')
            .orderBy('date', 'desc')
            .limit(6)
            .get();

        let testimonialsHTML = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const rating = parseInt(data.rating) || 5;

            // Build stars
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHTML += '<i class="fas fa-star" style="color:var(--warning); margin-right:2px;"></i>';
                } else {
                    starsHTML += '<i class="far fa-star" style="color:var(--text-muted); margin-right:2px;"></i>';
                }
            }

            // Find product link
            let productLinkHTML = '';
            if (data.productId) {
                // If products are loaded
                const prod = products.find(p => p.id === data.productId);
                if (prod) {
                    productLinkHTML = `<div style="margin-top: 15px; border-top: 1px dashed var(--border); padding-top: 10px; font-size: 0.78rem;">
                        <a href="produit.html?id=${prod.id}" style="color:var(--primary); font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                            <i class="fas fa-shopping-bag" style="font-size:0.75rem;"></i> Acheté : ${prod.name.substring(0, 24)}...
                        </a>
                    </div>`;
                }
            }

            testimonialsHTML.push(`
                <div class="skeleton-card" style="animation:none; background:var(--bg-card); border:1px solid var(--border); box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:10px;">
                    <div class="product-rating" style="color:var(--warning); margin-bottom:2px;">
                        ${starsHTML}
                    </div>
                    <p style="font-style:italic; font-size:0.9rem; color:var(--text-secondary); line-height:1.55; flex:1;">
                        "${data.comment}"
                    </p>
                    <strong style="font-size:0.85rem; color:var(--text-primary); display:block; margin-top:8px;">
                        ${data.clientName}
                    </strong>
                    ${productLinkHTML}
                </div>
            `);
        });

        if (testimonialsHTML.length > 0) {
            grid.innerHTML = testimonialsHTML.join('');
        } else {
            loadDefaultStaticTestimonials(grid);
        }

    } catch (err) {
        console.error("Error loading testimonials:", err);
        loadDefaultStaticTestimonials(grid);
    }
}

function loadDefaultStaticTestimonials(grid) {
    grid.innerHTML = `
        <div class="skeleton-card" style="animation:none; background:var(--bg-card); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <div class="product-rating" style="color:var(--warning);"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
          <p style="font-style:italic; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">"Achat d'un laptop Dell Latitude reconditionné. L'appareil est dans un état impeccable, comme neuf ! Livraison rapide sur Sétif. Service client réactif."</p>
          <strong style="margin-top:10px; font-size:0.85rem; color:var(--text-primary);">Sofiane K. (Sétif)</strong>
        </div>
        <div class="skeleton-card" style="animation:none; background:var(--bg-card); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <div class="product-rating" style="color:var(--warning);"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
          <p style="font-style:italic; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">"Très bon rapport qualité-prix. J'ai commandé une imprimante Canon et des accessoires, livraison Stop Desk conforme à Alger. Je recommande vivement !"</p>
          <strong style="margin-top:10px; font-size:0.85rem; color:var(--text-primary);">Amine B. (Alger)</strong>
        </div>
        <div class="skeleton-card" style="animation:none; background:var(--bg-card); border:1px solid var(--border); box-shadow:var(--shadow-sm);">
          <div class="product-rating" style="color:var(--warning);"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
          <p style="font-style:italic; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">"Excellent service après-vente. Le laptop avait un petit souci de batterie, il a été remplacé sous garantie sans aucune discussion."</p>
          <strong style="margin-top:10px; font-size:0.85rem; color:var(--text-primary);">Yasmine A. (Oran)</strong>
        </div>
    `;
}

window.checkActiveCampaigns = async function() {
    const banner = document.getElementById('marketingCampaignBanner');
    if (!banner) return;

    if (sessionStorage.getItem('campaignClosed') === 'true') {
        banner.style.display = 'none';
        return;
    }

    try {
        const now = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('codes_promo')
            .where('isActive', '==', true)
            .where('showBanner', '==', true)
            .get();

        let activeCampaign = null;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.startDate <= now && data.endDate >= now) {
                activeCampaign = data;
            }
        });

        if (activeCampaign) {
            const codeEl = document.getElementById('bannerPromoCode');
            const discountEl = document.getElementById('bannerPromoDiscount');
            
            if (codeEl) codeEl.textContent = activeCampaign.code;
            
            const discountText = activeCampaign.discountType === 'percentage' 
                ? `${activeCampaign.discountValue}%` 
                : `${activeCampaign.discountValue.toLocaleString('fr-FR')} DA`;
            
            if (discountEl) discountEl.textContent = discountText;

            banner.style.display = 'block';

            // Start countdown
            startCampaignCountdown(activeCampaign.endDate);
        } else {
            banner.style.display = 'none';
        }
    } catch (err) {
        console.error("Error loading active campaign banner:", err);
        banner.style.display = 'none';
    }
};

function startCampaignCountdown(endDateStr) {
    const countdownEl = document.getElementById('bannerCountdown');
    if (!countdownEl) return;

    // Target date is the end of the endDate day
    const targetDate = new Date(endDateStr + "T23:59:59").getTime();

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            clearInterval(interval);
            const banner = document.getElementById('marketingCampaignBanner');
            if (banner) banner.style.display = 'none';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.textContent = `${days}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }, 1000);
}

window.closeCampaignBanner = function() {
    const banner = document.getElementById('marketingCampaignBanner');
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('campaignClosed', 'true');
};
