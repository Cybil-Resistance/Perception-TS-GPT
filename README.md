# Perception, a Typescript GPT Implementation

Inspired by Auto-GPT, Perception is a Node.JS / Typescript implementation with some important changes:

1. Written in Typescript due to familiarity with Node
1. Auto-GPT has some limitations that I'd like to work around
1. Perception is intended to have more complex logic and more freedom

# Installation

1. `git clone https://github.com/WolpertingerLabs/perception-ts-gpt.git`
1. `cd Perception-TS-GPT`
1. `npm install`

# Setup - Required

1. Copy `.env.example` to `.env`
1. Edit `.env`, provide the required environment variables:
    1. `OPENAI_API_KEY` - Your OpenAI API key, provided by the [OpenAI API Key platform](https://platform.openai.com/account/api-keys)

# Setup - Optional

Edit `.env`, provide any of the optional environment variables.

## Google

1. `GOOGLE_API_KEY` - Your Google API key
1. `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - Your custom Google search engine ID

# Usage

## Development

1. `npm run start:dev`

## Prettier

1. `npm run prettier`

## Lint

1. `npm run lint`

## Build for Production

1. `npm run build`

## Production

1. `npm run start`
