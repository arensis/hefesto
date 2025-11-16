# Hefesto

El proyecto funciona como un API REST para el registro de datos de estaciones meteorológicas arduino y como servicio de consulta de datos sobre estas estaciones.

## Estación meteorológica

Para reportar datos se utilizó una placa NodeMCU que tiene conectado un sensor de temperatura y humedad DHT11. La placa envía las mediciones a través de una petición REST al servidor y en caso de error envía una notificación a un bot de Telegram.
Para funcionar correctamente se han de completar ciertas variables en el fichero config.h, tales como la conexión de la wifi, la url del servidor, los datos de conexión con el bot de telegram, etc.

[Repositorio de código de estación con DHT11 y placa NodeMCU](https://github.com/arensis/arduino/tree/kairos/NodeMCU/KAIROS_STATION_DHT11_SENSOR/API_CLIENT_JSON_DS18B20_TEMP_SENSOR)

## Entorno
### Levantar una instancia de MongoDB con docker
Si el contenedor de docker va a ser ejecutado dentro de una raspberry pi, si la raspberry pi es inferior a la raspberrypi 5 deberá usarse la versión de mongo 4.4.6, debido a que versiones posteriores requieren que el procesador suporte instrucciones AVX y los procesadores que montan raspberrypi inferiores a la 5 no lo soportan.

  - Fuente:
    - https://github.com/linuxserver/docker-unifi-network-application/issues/4
  - Qué son las instruccions AVX:
    - https://hardzone.es/reportajes/que-es/instrucciones-avx-procesador/
  
  #### Comando para levantar el contenedor de mongodb:
  Primero crearemos un directorio para almacenar los datos en disco y no perderlos frente a reinicios o problemas en el contenedor:

  ```bash
  mkdir -p ~/mongo-kairos-data
  ```

  Después ejecutaremos el comando para poder crear el contenedor de mongo como replica set para permitir sesiones de trasnsación enlazando el volumen de datos definido en el disco en el argumento -v

  ```bash
  docker run --name mongo-kairos \
    -p 27017:27017 \
    -v ~/mongo-data:/data/db \
    -d mongo:4.4.6 \
    --replSet rs0
  ```

  Una vez hecho esto entramos en el contenedor para inicializar el replica set:

  ```bash
  docker exec -it mongo-kairos mongo
  ```

  En la shell del contenedor ejecutaremos el comando para la inicialización

  ```javascript
  rs.initiate()
  ```

  Y se debería de devolver un ok 1 dentro del json de repuesta:

  ```json
  {
    ...,
    "ok": 1
  }
  ```

  Confiramos con el comando status para ver que en myState esté el valor 1 que indicará que es el primario

  ```js
  rs.status()
  ```

  Y la respuesta deberá contener dicho valor de la asiguiente manera:

  ```json
  {
    "set" : "rs0",
	  "date" : ISODate("2025-11-16T16:35:52.893Z"),
	  "myState" : 1,
    ...,
  }
  ```


### Descargar las dependencias del proyecto

```bash
$ npm install
```

## Ejecución de la aplicación

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Swagger

With the application running you can access to the swagger ui from the url:

```
localhost:3000/swagger-api
```

## Deploy

Para un despliegue usando PM2 se podrá hacer uso del fichero deploy.sh añadido al proyecto:

```bash
./deploy.sh
```



