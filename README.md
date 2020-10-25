# Serverless Post Deployment Builder
[![npm](https://img.shields.io/npm/v/serverless-post-deployment-builder.svg)](https://www.npmjs.com/package/serverless-post-deployment-builder)
[![license](https://img.shields.io/github/license/mahasooq/serverless-post-deployment-builder.svg)](https://github.com/mahasooq/serverless-post-deployment-builder/blob/master/LICENSE.md)

A [Serverless Framework](https://serverless.com) plugin to immediately build your frontend applicatoin after serverless deployment. It can fetch the cloudformation stack output and set in enviroment variables before building. 

## Installation

```sh
$ npm install --save-dev serverless-post-deployment-builder
```

## Configuration


```yaml
...

plugins:
  - serverless-post-deployment-builder

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

## Options 

**--noRun**

_optional_

`--noRun` cli option can be passed with `serverless deploy` to disable this plugin

### Configuration Options

**cwd**

_required_

The working directory where you need to run the build command

---

**packager**

_optional_, default: `npm`

Either `npm` or `yarn`

---

**command**

_optional_, default: `run build`

---

**environment**

_optional_

The values defined will be set as environemnt variable before building. It will override any environment variable in provider. 

---

**stackenvironment**

_optional_

You can spefify cloudformation stack outputs which you need to set in environemnt variables using this option. It's a key value in the format `ENV_NAME: STACK_OUTPUT_NAME`. It will fetch the output value with key `STACK_OUTPUT_NAME` and set to an environemtn variable named `ENV_NAME`

---

## Example
In this example, the plugin is setting two cloudformation outputs for AWS Cognito in the enviroment and build frontend application at `app` directory using `npm`

### serverless.yml

```yaml
service: post-deploy-builder-example

frameworkVersion: '2'

plugins:
  - serverless-post-deployment-builder


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
