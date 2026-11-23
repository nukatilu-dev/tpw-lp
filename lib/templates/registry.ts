export const TEMPLATE_DEFINITIONS = [
  {
    key: "business-profile",
    name: "Business Profile",
    description: "Website profil bisnis dan usaha.",
  },
  {
    key: "digital-menu",
    name: "Digital Menu",
    description: "Menu digital untuk restoran dan kuliner.",
  },
  {
    key: "product-catalog",
    name: "Product Catalog",
    description: "Katalog produk dan koleksi barang.",
  },
  {
    key: "personal-cv",
    name: "Personal CV",
    description: "Profil profesional dan riwayat pengalaman.",
  },
  {
    key: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Galeri karya dan proyek kreatif.",
  },
] as const

export type TemplateKey =
  (typeof TEMPLATE_DEFINITIONS)[number]["key"]

export type TemplateContent = Record<string, unknown>

const DEFAULT_CONTENT: Record<TemplateKey, TemplateContent> = {
  "business-profile": {
    businessName: "Nama Bisnis Anda",
    tagline: "Solusi terbaik untuk kebutuhan Anda.",
    headline: "Selamat datang di bisnis kami.",
    introduction:
      "Kami membantu pelanggan mendapatkan produk dan layanan berkualitas.",
    aboutTitle: "Tentang Kami",
    about:
      "Ceritakan sejarah, keunggulan, dan nilai yang ditawarkan bisnis Anda.",
    services: [
      {
        title: "Layanan Pertama",
        description: "Jelaskan layanan utama bisnis Anda.",
      },
    ],
    contact: {
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
    },
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
      tiktok: "",
    },
    images: {
      logo: "",
      product: "",
      background: "",
    },
    theme: {
      primary: "#173f35",
      accent: "#d4a96a",
    },
  },

  "digital-menu": {
    restaurantName: "Nama Restoran",
    tagline: "Rasa yang ingin Anda ingat.",
    introduction: "Selamat datang. Silakan pilih menu favorit Anda.",
    categories: [
      {
        name: "Makanan",
        items: [
          {
            name: "Menu Spesial",
            description: "Deskripsi menu",
            price: 25000,
            image: "",
          },
        ],
      },
      {
        name: "Minuman",
        items: [
          {
            name: "Minuman Segar",
            description: "Deskripsi minuman",
            price: 10000,
            image: "",
          },
        ],
      },
    ],
    contact: {
      whatsapp: "",
      address: "",
    },
  },

  "product-catalog": {
    brandName: "Nama Brand",
    tagline: "Temukan produk pilihan Anda.",
    introduction: "Jelajahi koleksi produk kami.",
    categories: ["Semua Produk"],
    products: [
      {
        name: "Produk Contoh",
        description: "Deskripsi produk.",
        price: 50000,
        image: "",
        category: "Semua Produk",
      },
    ],
    contact: {
      whatsapp: "",
      email: "",
    },
  },

  "personal-cv": {
    fullName: "Nama Lengkap",
    profession: "Profesi Anda",
    headline: "Halo, saya Nama Anda.",
    biography: "Perkenalkan diri dan perjalanan profesional Anda.",
    skills: ["Keahlian pertama", "Keahlian kedua"],
    experiences: [
      {
        position: "Posisi Pekerjaan",
        company: "Nama Perusahaan",
        period: "2024 - Sekarang",
        description: "Jelaskan tanggung jawab dan pencapaian.",
      },
    ],
    education: [
      {
        institution: "Nama Institusi",
        degree: "Pendidikan",
        period: "2020 - 2024",
      },
    ],
    contact: {
      email: "",
      phone: "",
      linkedin: "",
    },
  },

  "creative-portfolio": {
    creatorName: "Nama Kreator",
    profession: "Creative Professional",
    tagline: "Ide menjadi karya.",
    biography: "Ceritakan pendekatan dan perjalanan kreatif Anda.",
    projects: [
      {
        title: "Proyek Pertama",
        category: "Design",
        description: "Deskripsi singkat proyek.",
        image: "",
      },
      {
        title: "Proyek Kedua",
        category: "Creative",
        description: "Deskripsi singkat proyek.",
        image: "",
      },
    ],
    contact: {
      email: "",
      instagram: "",
    },
  },
}

const NAME_TO_KEY: Record<string, TemplateKey> = {
  "Business Profile": "business-profile",
  "Digital Menu": "digital-menu",
  "Product Catalog": "product-catalog",
  "Personal CV": "personal-cv",
  "Creative Portfolio": "creative-portfolio",
}

export function getTemplateKey(value: string): TemplateKey | null {
  if (value in DEFAULT_CONTENT) {
    return value as TemplateKey
  }

  return NAME_TO_KEY[value] ?? null
}

export function getTemplateDefinition(key: TemplateKey) {
  return TEMPLATE_DEFINITIONS.find((template) => template.key === key)!
}

export function createTemplateContent(
  key: TemplateKey
): TemplateContent {
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT[key])) as TemplateContent
}
