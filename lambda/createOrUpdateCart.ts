import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { faunaClient } from './fauna-client'; // Adjust this import based on your project's structure
import { fql, DocumentT, ServiceError } from 'fauna';
import { Order } from './models/orders.model';

/**
 * Get a customer's cart. Create one if it does not exist.
 * @route {POST} /customer/:id/cart
 * @param id
 * @returns Order
 */

const orderResponse = fql`{
  id: order.id,
  payment: order.payment,
  createdAt: order.createdAt.toString(),
  status: order.status,
  total: order.total,
  items: order.items.toArray().map((item) => {
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      description: item.product.description,
      stock: item.product.stock,
      category: {
        id: item.product.category.id,
        name: item.product.category.name,
        description: item.product.category.description
      }
    },
    quantity: item.quantity
  }),
  customer: {
    id: order.customer.id,
    name: order.customer.name,
    email: order.customer.email,
    address: order.customer.address
  }
}`;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Customer ID is required' }),
    };
  }

  try {
    // FaunaDB query to get or create the customer's cart
    const { data: cart } = await faunaClient.query<DocumentT<Order>>(
      fql`
        let order: Any = getOrCreateCart(${id})
        ${orderResponse}
      `
    );

    return {
      statusCode: 200,
      body: JSON.stringify(cart),
    };
  } catch (error: any) {
    console.error('Error getting or creating customer cart:', error);

    if (error instanceof ServiceError) {
      if (error.code === "document_not_found") {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: `No customer with id '${id}' exists.` }),
        };
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
