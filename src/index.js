'use strict';

const spawn = require('cross-spawn');
const assert = require('assert');
const util = require('util');

const defaults = require("./defaults");


class PostDeployBuilder {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {};
    this.hooks = {
      'after:deploy:deploy': this.process.bind(this)
    };
  }

  getConfig() {
    const service = this.serverless.service;
    return service.custom && service.custom.postDeployBuilder;
  }

  setEnvironmentAndOutput(data) {
    this.serverless.cli.log("Setting enviroment variables");

    const {
      service: {
        custom: {
          postDeployBuilder: {
            environment: customEnvironment = {},
            stackenvironment: stackEnvironment = {}
          }
        },
        provider: { environment: providerEnvironment } = {}
      }
    } = this.serverless;

    const environment = Object.assign(
      {},
      providerEnvironment,
      customEnvironment
    );

    this.setEnvironment(environment);
    this.setStackEnvironment(stackEnvironment, data);

    return;
  }

  setEnvironment(environment) {
    return Object.keys(environment).forEach((env) => {
      process.env[env] = environment[env]
    });
  }

  setStackEnvironment(stackEnvironment, data) {
    const stack = data.Stacks.pop() || { Outputs: [] };
    const output = stack.Outputs || [];

    return Object.keys(stackEnvironment).forEach((env) => {
      const op = output.find(item => (item["OutputKey"] == stackEnvironment[env]))
      const OutputValue = op['OutputValue'];
      this.serverless.cli.log(
        `Setting ${env} :  ${OutputValue}`
      );
      process.env[env] = OutputValue
    });
  }

  fetch() {
    this.serverless.cli.log("Fetching CloudFormation Stack Information");
    return this.serverless.getProvider('aws').request(
      'CloudFormation',
      'describeStacks',
      { StackName: this.stackName },
      this.serverless.getProvider('aws').getStage(),
      this.serverless.getProvider('aws').getRegion()
    );
  }

  buildClient() {    
    return new Promise((resolve, reject) => {
      this.serverless.cli.log("Building the client");
      const configuration = this.getConfig();
      const {
        packager = defaults.defaults.packager,
        command = defaults.defaults.command,
        cwd
      } = configuration;

      const buildOptions = {
        cwd
      };

      const build = spawn(
        packager,
        command.split(" "),
        buildOptions
      );

      build.stdout.on("data", this._onStdout.bind(this));
      build.stderr.on("data", this._onStderr.bind(this));
      build.on("error", this._onError.bind(this));
      build.on("close", code => {
        if (code === 0) {
          return resolve();
        }

        return reject(this.error);
      });
    });
  }

  _onStdout(data) {
    return this.serverless.cli.log(data.toString().trim());
  }

  _onStderr(data) {
    this.error = new this.serverless.classes.Error(data.toString().trim());
    return this.serverless.cli.log(data.toString().trim());
  }

  _onError(err) {
    this.error = new this.serverless.classes.Error(err);
  }

  validate() {
    this.serverless.cli.log("Validating the process");

    assert(this.serverless, 'Invalid serverless configuration');
    assert(this.serverless.service, 'Invalid serverless configuration');
    assert(this.serverless.service.provider, 'Invalid serverless configuration');
    assert(this.serverless.service.provider.name, 'Invalid serverless configuration');
    assert(this.serverless.service.provider.name === 'aws', 'Only supported for AWS provider');
    assert(this.options && !this.options.noRun, 'Skipping deployment with --noRun flag');
  }

  process() {
    this.serverless.cli.log("Starting the post deployment builder");
    return Promise.resolve()
      .then(() => this.validate())
      .then(() => this.fetch())
      .then((res) => this.setEnvironmentAndOutput(res))
      .then(() => this.buildClient())
      .catch(
        (err) => this.serverless.cli.log
        (util.format('Post Deployment Builder: %s!', err.message))
      );
  }


}

module.exports = PostDeployBuilder;
