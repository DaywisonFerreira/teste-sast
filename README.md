# iHub ifc-freight-api-orders

The iHub ifc-freight-api-orders is a microservice that managers the changes status of the orders.

## Table of contents
* [Models](#Models)
* [Routes](#Routes)
* [Middlewares](#Middlewares)
* [Controllers](#Controllers)
* [Tasks](#Tasks)

## Models

#### Store
The store model is the same used at the iHub Core and others applications. At the future this info will be available by api.

| Field       |   Type   |
| ----------- | :------: |
| active      | Boolean  |
| code        |  String  |
| name        |  String  |
| description |  String  |
| siteUrl     |  String  |
| icon        |  String  |
| createdBy   | ObjectId |

## Routes
Below there are the currents routes used.

```javascript
{
    method: 'post',
    path: '/courier/intelipost',
    private: false,
    controller: get,
}
```
## Middlewares
There is a middleware method who runs before every controllers at the application. It principal objective is does the store validation.

__Response__

#### 400
```json
{
   "status": 400,
   "code": "tracking.middleware.validation",
   "message": "Store is mandatory"
}
 ```
#### 404
```json
{
   "status": 404,
   "code": "tracking.middleware.validation",
   "message": "The store has not been found"
}
```

#### 403
```json
 {
   "status": 403,
   "code": "tracking.middleware.validation",
   "message": "The store parameter is inactive"
}
```
#### 500
```json
{
    "status": 500,
    "code": "tracking.middleware.exception",
    "error": "anyExceptionMessage"
}
```

## Controllers
These are the controllers used at the application until this time. Below there are some examples of requests and responses.

`get.ts` (**GET**) Gives the order trackings through of a feed. These trackings are pagead with a limit of 50. If needed to get more trackings, request over the api changing the current parameter page number.

__Request__

```javascript
curl -X GET \
  'http://localhost:9290/stores/5c92f1f7a8517900190964a2/trackings/feed?page=1&limit=1' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: 9b07c7f4-4baa-43f9-9813-94116db75004' \
  -H 'cache-control: no-cache'
  -H 'origin: infrashop' \
  -H 'store: 5c92f1f7a8517900190964a2'
```

__Response__
#### 200
```json
{
    "skip": 0,
    "limit": 50,
    "page": 1,
    "maxLimit": 50,
    "total": 4,
    "count": 4,
    "trackings": [
        {
            "status": "invoiced",
            "originOrderId": "927263493610",
            "token": "5cc1c66f68748600109ac706",
            "dateTime": "2019-03-01T12:43:11.000Z"
        },
        {
            "status": "dispatched",
            "originOrderId": "927263493611",
            "token": "5cc1c67768748600109ac708",
            "dateTime": "2019-03-01T12:43:11.000Z"
        },
        {
            "status": "delivered",
            "originOrderId": "927263493612",
            "token": "5cc1c67e68748600109ac70a",
            "dateTime": "2019-03-01T12:43:11.000Z"
        },
        {
            "status": "canceled",
            "originOrderId": "927263493613",
            "token": "5cc1c68668748600109ac70c",
            "dateTime": "2019-03-01T12:43:11.000Z"
        }
    ]
}
 ```

#### 400
```json
{
"status": 400,
"code": "tracking.get.feed.validation",
"message": "The parameter page and limit are mandatory"
}
```
#### 400
```json
{
"status": 400,
"code": "tracking.get.feed.validation",
"message": "The parameters page or limit are not valide numbers"
}
```
#### 400
```json
{
"status": 200,
"code": "tracking.get.feed",
"message": "No tracking available"
}
```
#### 500
```json
 {
 "status": 500,
 "code": "tracking.feed.confirm.error",
 "error":"anyExceptionMessage"
 }
 ```
 ____
`ack.ts` (**PUT**) Confirms reading of the token.

__Request__

```javascript
curl -X PUT \
  'http://localhost:9290/stores/5c92f1f7a8517900190964a2/trackings/feed/5cac9dfd21fec92b60df2fdb' \
  -H 'Content-Type: application/json' \
  -H 'Postman-Token: bc8a949c-bbb7-4f83-8399-eed0b1b90f39' \
  -H 'cache-control: no-cache'
```

__Response__
#### 400
```json
{
"status":  400,
"code":  "tracking.feed.confirm.validation",
"message":  "The token format is invalid"
}
```
#### 400
```json
 {
 "status":400,
 "code": "tracking.feed.confirm.validation",
 "message": "The token parameter is mandatory"
 }
 ```

#### 200
```json
{
"status": 200,
"code": 'tracking.feed.confirm',
"message": "The token 5cac9dfd21fec92b60df2fdb has been updated"
}
```
#### 200
 ```json
{
 "status":200,
 "code": "tracking.feed.confirm",
 "message": "The token 5cac9dfd21fec92b60df2fdb has been updated*"
}
```

#### 200
```json
{
"status": 200,
"code": "tracking.feed.confirm.newStatusAvailable",
"message": "The token 5cac9dfd21fec92b60df2fdb has already been updated. Request again to get the newer status"
}
```

#### 200
```json
{
"status": 404,
"code": "tracking.feed.confirm.notFound",
"message": "The token 5cac9dfd21fec92b60df2fdb has not been found after internal search. Some error must have occurred"
}
```

#### 500
```json
{
"status": 500,
"code":"tracking.feed.confirm.error",
"error":"anyExceptionMessage"
}
```

`postIntelipost.ts` (**POST**) Post a new order tracking status

__Status__
```
	DELIVERED: Entregue
	DELIVERY_FAILED: Falha na Entrega
	IN_TRANSIT: Em Transito
	NEW: Novo
	TO_BE_DELIVERED: A ser entregue
```

__Request__

```javascript
curl -X GET \
  'http://localhost:9290/intelipost' \
  -H 'Content-Type: application/json' \
	-H 'Authorization: Basic cmluYWxkby5hcmdlbnRpZXJlQGluZnJhY29tbWVyY2UuY29tLmJyOkoxbmYzNDk=' \
	--data-raw {
    "history": {
        "shipment_order_volume_id": 230713,
        "shipment_order_volume_state": "IN_TRANSIT",
        "tracking_state": null,
        "created": 1467412580614,
        "created_iso": "2016-07-01T19:36:20.614-03:00",
        "provider_message": "em processo de entrega",
        "provider_state": "ABC123",
        "shipper_provider_state": "ENT",
        "esprinter_message": "OBJETO EM RUA",
        "shipment_volume_micro_state": {
            "id": 28,
            "code": "27",
            "default_name": "CARGA REDESPACHADA",
            "i18n_name": null,
            "description": "A carga foi entregue para uma outra transportadora para contiunar a entrega até o destino. ",
            "shipment_order_volume_state_id": 12,
            "shipment_volume_state_source_id": 2,
            "name": "CARGA REDESPACHADA"
        },
        "attachments": [
            {
                "file_name": "assinatura.jpg",
                "mime_type": "image/jpg",
                "type": "OTHER",
                "processing_status": "PROCESSING",
                "additional_information": {
                    "key1": "value 1",
                    "key2": "value 2"
                },
                "url": null,
                "created": 1516031018137,
                "created_iso": "2018-01-15T13:43:38.137-02:00",
                "modified": 1516031018137,
                "modified_iso": "2018-01-15T13:43:38.137-02:00"
            }
        ],
        "shipment_order_volume_state_localized": "Em trânsito",
        "shipment_order_volume_state_history": 1384656,
        "event_date": 1467404520000,
        "event_date_iso": "2016-07-01T17:22:00.000-03:00"
    },
    "invoice": {
        "invoice_series": "1",
        "invoice_number": "1000",
        "invoice_key": "00000502834982004563550010000084111000132317"
    },
    "order_number": "PEDIDO0004",
    "tracking_code": "IP20160701BR",
    "volume_number": "1",
    "estimated_delivery_date": {
        "client": {
            "current": 1516031018137,
            "current_iso": "2018-01-15T13:43:38.137-02:00",
            "original": 1516031018137,
            "original_iso": "2018-01-15T13:43:38.137-02:00"
        },
        "logistic_provider": {
            "current": 1516031018137,
            "current_iso": "2018-01-15T13:43:38.137-02:00",
            "original": 1516031018137,
            "original_iso": "2018-01-15T13:43:38.137-02:00"
        }
    }
}
```

__Response__
#### 200
```json
{
	Created
}
 ```

#### 500
```json
 {
 "status": 500,
 "code": "tracking.get.courier.error",
 "error":"anyExceptionMessage"
 }
 ```
 ____

`postRoutEasy.ts` (**POST**) Post a new order tracking status

__Status__
```
	on_route:	Operador no trajeto
	on_break:	Operador pausou
    servicing : Operador inicia o trajeto
	completed:	Operador finalizou,
	failure: Falha na Entrega
```

__Request__

```javascript
curl -X GET \
  'http://localhost:9290/courier/routeasy' \
  -H 'Content-Type: application/json' \
	-H 'Authorization: Basic cmluYWxkby5hcmdlbnRpZXJlQGluZnJhY29tbWVyY2UuY29tLmJyOkoxbmYzNDk=' \
	--data-raw  {
   "current": {
     "_id": "5f6bae5a40a2483a886c6b7d",
     "entity": {
       "id": "5f6ba6a040a2483a886c6b2f",
       "status": "servicing",
       "type": "task"
     },
     "eventType": "action",
     "action": "start_service",
     "sender": {
       "firstName": "William",
       "lastName": "Kennedy",
       "email": "william.kennedy@routeasy.com.br",
       "_id": "5f43c8611ae3f310e7634d74",
       "username": "william.kennedy@routeasy.com.br",
       "displayName": "William kennedy",
       "id": "5f43c8611ae3f310e7634d74"
     },
     "date": "2020-09-23T20:21:46.395Z",
     "values": {},
     "created": "2020-09-23T20:21:46.395Z",
     "__v": 0,
     "tracking": "http://company.routeasy.com.br//tracking?hash=b691f1187fa40f60533cfd5691371abec9efa4690cc5c88878efc10bc9d7a6ec5b70579012a0c5e7e472f191a1fcb94aefa35a28d3a5917677e826291d7cc06a865d0b6b39865610cb7ad8fe55448452",
     "status": "servicing",
     "services": [{
       "name": "MEL COSMETICOS EIRELI",
       "code": "000000077566",
       "invoice_number": "93799",
       "order_number": "WEB-210609440",
       "shipment_number": null,
       "email": "WEST_VIVI@HOTMAIL.COM",
       "phone": null
     }],
     "job": {
       "id": "5f6ba6aece5e923a9a56e8e8",
       "due_date": 1600869600000,
       "routing": "5f6ba6a040a2483a886c6b28",
       "route": {
         "id": "5f6ba6a22942eb3a7c6de5c5",
         "name": "Rota 1"
       },
       "operator": {}
     }
   },
   "previous": null
 }
```

__Response__
#### 200
```json
{
	Created
}
 ```

#### 500
```json
 {
 "status": 500,
 "code": "tracking.get.courier.error",
 "error":"anyExceptionMessage"
 }
 ```
 ____

## Tasks
| Queue                                   |                   Description                    |
| --------------------------------------- | :----------------------------------------------: |
| __tracking_feed_order_status_q__        | Receives tracking and creates it at the database |
| __tracking_feed_reload_store_config_q__ |         Receives and reloads new stores          |
