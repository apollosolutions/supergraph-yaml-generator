import { Command, Option } from "clipanion";
import { GraphQLClient } from "graphql-request";
import { readFileSync, writeFileSync } from "fs";
import * as yaml from 'js-yaml'
import { getSdk } from "../studio/graphql.js";
import _ from 'lodash'
import { resolve } from "path";

export class DefaultCommand extends Command {
  graphref = Option.String("--graphref");

  configPath = Option.String("--config");

  out = Option.String('--out');

  config = "";

  yamlObject = { federation_version: '', supergraph: { graphref: "" }, subgraphs: {} };

  async execute() {
    try {
      if (this.configPath) {
        this.config = readFileSync(this.configPath, { encoding: 'utf-8' })
      }

      let tempYaml = yaml.load(this.config)
      if (typeof tempYaml === 'object' && tempYaml) {
        // @ts-ignore
        this.yamlObject = tempYaml
      }
    } catch (e) {
      this.context.stderr.write(`error creating yaml ${e}\n`)
      process.exit(1)
    }

    if (this.yamlObject.supergraph.graphref) {
      this.graphref = this.yamlObject.supergraph.graphref
    }
    if (!this.graphref && process.env['APOLLO_GRAPH_REF']) {
      this.graphref = process.env['APOLLO_GRAPH_REF']
    }

    if (!this.graphref) {
      this.context.stderr.write(
        "invalid request: you must pass a --graphref or via the configuration file\n"
      );
      process.exit(1);
    }
    let res = await fetchSubgraphsFromStudio(this.graphref)
    if (!res || !res.subgraphs) {
      this.context.stderr.write(
        "invalid request: unable to fetch subgraphs; ensure the variant is not a contract or that you have correct permissions\n"
      );
      process.exit(1);
    }

    let { subgraphs, version } = res

    if (!this.yamlObject.subgraphs) {
      this.yamlObject.subgraphs = {}
    }

    if (!this.yamlObject.federation_version) {
      this.yamlObject.federation_version = version
    }

    subgraphs.forEach(subgraph => {
      // @ts-ignore
      if (!Object.keys(this.yamlObject.subgraphs).includes(subgraph.name)) {
        // @ts-ignore
        this.yamlObject.subgraphs[subgraph.name] = { schema: { graphref: this.graphref, subgraph: subgraph.name } }
      }
    })
    if (!this.out) {
      this.out = 'supergraph.yaml'
    }
    writeFileSync(this.out, yaml.dump(this.yamlObject))
    this.context.stdout.write(`Finished writing supergraph config to ${this.out}. Run:\n\trover dev --supergraph-config ${resolve(this.out)}\nHappy developing!\n`)
  }

}

/**
 * @param {string} ref
 */
async function fetchSubgraphsFromStudio(ref) {
  const apiKey = process.env.APOLLO_KEY;
  if (!apiKey) {
    throw new Error("missing APOLLO_KEY");
  }

  const client = new GraphQLClient(
    "https://graphql.api.apollographql.com/api/graphql",
    {
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  const sdk = getSdk(client)
  const resp = await sdk.SubgraphsForVariant({ ref })
  if (resp.variant?.__typename !== 'GraphVariant') {
    return null
  }

  let version = '2'
  if (resp.variant.latestLaunch?.buildInput.__typename === 'CompositionBuildInput' && resp.variant.latestLaunch?.buildInput.version) {
    version = `=${resp.variant.latestLaunch?.buildInput.version}`
  }

  return { subgraphs: resp.variant.subgraphs, version }
}
