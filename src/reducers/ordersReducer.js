export const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'];

export function ordersReducer(state, action) {
  switch (action.type) {
    case 'LOAD_ORDERS':
      return action.payload;
    case 'CREATE_ORDER':
      return [action.payload, ...state];
    case 'UPDATE_STATUS': {
      let didChange = false;
      const nextState = state.map((order) => {
        if (order.id !== action.payload.id) return order;
        if (order.status === 'Cancelled' || order.status === 'Served') return order;
        const currentRank = ORDER_STATUSES.indexOf(order.status);
        const nextRank = ORDER_STATUSES.indexOf(action.payload.status);
        if (!action.payload.manual && nextRank <= currentRank) return order;
        if (order.status === action.payload.status) return order;
        didChange = true;
        return { ...order, status: action.payload.status };
      });
      return didChange ? nextState : state;
    }
    default:
      return state;
  }
}
