/**
 * Amar Informatique - Premium Tech Store
 * script.js - Version 3.2 ✅ Fixed & Clean (Pixel Removed)
 * Dernière mise à jour: 2026
 */

// ========== 🌐 VARIABLES GLOBALES ==========
let products = [];
let cart = [];
let currentProductId = null;
let observer;
let sliderInterval;
let displayedProductsCount = 0;
let filteredProducts = [];
const PRODUCTS_PER_PAGE = 10;
window.sliderInitialized = false;

// ========== 🚚 دوال مودال الشحن (عامة لتجنب ReferenceError) ==========
window.openShippingModal = function() {
    const modal = document.getElementById('shippingModal');
    if (modal) { modal.classList.add('active'); if (typeof renderShippingTable === 'function') renderShippingTable('domicile'); }
};

window.closeShippingModal = function() {
    const modal = document.getElementById('shippingModal');
    if (modal) modal.classList.remove('active');
};

window.switchShippingType = function(type, btn) {
    document.querySelectorAll('.btn-shipping-type').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    if (typeof renderShippingTable === 'function') renderShippingTable(type);
};

window.filterShippingTable = function() {
    const search = document.getElementById('shippingSearch')?.value.toLowerCase() || '';
    document.querySelectorAll('#shippingTableBody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
};

// ========== 🎨 دوال مساعدة للفئات ==========
const CAT_META = {
    laptop: { label: 'Laptop', icon: '<i class="fas fa-laptop"></i>', cls: 'cat-badge-laptop' },
    imprimantes: { label: 'Imprimantes', icon: '<i class="fas fa-print"></i>', cls: 'cat-badge-imprimantes' },
    accessoires: { label: 'Accessoires', icon: '<i class="fas fa-plug"></i>', cls: 'cat-badge-accessoires' },
};

function catLabel(c) { return (CAT_META[c] || {}).label || c || 'Général'; }
function catIcon(c) { return (CAT_META[c] ? CAT_META[c].icon : '<i class="fas fa-tag"></i>'); }
function catBadgeClass(c) { return (CAT_META[c] ? CAT_META[c].cls : 'cat-badge-default'); }

// ========== 🗺️ بيانات الولايات والبلديات ==========
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
    "15 - Tizi Ouzou": ["Tizi Ouzou", "Ain El Hammam", "Akbil", "Azeffoun", "Boghni", "Boudjima", "Bouira", "Draa El Mizan", "Iferhounene", "Larbaa Nath Irathen", "Maatkas", "Makouda", "Mizrana", "Ouacif", "Ouadhia", "Tigzirt", "Timizart"],
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
    "46 - Aïn Témouchent": ["Aïn Témouchent", "Ain Kihel", "Aoubellil", "Beni Saf", "Bouzedjar", "El Amria", "El Malah", "Hammam Bouhadjar", "Hassasna", "Oued Berkeche", "Oued Sabah", "Sidi Ben Adda", "Sidi Boumediene", "Sidi Ourial", "Terga", "Tlemcen"],
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

// ========== 💰 أسعار الشحن ==========
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

// ========== 🚀 INITIALISATION PRINCIPALE ==========
document.addEventListener('DOMContentLoaded', async function () {
  
    // ✅ 1. التحقق من تهيئة Firebase
    if (typeof window.db === 'undefined') {
        console.error("❌ Firebase non initialisé!");
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; color:red;">❌ Erreur de configuration Firebase.</p>';
        }
        return;
    }

    // ✅ 2. تحميل المنتجات والبيانات
    await loadProductsFromFirebase();
    loadCartFromStorage();

    // ✅ 3. إعداد الأحداث والأزرار
    setupEventListeners();

    // ✅ 4. زر الإضافة من مودال التفاصيل
    const modalBtn = document.getElementById('modalAddToCartBtn');
    if (modalBtn) {
        modalBtn.addEventListener('click', () => {
            if (currentProductId) {
                addToCart(currentProductId);
                const modal = document.getElementById('productDetailModal');
                if (modal) modal.classList.remove('active');
            }
        });
    }

    // ✅ 5. فلاتر الولايات والشحن
    const wilayaSel = document.getElementById('wilaya');
    const typeSel = document.getElementById('orderType');
    const communeSel = document.getElementById('commune');
    const orderForm = document.getElementById('orderForm');

    wilayaSel?.addEventListener('change', function () {
        const w = this.value;
        if (communeSel) communeSel.innerHTML = '<option value="">Sélectionner une commune</option>';
        updateShippingPrice();
        if (w && wilayasData[w]) {
            wilayasData[w].forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                communeSel?.appendChild(opt);
            });
        }
    });

    typeSel?.addEventListener('change', updateShippingPrice);
    orderForm?.addEventListener('submit', submitOrderForm);

    // ✅ 6. تحسينات الجوال والصور
    if ('ontouchstart' in window) document.body.classList.add('touch-device');
    window.addEventListener('load', optimizeImages);
    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(optimizeImages, 250);
    });

    // ✅ 7. سوايب السلايدر باللمس
    let touchStartX = 0, touchEndX = 0;
    const slider = document.getElementById('heroSlider');
    if (slider) {
        slider.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) document.getElementById('nextBtn')?.click();
            if (touchEndX > touchStartX + 50) document.getElementById('prevBtn')?.click();
        }, { passive: true });
    }

    // ✅ 8. أزرار التواصل الاجتماعي
    const socialToggleBtn = document.getElementById('socialToggleBtn');
    const socialLinksMenu = document.getElementById('socialLinksMenu');
    if (socialToggleBtn && socialLinksMenu) {
        socialToggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = socialLinksMenu.classList.toggle('active');
            socialToggleBtn.setAttribute('aria-expanded', isActive);
            socialLinksMenu.setAttribute('aria-hidden', !isActive);
        });
        document.addEventListener('click', function(e) {
            if (!socialToggleBtn.contains(e.target) && !socialLinksMenu.contains(e.target)) {
                socialLinksMenu.classList.remove('active');
                socialToggleBtn.setAttribute('aria-expanded', 'false');
                socialLinksMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // ✅ 9. إغلاق مودال الشحن عند النقر خارجه
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('shippingModal');
        if (modal && e.target === modal) window.closeShippingModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeShippingModal(); });

    console.log('✅ Amar Informatique - Application initialisée');
});

