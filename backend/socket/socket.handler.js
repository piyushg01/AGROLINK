import Order from '../models/order.model.js';
import Produce from '../models/produce.model.js';
import Chat from '../models/chat.model.js';

export const handleSocketConnections = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);
    console.log('Handshake info:', socket.handshake.query);

    // Join room for specific order negotiation
    socket.on('join_room', ({ orderId }) => {
      console.log('JOIN ROOM EVENT RECEIVED. orderId:', orderId);
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
    });

    // Handle sending message/offer
    socket.on('send_message', async (data) => {
      console.log('SEND MESSAGE EVENT RECEIVED. data:', data);
      try {
        const { orderId, senderId, receiverId, message, offerPrice, isOffer } = data;
        console.log('Parsed send_message payload values:', {
          orderId,
          senderId,
          receiverId,
          message,
          offerPrice,
          isOffer
        });

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

        console.log('Attempting to save Chat document before save:', chatMessage);
        const savedMessage = await chatMessage.save();
        console.log('Chat document successfully saved in MongoDB:', savedMessage);

        // If it is an offer, update the order negotiation price and status
        if (isOffer && offerPrice) {
          console.log(`Updating order ${orderId} negotiation price to: ${offerPrice}`);
          await Order.findByIdAndUpdate(orderId, {
            negotiationPrice: offerPrice,
            status: 'In Negotiation',
          });
          
          // Emit order updated notification
          console.log(`Emitting order_updated to room: order_${orderId}`);
          io.to(`order_${orderId}`).emit('order_updated', {
            negotiationPrice: offerPrice,
            status: 'In Negotiation',
          });
        }

        // Broadcast message to everyone in the room
        console.log(`Emitting receive_message to room: order_${orderId} with message:`, chatMessage);
        io.to(`order_${orderId}`).emit('receive_message', chatMessage);
        console.log(`Broadcast of receive_message to room: order_${orderId} completed`);
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    // Handle accepting offer
    socket.on('accept_offer', async ({ orderId, finalPrice }) => {
      console.log('ACCEPT OFFER EVENT RECEIVED. orderId:', orderId, 'finalPrice:', finalPrice);
      try {
        const order = await Order.findById(orderId);
        if (!order) {
          console.error(`Order not found for ID: ${orderId}`);
          return;
        }

        const totalAmount = finalPrice * order.quantity;
        console.log(`Calculating total amount for acceptance: ${finalPrice} * ${order.quantity} = ${totalAmount}`);

        // Update order status and price
        order.price = finalPrice;
        order.totalAmount = totalAmount;
        order.status = 'Approved';
        order.negotiationPrice = null;
        console.log('Saving updated Order for acceptance:', order);
        await order.save();
        console.log('Order saved successfully.');

        // Mark the produce as Sold
        if (order.type === 'produce' && order.produce) {
          console.log(`Updating Produce ${order.produce} status to Sold`);
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
        console.log('Saving system message for deal finalization:', systemMessage);
        await systemMessage.save();
        console.log('System message saved successfully.');

        // Update older offers in the same chat to Rejected/Archived if they were pending
        console.log(`Updating older pending offers to Rejected for order: ${orderId}`);
        await Chat.updateMany(
          { order: orderId, isOffer: true, offerStatus: 'Pending' },
          { offerStatus: 'Rejected' }
        );

        // Notify room
        console.log(`Emitting receive_message to room: order_${orderId} for systemMessage`);
        io.to(`order_${orderId}`).emit('receive_message', systemMessage);
        console.log(`Emitting order_updated to room: order_${orderId}`);
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
      console.log('REJECT OFFER EVENT RECEIVED. orderId:', orderId);
      try {
        const order = await Order.findById(orderId);
        if (!order) {
          console.error(`Order not found for ID: ${orderId}`);
          return;
        }

        // Reset negotiation price on order, status stays in negotiation or goes to Pending
        order.negotiationPrice = null;
        order.status = 'Pending';
        console.log('Saving updated Order for rejection:', order);
        await order.save();
        console.log('Order saved successfully.');

        // Save rejection system message
        const systemMessage = new Chat({
          order: orderId,
          sender: order.seller,
          receiver: order.buyer,
          message: 'The price offer was rejected. Standard pricing applies.',
          isOffer: false,
          offerStatus: 'Pending',
        });
        console.log('Saving system message for rejection:', systemMessage);
        await systemMessage.save();
        console.log('System message saved successfully.');

        // Mark pending offers as Rejected
        console.log(`Rejecting pending offers for order: ${orderId}`);
        await Chat.updateMany(
          { order: orderId, isOffer: true, offerStatus: 'Pending' },
          { offerStatus: 'Rejected' }
        );

        // Notify room
        console.log(`Emitting receive_message to room: order_${orderId} for systemMessage`);
        io.to(`order_${orderId}`).emit('receive_message', systemMessage);
        console.log(`Emitting order_updated to room: order_${orderId}`);
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
