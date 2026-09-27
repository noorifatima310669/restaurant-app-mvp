export const menuItems = [
  {
    id: 'starter-1', name: 'Truffle Parmesan Fries',
    description: 'Hand-cut fries, black truffle seasoning, aged parmesan and parsley.',
    price: 895, category: 'Starters', image: require('../../assets/menu/truffle-parmesan-fries.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'starter-2', name: 'Crispy Calamari',
    description: 'Golden calamari, preserved lemon, herb aioli and fresh citrus.',
    price: 1295, category: 'Starters', image: require('../../assets/menu/crispy-calamari.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'starter-3', name: 'Halloumi Bites',
    description: 'Seared halloumi, pomegranate glaze, toasted sesame and garden mint.',
    price: 1095, category: 'Starters', image: require('../../assets/menu/halloumi-bites.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'starter-4', name: 'Smoky Hummus Plate',
    description: 'Silky chickpea hummus, smoked paprika oil and warm flatbread.',
    price: 995, category: 'Starters', image: require('../../assets/menu/smoky-hummus-plate.png'),
    isSpecial: false, isAvailable: false,
  },
  {
    id: 'starter-5', name: 'Korean Glazed Wings',
    description: 'Crisp chicken wings, gochujang glaze, scallions and sesame.',
    price: 1395, category: 'Starters', image: require('../../assets/menu/korean-glazed-wings.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-1', name: 'Herb Grilled Chicken Bowl',
    description: 'Charred chicken, fragrant rice, roast vegetables and lemon tahini.',
    price: 1895, category: 'Mains', image: require('../../assets/menu/herb-chicken-bowl.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-2', name: 'Firecracker Beef',
    description: 'Tender beef, fiery house glaze, peppers, scallions and jasmine rice.',
    price: 2295, category: 'Mains', image: require('../../assets/menu/firecracker-beef.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'main-3', name: 'Creamy Pesto Penne',
    description: 'Basil pesto cream, cherry tomato, parmesan and toasted pine nuts.',
    price: 1695, category: 'Mains', image: require('../../assets/menu/creamy-pesto-penne.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'main-4', name: 'Mediterranean Salmon',
    description: 'Seared salmon, lemon couscous, grilled vegetables and herb sauce.',
    price: 2795, category: 'Mains', image: require('../../assets/menu/mediterranean-salmon.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'main-5', name: 'Urban Smash Burger',
    description: 'Double beef patty, cheddar, house pickles, onions and signature sauce.',
    price: 1995, category: 'Mains', image: require('../../assets/menu/urban-smash-burger.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-1', name: 'Burnt Basque Cheesecake',
    description: 'Deeply caramelised top with a soft, creamy vanilla centre.',
    price: 995, category: 'Desserts', image: require('../../assets/menu/burnt-basque-cheesecake.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'dessert-2', name: 'Lotus Tiramisu',
    description: 'Espresso-soaked layers, mascarpone and caramel biscuit crumb.',
    price: 1095, category: 'Desserts', image: require('../../assets/menu/lotus-tiramisu.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-3', name: 'Chocolate Lava Cake',
    description: 'Warm dark chocolate fondant with a flowing centre and vanilla gelato.',
    price: 1195, category: 'Desserts', image: require('../../assets/menu/chocolate-lava-cake.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'dessert-4', name: 'Pistachio Milk Cake',
    description: 'Three-milk sponge, pistachio cream, rose and roasted nuts.',
    price: 1145, category: 'Desserts', image: require('../../assets/menu/pistachio-milk-cake.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'dessert-5', name: 'Mango Panna Cotta',
    description: 'Silky vanilla panna cotta, mango coulis and fresh mango.',
    price: 945, category: 'Desserts', image: require('../../assets/menu/mango-panna-cotta.png'),
    isSpecial: false, isAvailable: false,
  },
  {
    id: 'drink-1', name: 'Peach Iced Tea',
    description: 'House-brewed black tea, ripe peach, lemon and clear ice.',
    price: 495, category: 'Drinks', image: require('../../assets/menu/peach-iced-tea.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'drink-2', name: 'Mint Citrus Cooler',
    description: 'Fresh mint, lime, lemon and sparkling soda over crushed ice.',
    price: 545, category: 'Drinks', image: require('../../assets/menu/mint-citrus-cooler.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'drink-3', name: 'Vanilla Cold Brew',
    description: 'Slow-steeped coffee, vanilla bean and a light cream cap.',
    price: 595, category: 'Drinks', image: require('../../assets/menu/vanilla-cold-brew.png'),
    isSpecial: false, isAvailable: true,
  },
  {
    id: 'drink-4', name: 'Berry Sparkler',
    description: 'Mixed berries, rosemary, citrus and fine sparkling soda.',
    price: 575, category: 'Drinks', image: require('../../assets/menu/berry-sparkler.png'),
    isSpecial: true, isAvailable: true,
  },
  {
    id: 'drink-5', name: 'Sparkling Mineral Water',
    description: 'Chilled sparkling mineral water, served with a citrus peel.',
    price: 395, category: 'Drinks', image: require('../../assets/menu/sparkling-mineral-water.png'),
    isSpecial: false, isAvailable: true,
  },
];

export const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
