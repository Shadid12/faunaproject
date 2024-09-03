import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { faunaClient } from './fauna-client'; // Adjust this import based on your project's structure
import { fql, Page } from 'fauna';
import { Product } from './models/products.model'; // Adjust this import based on your project's structure

/**
 * Get a page of products. If a category query parameter is provided, return only products in that category.
 * If no category query parameter is provided, return all products. The results are paginated with a default
 * page size of 10. If a nextToken is provided, return the next page of products corresponding to that token.
 * @route {GET} /products
 * @queryparam category
 * @queryparam nextToken
 * @queryparam pageSize
 * @returns { results: Product[], nextToken: string }
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};
  const { category, nextToken = undefined, pageSize = '10' } = queryParams;

  const pageSizeNumber = Number(pageSize);

  try {
    const queryFragment =
      category === undefined
        ? fql`Product.sortedByCategory().pageSize(${pageSizeNumber})`
        : fql`Product.byCategory(Category.byName(${category}).first()).pageSize(${pageSizeNumber})`;

    const query = fql`
      ${queryFragment}
      .map(product => {
        let product: Any = product;
        let category: Any = product.category;
        {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          category: { id: category.id, name: category.name, description: category.description },
        }
      })
    `;

    const { data: page } = await faunaClient.query<Page<Product>>(
      nextToken ? fql`Set.paginate(${nextToken})` : query
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ results: page.data, nextToken: page.after }),
    };
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
