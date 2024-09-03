import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dotenv from 'dotenv';

dotenv.config();

export class NewprojectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*** Endpoints simmilar to JS sample app */

    // Define the getProducts Lambda function
    const getProductsLambda = new lambda.Function(this, 'GetProductsFunction', {
      functionName: 'GetProducts',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'), // Assuming your handler is in the 'lambda' directory
      handler: 'getProducts.handler', // File name is getProducts.ts and function name is handler
      environment: {
        FAUNA_SECRET: process.env.FAUNA_SECRET || '', 
      },
    });

    // Define the createProduct Lambda function
    const createProductLambda = new lambda.Function(this, 'CreateProductFunction', {
      functionName: 'CreateProduct',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'), // Assuming your handler is in the 'lambda' directory
      handler: 'createProduct.handler', // File name is createProduct.ts and function name is handler
      environment: {
        FAUNA_SECRET: process.env.FAUNA_SECRET || '', // Add necessary environment variables
      },
    });

    // Define the updateProduct Lambda function
    const updateProductLambda = new lambda.Function(this, 'UpdateProductFunction', {
      functionName: 'UpdateProduct',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'), // Assuming your handler is in the 'lambda' directory
      handler: 'updateProduct.handler', // File name is updateProduct.ts and function name is handler
      environment: {
        FAUNA_SECRET: process.env.FAUNA_SECRET || '', // Add necessary environment variables
      },
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'CrudApi', {
      restApiName: 'Fauna Workshop Service',
      description: 'This service handles CRUD operations.',
    });

    // GET /products - Get all products
    const products = api.root.addResource('products');
    const getProductsIntegration = new apigateway.LambdaIntegration(getProductsLambda);
    products.addMethod('GET', getProductsIntegration);

    // POST /products - Create a new product
    const createProductIntegration = new apigateway.LambdaIntegration(createProductLambda);
    products.addMethod('POST', createProductIntegration);

    // PATCH /products/{id} route for PATCH
    const product = products.addResource('{id}');
    const updateProductIntegration = new apigateway.LambdaIntegration(updateProductLambda);
    product.addMethod('PATCH', updateProductIntegration);

    /** END */
  }
}


