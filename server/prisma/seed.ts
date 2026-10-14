import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do Nexus Shop...')

  // 1. Criar Administrador
  const adminPasswordHash = await bcrypt.hash('NexusAdmin@2025', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexusshop.com' },
    update: {},
    create: {
      email: 'admin@nexusshop.com',
      name: 'Nexus Admin',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      emailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    },
  })
  console.log(`👤 Usuário Admin criado: ${admin.email}`)

  // 2. Criar Cliente Padrão com Endereço
  const customerPasswordHash = await bcrypt.hash('Cliente@123', 12)
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
  console.log(`👤 Usuário Cliente criado: ${customer.email}`)

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
      avgRating: 4.9,
      totalReviews: 28,
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
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop',
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
      avgRating: 4.8,
      totalReviews: 35,
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
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop',
      ],
    },
    {
      name: 'Xiaomi 14 Ultra Leica',
      slug: 'xiaomi-14-ultra-leica',
      description: 'Projetado em parceria lendária com a Leica. Quatro câmeras de 50MP com lente ótica Leica Summilux e sensor principal de 1 polegada com abertura variável contínua para fotografia profissional no bolso.',
      price: 6499.00,
      compareAtPrice: 7299.00,
      brand: 'Xiaomi',
      model: '14 Ultra',
      sku: 'NEXUS-XIA14U-512',
      stock: 25,
      isFeatured: true,
      avgRating: 4.9,
      totalReviews: 19,
      totalSold: 88,
      specifications: {
        screenSize: '6.73"',
        resolution: '3200 x 1440 (AMOLED LTPO 120Hz 3000 nits)',
        processor: 'Qualcomm Snapdragon 8 Gen 3',
        ram: 16,
        storage: 512,
        battery: 5000,
        mainCamera: 'Quad 50 MP Leica (1" LYT-900 + 75mm Floating Telefoto + 120mm Periscópio + Ultra-Wide)',
        frontCamera: '32 MP 4K',
        os: 'Xiaomi HyperOS (Android 14)',
        weight: 220,
        charging: 'HyperCharge 90W com fio (0 a 100% em 33 min), 80W sem fio',
        colors: ['Black Vegan Leather', 'White Vegan Leather'],
      },
      images: [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop',
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
      avgRating: 4.7,
      totalReviews: 22,
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
        'https://images.unsplash.com/photo-1511707171634-5f897ff02597?w=800&auto=format&fit=crop',
      ],
    },
    {
      name: 'Motorola Edge 50 Ultra',
      slug: 'motorola-edge-50-ultra',
      description: 'Design refinado com acabamento em madeira natural e couro vegano. Câmeras certificadas pela Pantone, tela Super HD pOLED de 144Hz e carregador ultrarrápido TurboPower de 125W na caixa.',
      price: 4999.00,
      compareAtPrice: 5699.00,
      brand: 'Motorola',
      model: 'Edge 50 Ultra',
      sku: 'NEXUS-MOT-E50U-512',
      stock: 40,
      isFeatured: false,
      avgRating: 4.6,
      totalReviews: 14,
      totalSold: 65,
      specifications: {
        screenSize: '6.7"',
        resolution: '2712 x 1220 (Super HD pOLED 144Hz)',
        processor: 'Snapdragon 8s Gen 3',
        ram: 16,
        storage: 512,
        battery: 4500,
        mainCamera: '50 MP OIS + 50 MP Ultra-Wide/Macro + 64 MP Telefoto Periscópio 3x',
        frontCamera: '50 MP com foco automático',
        os: 'Android 14 Hello UI',
        weight: 197,
        charging: 'TurboPower 125W (100% em 20 min), 50W sem fio',
        colors: ['Peach Fuzz', 'Nordic Wood', 'Black Forest'],
      },
      images: [
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop',
      ],
    },
  ]

  for (const item of products) {
    const { images, ...productData } = item
    const createdProduct = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {},
      create: productData as any,
    })

    for (let i = 0; i < images.length; i++) {
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

  console.log('✅ Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
