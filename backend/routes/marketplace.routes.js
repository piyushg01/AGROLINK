import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  uploadProduce,
  analyzeProduceListing,
  getMyProduce,
  getAllProduce,
  getProduceById,
  uploadProduct,
  getMyProducts,
  getAllProducts,
  getProductById,
  getNearbyShopkeepers,
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/marketplace.controller.js';

const router = express.Router();

// Produce (Crops) routes
router.post('/produce', protect, uploadProduce);
router.post('/produce/analyze-listing', protect, analyzeProduceListing);
router.get('/produce/mine', protect, getMyProduce);
router.get('/produce/all', protect, getAllProduce);
router.get('/produce/:id', protect, getProduceById);

// Product (Fertilizer/Tools) routes
router.post('/products', protect, uploadProduct);
router.get('/products/mine', protect, getMyProducts);
router.get('/products/all', protect, getAllProducts);
router.get('/products/:id', protect, getProductById);

// Geolocation matches
router.get('/nearby-shopkeepers', protect, getNearbyShopkeepers);

// Orders routes
router.post('/orders', protect, createOrder);
router.get('/orders/mine', protect, getMyOrders);
router.get('/orders/:id', protect, getOrderById);
router.patch('/orders/:id/status', protect, updateOrderStatus);

export default router;
