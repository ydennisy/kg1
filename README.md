# `KG1`

KG1 is a personal knowledge management application.

> [!IMPORTANT]  
> This project is currently in a very early development/experimental stage. There are a lot of unimplemented/broken features at the moment. Contributions are welcome to help out with the progress!

The long term vision is to satisfy the following main functions:

- Do not worry about structure of your knowledge graph, just throw stuff in there.
- Social apps do not all have to be 2 second videos of cats, deep thoughts can also be fun to share.
- Infuse the app with AI to help you store, find, reason and explore both your own and the world's knowledge!

Ok, but what can we do today?

Not much yet:

- You are able to add a `node`, which can be text, link or a combination.
- You are able to search these using dense embeddings.
- You can chat with an AI using the `nodes` stored in KG1 (RAG).

## Usage

The current version is for bleeding edge early adopters!

Install the CLI from NPM:

```
npm i kg1-cli -g
```

You can now use the CLI, locally to interact with KG1:

```
kg1 add "A new note about something which is very interesting!"
kg1 search "how do racoons make love?"
kg1 chat "why is the world flat?"
```
