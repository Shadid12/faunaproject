import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { faunaClient } from './fauna-client'; // Adjust this import based on your project's structure
import { fql, AbortError, DocumentT } from 'fauna';
import { Product } from './models/products.model';

/**
 * Create a new product.
 * @route {POST} /products
 * @bodyparam name
 * @bodyparam description
 * @bodyparam price
 * @bodyparam stock
 * @bodyparam category
 * @returns Product
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');

    const { name, price, description, stock, category } = body;

    // FaunaDB query to create a product
    const { data: product } = await faunaClient.query<DocumentT<Product>>(
      fql`
        let categoryDoc = Category.byName(${category}).first()
        if (categoryDoc == null) abort("Category does not exist.")
        let args = { name: ${name}, price: ${price}, stock: ${stock}, description: ${description}, category: categoryDoc }
        let product: Any = Product.create(args)
        product {
          id,
          name,
          price,
          description,
          stock,
          category {
            id,
            name,
            description
          }
        }
      `
    );

    // Return the created product
    return {
      statusCode: 201,
      body: JSON.stringify(product),
    };
  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error instanceof AbortError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: error.abort }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
