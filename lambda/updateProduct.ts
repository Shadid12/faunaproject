import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { faunaClient } from './fauna-client'; // Adjust this import based on your project's structure
import { fql, AbortError, DocumentT } from 'fauna';
import { Product } from './models/products.model';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Extract the product ID from the path parameters
    const { id } = event.pathParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Product ID is required' }),
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    let category = body.category || null;
    const { name, price, description, stock } = body;

    if (!name && !price && !description && !stock) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'At least one field is required to update a product' }),
      };
    }

    // FaunaDB query to update a product
    const { data: product } = await faunaClient.query<DocumentT<Product>>(
      fql`
          // Get the product by id, using the ! operator to assert that the product exists.
          // If it does not exist Fauna will throw a document_not_found error.
          let product: Any = Product.byId(${id})!
          // Get the category by name. We can use .first() here because we know that the category
          // name is unique.
          let category = Category.byName(${category ?? ""}).first()
          // If a category was provided and it does not exist, abort the transaction.
          if (${!!category} && category == null) abort("Category does not exist.")
          let fields = ${{ name, price, stock, description }}
          if (category != null) {
            // If a category was provided, update the product with the new category document as well as
            // any other fields that were provided.
            product!.update(Object.assign(fields, { category: category }))
          } else {
            // If no category was provided, update the product with the fields that were provided.
            product!.update(fields)
          }
          // Use projection to only return the fields you need.
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

    // Return the updated product
    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error: any) {
    console.error('Error updating product:', error);

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
