const fs = require('fs');
module.exports = [
  {
    id: 'starter-1', name: 'Truffle Parmesan Fries',
    description: 'Hand-cut fries, black truffle seasoning, aged parmesan and parsley.',
    price: 895, category: 'Starters', image: 'truffle-parmesan-fries',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'starter-2', name: 'Crispy Calamari',
    description: 'Golden calamari, preserved lemon, herb aioli and fresh citrus.',
    price: 1295, category: 'Starters', image: 'crispy-calamari',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'starter-3', name: 'Halloumi Bites',
    description: 'Seared halloumi, pomegranate glaze, toasted sesame and garden mint.',
    price: 1095, category: 'Starters', image: 'halloumi-bites',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'starter-4', name: 'Smoky Hummus Plate',
    description: 'Silky chickpea hummus, smoked paprika oil and warm flatbread.',
    price: 995, category: 'Starters', image: 'smoky-hummus-plate',
    isSpecial: false, isAvailable: false,
  },
  {
    id: 'starter-5', name: 'Korean Glazed Wings',
    description: 'Crisp chicken wings, gochujang glaze, scallions and sesame.',
    price: 1395, category: 'Starters', image: 'korean-glazed-wings',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-1', name: 'Herb Grilled Chicken Bowl',
    description: 'Charred chicken, fragrant rice, roast vegetables and lemon tahini.',
    price: 1895, category: 'Mains', image: 'herb-chicken-bowl',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-2', name: 'Firecracker Beef',
    description: 'Tender beef, fiery house glaze, peppers, scallions and jasmine rice.',
    price: 2295, category: 'Mains', image: 'firecracker-beef',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'main-3', name: 'Creamy Pesto Penne',
    description: 'Basil pesto cream, cherry tomato, parmesan and toasted pine nuts.',
    price: 1695, category: 'Mains', image: 'creamy-pesto-penne',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'main-4', name: 'Mediterranean Salmon',
    description: 'Seared salmon, lemon couscous, grilled vegetables and herb sauce.',
    price: 2795, category: 'Mains', image: 'mediterranean-salmon',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-5', name: 'Urban Smash Burger',
    description: 'Double beef patty, cheddar, house pickles, onions and signature sauce.',
    price: 1995, category: 'Mains', image: 'urban-smash-burger',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-1', name: 'Burnt Basque Cheesecake',
    description: 'Deeply caramelised top with a soft, creamy vanilla centre.',
    price: 995, category: 'Desserts', image: 'burnt-basque-cheesecake',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'dessert-2', name: 'Lotus Tiramisu',
    description: 'Espresso-soaked layers, mascarpone and caramel biscuit crumb.',
    price: 1095, category: 'Desserts', image: 'lotus-tiramisu',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-3', name: 'Chocolate Lava Cake',
    description: 'Warm dark chocolate fondant with a flowing centre and vanilla gelato.',
    price: 1195, category: 'Desserts', image: 'chocolate-lava-cake',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-4', name: 'Pistachio Milk Cake',
    description: 'Three-milk sponge, pistachio cream, rose and roasted nuts.',
    price: 1145, category: 'Desserts', image: 'pistachio-milk-cake',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'dessert-5', name: 'Mango Panna Cotta',
    description: 'Silky vanilla panna cotta, mango coulis and fresh mango.',
    price: 945, category: 'Desserts', image: 'mango-panna-cotta',
    isSpecial: false, isAvailable: false,
  },
  {
    id: 'drink-1', name: 'Peach Iced Tea',
    description: 'House-brewed black tea, ripe peach, lemon and clear ice.',
    price: 495, category: 'Drinks', image: 'peach-iced-tea',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'drink-2', name: 'Mint Citrus Cooler',
    description: 'Fresh mint, lime, lemon and sparkling soda over crushed ice.',
    price: 545, category: 'Drinks', image: 'mint-citrus-cooler',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'drink-3', name: 'Vanilla Cold Brew',
    description: 'Slow-steeped coffee, vanilla bean and a light cream cap.',
    price: 595, category: 'Drinks', image: 'vanilla-cold-brew',
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'drink-4', name: 'Berry Sparkler',
    description: 'Mixed berries, rosemary, citrus and fine sparkling soda.',
    price: 575, category: 'Drinks', image: 'berry-sparkler',
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'drink-5', name: 'Sparkling Mineral Water',
    description: 'Chilled sparkling mineral water, served with a citrus peel.',
    price: 395, category: 'Drinks', image: 'sparkling-mineral-water',
    isSpecial: false, isAvailable: true,
  },
];


const menu = module.exports.map(({image,...item}) => ({...item,imageKey:image}));
const vm = require('vm');
function read(file, variable) { const ctx={}; vm.runInNewContext(fs.readFileSync(file,'utf8').replace(/export const /g,'var '),ctx); return ctx[variable]; }
fs.writeFileSync('server/data/a1-seed.json', JSON.stringify({menu,tables:read('src/data/tables.js','tables'),users:read('src/data/users.js','mockUsers')},null,2)+'\n');
