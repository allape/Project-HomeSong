# Home Song

Song Management for Home NAS.  
And the default UI is not designed for "to client" usage, more ERP style.
Client usages should be integrated with some authentication system.

### Start

All available images are
in [https://github.com/allape/homesong/pkgs/container/homesong](https://github.com/allape/homesong/pkgs/container/homesong).

#### MySQL Mode

```shell
docker compose -f docker.compose.yaml up -d
```

#### SQLite / Standalone Mode

```shell
docker run -d --name homesong \
  -p 8080:8080 \
  -v "$(pwd)/database:/app/database" \
  -v "$(pwd)/static:/app/static" \
  ghcr.io/allape/homesong:main
```

### Dev

```shell
go run .
```

```shell
cd ui
npm i
npm run dev
```

### Build

See [Dockerfile](Dockerfile) or [docker.yaml](.github/workflows/docker.yaml)

# Credits

- [favicon.png](asset/favicon.png): https://www.irasutoya.com/2018/01/cd.html
