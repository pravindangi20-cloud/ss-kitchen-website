# S.S Kitchen Centre website

Double-click `index.html` to open. No install, no build.

## 1. Change phone, WhatsApp, address, hours
Open `js/config.js`. Edit the values in quotes and save. Everything on the site updates.
Hours: `hoursDisplay` is the text shown, `openHour` / `closeHour` (24-hour clock) drive the "Open now" badge. 12 and 3 means 12 PM to 3 AM. For 24 hours use `openHour: 0` and `closeHour: 24`.

## 2. Add, edit or remove a dish / change a price
Open `js/menu-data.js`. Each dish is one line. Copy this line, paste it anywhere in the list and edit it:

```
{ id: "starters-new-dish", category: "Starters", subcategory: "", name: "New Dish", description: "Short line about it", price: 150, diet: "veg", image: "", chefsPick: false },
```
- `category` must be one of: Starters, Rice & Biryani, Main Course, Thalis, Maggi, Breads, Fried Rice, Sides & Drinks
- `subcategory` is used only in Main Course: Chicken, Egg, Paneer & Veg
- `diet`: "veg" or "non-veg"
- `price: null` shows "Ask us"
- `id` must be unique. To remove a dish, delete its line.

## 3. Replace placeholder images
Put real photos (JPG/WebP, under 200 KB each) in `images/`. Then update the path:
- Dish photos: the `image` field in `js/menu-data.js`
- Hero, story photos: `src` in `index.html` (search "REPLACE with real photo")
- Gallery photos: the `PHOTOS` list near the top of the mosaic part of `js/main.js`
- CTA banner background: `css/style.css` (search "REPLACE with real photo")

## 4. Colours and fonts
Top of `css/style.css`, inside `:root { ... }`.

## 5. Owner name and social links
`js/config.js`: `ownerName`, `instagramUrl`, `facebookUrl`, `googleReviewsUrl`. Icons with "#" or empty links stay hidden.

## 6. Put it online free (Netlify Drop)
1. Go to app.netlify.com/drop
2. Drag the whole `ss-kitchen` folder onto the page
3. Wait a few seconds for the link
4. Open the link and check on your phone
5. To update later, drag the folder again (or use GitHub Pages / Vercel)

## 7. Custom domain
Buy a domain (GoDaddy, Namecheap, etc.). In Netlify: Site settings > Domain management > Add domain, then copy the DNS records Netlify shows into your domain provider. Also update the canonical URL and `og:url` in `index.html`.
