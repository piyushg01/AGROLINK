import Order from '../models/order.model.js';
import Produce from '../models/produce.model.js';
import Chat from '../models/chat.model.js';

export const handleSocketConnections = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // Join room for specific order negotiation
    socket.on('join_room', ({ orderId }) => {
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
    });

    // Handle sending message/offer
    socket.on('send_message', async (data) => {
      try {
        const { orderId, senderId, receiverId, message, offerPrice, isOffer } = data;

        // Save chat message
        const chatMessage = new Chat({
          order: orderId,
          sender: senderId,
          receiver: receiverId,
          message,
          offerPrice: isOffer ? offerPrice : null,
          isOffer: isOffer || false,
          offerStatus: isOffer ? 'Pending' : 'Pending',
        });

        await chatMessage.save();

        // If it is an offer, update the order negotiation price and status
        if (isOffer && offerPrice) {
          await Order.findByIdAndUpdate(orderId, {
            negotiationPrice: offerPrice,
            status: 'In Negotiation',
          });
          
          // Emit order updated notification
          io.to(`order_${orderId}`).emit('order_updated', {
            negotiationPrice: offerPrice,
            status: 'In Negotiation',
          });
        }

        // Broadcast message to everyone in the room
        io.to(`order_${orderId}`).emit('receive_message', chatMessage);
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    // Handle accepting offer
    socket.on('accept_offer', async ({ orderId, finalPrice }) => {
      try {
        const order = await Order.findById(orderId);
        if (!order) return;

        const totalAmount = finalPrice * order.quantity;

        // Update order status and price
        order.price = finalPrice;
        order.totalAmount = totalAmount;
        order.status = 'Approved';
        order.negotiationPrice = null;
        await order.save();

        // Mark the produce as Sold
        if (order.type === 'produce' && order.produce) {
          await Produce.findByIdAndUpdate(order.produce, { status: 'Sold' });
        }

        // Save finalization system message
        const systemMessage = new Chat({
          order: orderId,
          sender: order.seller, // Seller accepted or Buyer accepted
          receiver: order.buyer,
          message: `Deal finalized! Offer of ₹${finalPrice}/kg accepted.`,
          offerPrice: finalPrice,
          isOffer: true,
          offerStatus: 'Accepted',
        });
        await systemMessage.save();

        // Update older offers in the same chat to Rejected/Archived if they were pending
        await Chat.updateMany(
          { order: orderId, isOffer: true, offerStatus: 'Pending' },
          { offerStatus: 'Rejected' }
        );

        // Notify room
        io.to(`order_${orderId}`).emit('receive_message', systemMessage);
        io.to(`order_${orderId}`).emit('order_updated', {
          price: finalPrice,
          totalAmount,
          status: 'Approved',
          negotiationPrice: null,
        });
      } catch (error) {
        console.error('Socket accept_offer error:', error);
      }
    });

    // Handle rejecting offer
    socket.on('reject_offer', async ({ orderId }) => {
      try {
        const order = await Order.findById(orderId);
        if (!order) return;

        // Reset negotiation price on order, status stays in negotiation or goes to Pending
        order.negotiationPrice = null;
        order.status = 'Pending';
        await order.save();

        // Save rejection system message
        const systemMessage = new Chat({
          order: orderId,
          sender: order.seller,
          receiver: order.buyer,
          message: 'The price offer was rejected. Standard pricing applies.',
          isOffer: false,
          offerStatus: 'Pending',
        });
        await systemMessage.save();

        // Mark pending offers as Rejected
        await Chat.updateMany(
          { order: orderId, isOffer: true, offerStatus: 'Pending' },
          { offerStatus: 'Rejected' }
        );

        // Notify room
        io.to(`order_${orderId}`).emit('receive_message', systemMessage);
        io.to(`order_${orderId}`).emit('order_updated', {
          status: 'Pending',
          negotiationPrice: null,
        });
      } catch (error) {
        console.error('Socket reject_offer error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
