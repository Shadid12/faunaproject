import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { faunaClient } from './fauna-client'; // Adjust this import based on your project's structure
import { fql, Page } from 'fauna';
import { Product } from './models/products.model';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract query parameters from the request
    const queryParams = event.queryStringParameters || {};
    const {
      minPrice = '0',
      maxPrice = '10000',
      pageSize = '25',
      nextToken = undefined,
    } = queryParams;

    // FaunaDB query to find products by price range
    const query = fql`
      Product.sortedByPriceLowToHigh({ from: ${Number(minPrice)}, to: ${Number(maxPrice)}})
      .pageSize(${Number(pageSize)}) {
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
    `;

    const { data: products } = await faunaClient.query<Page<Product>>(
      nextToken ? fql`Set.paginate(${nextToken as string})` : query, 
      { typecheck: false }
    );

    // Return the page of products and the next token
    return {
      statusCode: 200,
      body: JSON.stringify({ results: products.data, nextToken: products.after }),
    };
  } catch (error: any) {
    console.error('Error fetching products by price:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
