/**
 * Créditos das fotos dos produtos de demonstração (seed).
 * Todas vêm do Wikimedia Commons; as licenças CC BY e CC BY-SA exigem citar autor, fonte e licença.
 * Gerado a partir dos comentários de server/prisma/seed.ts — mantenha os dois em sincronia.
 */
export type PhotoCredit = { author: string; license: string; licenseUrl: string; source: string }

export const PHOTO_CREDITS: Array<{ product: string; slug: string; photos: PhotoCredit[] }> = [
  {
    "product": "Apple iPhone 15 Pro Max",
    "slug": "apple-iphone-15-pro-max",
    "photos": [
      {
        "author": "Kgbo",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:IPhone_15_Pro_Max_and_the_box%2C_2023%2C_01.jpg"
      },
      {
        "author": "メイド理世",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Back_view_of_iPhone_15_Pro_Max_Natural_Titanium.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy S24 Ultra 5G",
    "slug": "samsung-galaxy-s24-ultra",
    "photos": [
      {
        "author": "SimonWaldherr",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24_Ultra_with_dark_Background.jpg"
      },
      {
        "author": "TGspot.co.il",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung-Galaxy-S24-Ultra-Front.jpg"
      }
    ]
  },
  {
    "product": "Xiaomi 15 Ultra",
    "slug": "xiaomi-15-ultra",
    "photos": [
      {
        "author": "毕明明",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Xiaomi_15_Ultra_002.jpg"
      },
      {
        "author": "毕明明",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Xiaomi_15_Ultra_003.jpg"
      }
    ]
  },
  {
    "product": "Google Pixel 8 Pro",
    "slug": "google-pixel-8-pro",
    "photos": [
      {
        "author": "SimonWaldherr",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro.jpg"
      },
      {
        "author": "Mliu92",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Google_Pixel_8_Pro_back_%28Bay%29.svg"
      }
    ]
  },
  {
    "product": "Motorola Edge 50 Neo",
    "slug": "motorola-edge-50-neo",
    "photos": [
      {
        "author": "Mannivu",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Motorola_Edge_50_Neo.jpg"
      },
      {
        "author": "AdiDusi",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Motorola_Edge_50_Neo_Nautical_Blue_Rear_View.png"
      }
    ]
  },
  {
    "product": "Apple iPhone 16 Pro",
    "slug": "apple-iphone-16-pro",
    "photos": [
      {
        "author": "Kyu3a",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Back_of_iPhone_16_Pro_-_1.jpg"
      },
      {
        "author": "Kyu3a",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Camera_of_iPhone_16_Pro.jpg"
      }
    ]
  },
  {
    "product": "Apple iPhone 16",
    "slug": "apple-iphone-16",
    "photos": [
      {
        "author": "Padgriffin",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:IPhone_16_Ultramarine_Rear.png"
      },
      {
        "author": "Kyu3a",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Back_of_iPhone_16_-_2.jpg"
      }
    ]
  },
  {
    "product": "Apple iPhone 15",
    "slug": "apple-iphone-15",
    "photos": [
      {
        "author": "IPHONE 15",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:IPhone_15_%26_iPhone_15_Plus.jpg"
      },
      {
        "author": "IPHONE 15",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Apple_iPhone_15.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy S25 Ultra",
    "slug": "samsung-galaxy-s25-ultra",
    "photos": [
      {
        "author": "Alvis Jean",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S25_Ultra_Titanium_Silverblue.jpg"
      },
      {
        "author": "HuangWending18072009",
        "license": "CC0",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Rear_view_of_the_Samsung_Galaxy_S25_Ultra_smartphone.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy S24",
    "slug": "samsung-galaxy-s24",
    "photos": [
      {
        "author": "Ganesh Mohan T",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24_01.jpg"
      },
      {
        "author": "可恩Ke En",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_s24_series_5.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy S23 Ultra",
    "slug": "samsung-galaxy-s23-ultra",
    "photos": [
      {
        "author": "PantheraLeo1359531",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_20230416_HOF00318_RAW-Export_cens.png"
      },
      {
        "author": "PantheraLeo1359531",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S23_Ultra%2C_512_GB%2C_Lavender_mit_S-Pen_20230416_HOF00335_RAW-Export_cens.png"
      }
    ]
  },
  {
    "product": "Samsung Galaxy Z Fold6",
    "slug": "samsung-galaxy-z-fold6",
    "photos": [
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold_6_%282%29.jpg"
      },
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold_6_%283%29.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy Z Flip6",
    "slug": "samsung-galaxy-z-flip6",
    "photos": [
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Secondary_screen_on_the_back_of_Z_Flip_6.jpg"
      },
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Flip_6.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy A55 5G",
    "slug": "samsung-galaxy-a55",
    "photos": [
      {
        "author": "Captainmorlypogi1959",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_A55_5G_2024_%28cropped%29.jpg"
      },
      {
        "author": "OneUIExplorer",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Galaxy_A55.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy A35 5G",
    "slug": "samsung-galaxy-a35",
    "photos": [
      {
        "author": "Captainmorlypogi1959",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_A35_5G_2024_%281%29.jpg"
      },
      {
        "author": "Captainmorlypogi1959",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_A35_5G_2024_%282%29.jpg"
      }
    ]
  },
  {
    "product": "Samsung Galaxy A15",
    "slug": "samsung-galaxy-a15",
    "photos": [
      {
        "author": "PantheraLeo1359531",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_A15_20240529_HOF7502_RAW-Export_cens.png"
      }
    ]
  },
  {
    "product": "Google Pixel 9 Pro XL",
    "slug": "google-pixel-9-pro-xl",
    "photos": [
      {
        "author": "D.328",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Google_Pixel_9_Pro_XL_%28back%29.jpg"
      }
    ]
  },
  {
    "product": "Google Pixel 8a",
    "slug": "google-pixel-8a",
    "photos": [
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Rear_view_of_Pixel_8a.jpg"
      },
      {
        "author": "Miyako Fujimiya",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Pixel_8a.jpg"
      }
    ]
  },
  {
    "product": "Google Pixel 7a",
    "slug": "google-pixel-7a",
    "photos": [
      {
        "author": "Tatsuo Yamashita",
        "license": "CC BY 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/2.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Google_Pixel_7A.jpg"
      }
    ]
  },
  {
    "product": "Xiaomi 14",
    "slug": "xiaomi-14",
    "photos": [
      {
        "author": "茅野ふたば",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Xiaomi_14_rear_%28July_10%2C_2026%29.jpg"
      },
      {
        "author": "茅野ふたば",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Xiaomi_14_%28July_10%2C_2026%29.jpg"
      }
    ]
  },
  {
    "product": "Motorola Razr 40",
    "slug": "motorola-razr-40",
    "photos": [
      {
        "author": "Kyu3a",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Motorola_razr_40_-_3.jpg"
      },
      {
        "author": "X-SHLIED",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Motorola_Razr_40.jpg"
      }
    ]
  },
  {
    "product": "Nothing Phone (2)",
    "slug": "nothing-phone-2",
    "photos": [
      {
        "author": "Booredatwork.com",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Nothing_phone_%282%29_%28Booredatwork.com%29_025.png"
      },
      {
        "author": "Booredatwork.com",
        "license": "CC BY 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/3.0/deed.pt-br",
        "source": "https://commons.wikimedia.org/wiki/File:Nothing_phone_%282%29_%28Booredatwork.com%29_001.png"
      }
    ]
  }
]
