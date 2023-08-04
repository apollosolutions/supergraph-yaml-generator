# supergraph-yaml-generator

Give your project a relevant name and description in this README.

**The code in this repository is experimental and has been provided for reference purposes only. Community feedback is welcome but this project may not be supported in the same way that repositories in the official [Apollo GraphQL GitHub organization](https://github.com/apollographql) are. If you need help you can file an issue on this repository, [contact Apollo](https://www.apollographql.com/contact-sales) to talk to an expert, or create a ticket directly in Apollo Studio.**

## Details

To enable developers to easily build against new or local subgraphs, you may end up using `rover dev` to simulate the full supergraph as it stands. With the recent addition of [starting a session with multiple subgraphs](https://www.apollographql.com/docs/rover/commands/dev#starting-a-session-with-multiple-subgraphs) within Rover, developers can easily get their supergraph up and running quickly.

In order to accelerate the building of that configuration, this quick CLI tool will do that instead.

To use this, you will need at least two things:

- An `APOLLO_KEY` which has access to the target graph
- The `APOLLO_GRAPH_REF` (or graph reference, such as `graph@variant`) for the graph you'll develop against

## Usage

To use this, run `npx github:@apollosolutions/supergraph-yaml-generator`. There are a number of flags you can use:

- `--graphref graph@variant` to directly pass the graph reference via argument
- `--out file_out.yaml` to set the output file location; defaults to `supergraph.yaml` within the currently run location
- `--config` to inherit a supergraph.yaml configuration file

By default this tool will listen for three places for the graph reference, listed in terms of priority:

- The `--config` provided file's defined `supergraph.graphref` attribute; more on this below.
- The `--graphref` argument
- The `APOLLO_GRAPH_REF` environment variable

### Supergraph Config Syntax Addition

In addition, this supports additional syntax within the `supergraph.yaml` format:

```yml
supergraph:
  graphref: variant@dev
```

This syntax allows for a declarative way to set the graphref, and is prioritized over the other options.

### `--config`

When using the `--config` flag, this will append to the provided supergraph configuration, and allow you to update as new subgraphs are added (or if you would prefer to update multiple subgraphs at once). This configuration prefers the existing subgraphs within the configuration and will not overwrite them with subgraphs within Apollo Studio.
