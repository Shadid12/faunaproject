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

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'CrudApi', {
      restApiName: 'CRUD Service',
      description: 'This service handles CRUD operations.',
    });

    // /products route for GET
    const products = api.root.addResource('products');
    const getProductsIntegration = new apigateway.LambdaIntegration(getProductsLambda);
    products.addMethod('GET', getProductsIntegration);

    /** END */

    // Create Lambda functions for each CRUD operation
    const createLambda = this.createCrudLambda('CreateItem', 'create.handler');
    const readLambda = this.createCrudLambda('ReadItem', 'read.handler');
    const updateLambda = this.createCrudLambda('UpdateItem', 'update.handler');
    const deleteLambda = this.createCrudLambda('DeleteItem', 'delete.handler');


    // Integrate Lambda functions with API Gateway
    const items = api.root.addResource('items');

    // POST /items - Create an item
    const createIntegration = new apigateway.LambdaIntegration(createLambda);
    items.addMethod('POST', createIntegration);

    // GET /items/{id} - Read an item
    const item = items.addResource('{id}');
    const readIntegration = new apigateway.LambdaIntegration(readLambda);
    item.addMethod('GET', readIntegration);

    // PUT /items/{id} - Update an item
    const updateIntegration = new apigateway.LambdaIntegration(updateLambda);
    item.addMethod('PUT', updateIntegration);

    // DELETE /items/{id} - Delete an item
    const deleteIntegration = new apigateway.LambdaIntegration(deleteLambda);
    item.addMethod('DELETE', deleteIntegration);
  }

  private createCrudLambda(name: string, handler: string): lambda.Function {
    return new lambda.Function(this, `${name}Function`, {
      functionName: name,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: handler,
    });
  }
}


