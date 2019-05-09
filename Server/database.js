var express = require('express');
var app = express();
var database = require('./generated.json');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var _ = require('underscore');

//setting elasticsearch database connection
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

module.exports = client;    

//check if the connection is successfull
client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 30000,
  }, 
  function (error) {
  if (error) {
    console.error('Elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

router.get('/get_data', function(req, res) {
  res.send(database)
})

//creating a new index and posting document data to the elasticsearch database
  router.post('/create_index_for_customer', function(request, response) {
    
    var index_vl = 'customer';
    client.indices.create({
      index: index_vl,
      body: {
        "settings": {
          "analysis": {
              "filter": {
                "english_stop": {
                  "type":       "stop",
                  "stopwords":  "_english_" 
                },
                "english_stemmer": {
                  "type":       "stemmer",
                  "language":   "english"
                },
                "english_possessive_stemmer": {
                  "type":       "stemmer",
                  "language":   "possessive_english"
                }
              },
              "analyzer": {
                  "autocomplete": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": [
                      "english_possessive_stemmer",
                      "lowercase",
                      "english_stop",
                      "english_stemmer"]
                  }
              }
          }
      },
          "mappings": {
            "cus_info": {
              "properties": {
                "name": {
                      "analyzer": "autocomplete",
                      "type":"completion"
                },
                "age": {
                      "type": "integer"
                },
                "gender": {
                      "analyzer": "autocomplete",
                      "type":"completion"
                },
                "email": {
                      "analyzer": "autocomplete",
                      "type":"completion"
                },
                "address": {
                      "analyzer": "autocomplete",
                      "type":"completion"
                }
              }
            }
          }
        }  
    }, function(err, respcode) {
        const cust_data = database;
  
        _this.bulkIndex(index_vl,'cus_info', cust_data);
        response.status(200).send({ indes: 'data_pushed' })
          .end();
    });
  });
/*
//retrieving indexed document data from the elasticsearch database
router.get('/get_data_from_customer/:vl', function(request, response) {
  let body = {
    from: 0,
    size: 10,
    query: {
      match_phrase_prefix: {
        name: {
          query: request.params.vl
        }
      }
    }
  };
  let vl = [];
    client.search({ index: 'customer', body: body, type: 'cus_info' })
      .then(result => {
        result.hits.hits.forEach(re => {
          vl.push(re['_source']);
        });
        response.status(200).send(vl).end();
      });
})*/
//search indexed document data from elasticsearch index
router.get('/get_data_from_customer/:vl', function(request, response) {
  let body = {
    from: 0,
    size: 10,
    suggest: {
      nameSuggest: {
          prefix: request.params.vl,
          completion: {
            field: 'name',
            fuzzy: {
              fuzziness: 5
            }
          }
      }
    }
  };
  let vl = [];
    client.search({ index: 'customer', body: body, type: 'cus_info' })
      .then(result => {
        result.suggest.nameSuggest.options.forEach(re => {
          vl.push(re['_source']);
        });
        response.status(200).send(vl).end();
      });
})
//////////////////////////////////////////////////////////////////////
router.get('/get_data_from_customer/', function(request, response) {
  let body = {
    from: 0,
    size: 0,
  };
  let vl = [];
    client.search({ index: 'customer', body: body, type: 'cus_info' })
      .then(result => {
        result.hits.hits.forEach(re => {
          vl.push(re['_source']);
        });
        response.status(200).send(vl).end();
      });
})

module.exports = router;


return _this = {
bulkIndex: function bulkIndex(index, type, data){
  let bulkBody = [];

  data.forEach(item => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _Id: item._id
      }
    });

    bulkBody.push(item);
  });

  client.bulk({ body: bulkBody })
    .then(response => {
      let errorCount = 0;
      response.items.forEach(item => {
        if (item.index && item.index.error) {
          console.log(++errorCount, item.index.error);
        }
      });

      console.log(`Successfully indexed ${data.length - errorCount} out of ${data.length} items`);
    })
    .catch(console.err);
  }
}
