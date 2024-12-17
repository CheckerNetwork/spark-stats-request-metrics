# Cloudflare metrics worker

[Couldflare worker](https://developers.cloudflare.com/workers/) used to proxy requests to your application and send metrics to InfluxDB.

## Development

1. Install dependencies

```
npm install
```

2. Copy example files

```
cp .dev.vars.example .dev.vars
cp wrangler.toml.example wrangler.toml
```

3. Edit secrets inside `.dev.vars` and environment variables inside `wrangler.toml` files

3. Run your worker

```
npm run dev
```

## Deployment (Github Actions)

In order to deploy your worker via Github Actions, you need to have a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and running instance of InfluxDB.

Add generated API token to Github secrets as `CLOUDFLARE_API_TOKEN` and authentication token under `INFLUX_TOKEN`.

Other required environment variables include the following:
- `INFLUX_URL` - InfluxDB URL
- `INFLUX_DATABASE` - InfluxDB database (bucket) name
- `INFLUX_METRIC_NAME` - InfluxDB metric name

After setting up secrets, you can push your code to Github and worker will be deployed to production environment automatically.
