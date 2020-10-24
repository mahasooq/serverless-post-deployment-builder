# Serverless Post Deployment Builder
[![npm](https://img.shields.io/npm/v/@mahasooq/serverless-post-deploy-builder.svg)](https://www.npmjs.com/package/@mahasooq/serverless-post-deploy-builder)
[![license](https://img.shields.io/github/license/mahasooq/serverless-post-deploy-builder.svg)](https://github.com/mahasooq/serverless-post-deploy-builder/blob/master/LICENSE.md)

A [Serverless Framework](https://serverless.com) plugin to immediately build after serverless deployment. It will fetch the cloudformation stack output and set in enviroment variables. 

## Installation

```sh
$ npm install --save-dev serverless-post-deploy-builder
```

## Configuration


```yaml
...

plugins:
  - serverless-post-deploy-builder

postDeployBuilder:
    cwd: app
    packager: npm
    command: run build
    environment:
      REACT_APP_VERSION: 2
    stackenvironment:
      REACT_APP_USER_POOL_ID: UserPoolId # In the format ENV_NAME: STACK_OUTPUT_NAME
      REACT_APP_USER_POOL_CLIENT_ID: UserPoolClientId
...
```
You can spefify cloudformation stack outputs you need to set in environemnt variables using the option`stackenvironment`, its a key value in the format `ENV_NAME: STACK_OUTPUT_NAME`

## options 
`--noRun` cli option can be passed with `serverless deploy` to disable this plugin

##Example
In this example, the plugin is setting two cloudformation outputs ( for AWS Cognito ) in the enviroment variable and build the frontend application at `app` directory using `npm`

### serverless.yml

```yaml
service: post-deploy-builder-example

frameworkVersion: '2'

plugins:
  - serverless-post-deploy-builder


custom:  
  postDeployBuilder:
    cwd: app
    packager: npm
    command: run build
    environment:
      REACT_APP_STAGE: ${opt:stage}
    stackenvironment:
      REACT_APP_USER_POOL_ID: UserPoolId
      REACT_APP_USER_POOL_CLIENT_ID: UserPoolClientId

provider:
  name: aws
  runtime: nodejs12.x

functions:
  example:
    handler: lambda/example.handler
    events:
      - http:
          path: example
          method: get
          cors: true

resources:
  Resources:    
    CognitoUserPool:
      Type: AWS::Cognito::UserPool
      Properties:
          UserPoolName: ${self:service}-${opt:stage}-user-pool

    CognitoUserPoolClient:
      Type: AWS::Cognito::UserPoolClient
      Properties:
          ClientName: ${self:service}-${opt:stage}-user-pool-client
          UserPoolId:
            Ref: CognitoUserPool

  Outputs:
    UserPoolId:
      Value:
        Ref: CognitoUserPool
      Export:
        Name: ${self:service}-${opt:stage}-user-poolId

    UserPoolClientId:
      Value:
        Ref: CognitoUserPoolClient
      Export:
        Name: ${self:service}-${opt:stage}-user-pool-clientId
```

The plugin will be invoked when you deploy the applicaiton with
```sh
$ serverless deploy --stage=dev
```
This will build the frontend using `npm run build` with the environment variables
```env
REACT_APP_STAGE=dev
REACT_APP_USER_POOL_ID=ap-southeast-1_XXXXXXU
REACT_APP_USER_POOL_CLIENT_ID=6oeieXXXXXXXXXXXXXXXXb3
```
