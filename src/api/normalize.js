import { menuImages, fallbackImage } from '../data/menuImages';
export const normalizeUser = user => ({ ...user, id: user._id });
export const normalizeMenu = item => ({ ...item, id: item._id, image: menuImages[item.imageKey] || fallbackImage });
export const normalizeTable = table => ({ ...table, id: table._id });
export const normalizeReservation = item => ({ ...item, id: item._id, tableId: item.table, customerId: item.customer });
export const normalizeOrder = order => ({ ...order, id: order._id, timestamp: order.createdAt,
  customer: order.customer?._id ? normalizeUser(order.customer) : { id: order.customer },
  items: order.items.map(item => ({ ...item, id: item.menuItem })),
});