// ========== 🔀 دالة خلط المنتجات عشوائياً ==========
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function loadProductsFromFirebase() {
    try {
        const grid = document.getElementById('productsGrid');
        if (!grid) { console.warn("⚠️ #productsGrid غير موجود"); return; }

        console.log("🔄 جاري تحميل المنتجات من Firebase...");
        
        // 1️⃣ جلب البيانات بدون orderBy لتجنب مشاكل الفهارس
        const snapshot = await db.collection("products").get();
        
        console.log(`📦 عدد المستندات في مجموعة 'products': ${snapshot.size}`);
        
        if (snapshot.empty) {
            console.warn("⚠️ المجموعة فارغة أو اسمها مختلف!");
            grid.innerHTML = `<div style="text-align:center; grid-column:1/-1; padding:30px; color:var(--text-muted);">
                <i class="fas fa-box-open fa-3x" style="margin-bottom:15px; opacity:0.5;"></i><br>
                <strong>لا توجد منتجات حالياً</strong><br>
                <small>تأكد أن اسم المجموعة في Firebase هو <code>products</code> (بحروف صغيرة)</small>
            </div>`;
            return;
        }

        produits = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`📄 منتج: ${doc.id}`, data); // سجل البيانات للمراجعة
            
            produits.push({
                id: doc.id,
                name: data.name || 'Produit sans nom',
                category: data.category || '',
                description: data.description || '',
                price: typeof data.price === 'number' ? data.price : 0,
                image: data.image || '',
                oldPrice: data.oldPrice || null,
                promo: data.promo || false,
                featured: data.featured || false,
                createdAt: data.createdAt || new Date()
            });
        });

        // 2️⃣ الترتيب محلياً بدلاً من Firestore
        produits.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        shuffleArray(produits);
        loadProducts();
        updateCatCounts();
        console.log("✅ تم تحميل وعرض المنتجات بنجاح!");

    } catch (error) {
        console.error("❌ خطأ في تحميل المنتجات:", error.code, error.message);
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#ef4444; padding:20px;">
                ❌ خطأ: ${error.message}<br>
                <button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;">إعادة المحاولة</button>
            </p>`;
        }
    }
}
// ========== 🎨 عرض المنتجات مع Pagination ==========
function loadProducts(productsToDisplay = null, resetPagination = true) {
    const grid = document.getElementById('productsGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!grid) { console.warn("⚠️ #productsGrid non trouvé"); return; }

    if (!productsToDisplay) {
        productsToDisplay = [...products];
        filteredProducts = [...products];
    } else {
        filteredProducts = [...productsToDisplay];
    }

    if (resetPagination) {
        displayedProductsCount = 0;
        grid.innerHTML = '';
    }

    const productsToShow = filteredProducts.slice(displayedProductsCount, displayedProductsCount + PRODUCTS_PER_PAGE);

    if (productsToShow.length === 0 && displayedProductsCount === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 20px; color: var(--text-muted);">Aucun produit trouvé.</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    productsToShow.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => window.location.href = `produit.html?id=${product.id}`;
        card.setAttribute('tabindex', '0');
        card.onkeypress = (e) => { if (e.key === 'Enter') window.location.href = `produit.html?id=${product.id}`; };

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'product-image-wrapper';

        const img = document.createElement('img');
        img.src = product.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%231e293b%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%2394a3b8%22%3ENo+Image%3C/text%3E%3C/svg%3E';
        img.alt = product.name;
        img.className = 'product-image';
        img.loading = 'lazy';
        img.onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%231e293b%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%2394a3b8%22%3ENo+Image%3C/text%3E%3C/svg%3E';
        };

        if (product.promo) {
            const badge = document.createElement('span');
            badge.className = 'product-badge';
            badge.textContent = '-20%';
            imgWrapper.appendChild(badge);
        }

        const actions = document.createElement('div');
        actions.className = 'product-actions';
        actions.innerHTML = `<button class="action-btn wishlist" onclick="event.stopPropagation();toggleWishlist('${product.id}')" title="Favoris"><i class="far fa-heart"></i></button>
        <button class="action-btn" onclick="event.stopPropagation();quickView('${product.id}')" title="Aperçu"><i class="fas fa-eye"></i></button>`;
        imgWrapper.appendChild(actions);
        imgWrapper.appendChild(img);

        const info = document.createElement('div');
        info.className = 'product-info';
        const price = parseFloat(product.price) || 0;

        info.innerHTML = `<span class="product-category ${catBadgeClass(product.category)}">${catIcon(product.category)} ${product.category ? catLabel(product.category) : 'Général'}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description || ''}</p>
        <div class="product-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;">
            <div class="price-container"><span class="product-price">${product.oldPrice ? `<old>${product.oldPrice.toLocaleString('fr-FR')}</old>` : ''}${price.toLocaleString('fr-FR')} DA</span></div>
            <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.id}')" title="Ajouter au panier"><i class="fas fa-cart-plus"></i></button>
        </div>`;

        card.appendChild(imgWrapper);
        card.appendChild(info);
        grid.appendChild(card);
    });

    displayedProductsCount += productsToShow.length;

    if (loadMoreBtn) {
        if (displayedProductsCount >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'flex';
            const remaining = filteredProducts.length - displayedProductsCount;
            loadMoreBtn.innerHTML = `<i class="fas fa-plus"></i> Afficher ${Math.min(PRODUCTS_PER_PAGE, remaining)} produit${remaining > 1 ? 's' : ''} de plus`;
        }
    }

    if (resetPagination && !window.sliderInitialized) {
        setTimeout(() => {
            if (typeof initHeroSlider === 'function') initHeroSlider();
            window.sliderInitialized = true;
        }, 100);
    }

    setTimeout(initScrollAnimations, 100);
}

// ========== ▶️ Load More ==========
function loadMoreProducts() {
    if (displayedProductsCount >= filteredProducts.length) return;
    loadProducts(filteredProducts, false);
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== 🌀 Scroll Animation ==========
function initScrollAnimations() {
    if (observer) observer.disconnect();
    const cards = document.querySelectorAll('.product-card');
    if (cards.length === 0) return;
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    cards.forEach(card => observer.observe(card));
}

// ========== 🎠 Hero Slider ==========
function initHeroSlider() {
    const sliderContainer = document.getElementById('heroSlider');
    if (!sliderContainer) return;
    const sliderWrapper = document.getElementById('sliderWrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    if (!sliderWrapper || !dotsContainer) return;

    const featuredProducts = products.filter(p => p.featured).slice(0, 5);
    if (featuredProducts.length === 0) {
        sliderContainer.style.display = 'none';
        return;
    }

    sliderWrapper.innerHTML = '';
    dotsContainer.innerHTML = '';
    let slides = [];

    featuredProducts.forEach((product, index) => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `<img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" class="slide-image" loading="lazy">
        <div class="slide-content">${product.promo ? '<span class="slide-badge">PROMO</span>' : ''}
        <h3 class="slide-title">${product.name}</h3>
        <p class="slide-desc">${(product.description || '').substring(0, 100)}...</p>
        <div class="slide-price">${product.oldPrice ? `<old>${product.oldPrice.toLocaleString('fr-FR')}</old>` : ''}${(parseFloat(product.price) || 0).toLocaleString('fr-FR')} DA</div>
        <button class="btn-slider" onclick="event.stopPropagation(); window.location.href='produit.html?id=${product.id}'">Voir le produit</button></div>`;
        sliderWrapper.appendChild(slide);
        slides.push(slide);

        const dot = document.createElement('div');
        dot.className = 'slider-dot';
        dot.addEventListener('click', () => goToSlide(index, slides, sliderWrapper, dotsContainer));
        dotsContainer.appendChild(dot);
    });

    updateSlider(0, slides, sliderWrapper, dotsContainer);
    setupSliderButtons(prevBtn, nextBtn, slides, sliderWrapper, dotsContainer);

    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => { nextSlide(slides, sliderWrapper, dotsContainer); }, 5000);
}

function updateSlider(index, slides, wrapper, dotsContainer) {
    if (!wrapper) return;
    wrapper.style.transform = `translateX(-${index * 100}%)`;
    document.querySelectorAll('.slider-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
}

function goToSlide(index, slides, wrapper, dotsContainer) {
    updateSlider(index, slides, wrapper, dotsContainer);
    resetAutoPlay(slides, wrapper, dotsContainer);
}

function nextSlide(slides, wrapper, dotsContainer) {
    const currentIndex = Array.from(document.querySelectorAll('.slider-dot')).findIndex(dot => dot.classList.contains('active'));
    const nextIndex = (currentIndex + 1) % slides.length;
    updateSlider(nextIndex, slides, wrapper, dotsContainer);
    resetAutoPlay(slides, wrapper, dotsContainer);
}

function setupSliderButtons(prevBtn, nextBtn, slides, wrapper, dotsContainer) {
    prevBtn?.addEventListener('click', () => {
        const currentIndex = Array.from(document.querySelectorAll('.slider-dot')).findIndex(dot => dot.classList.contains('active'));
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlider(prevIndex, slides, wrapper, dotsContainer);
        resetAutoPlay(slides, wrapper, dotsContainer);
    });
    nextBtn?.addEventListener('click', () => nextSlide(slides, wrapper, dotsContainer));
}

function resetAutoPlay(slides, wrapper, dotsContainer) {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => { nextSlide(slides, wrapper, dotsContainer); }, 5000);
}

// ========== 🔍 Quick View Modal ==========
function quickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    currentProductId = productId;
    
    const detailImage = document.getElementById('detailImage');
    const detailName = document.getElementById('productModalTitle');
    const detailCategory = document.getElementById('detailCategory');
    const detailDescription = document.getElementById('detailDescription');
    const detailPrice = document.getElementById('detailPrice');
    const modal = document.getElementById('productDetailModal');
    
    if (detailImage) detailImage.src = product.image || '';
    if (detailName) detailName.textContent = product.name;
    if (detailCategory) detailCategory.textContent = product.category || '';
    if (detailDescription) detailDescription.textContent = product.description || 'Pas de description.';
    if (detailPrice) {
        const price = parseFloat(product.price) || 0;
        detailPrice.textContent = (product.oldPrice ? `${product.oldPrice.toLocaleString('fr-FR')} DA ` : '') + `${price.toLocaleString('fr-FR')} DA`;
    }
    if (modal) modal.classList.add('active');
}

// ========== ❤️ Wishlist ==========
function toggleWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification('Retiré des favoris', 'info');
    } else {
        wishlist.push(productId);
        showNotification('Ajouté aux favoris', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// ========== 🛒 Panier Functions ==========
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) { showNotification("Produit non trouvé.", 'error'); return; }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1, price: parseFloat(product.price) || 0 });
    }
    
    saveCartToStorage();
    updateCartCount();
    showNotification(`✅ ${product.name} ajouté au panier!`, 'success');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) removeFromCart(productId);
        else { saveCartToStorage(); displayCart(); }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartCount();
    displayCart();
}

function displayCart() {
    const cartItems = document.getElementById('cartItems');
    const totalPriceEl = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!cartItems) return;
    
    let total = 0;
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty">Votre panier est vide</div>';
        if (totalPriceEl) totalPriceEl.textContent = '0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const itemTotal = price * quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `<img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60'">
        <div class="cart-item-info"><div class="cart-item-name">${item.name || 'Produit inconnu'}</div>
        <div class="cart-item-price">${price.toLocaleString('fr-FR')} DA</div>
        <div class="cart-item-qty"><button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button><span>${quantity}</span><button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button></div></div>
        <div style="font-weight:bold; color:var(--secondary-color);">${itemTotal.toLocaleString('fr-FR')} DA</div>
        <i class="fas fa-trash cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer"></i>`;
        cartItems.appendChild(cartItem);
    });
    
    if (totalPriceEl) totalPriceEl.textContent = total.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
    if (checkoutBtn) checkoutBtn.disabled = false;
}

function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (!countEl) return;
    const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'flex' : 'none';
}

function saveCartToStorage() { localStorage.setItem('cart', JSON.stringify(cart)); }

function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            cart = cart.map(item => ({
                ...item,
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1
            })).filter(item => item.id && item.name);
            updateCartCount();
        } catch (e) {
            console.error("❌ Erreur lecture panier:", e);
            cart = [];
            localStorage.removeItem('cart');
        }
    }
}

// ========== ⚙️ Event Listeners Setup ==========
function setupEventListeners() {
    const cartBtn = document.getElementById('cartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeButtons = document.querySelectorAll('.close-modal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const searchInput = document.getElementById('searchInput');

    cartBtn?.addEventListener('click', () => {
        if (cartModal) { cartModal.classList.add('active'); displayCart(); }
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => {
                m.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });

    checkoutBtn?.addEventListener('click', () => {
        if (cart.length > 0) {
            if (cartModal) cartModal.classList.remove('active');
            openOrderForm();
        }
    });

    searchInput?.addEventListener('input', filterProducts);
}

// ========== 🏷️ Category Filter ==========
function selectCat(cat, btn) {
    document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const hidden = document.getElementById('categoryFilter');
    if (hidden) hidden.value = cat;
    filterProducts();
}

function updateCatCounts() {
    const total = products.length;
    const laptop = products.filter(p => p.category === 'laptop').length;
    const imp = products.filter(p => p.category === 'imprimantes').length;
    const acc = products.filter(p => p.category === 'accessoires').length;
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setEl('countAll', total); setEl('countLaptop', laptop); setEl('countImprimantes', imp); setEl('countAccessoires', acc);
}

// ========== 🔍 Filter Products ==========
function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const selectedCategory = categoryFilter?.value || '';
    
    const filtered = products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    loadProducts(filtered, true);
}

// ========== 📋 Order Functions ==========
function generateOrderNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
    let count = localStorage.getItem('orderCount') || '0';
    count = String(parseInt(count) + 1).padStart(3, '0');
    localStorage.setItem('orderCount', count);
    return `AM${datePart}${count}`;
}

function openOrderForm() {
    const modal = document.getElementById('orderFormModal');
    if (modal) { modal.classList.add('active'); initializeWilayaSelect(); document.body.style.overflow = 'hidden'; }
}

function closeOrderForm() {
    const modal = document.getElementById('orderFormModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function initializeWilayaSelect() {
    const select = document.getElementById('wilaya');
    if (!select) return;
    select.innerHTML = '<option value="">Sélectionner une wilaya</option>';
    Object.keys(wilayasData).forEach(wilaya => {
        const opt = document.createElement('option');
        opt.value = wilaya; opt.textContent = wilaya;
        select.appendChild(opt);
    });
}

function updateShippingPrice() {
    const type = document.getElementById('orderType')?.value || '';
    const wilaya = document.getElementById('wilaya')?.value || '';
    const priceEl = document.getElementById('shippingPrice');
    const info = document.querySelector('.shipping-info');
    
    if (!wilaya) {
        if (priceEl) priceEl.textContent = '0 DA';
        if (info) info.classList.remove('active');
        return;
    }
    
    let price = 0;
    if (type === 'domicile') price = shippingPrices[wilaya] || 0;
    else if (type === 'stopdesk') price = stopDeskPrices[wilaya] || 0;
    
    if (priceEl) priceEl.textContent = price + ' DA';
    if (info) info.classList.add('active');
}

// ========== 📤 Submit Order ==========
async function submitOrderForm(e) {
    e.preventDefault();
    const form = document.getElementById('orderForm');
    if (!form) return;

    const orderType = form.orderType?.value || '';
    const wilaya = form.wilaya?.value || '';
    const commune = form.commune?.value || '';

    if (!orderType || !wilaya || !commune) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    let shippingPrice = 0;
    if (orderType === 'domicile') shippingPrice = shippingPrices[wilaya] || 0;
    else if (orderType === 'stopdesk') shippingPrice = stopDeskPrices[wilaya] || 0;

    const orderNumber = generateOrderNumber();
    const cartTotal = parseFloat(document.getElementById('totalPrice')?.textContent) || 0;
    const grandTotal = cartTotal + shippingPrice;

    const commande = {
        orderNumber, status: 'pending', orderType,
        firstName: form.firstName?.value.trim() || '',
        lastName: form.lastName?.value.trim() || '',
        phone1: form.phone1?.value.trim() || '',
        phone2: form.phone2?.value.trim() || null,
        wilaya, commune,
        cartItems: [...cart], cartTotal, shippingPrice, grandTotal,
        date: new Date().toISOString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

        await db.collection("commandes").add(commande);

        closeOrderForm();
        const confirmModal = document.getElementById('confirmModal');
        const orderNumberEl = document.getElementById('orderNumber');
        if (confirmModal) confirmModal.classList.add('active');
        if (orderNumberEl) orderNumberEl.textContent = orderNumber;

        cart = []; saveCartToStorage(); updateCartCount(); form.reset();
        const shippingPriceEl = document.getElementById('shippingPrice');
        if (shippingPriceEl) shippingPriceEl.textContent = '0 DA';
        showNotification('✅ Commande envoyée avec succès!', 'success');

    } catch (error) {
        console.error("❌ Erreur Firebase:", error);
        alert("Erreur lors de l'envoi. Vérifiez votre connexion.");
    } finally {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = false; btn.innerHTML = 'Confirmer la Commande'; }
    }
}

// ========== 🔔 Notification System ==========
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#6366f1';
    notif.style.cssText = `position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: white; padding: 15px 25px; border-radius: 12px; z-index: 10000; animation: slideIn 0.3s ease-out; box-shadow: 0 4px 20px rgba(0,0,0,0.2); font-weight: 500;`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ========== 🎨 Animation Styles ==========
const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } } .product-card { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; } .product-card.visible { opacity: 1; transform: translateY(0); }`;
document.head.appendChild(style);

