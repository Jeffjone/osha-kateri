export const products = [
  { id: "andros", name: "Andros Double-Breasted Suit", group: "men", type: "Tailoring", color: "Aubergine", price: 890, sizes: ["46 EU", "48 EU", "50 EU", "52 EU", "54 EU"], description: "A six-button silhouette with a broad peak lapel and a softly structured shoulder.", care: "Wool blend. Dry clean." },
  { id: "antheia", name: "Antheia Linen Blazer", group: "women", type: "Tailoring", color: "Limestone", price: 485, sizes: ["34 EU", "36 EU", "38 EU", "40 EU", "42 EU"], description: "A single-breasted linen blazer with a relaxed fit and softly defined waist.", care: "Linen. Dry clean." },
  { id: "naxos", name: "Naxos Knit Polo", group: "men", type: "Knitwear", color: "Olive Taupe", price: 225, sizes: ["XS", "S", "M", "L", "XL"], description: "An open-collar polo in textured cotton knit, finished with short sleeves and a ribbed hem.", care: "Cotton. Hand wash cold and dry flat." },
  { id: "melania", name: "Melania Silk Dress", group: "women", type: "Dresses", color: "Dusty Mauve", price: 595, sizes: ["34 EU", "36 EU", "38 EU", "40 EU", "42 EU"], description: "A fluid, sleeveless silk dress with a softly gathered neckline and a clean, long hem.", care: "Silk. Dry clean." },
  { id: "paros", name: "Paros Linen Shirt", group: "men", type: "Shirts", color: "Chalk", price: 180, sizes: ["XS", "S", "M", "L", "XL"], description: "An airy linen shirt with an open collar and a straight cut for warm coastal evenings.", care: "Linen. Wash cold and air dry." },
  { id: "delos", name: "Delos Silk Scarf", group: "accessories", type: "Accessories", color: "Olive and Mauve", price: 115, sizes: ["One size"], description: "A silk scarf in muted olive and mauve with a banded edge.", care: "Silk. Dry clean." }
];

export const collections = {
  all: { name: "The Aegean Collection", description: "Tailoring, ready-to-wear and accessories in the shades of dusk." },
  men: { name: "Men", description: "Softly structured tailoring, textured knitwear and coastal linen.", group: "men" },
  women: { name: "Women", description: "Relaxed tailoring and fluid silhouettes in silk and linen.", group: "women" },
  accessories: { name: "Accessories", description: "The finishing details of the Aegean wardrobe.", group: "accessories" },
  melania: { name: "The Melania Edit", description: "Silk and softened tailoring in the colors of a late Mediterranean evening.", includes: ["melania", "antheia", "delos"] },
  tailoring: { name: "Tailoring", description: "Defined lines and relaxed construction.", types: ["Tailoring"] },
  suits: { name: "Suits", description: "Softly structured tailoring.", includes: ["andros"] },
  blazers: { name: "Blazers", description: "Light layers in coastal shades.", includes: ["antheia"] },
  knitwear: { name: "Knitwear", description: "Quiet texture and an easy fit.", types: ["Knitwear"] },
  shirts: { name: "Shirts", description: "Open collars and airy fabrics.", types: ["Shirts"] },
  dresses: { name: "Dresses", description: "Fluid silhouettes for after dark.", types: ["Dresses"] },
  evening: { name: "Evening", description: "Aubergine tailoring and silk for the hours after sunset.", includes: ["andros", "melania", "delos"] },
  gifting: { name: "Gifting", description: "Small luxuries and favorites from the collection.", includes: ["delos", "naxos", "paros"] }
};

export const menus = {
  highlights: {
    label: "Highlights",
    columns: [
      ["Collection", [["The Aegean Collection", "shop/all"], ["Evening", "shop/evening"], ["View all", "shop/all"]]],
      ["The Melania Edit", [["Womenswear lookbook", "lookbook/women"], ["Shop the edit", "shop/melania"]]]
    ],
    features: [["Tailoring", "shop/tailoring", "andros"], ["The Melania Edit", "shop/melania", "melania"], ["Knitwear", "shop/knitwear", "naxos"]]
  },
  men: {
    label: "Men",
    columns: [
      ["Ready to wear", [["Suits", "shop/suits"], ["Knitwear", "shop/knitwear"], ["Shirts", "shop/shirts"], ["View all menswear", "shop/men"]]],
      ["Accessories", [["Scarves", "shop/accessories"], ["Gifting", "shop/gifting"]]],
      ["Shop by occasion", [["Evening", "shop/evening"], ["Everyday", "shop/knitwear"], ["Warm weather", "shop/shirts"]]]
    ],
    features: [["Aegean After Dark", "shop/men", "andros"], ["Coastal Linen", "shop/shirts", "paros"], ["Gifting", "shop/gifting", "delos"]]
  },
  women: {
    label: "Women",
    columns: [
      ["Lookbook", [["The Aegean Collection", "lookbook/women"], ["The Melania Edit", "shop/melania"]]],
      ["Ready to wear", [["Blazers", "shop/blazers"], ["Dresses", "shop/dresses"], ["View all womenswear", "shop/women"]]]
    ],
    features: [["Womenswear Lookbook", "lookbook/women", "evening"], ["Linen Tailoring", "shop/blazers", "antheia"], ["Melania", "shop/melania", "melania"]]
  },
  house: {
    label: "The House",
    columns: [
      ["Osha Kateri", [["About the house", "house"], ["Aegean After Dark lookbook", "lookbook"], ["Client service", "contact"]]]
    ],
    features: [["The House", "house", "terrace"], ["Campaign", "lookbook", "aegean"], ["Evening", "shop/evening", "melania"]]
  }
};

export const image = (id) => `images/campaign/${id}.webp`;
export const getProduct = (id) => products.find((product) => product.id === id);
export const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function collectionProducts(collection) {
  if (collection.includes) return collection.includes.map(getProduct);
  if (collection.group) return products.filter((product) => product.group === collection.group);
  if (collection.types) return products.filter((product) => collection.types.includes(product.type));
  return products;
}

export function findProducts(query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return products.filter((product) => {
    const fields = [product.name, product.color, product.type, collections[product.group].name, product.description].join(" ").toLowerCase();
    return terms.every((term) => fields.includes(term));
  });
}
