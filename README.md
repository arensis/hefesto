# Hefesto-Kairos

El proyecto funciona como un API REST para el registro de datos de estaciones meteorológicas arduino y como servicio de consulta de datos sobre estas estaciones.

## Estación meteorológica

Para reportar datos se utilizó una placa NodeMCU que tiene conectado un sensor de temperatura y humedad DHT11. La placa envía las mediciones a través de una petición REST al servidor y en caso de error envía una notificación a un bot de Telegram.
Para funcionar correctamente se han de completar ciertas variables en el fichero config.h, tales como la conexión de la wifi, la url del servidor, los datos de conexión con el bot de telegram, etc.

[Repositorio de código de estación con DHT11 y placa NodeMCU](https://github.com/arensis/arduino/tree/kairos/NodeMCU/KAIROS_STATION_DHT11_SENSOR/API_CLIENT_JSON_DS18B20_TEMP_SENSOR)


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
