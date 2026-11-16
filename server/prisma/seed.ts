import { Prisma, PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { upsertDemoAccounts } from './demo-accounts.js'
import crypto from 'crypto'

const prisma = new PrismaClient()

/** Senha forte aleatória para o seed de desenvolvimento quando não vier do ambiente. */
function randomPassword() {
  return `Nx${crypto.randomBytes(9).toString('base64url')}9a`
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@nexusshop.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || randomPassword()
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD || randomPassword()

async function main() {
  console.log('🌱 Iniciando seed do Nexus Shop...')

  // 1. Criar Administrador
  // upsert não altera usuários existentes: só informa a senha de quem for criado agora
  const adminExisted = !!(await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } }))
  const customerExisted = !!(await prisma.user.findUnique({ where: { email: 'cliente@nexusshop.com' } }))
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'Nexus Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    },
  })
  console.log(`👤 Usuário Admin ${adminExisted ? 'já existia' : 'criado'}: ${admin.email}`)

  // 2. Criar Cliente Padrão com Endereço
  const customerPasswordHash = await bcrypt.hash(CUSTOMER_PASSWORD, 12)
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@nexusshop.com' },
    update: {},
    create: {
      email: 'cliente@nexusshop.com',
      name: 'Lucas Ferreira',
      phone: '(11) 98765-4321',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      addresses: {
        create: {
          label: 'Casa',
          street: 'Av. Paulista',
          number: '1000',
          complement: 'Apt 42',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          isDefault: true,
        },
      },
    },
  })
  console.log(`👤 Usuário Cliente ${customerExisted ? 'já existia' : 'criado'}: ${customer.email}`)

  // 2.1 Contas de demonstração (senha exibida na tela de login)
  await upsertDemoAccounts(prisma)

  // 3. Catálogo de Smartphones com especificações detalhadas
  const products = [
    {
      name: 'Apple iPhone 15 Pro Max',
      slug: 'apple-iphone-15-pro-max',
      description: 'O iPhone definitivo com estrutura em titânio aeroespacial, chip A17 Pro revolucionário para jogos, botão de Ação personalizável e o sistema de câmeras mais poderoso já criado pela Apple com zoom óptico de 5x.',
      price: 8999.00,
      compareAtPrice: 9999.00,
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      sku: 'NEXUS-IP15PM-256',
      stock: 45,
      isFeatured: true,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 142,
      specifications: {
        screenSize: '6.7"',
        resolution: '2796 x 1290 (Super Retina XDR OLED 120Hz ProMotion)',
        processor: 'Apple A17 Pro (3nm)',
        ram: 8,
        storage: 256,
        battery: 4422,
        mainCamera: '48 MP (Principal) + 12 MP (Ultra-Wide) + 12 MP (Telefoto 5x)',
        frontCamera: '12 MP TrueDepth',
        os: 'iOS 17',
        weight: 221,
        charging: 'USB-C com suporte a USB 3 (10Gb/s), MagSafe 15W',
        colors: ['Titânio Natural', 'Titânio Azul', 'Titânio Branco', 'Titânio Preto'],
      },
      images: [
        // Fotos: Kgbo e メイド理世, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/IPhone_15_Pro_Max_and_the_box%2C_2023%2C_01.jpg/960px-IPhone_15_Pro_Max_and_the_box%2C_2023%2C_01.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Back_view_of_iPhone_15_Pro_Max_Natural_Titanium.jpg/960px-Back_view_of_iPhone_15_Pro_Max_Natural_Titanium.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy S24 Ultra 5G',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Conheça o Galaxy S24 Ultra com Galaxy AI integrada, estrutura reforçada em titânio, tela plana Corning Gorilla Armor antirreflexo e o poder bruto do processador Snapdragon 8 Gen 3 para Galaxy.',
      price: 7999.00,
      compareAtPrice: 8999.00,
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      sku: 'NEXUS-GS24U-512',
      stock: 60,
      isFeatured: true,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 210,
      specifications: {
        screenSize: '6.8"',
        resolution: '3120 x 1440 (Dynamic AMOLED 2X 120Hz 2600 nits)',
        processor: 'Snapdragon 8 Gen 3 for Galaxy',
        ram: 12,
        storage: 512,
        battery: 5000,
        mainCamera: '200 MP (Principal) + 50 MP (Periscópio 5x) + 12 MP (Ultra-Wide) + 10 MP (Telefoto 3x)',
        frontCamera: '12 MP Dual Pixel',
        os: 'Android 14 com One UI 6.1 (7 anos de atualizações)',
        weight: 232,
        charging: 'Carregamento rápido de 45W, Wireless 15W',
        colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'],
      },
      images: [
        // Fotos: SimonWaldherr e TGspot.co.il, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Samsung_Galaxy_S24_Ultra_with_dark_Background.jpg/960px-Samsung_Galaxy_S24_Ultra_with_dark_Background.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Samsung-Galaxy-S24-Ultra-Front.jpg/960px-Samsung-Galaxy-S24-Ultra-Front.jpg',
      ],
    },
    {
      name: 'Xiaomi 15 Ultra',
      slug: 'xiaomi-15-ultra',
      description: 'Câmera Leica de verdade no bolso: sensor principal de 1 polegada, teleobjetiva periscópio de 200 MP e quatro câmeras com gravação 8K. Tela LTPO de 3200 nits, Snapdragon 8 Elite e bateria de silício-carbono de 5410 mAh.',
      price: 8499.00,
      compareAtPrice: 9499.00,
      brand: 'Xiaomi',
      model: '15 Ultra',
      sku: 'NEXUS-XIA15U-512',
      stock: 25,
      isFeatured: true,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 88,
      specifications: {
        screenSize: '6.73"',
        resolution: '3200 x 1440 (AMOLED LTPO 120Hz, 3200 nits)',
        processor: 'Qualcomm Snapdragon 8 Elite',
        ram: 16,
        storage: 512,
        battery: 5410,
        mainCamera: 'Quad Leica: 50 MP 1" LYT-900 + 200 MP Periscópio 100mm + 50 MP Tele 3x + 50 MP Ultra-Wide',
        frontCamera: '32 MP',
        os: 'Xiaomi HyperOS 2 (Android 15)',
        weight: 226,
        charging: 'HyperCharge 90W com fio, 80W sem fio',
        colors: ['Preto', 'Branco', 'Prata Cromado'],
      },
      images: [
        // Fotos: 毕明明, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Xiaomi_15_Ultra_002.jpg/960px-Xiaomi_15_Ultra_002.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Xiaomi_15_Ultra_003.jpg/960px-Xiaomi_15_Ultra_003.jpg',
      ],
    },
    {
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      description: 'O smartphone com a inteligência do Google Tensor G3. Recursos revolucionários de fotografia computacional como Magic Editor, Melhor Take, Áudio Borracha Mágica e sensor de temperatura corporal integrado.',
      price: 5799.00,
      compareAtPrice: 6499.00,
      brand: 'Google',
      model: 'Pixel 8 Pro',
      sku: 'NEXUS-PIX8P-128',
      stock: 30,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 94,
      specifications: {
        screenSize: '6.7"',
        resolution: '2992 x 1344 (Super Actua LTPO OLED 120Hz)',
        processor: 'Google Tensor G3 com Coprocessador Titan M2',
        ram: 12,
        storage: 128,
        battery: 5050,
        mainCamera: '50 MP Octa PD + 48 MP Quad PD Ultra-Wide + 48 MP Quad PD Telefoto 5x',
        frontCamera: '10.5 MP Dual PD',
        os: 'Android 14 Puro (7 anos de suporte)',
        weight: 213,
        charging: 'Carregamento Rápido 30W, Qi sem fio',
        colors: ['Azul-baía', 'Obsidiana', 'Porcelana'],
      },
      images: [
        // Fotos: SimonWaldherr e Mliu92, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Google_Pixel_8_Pro.jpg/960px-Google_Pixel_8_Pro.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Google_Pixel_8_Pro_back_%28Bay%29.svg/960px-Google_Pixel_8_Pro_back_%28Bay%29.svg.png',
      ],
    },
    {
      name: 'Motorola Edge 50 Neo',
      slug: 'motorola-edge-50-neo',
      description: 'Compacto, leve e com cores validadas pela Pantone. Tela pOLED 1.5K de 120Hz, câmera principal Sony LYTIA 700C com OIS, teleobjetiva 3x e carregamento TurboPower de 68W.',
      price: 2499.00,
      compareAtPrice: 2999.00,
      brand: 'Motorola',
      model: 'Edge 50 Neo',
      sku: 'NEXUS-MOT-E50N-256',
      stock: 40,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 65,
      specifications: {
        screenSize: '6.4"',
        resolution: '2670 x 1200 (pOLED 1.5K 120Hz, 3000 nits)',
        processor: 'MediaTek Dimensity 7300',
        ram: 8,
        storage: 256,
        battery: 4310,
        mainCamera: '50 MP Sony LYTIA 700C OIS + 13 MP Ultra-Wide/Macro + 10 MP Telefoto 3x',
        frontCamera: '32 MP',
        os: 'Android 14 Hello UI',
        weight: 171,
        charging: 'TurboPower 68W com fio, 15W sem fio',
        colors: ['Pantone Poinciana', 'Pantone Nautical Blue', 'Pantone Lattè', 'Pantone Grisaille'],
      },
      images: [
        // Fotos: Mannivu e AdiDusi, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Motorola_Edge_50_Neo.jpg/960px-Motorola_Edge_50_Neo.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Motorola_Edge_50_Neo_Nautical_Blue_Rear_View.png/960px-Motorola_Edge_50_Neo_Nautical_Blue_Rear_View.png',
      ],
    },
    {
      name: 'Apple iPhone 16 Pro',
      slug: 'apple-iphone-16-pro',
      description: 'Titânio, tela ProMotion de 120Hz e o chip A18 Pro. Câmera Fusion de 48 MP, ultra-angular de 48 MP e teleobjetiva 5x, com o novo botão Controle da Câmera.',
      price: 8299.00,
      compareAtPrice: 9299.00,
      brand: 'Apple',
      model: 'iPhone 16 Pro',
      sku: 'NEXUS-APL-16P-256',
      stock: 30,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 120,
      specifications: {
        screenSize: '6.3"',
        resolution: '2622 x 1206 (Super Retina XDR OLED, ProMotion 120Hz)',
        processor: 'Apple A18 Pro',
        ram: 8,
        storage: 256,
        battery: 3582,
        mainCamera: '48 MP Fusion + 48 MP Ultra-Wide + 12 MP Telefoto 5x',
        frontCamera: '12 MP TrueDepth',
        os: 'iOS 18',
        weight: 199,
        charging: 'USB-C com fio, MagSafe 25W',
        colors: ['Titânio-deserto', 'Titânio natural', 'Titânio branco', 'Titânio preto'],
      },
      images: [
        // Fotos: Kyu3a, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Back_of_iPhone_16_Pro_-_1.jpg/960px-Back_of_iPhone_16_Pro_-_1.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Camera_of_iPhone_16_Pro.jpg/960px-Camera_of_iPhone_16_Pro.jpg',
      ],
    },
    {
      name: 'Apple iPhone 16',
      slug: 'apple-iphone-16',
      description: 'Chip A18, câmera Fusion de 48 MP com zoom 2x de qualidade óptica, botão de Ação e Controle da Câmera. Cores vibrantes com vidro colorido.',
      price: 5999.00,
      compareAtPrice: 6799.00,
      brand: 'Apple',
      model: 'iPhone 16',
      sku: 'NEXUS-APL-16-128',
      stock: 45,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 140,
      specifications: {
        screenSize: '6.1"',
        resolution: '2556 x 1179 (Super Retina XDR OLED 60Hz)',
        processor: 'Apple A18',
        ram: 8,
        storage: 128,
        battery: 3561,
        mainCamera: '48 MP Fusion + 12 MP Ultra-Wide',
        frontCamera: '12 MP TrueDepth',
        os: 'iOS 18',
        weight: 170,
        charging: 'USB-C com fio, MagSafe 25W',
        colors: ['Ultramarino', 'Verde-acinzentado', 'Rosa', 'Branco', 'Preto'],
      },
      images: [
        // Fotos: Padgriffin (CC BY 4.0) e Kyu3a (CC BY-SA 4.0), Wikimedia Commons
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/IPhone_16_Ultramarine_Rear.png/960px-IPhone_16_Ultramarine_Rear.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Back_of_iPhone_16_-_2.jpg/960px-Back_of_iPhone_16_-_2.jpg',
      ],
    },
    {
      name: 'Apple iPhone 15',
      slug: 'apple-iphone-15',
      description: 'Dynamic Island, câmera principal de 48 MP e USB-C. Vidro traseiro com cor infundida e acabamento fosco.',
      price: 4799.00,
      compareAtPrice: 5499.00,
      brand: 'Apple',
      model: 'iPhone 15',
      sku: 'NEXUS-APL-15-128',
      stock: 40,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 110,
      specifications: {
        screenSize: '6.1"',
        resolution: '2556 x 1179 (Super Retina XDR OLED 60Hz)',
        processor: 'Apple A16 Bionic',
        ram: 6,
        storage: 128,
        battery: 3349,
        mainCamera: '48 MP Principal + 12 MP Ultra-Wide',
        frontCamera: '12 MP TrueDepth',
        os: 'iOS 17',
        weight: 171,
        charging: 'USB-C com fio, MagSafe 15W',
        colors: ['Rosa', 'Amarelo', 'Verde', 'Azul', 'Preto'],
      },
      images: [
        // Fotos: IPHONE 15, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/IPhone_15_%26_iPhone_15_Plus.jpg/960px-IPhone_15_%26_iPhone_15_Plus.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Apple_iPhone_15.jpg/960px-Apple_iPhone_15.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy S25 Ultra',
      slug: 'samsung-galaxy-s25-ultra',
      description: 'Tela de 6,9" com Gorilla Armor 2 antirreflexo, Snapdragon 8 Elite for Galaxy, câmera de 200 MP com ultra-angular de 50 MP e S Pen integrada.',
      price: 8999.00,
      compareAtPrice: 10499.00,
      brand: 'Samsung',
      model: 'Galaxy S25 Ultra',
      sku: 'NEXUS-SAM-S25U-512',
      stock: 20,
      isFeatured: true,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 75,
      specifications: {
        screenSize: '6.9"',
        resolution: '3120 x 1440 (Dynamic AMOLED 2X 120Hz)',
        processor: 'Snapdragon 8 Elite for Galaxy',
        ram: 12,
        storage: 512,
        battery: 5000,
        mainCamera: '200 MP + 50 MP Ultra-Wide + 10 MP Tele 3x + 50 MP Periscópio 5x',
        frontCamera: '12 MP',
        os: 'Android 15 (One UI 7)',
        weight: 218,
        charging: '45W com fio, 15W sem fio',
        colors: ['Titanium Silverblue', 'Titanium Black', 'Titanium Gray', 'Titanium Whitesilver'],
      },
      images: [
        // Fotos: Alvis Jean (CC BY-SA 4.0) e HuangWending18072009 (CC0), Wikimedia Commons
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Samsung_Galaxy_S25_Ultra_Titanium_Silverblue.jpg/960px-Samsung_Galaxy_S25_Ultra_Titanium_Silverblue.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Rear_view_of_the_Samsung_Galaxy_S25_Ultra_smartphone.jpg/960px-Rear_view_of_the_Samsung_Galaxy_S25_Ultra_smartphone.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'Compacto e com Galaxy AI: tradução de chamadas, Circule para Pesquisar e edição generativa. Tela de 120Hz e câmera tripla com tele 3x.',
      price: 4499.00,
      compareAtPrice: 5299.00,
      brand: 'Samsung',
      model: 'Galaxy S24',
      sku: 'NEXUS-SAM-S24-256',
      stock: 35,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 98,
      specifications: {
        screenSize: '6.2"',
        resolution: '2340 x 1080 (Dynamic AMOLED 2X 120Hz)',
        processor: 'Exynos 2400',
        ram: 8,
        storage: 256,
        battery: 4000,
        mainCamera: '50 MP + 12 MP Ultra-Wide + 10 MP Telefoto 3x',
        frontCamera: '12 MP',
        os: 'Android 14 (One UI 6.1)',
        weight: 167,
        charging: '25W com fio, 15W sem fio',
        colors: ['Onyx Black', 'Marble Grey', 'Cobalt Violet', 'Amber Yellow'],
      },
      images: [
        // Fotos: Ganesh Mohan T (CC BY-SA 4.0) e 可恩Ke En (CC BY 3.0), Wikimedia Commons
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Samsung_Galaxy_S24_01.jpg/960px-Samsung_Galaxy_S24_01.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Samsung_Galaxy_s24_series_5.jpg/960px-Samsung_Galaxy_s24_series_5.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy S23 Ultra',
      slug: 'samsung-galaxy-s23-ultra',
      description: 'Câmera de 200 MP com dois zooms ópticos (3x e 10x), S Pen embutida e Snapdragon 8 Gen 2 for Galaxy. Um Ultra completo por um preço bem menor.',
      price: 5499.00,
      compareAtPrice: 6999.00,
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      sku: 'NEXUS-SAM-S23U-512',
      stock: 15,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 60,
      specifications: {
        screenSize: '6.8"',
        resolution: '3088 x 1440 (Dynamic AMOLED 2X 120Hz)',
        processor: 'Snapdragon 8 Gen 2 for Galaxy',
        ram: 12,
        storage: 512,
        battery: 5000,
        mainCamera: '200 MP + 12 MP Ultra-Wide + 10 MP Tele 3x + 10 MP Periscópio 10x',
        frontCamera: '12 MP',
        os: 'Android 13 (One UI 5.1)',
        weight: 234,
        charging: '45W com fio, 15W sem fio',
        colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      },
      images: [
        // Fotos: PantheraLeo1359531, Wikimedia Commons, CC BY 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_20230416_HOF00318_RAW-Export_cens.png/960px-Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_20230416_HOF00318_RAW-Export_cens.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_mit_S-Pen_20230416_HOF00335_RAW-Export_cens.png/960px-Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_mit_S-Pen_20230416_HOF00335_RAW-Export_cens.png',
      ],
    },
    {
      name: 'Samsung Galaxy Z Fold6',
      slug: 'samsung-galaxy-z-fold6',
      description: 'Abre e vira um tablet de 7,6". Mais leve que a geração anterior, com tela externa de 6,3" mais larga, Snapdragon 8 Gen 3 e certificação IP48.',
      price: 11999.00,
      compareAtPrice: 13499.00,
      brand: 'Samsung',
      model: 'Galaxy Z Fold6',
      sku: 'NEXUS-SAM-ZFO6-512',
      stock: 10,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 22,
      specifications: {
        screenSize: '7.6" (externa 6.3")',
        resolution: '2160 x 1856 (Dynamic AMOLED 2X 120Hz)',
        processor: 'Snapdragon 8 Gen 3 for Galaxy',
        ram: 12,
        storage: 512,
        battery: 4400,
        mainCamera: '50 MP + 12 MP Ultra-Wide + 10 MP Telefoto 3x',
        frontCamera: '10 MP (externa) + 4 MP sob a tela',
        os: 'Android 14 (One UI 6.1.1)',
        weight: 239,
        charging: '25W com fio, 15W sem fio',
        colors: ['Silver Shadow', 'Pink', 'Navy'],
      },
      images: [
        // Fotos: Miyako Fujimiya, Wikimedia Commons, CC BY 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Samsung_Galaxy_Z_Fold_6_%282%29.jpg/960px-Samsung_Galaxy_Z_Fold_6_%282%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Samsung_Galaxy_Z_Fold_6_%283%29.jpg/960px-Samsung_Galaxy_Z_Fold_6_%283%29.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy Z Flip6',
      slug: 'samsung-galaxy-z-flip6',
      description: 'Dobrável que cabe em qualquer bolso: tela externa de 3,4" para responder mensagens sem abrir, câmera de 50 MP e bateria de 4000 mAh.',
      price: 6499.00,
      compareAtPrice: 7499.00,
      brand: 'Samsung',
      model: 'Galaxy Z Flip6',
      sku: 'NEXUS-SAM-ZFL6-256',
      stock: 20,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 45,
      specifications: {
        screenSize: '6.7" (externa 3.4")',
        resolution: '2640 x 1080 (Dynamic AMOLED 2X 120Hz)',
        processor: 'Snapdragon 8 Gen 3 for Galaxy',
        ram: 12,
        storage: 256,
        battery: 4000,
        mainCamera: '50 MP + 12 MP Ultra-Wide',
        frontCamera: '10 MP',
        os: 'Android 14 (One UI 6.1.1)',
        weight: 187,
        charging: '25W com fio, 15W sem fio',
        colors: ['Blue', 'Yellow', 'Mint', 'Silver Shadow'],
      },
      images: [
        // Fotos: Miyako Fujimiya, Wikimedia Commons, CC BY 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Secondary_screen_on_the_back_of_Z_Flip_6.jpg/960px-Secondary_screen_on_the_back_of_Z_Flip_6.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Samsung_Galaxy_Z_Flip_6.jpg/960px-Samsung_Galaxy_Z_Flip_6.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy A55 5G',
      slug: 'samsung-galaxy-a55',
      description: 'Intermediário com acabamento premium: moldura de metal, vidro Gorilla Victus+ e resistência IP67. Câmera de 50 MP com OIS e selfie de 32 MP.',
      price: 2299.00,
      compareAtPrice: 2799.00,
      brand: 'Samsung',
      model: 'Galaxy A55',
      sku: 'NEXUS-SAM-A55-256',
      stock: 60,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 135,
      specifications: {
        screenSize: '6.6"',
        resolution: '2340 x 1080 (Super AMOLED 120Hz)',
        processor: 'Exynos 1480',
        ram: 8,
        storage: 256,
        battery: 5000,
        mainCamera: '50 MP OIS + 12 MP Ultra-Wide + 5 MP Macro',
        frontCamera: '32 MP',
        os: 'Android 14 (One UI 6.1)',
        weight: 213,
        charging: '25W com fio',
        colors: ['Awesome Iceblue', 'Awesome Lilac', 'Awesome Navy', 'Awesome Lemon'],
      },
      images: [
        // Fotos: Captainmorlypogi1959 e OneUIExplorer, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Samsung_Galaxy_A55_5G_2024_%28cropped%29.jpg/960px-Samsung_Galaxy_A55_5G_2024_%28cropped%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Galaxy_A55.jpg/960px-Galaxy_A55.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy A35 5G',
      slug: 'samsung-galaxy-a35',
      description: 'Tela Super AMOLED de 120Hz, câmera principal de 50 MP com estabilização óptica, bateria de 5000 mAh e proteção IP67.',
      price: 1799.00,
      compareAtPrice: 2199.00,
      brand: 'Samsung',
      model: 'Galaxy A35',
      sku: 'NEXUS-SAM-A35-128',
      stock: 70,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 150,
      specifications: {
        screenSize: '6.6"',
        resolution: '2340 x 1080 (Super AMOLED 120Hz)',
        processor: 'Exynos 1380',
        ram: 8,
        storage: 128,
        battery: 5000,
        mainCamera: '50 MP OIS + 8 MP Ultra-Wide + 5 MP Macro',
        frontCamera: '13 MP',
        os: 'Android 14 (One UI 6.1)',
        weight: 209,
        charging: '25W com fio',
        colors: ['Awesome Iceblue', 'Awesome Lilac', 'Awesome Navy', 'Awesome Lemon'],
      },
      images: [
        // Fotos: Captainmorlypogi1959, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Samsung_Galaxy_A35_5G_2024_%281%29.jpg/960px-Samsung_Galaxy_A35_5G_2024_%281%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Samsung_Galaxy_A35_5G_2024_%282%29.jpg/960px-Samsung_Galaxy_A35_5G_2024_%282%29.jpg',
      ],
    },
    {
      name: 'Samsung Galaxy A15',
      slug: 'samsung-galaxy-a15',
      description: 'O Galaxy de entrada com tela Super AMOLED de 90Hz, câmera de 50 MP e bateria de 5000 mAh com carregamento de 25W.',
      price: 999.00,
      compareAtPrice: 1299.00,
      brand: 'Samsung',
      model: 'Galaxy A15',
      sku: 'NEXUS-SAM-A15-128',
      stock: 80,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 160,
      specifications: {
        screenSize: '6.5"',
        resolution: '2340 x 1080 (Super AMOLED 90Hz)',
        processor: 'MediaTek Helio G99',
        ram: 4,
        storage: 128,
        battery: 5000,
        mainCamera: '50 MP + 5 MP Ultra-Wide + 2 MP Macro',
        frontCamera: '13 MP',
        os: 'Android 14 (One UI 6)',
        weight: 200,
        charging: '25W com fio',
        colors: ['Azul Escuro', 'Azul Claro', 'Amarelo'],
      },
      images: [
        // Fotos: PantheraLeo1359531, Wikimedia Commons, CC BY 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Samsung_Galaxy_A15_20240529_HOF7502_RAW-Export_cens.png/960px-Samsung_Galaxy_A15_20240529_HOF7502_RAW-Export_cens.png',
      ],
    },
    {
      name: 'Google Pixel 9 Pro XL',
      slug: 'google-pixel-9-pro-xl',
      description: 'Tensor G4 com Gemini, tela Super Actua de 6,8" e câmera tripla com teleobjetiva 5x. Selfie de 42 MP e 7 anos de atualizações.',
      price: 7999.00,
      compareAtPrice: 8999.00,
      brand: 'Google',
      model: 'Pixel 9 Pro XL',
      sku: 'NEXUS-GOO-P9PXL-256',
      stock: 15,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 40,
      specifications: {
        screenSize: '6.8"',
        resolution: '2992 x 1344 (Super Actua LTPO OLED 120Hz)',
        processor: 'Google Tensor G4',
        ram: 16,
        storage: 256,
        battery: 5060,
        mainCamera: '50 MP + 48 MP Ultra-Wide + 48 MP Telefoto 5x',
        frontCamera: '42 MP',
        os: 'Android 14 (7 anos de atualizações)',
        weight: 221,
        charging: '37W com fio, 23W sem fio (Pixel Stand)',
        colors: ['Porcelana', 'Obsidiana', 'Avelã', 'Quartzo-rosa'],
      },
      images: [
        // Fotos: D.328, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Google_Pixel_9_Pro_XL_%28back%29.jpg/960px-Google_Pixel_9_Pro_XL_%28back%29.jpg',
      ],
    },
    {
      name: 'Google Pixel 8a',
      slug: 'google-pixel-8a',
      description: 'O Pixel acessível com o mesmo Tensor G3 do Pixel 8. Tela Actua de 120Hz, câmera de 64 MP e 7 anos de atualizações de sistema.',
      price: 2999.00,
      compareAtPrice: 3499.00,
      brand: 'Google',
      model: 'Pixel 8a',
      sku: 'NEXUS-GOO-P8A-128',
      stock: 30,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 70,
      specifications: {
        screenSize: '6.1"',
        resolution: '2400 x 1080 (Actua OLED 120Hz)',
        processor: 'Google Tensor G3',
        ram: 8,
        storage: 128,
        battery: 4492,
        mainCamera: '64 MP + 13 MP Ultra-Wide',
        frontCamera: '13 MP',
        os: 'Android 14 (7 anos de atualizações)',
        weight: 188,
        charging: '18W com fio, 7,5W sem fio',
        colors: ['Obsidiana', 'Porcelana', 'Baía', 'Aloe'],
      },
      images: [
        // Fotos: Miyako Fujimiya, Wikimedia Commons, CC BY 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Rear_view_of_Pixel_8a.jpg/960px-Rear_view_of_Pixel_8a.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pixel_8a.jpg/960px-Pixel_8a.jpg',
      ],
    },
    {
      name: 'Google Pixel 7a',
      slug: 'google-pixel-7a',
      description: 'Fotografia do Google por um preço de entrada: câmera de 64 MP com OIS, Tensor G2 e carregamento sem fio.',
      price: 2199.00,
      compareAtPrice: 2699.00,
      brand: 'Google',
      model: 'Pixel 7a',
      sku: 'NEXUS-GOO-P7A-128',
      stock: 25,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 55,
      specifications: {
        screenSize: '6.1"',
        resolution: '2400 x 1080 (OLED 90Hz)',
        processor: 'Google Tensor G2',
        ram: 8,
        storage: 128,
        battery: 4385,
        mainCamera: '64 MP OIS + 13 MP Ultra-Wide',
        frontCamera: '13 MP',
        os: 'Android 13',
        weight: 193,
        charging: '18W com fio, 7,5W sem fio',
        colors: ['Carvão', 'Neve', 'Mar', 'Coral'],
      },
      images: [
        // Fotos: Tatsuo Yamashita, Wikimedia Commons, CC BY 2.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Google_Pixel_7A.jpg/960px-Google_Pixel_7A.jpg',
      ],
    },
    {
      name: 'Xiaomi 14',
      slug: 'xiaomi-14',
      description: 'Flagship compacto com lentes Leica Summilux, sensor Light Fusion 900, Snapdragon 8 Gen 3 e carregamento HyperCharge de 90W.',
      price: 4999.00,
      compareAtPrice: 5999.00,
      brand: 'Xiaomi',
      model: '14',
      sku: 'NEXUS-XIA14-512',
      stock: 25,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 50,
      specifications: {
        screenSize: '6.36"',
        resolution: '2670 x 1200 (AMOLED LTPO 120Hz)',
        processor: 'Qualcomm Snapdragon 8 Gen 3',
        ram: 12,
        storage: 512,
        battery: 4610,
        mainCamera: 'Leica: 50 MP Light Fusion 900 + 50 MP Tele 75mm + 50 MP Ultra-Wide',
        frontCamera: '32 MP',
        os: 'Xiaomi HyperOS (Android 14)',
        weight: 193,
        charging: 'HyperCharge 90W com fio, 50W sem fio',
        colors: ['Preto', 'Branco', 'Verde Jade'],
      },
      images: [
        // Fotos: 茅野ふたば, Wikimedia Commons, CC BY-SA 4.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Xiaomi_14_rear_%28July_10%2C_2026%29.jpg/960px-Xiaomi_14_rear_%28July_10%2C_2026%29.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Xiaomi_14_%28July_10%2C_2026%29.jpg/960px-Xiaomi_14_%28July_10%2C_2026%29.jpg',
      ],
    },
    {
      name: 'Motorola Razr 40',
      slug: 'motorola-razr-40',
      description: 'Dobrável flip com tela interna pOLED de 6,9" e 144Hz, tela externa para notificações e acabamento em couro vegano.',
      price: 2999.00,
      compareAtPrice: 3999.00,
      brand: 'Motorola',
      model: 'Razr 40',
      sku: 'NEXUS-MOT-RZR40-256',
      stock: 20,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 35,
      specifications: {
        screenSize: '6.9" (externa 1.5")',
        resolution: '2640 x 1080 (pOLED 144Hz)',
        processor: 'Snapdragon 7 Gen 1',
        ram: 8,
        storage: 256,
        battery: 4200,
        mainCamera: '64 MP OIS + 13 MP Ultra-Wide/Macro',
        frontCamera: '32 MP',
        os: 'Android 13',
        weight: 189,
        charging: 'TurboPower 30W com fio, 5W sem fio',
        colors: ['Sage Green', 'Summer Lilac', 'Vanilla Cream'],
      },
      images: [
        // Fotos: Kyu3a (CC BY-SA 4.0) e X-SHLIED (CC BY 4.0), Wikimedia Commons
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Motorola_razr_40_-_3.jpg/960px-Motorola_razr_40_-_3.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Motorola_Razr_40.jpg/960px-Motorola_Razr_40.jpg',
      ],
    },
    {
      name: 'Nothing Phone (2)',
      slug: 'nothing-phone-2',
      description: 'Traseira transparente com a interface Glyph de luzes que avisam notificações e chamadas. Snapdragon 8+ Gen 1 e duas câmeras de 50 MP.',
      price: 3299.00,
      compareAtPrice: 3999.00,
      brand: 'Nothing',
      model: 'Phone (2)',
      sku: 'NEXUS-NOT-PH2-256',
      stock: 15,
      isFeatured: false,
      avgRating: 0, // calculado a partir das avaliações reais
      totalReviews: 0,
      totalSold: 30,
      specifications: {
        screenSize: '6.7"',
        resolution: '2412 x 1080 (LTPO OLED 120Hz)',
        processor: 'Snapdragon 8+ Gen 1',
        ram: 12,
        storage: 256,
        battery: 4700,
        mainCamera: '50 MP OIS + 50 MP Ultra-Wide',
        frontCamera: '32 MP',
        os: 'Nothing OS 2.0 (Android 13)',
        weight: 201,
        charging: '45W com fio, 15W sem fio',
        colors: ['Dark Grey', 'White'],
      },
      images: [
        // Fotos: Booredatwork.com, Wikimedia Commons, CC BY 3.0
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Nothing_phone_%282%29_%28Booredatwork.com%29_025.png/960px-Nothing_phone_%282%29_%28Booredatwork.com%29_025.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Nothing_phone_%282%29_%28Booredatwork.com%29_001.png/960px-Nothing_phone_%282%29_%28Booredatwork.com%29_001.png',
      ],
    },
  ]

  for (const item of products) {
    const { images, ...productData } = item
    const createdProduct = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {},
      create: productData as Prisma.ProductCreateInput,
    })

    // Rodar o seed de novo não duplica as fotos
    const hasImages = await prisma.productImage.count({ where: { productId: createdProduct.id } })
    for (let i = 0; !hasImages && i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          url: images[i],
          alt: `${item.name} - Imagem ${i + 1}`,
          position: i,
        },
      })
    }
    console.log(`📱 Smartphone cadastrado: ${item.name}`)
  }

  // 4. Cupons de Desconto
  const coupons = [
    {
      code: 'NEXUS10',
      description: '10% de desconto em todo o catálogo Nexus Shop',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 1000,
      maxUses: 500,
    },
    {
      code: 'PRIMEIRACOMPRA',
      description: 'R$ 150 de desconto imediato na sua primeira compra',
      discountType: 'fixed',
      discountValue: 150,
      minOrderValue: 2000,
      maxUses: 1000,
    },
  ]

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    })
    console.log(`🎟️ Cupom criado: ${c.code}`)
  }

  // Configurações da loja de demonstração: os dois gateways ativos e frete grátis acima de R$ 3.000
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Nexus Shop',
      contactEmail: 'contato@nexusshop.com',
      freeShippingThreshold: 3000,
      stripeEnabled: true,
      mercadoPagoEnabled: true,
    },
  })
  console.log('⚙️ Configurações da loja criadas (gateways ativos, frete grátis acima de R$ 3.000)')

  console.log('✅ Seed finalizado com sucesso!')
  const showAdmin = !adminExisted && !process.env.SEED_ADMIN_PASSWORD
  const showCustomer = !customerExisted && !process.env.SEED_CUSTOMER_PASSWORD
  if (showAdmin || showCustomer) {
    console.log('\n🔑 Senhas geradas para os usuários criados agora (anote):')
    if (showAdmin) console.log(`   ${ADMIN_EMAIL}: ${ADMIN_PASSWORD}`)
    if (showCustomer) console.log(`   cliente@nexusshop.com: ${CUSTOMER_PASSWORD}`)
  }
  if (adminExisted || customerExisted) {
    console.log('ℹ️ Usuários que já existiam mantiveram a senha anterior.')
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