// ========== 🚚 Shipping Modal Table ==========
function renderShippingTable(type) {
    const tbody = document.getElementById('shippingTableBody');
    if (!tbody) return;
    const prices = type === 'domicile' ? shippingPrices : stopDeskPrices;
    const wilayas = Object.keys(prices).sort();
    tbody.innerHTML = wilayas.map((wilaya) => {
        const [code, name] = wilaya.split(' - ');
        return `<tr><td>${code}</td><td>${name}</td><td style="text-align:center;font-weight:700;color:var(--secondary-color);">${prices[wilaya]} DA</td></tr>`;
    }).join('');
}

// ========== 🖼️ Image Optimization ==========
function optimizeImages() {
    const images = document.querySelectorAll('.product-image, .detail-image, .slide-image');
    const screenWidth = window.innerWidth;
    images.forEach(img => { img.loading = screenWidth < 768 ? 'eager' : 'lazy'; });
}

// ========== 🌐 Export Global Functions ==========
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.quickView = quickView;
window.toggleWishlist = toggleWishlist;
window.selectCat = selectCat;
window.loadMoreProducts = loadMoreProducts;
window.openOrderForm = openOrderForm;
window.closeOrderForm = closeOrderForm;
// دوال الشحن معرفة مسبقاً في الأعلى كـ window.openShippingModal إلخ
