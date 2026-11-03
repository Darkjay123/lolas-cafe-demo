// Sample menu built from Lola's Cafe's public posts. Prices are samples for the demo.
const MENU = [
  { id: "burgers", name: "Burgers & Grills", items: [
    { id: "sig-burger", name: "Lola Signature Burger", desc: "Double-stacked beef patty, melted cheese, house sauce, crisp lettuce", price: 4500, img: "img/burger.webp", mods: [{ id: "x-patty", name: "Extra patty", price: 1500 }, { id: "x-cheese", name: "Extra cheese", price: 500 }, { id: "spicy", name: "Make it spicy", price: 200 }] },
    { id: "smash", name: "Double Smash Burger", desc: "Two smashed patties, caramelised onions, secret sauce", price: 6000, img: "img/burger.webp", mods: [{ id: "x-cheese", name: "Extra cheese", price: 500 }, { id: "spicy", name: "Make it spicy", price: 200 }] },
    { id: "crispy-chick", name: "Crispy Chicken Burger", desc: "Buttermilk-fried chicken thigh, slaw, mayo drizzle", price: 3800, img: "img/burger.webp", mods: [{ id: "x-cheese", name: "Extra cheese", price: 500 }, { id: "spicy", name: "Make it spicy", price: 200 }] }
  ]},
  { id: "pizza", name: "Pizza", items: [
    { id: "pepperoni", name: "Pepperoni Pizza", desc: "Hand-stretched base, generous pepperoni, mozzarella pull", price: 7500, img: "img/pizza.webp", sizes: [{ id: "s9", name: '9"', delta: 0 }, { id: "s12", name: '12"', delta: 3500 }], mods: [{ id: "x-cheese", name: "Extra cheese", price: 500 }] },
    { id: "suya-pizza", name: "Chicken Suya Pizza", desc: "Suya-spiced chicken, peppers, red onions, yaji dust", price: 8000, img: "img/pizza.webp", sizes: [{ id: "s9", name: '9"', delta: 0 }, { id: "s12", name: '12"', delta: 3500 }], mods: [{ id: "x-cheese", name: "Extra cheese", price: 500 }] }
  ]},
  { id: "sides", name: "Sides & Wings", items: [
    { id: "loaded-fries", name: "Loaded Fries", desc: "Golden fries loaded with cheese sauce, chicken bits and drizzle", price: 4500, img: "img/burger.webp", mods: [{ id: "x-cheese", name: "Extra cheese sauce", price: 500 }, { id: "spicy", name: "Make it spicy", price: 200 }] },
    { id: "honey-wings", name: "Honey Wings (6pc)", desc: "Sticky honey-glazed wings, toasted sesame", price: 5000, img: "img/wings.webp", mods: [{ id: "spicy", name: "Make it spicy", price: 200 }] },
    { id: "turkey-fries", name: "Turkey & Fries", desc: "Juicy turkey thigh over a pile of fries", price: 6500, img: "img/burger.webp", mods: [] }
  ]},
  { id: "shawarma", name: "Shawarma", items: [
    { id: "chick-shaw", name: "Chicken Shawarma", desc: "Grilled chicken, creamy garlic sauce, crunchy veg, foil-wrapped", price: 3500, img: "img/shawarma.webp", mods: [{ id: "double", name: "Double protein", price: 1200 }, { id: "spicy", name: "Make it spicy", price: 200 }] },
    { id: "beef-shaw", name: "Beef Shawarma", desc: "Seared beef strips, sausages, house sauce", price: 3800, img: "img/shawarma.webp", mods: [{ id: "double", name: "Double protein", price: 1200 }, { id: "spicy", name: "Make it spicy", price: 200 }] }
  ]},
  { id: "drinks", name: "Signature Drinks", items: [
    { id: "bubble-tea", name: "Strawberry Bubble Tea", desc: "The one everyone talks about. Strawberry milk tea, chewy boba", price: 3000, img: "img/milkshake.webp", mods: [{ id: "x-boba", name: "Extra boba", price: 400 }] },
    { id: "milkshake", name: "Vanilla Milkshake", desc: "Thick, cold, crowned with soft scoop and cinnamon dust", price: 3500, img: "img/milkshake.webp", mods: [] },
    { id: "iced-coffee", name: "Iced Coffee", desc: "Cold-brewed, lightly sweet, properly strong", price: 2800, img: "img/milkshake.webp", mods: [] }
  ]},
  { id: "pastries", name: "Pastries & Sweets", items: [
    { id: "choc-cake", name: "Chocolate Fudge Slice", desc: "Dense chocolate sponge, glossy ganache, strawberry crown", price: 2500, img: "img/cake.webp", mods: [] },
    { id: "meat-pie", name: "Meat Pie", desc: "Flaky crust, proper Nigerian filling", price: 1200, img: "img/cake.webp", mods: [] },
    { id: "croissant", name: "Butter Croissant", desc: "Baked fresh through the morning", price: 1800, img: "img/cake.webp", mods: [] }
  ]}
];
const DEMO = { deliveryFee: 800, hours: "9:00 AM - 8:00 PM", address: "Delight Bar Junction, Ekrejeta, Abraka, Delta State", phone: "0901 570 4346", phone2: "0916 250 9367" };
