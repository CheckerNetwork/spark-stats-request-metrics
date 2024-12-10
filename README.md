# Cloudflare metrics worker

Send your page views from [Cloudflare worker](https://developers.cloudflare.com/workers/) to InfluxDB.

## Get started

1. Install dependencies

```
npm install
```

2. Copy example files

```
cp .env.example .env
cp wrangler.toml.example wrangler.toml
```

3. Deploy your worker

```
npm run deploy
```