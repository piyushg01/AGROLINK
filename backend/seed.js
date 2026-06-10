import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Import models
import User from './models/user.model.js';
import Produce from './models/produce.model.js';
import Product from './models/product.model.js';
import Order from './models/order.model.js';
import Chat from './models/chat.model.js';
import CropHealth from './models/cropHealth.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agrolink';

async function seed() {
  try {
    console.log('Connecting to database:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Database connected successfully.');

    // Clear existing data
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Produce.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Chat.deleteMany({});
    await CropHealth.deleteMany({});
    console.log('Old records successfully cleared.');

    // Create passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    console.log('Seeding Users...');
    // Rajesh Kumar (Farmer)
    const farmer = new User({
      name: 'Rajesh Kumar',
      email: 'farmer@agrolink.com',
      password: hashedPassword,
      role: 'farmer',
      phone: '+91 98765 43210',
      address: 'Rajesh Farms, Khed Taluka, Pune, Maharashtra',
      location: {
        type: 'Point',
        coordinates: [73.8850, 18.7250], // Pune rural area
      },
      language: 'en',
    });

    // Vikram Singh (Dealer / Buyer) - Navi Mumbai (~120km, average-high price)
    const dealer = new User({
      name: 'Vikram Singh',
      email: 'dealer@agrolink.com',
      password: hashedPassword,
      role: 'dealer',
      phone: '+91 88888 77777',
      address: 'Singh Crops Export Ltd, APMC Market, Vashi, Navi Mumbai',
      location: {
        type: 'Point',
        coordinates: [73.0012, 19.0308],
      },
      trustScore: 92,
      rating: 4.6,
      previousTransactions: 24,
      averageOfferPriceMultiplier: 1.05,
      language: 'en',
    });

    // Amit Patel (Dealer 2) - Mumbai (~125km, standard price)
    const dealer2 = new User({
      name: 'Amit Patel',
      email: 'dealer2@agrolink.com',
      password: hashedPassword,
      role: 'dealer',
      phone: '+91 91234 56789',
      address: 'Patel Trading House, APMC, Mumbai',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760],
      },
      trustScore: 85,
      rating: 4.1,
      previousTransactions: 12,
      averageOfferPriceMultiplier: 0.98,
      language: 'en',
    });

    // Suresh Kulkarni (Dealer 3) - Pune (~25km, extremely close, medium price)
    const dealer3 = new User({
      name: 'Suresh Kulkarni',
      email: 'dealer3@agrolink.com',
      password: hashedPassword,
      role: 'dealer',
      phone: '+91 93333 44444',
      address: 'Kulkarni Agri-Sourcing, Shivaji Nagar, Pune',
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
      },
      trustScore: 95,
      rating: 4.8,
      previousTransactions: 38,
      averageOfferPriceMultiplier: 1.02,
      language: 'en',
    });

    // Harpreet Singh (Dealer 4) - Indore (~500km, very far, premium profit)
    const dealer4 = new User({
      name: 'Harpreet Singh',
      email: 'dealer4@agrolink.com',
      password: hashedPassword,
      role: 'dealer',
      phone: '+91 94444 55555',
      address: 'Indore Grain Logistics APMC, Indore, MP',
      location: {
        type: 'Point',
        coordinates: [75.8573, 22.7196],
      },
      trustScore: 78,
      rating: 3.9,
      previousTransactions: 8,
      averageOfferPriceMultiplier: 1.12,
      language: 'en',
    });

    // Rajesh Deshmukh (Dealer 5) - Sangamner (~110km, standard price)
    const dealer5 = new User({
      name: 'Rajesh Deshmukh',
      email: 'dealer5@agrolink.com',
      password: hashedPassword,
      role: 'dealer',
      phone: '+91 95555 66666',
      address: 'Deshmukh & Sons Sourcing, Sangamner, Maharashtra',
      location: {
        type: 'Point',
        coordinates: [74.1240, 19.5761],
      },
      trustScore: 88,
      rating: 4.3,
      previousTransactions: 15,
      averageOfferPriceMultiplier: 1.01,
      language: 'en',
    });

    // Sunita Sharma (Shopkeeper / Supplier)
    const shopkeeper = new User({
      name: 'Sunita Sharma',
      email: 'shopkeeper@agrolink.com',
      password: hashedPassword,
      role: 'shopkeeper',
      phone: '+91 77777 66666',
      address: 'Sharma Agro-Seeds & Fertilizers, Chinchwad Road, Pune',
      location: {
        type: 'Point',
        coordinates: [73.7997, 18.6298],
      },
      language: 'en',
    });

    await farmer.save();
    await dealer.save();
    await dealer2.save();
    await dealer3.save();
    await dealer4.save();
    await dealer5.save();
    await shopkeeper.save();
    console.log('Users seeded: farmer@agrolink.com, shopkeeper@agrolink.com, and 5 dealers (dealer@, dealer2@, dealer3@, dealer4@, dealer5@)');

    console.log('Seeding Produce Listings...');
    // Seed Farmer Produce Listings
    const produceList = [
      {
        farmer: farmer._id,
        cropName: 'Premium Durum Wheat',
        category: 'Grain',
        quantity: 5000,
        pricePerKg: 24,
        description: 'Lush golden Durum wheat harvested directly from clean organic soil. Grade-A quality, low moisture content, ideal for pasta and premium flour milling.',
        address: farmer.address,
        coordinates: farmer.location.coordinates,
        status: 'Available',
      },
      {
        farmer: farmer._id,
        cropName: 'Basmati Rice Grade A',
        category: 'Grain',
        quantity: 3000,
        pricePerKg: 65,
        description: 'Long-grained aromatic traditional Basmati rice. Carefully sun-dried and ready for bulk distribution and exports.',
        address: farmer.address,
        coordinates: farmer.location.coordinates,
        status: 'Available',
      },
      {
        farmer: farmer._id,
        cropName: 'Organic Roma Tomatoes',
        category: 'Vegetable',
        quantity: 800,
        pricePerKg: 18,
        description: 'Juicy, thick-walled, red Roma tomatoes. 100% pesticide-free, handpicked and sorted for fresh retail market delivery.',
        address: farmer.address,
        coordinates: farmer.location.coordinates,
        status: 'Available',
      },
    ];

    const seededProduce = await Produce.insertMany(produceList);
    console.log('Produce listings successfully seeded.');

    console.log('Seeding Shopkeeper Products...');
    // Seed Shopkeeper Fertilizers
    const productList = [
      {
        shopkeeper: shopkeeper._id,
        name: 'NPK 19-19-19 Premium Fertilizer',
        category: 'Fertilizer',
        price: 450,
        description: 'Completely water-soluble compound fertilizer containing equal ratios of nitrogen, phosphorus, and potassium. Boosts vegetative growth, root development, and fruit sizing.',
        quantityInStock: 100,
      },
      {
        shopkeeper: shopkeeper._id,
        name: 'Organic Neem Oil Pesticide (Cold Pressed)',
        category: 'Pesticide',
        price: 180,
        description: '100% natural cold-pressed pure neem oil. Excellent organic insect repellent, fungicide, and miticide for eco-conscious farming.',
        quantityInStock: 50,
      },
      {
        shopkeeper: shopkeeper._id,
        name: 'Single Super Phosphate (SSP) Granular',
        category: 'Fertilizer',
        price: 350,
        description: 'High-grade phosphate-rich granular fertilizer. Supplies active phosphorus, calcium, and sulfur directly to young seedlings to boost root systems.',
        quantityInStock: 80,
      },
      {
        shopkeeper: shopkeeper._id,
        name: 'Chlorothalonil Fungicide 75% WP',
        category: 'Pesticide',
        price: 290,
        description: 'Broad-spectrum preventative fungicide. Highly effective against Early/Late Blight in tomatoes and potatoes.',
        quantityInStock: 40,
      },
      {
        shopkeeper: shopkeeper._id,
        name: 'Mancozeb Fungicide Premium',
        category: 'Pesticide',
        price: 260,
        description: 'Premium protective fungicide to control common rust, downy mildew, and leaf spots on field crops.',
        quantityInStock: 45,
      },
    ];

    await Product.insertMany(productList);
    console.log('Shopkeeper products successfully seeded.');

    console.log('Creating a Mock Negotiation Chat...');
    // Create a mock active order in negotiation
    const riceProduce = seededProduce[1]; // Basmati Rice (base: 65)
    const mockOrder = new Order({
      buyer: dealer._id,
      seller: farmer._id,
      produce: riceProduce._id,
      type: 'produce',
      quantity: 1500,
      price: riceProduce.pricePerKg,
      totalAmount: riceProduce.pricePerKg * 1500,
      negotiationPrice: 60, // Vikram wants it at ₹60/kg instead of ₹65/kg
      status: 'In Negotiation',
    });

    await mockOrder.save();

    // Seed conversation messages for this negotiation order
    const chatHistory = [
      {
        order: mockOrder._id,
        sender: dealer._id,
        receiver: farmer._id,
        message: 'Hello Rajesh! I am interested in your Basmati Rice listing. Since I am buying in bulk (1500 kg), could you offer a better price of ₹60/kg?',
        offerPrice: 60,
        isOffer: true,
        offerStatus: 'Pending',
      },
      {
        order: mockOrder._id,
        sender: farmer._id,
        receiver: dealer._id,
        message: 'Namaste Vikram ji. Thank you for your inquiry. ₹60/kg is a bit too low since this is organic Grade-A basmati. I can meet you at ₹62/kg, what do you think?',
        offerPrice: 62,
        isOffer: true,
        offerStatus: 'Pending',
      }
    ];

    await Chat.insertMany(chatHistory);
    console.log('Bid negotiation seeded successfully between Rajesh (Farmer) and Vikram (Dealer).');

    console.log('Seeding Crop Health History...');
    const diseaseHistory = [
      {
        farmer: farmer._id,
        cropName: 'Tomato',
        disease: 'Early Blight (Alternaria solani)',
        confidence: 88.5,
        severity: 'High',
        description: 'High-risk early blight infection caused by Alternaria solani. The pathogen causes dark brown concentric bullseye lesions with surrounding yellow chlorotic halos.',
        symptoms: ['Concentric ring circular brown lesions', 'Yellow chlorotic halos around lesions', 'Early leaf fall'],
        treatment: ['Spray Chlorothalonil or Metalaxyl systemically.', 'Avoid overhead irrigation.', 'Prune lower leaves.'],
        estimatedCost: '₹600 - ₹1200',
        recommendedFertilizers: ['Single Super Phosphate (SSP) Granular'],
        recommendedPesticides: ['Chlorothalonil Fungicide 75% WP', 'Organic Neem Oil Pesticide (Cold Pressed)'],
        image: '',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      {
        farmer: farmer._id,
        cropName: 'Wheat',
        disease: 'Common Rust (Puccinia sorghi)',
        confidence: 94.2,
        severity: 'Medium',
        description: 'Active outbreak of Puccinia sorghi detected. Characterized by prominent rusty-orange powdery pustules that rupture the epidermal layer.',
        symptoms: ['Bright orange-yellow powdery pustules', 'Premature chlorosis surrounding lesions', 'Dehydration'],
        treatment: ['Apply copper-based fungicide or Mancozeb.', 'Ensure adequate plant spacing.', 'Ensure proper nitrogen balance.'],
        estimatedCost: '₹450 - ₹950',
        recommendedFertilizers: ['NPK 19-19-19 Premium Fertilizer', 'Single Super Phosphate (SSP) Granular'],
        recommendedPesticides: ['Organic Neem Oil Pesticide (Cold Pressed)', 'Mancozeb Fungicide Premium'],
        image: '',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        farmer: farmer._id,
        cropName: 'Tomato',
        disease: 'Healthy Leaf',
        confidence: 98.1,
        severity: 'None',
        description: 'The tomato or general crop leaf appears healthy and shows normal chlorophyll levels. No pathogens detected.',
        symptoms: ['Green vibrant coloration', 'Normal vein structure', 'No lesions or spots'],
        treatment: ['Maintain regular watering schedule.', 'Apply nitrogen-rich fertilizer if growth is slow.'],
        estimatedCost: '₹0',
        recommendedFertilizers: ['NPK 19-19-19 Premium Fertilizer'],
        recommendedPesticides: [],
        image: '',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      }
    ];
    await CropHealth.insertMany(diseaseHistory);
    console.log('Crop health history seeded successfully.');

    console.log('--------------------------------------------------');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Use email: farmer@agrolink.com, dealer@agrolink.com, or shopkeeper@agrolink.com with password: password123 to log in.');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('Fatal seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seed();
