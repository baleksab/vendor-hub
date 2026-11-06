export const CART_PATH = "/cart";

export const CHECKOUT_PATH = "/checkout";

export const ORDERS_PATH = "/orders";

export const orderPath = (id: string) => `${ORDERS_PATH}/${id}`;

export const paymentPath = (id: string) => `${orderPath(id)}/pay`;
