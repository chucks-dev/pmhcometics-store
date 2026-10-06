/** Inserts demo categories, products and a BEAUTY10 code. Safe to re-run (skips existing slugs/SKUs). */
import { pool } from "../src/server/db/client";
import { slugify } from "../src/lib/slug";

const CATEGORIES = [
  ["Skincare", "Cleansers, serums and moisturisers for every routine."], ["Makeup", "Complexion, lips and eyes."],
  ["Hair Care", "Shampoos, oils and treatments."], ["Body Care", "Lotions, butters and scrubs."], ["Fragrance", "Everyday scents and gift sets."],
];

// [category, name, brand, priceNaira, discountNaira|null, stock, skinTypes, benefits, ingredients, description, bestSeller, featured]
const PRODUCTS: [string, string, string, number, number | null, number, string[], string[], string, string, boolean, boolean][] = [
  ["Skincare", "Gentle Gel Cleanser", "Dewdrop Lab", 8500, null, 40, ["normal", "oily", "combination"], ["Lightly foaming", "Leaves skin feeling fresh", "Fragrance-free"], "Water, Glycerin, Coco-Glucoside, Aloe Barbadensis Leaf Juice", "A soft gel cleanser for morning and night.", true, true],
  ["Skincare", "Hydra Glow Serum", "Aurelle", 15500, 12900, 25, ["dry", "normal", "sensitive"], ["Hydrating", "Lightweight finish", "Layers well under makeup"], "Water, Hyaluronic Acid, Glycerin, Panthenol", "A water-light serum that keeps skin feeling plump and comfortable.", true, true],
  ["Skincare", "Daily Barrier Moisturiser", "Dewdrop Lab", 12000, null, 30, ["dry", "sensitive", "normal"], ["Rich but not greasy", "Comforting", "Suitable for daily use"], "Water, Shea Butter, Ceramide NP, Squalane", "Everyday cream for skin that likes a cushion of moisture.", false, false],
  ["Skincare", "Brightening Vitamin C Drops", "Aurelle", 18000, 15000, 12, ["normal", "combination", "oily"], ["Brightening look", "Even-looking tone", "Fresh citrus-free scent"], "Water, Ascorbyl Glucoside, Glycerin, Ferulic Acid", "A daily drop serum to help skin look radiant.", true, false],
  ["Skincare", "Mineral Sunscreen SPF 50", "Kora", 11000, null, 3, ["normal", "dry", "combination", "sensitive"], ["Broad-spectrum SPF 50", "No white cast", "Sits well under makeup"], "Zinc Oxide, Squalane, Vitamin E", "A sheer daily sunscreen for all skin tones.", false, true],
  ["Makeup", "Skin Tint Foundation", "Kora", 14500, null, 35, ["normal", "dry", "combination"], ["Natural, skin-like finish", "Buildable coverage", "12 shades"], "Water, Squalane, Iron Oxides, Glycerin", "A comfortable, breathable base with a soft glow.", true, true],
  ["Makeup", "Velvet Matte Lip Colour", "Aurelle", 6500, 5200, 60, [], ["Soft-focus matte", "Long-wearing", "Comfortable formula"], "Isododecane, Jojoba Esters, Mica", "Rich colour in one swipe.", false, false],
  ["Makeup", "Lengthening Mascara", "Kora", 7500, null, 0, [], ["Defined lashes", "Smudge-resistant", "Easy to remove"], "Water, Beeswax, Carnauba Wax, Iron Oxides", "A classic black mascara that separates and lengthens.", false, false],
  ["Hair Care", "Shea & Argan Hair Oil", "Savannah Botanics", 9000, null, 45, [], ["Adds shine", "Softens ends", "Non-sticky feel"], "Argan Oil, Shea Oil, Castor Oil, Vitamin E", "A lightweight oil to finish any style.", true, false],
  ["Hair Care", "Scalp Care Shampoo", "Savannah Botanics", 8000, null, 28, [], ["Gentle on scalp", "Refreshing", "Sulphate-free"], "Water, Coco-Betaine, Aloe Vera, Peppermint Oil", "A balancing shampoo for everyday washing.", false, false],
  ["Body Care", "Whipped Shea Body Butter", "Savannah Botanics", 10500, 8900, 22, ["dry"], ["Deep moisture", "Soft, supple feel", "Warm vanilla scent"], "Shea Butter, Cocoa Butter, Coconut Oil, Vanilla Extract", "A cloud-like butter for dry skin.", true, true],
  ["Body Care", "Sugar Glow Body Scrub", "Dewdrop Lab", 7000, null, 4, [], ["Smoothing", "Rinses clean", "Citrus scent"], "Sugar, Sweet Almond Oil, Orange Peel Oil", "A weekly scrub for smoother-feeling skin.", false, false],
  ["Fragrance", "Amber Bloom Eau de Parfum 50ml", "Aurelle", 32000, 27500, 15, [], ["Warm floral amber", "Long-lasting", "Gift-ready box"], "Alcohol Denat., Parfum, Water", "Soft florals over warm amber and sandalwood.", true, true],
  ["Fragrance", "Citrus Linen Body Mist", "Kora", 9500, null, 50, [], ["Fresh and light", "Everyday wear", "Travel-friendly"], "Water, Alcohol Denat., Parfum", "A clean, bright mist for warm days.", false, false],
];

async function main() {
  const catIds: Record<string, string> = {};
  for (const [i, [name, desc]] of CATEGORIES.entries()) {
    const slug = slugify(name);
    await pool.query(`INSERT INTO categories (name, slug, description, sort_order) VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO NOTHING`, [name, slug, desc, i]);
    catIds[name] = (await pool.query(`SELECT id FROM categories WHERE slug = $1`, [slug])).rows[0].id;
  }
  let n = 0;
  for (const [cat, name, brand, price, disc, stock, skin, benefits, ingredients, desc, best, featured] of PRODUCTS) {
    const sku = "LUM-" + slugify(name).toUpperCase().replace(/-/g, "").slice(0, 8) + "-" + (++n).toString().padStart(2, "0");
    await pool.query(
      `INSERT INTO products (sku, name, slug, description, category_id, brand, price_kobo, discount_price_kobo, stock, ingredients, benefits, how_to_use, skin_types, status, is_best_seller, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'published',$14,$15) ON CONFLICT DO NOTHING`,
      [sku, name, slugify(name), desc, catIds[cat], brand, price * 100, disc ? disc * 100 : null, stock, ingredients, benefits,
       "Apply to clean skin or hair as needed. Patch-test first if you have sensitive skin.", skin, best, featured]);
  }
  await pool.query(
    `INSERT INTO discounts (code, type, value, min_order_kobo, expires_at) VALUES ('BEAUTY10','percentage',10,2000000, now() + interval '1 year') ON CONFLICT DO NOTHING`);
  console.log(`Seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products and the BEAUTY10 code.`);
  console.log("Products have no photos yet. Add them in Admin > Products.");
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
