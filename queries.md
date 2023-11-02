# Sample Queries

## Sales for the last 30 days

### Subgraph Query
```graphql
query Last30DaysSales($timestamp_gt: String) {
  sales(
    orderBy: timestamp
    orderDirection: desc
    where: { timestamp_gt: $timestamp_gt }
  ) {
    id
    to {
      id
    }
    amount
    txHash
    timestamp
  }
}
```

### Squid Query
Since there is no separate entity called Sales, we have to fetch `Event` entity where `Event.type = SALE`. 

`$timestamp_gt = 1522136619000`
```graphql
query Last30DaysSales($timestamp_gt: BigInt) {
  events(
    orderBy: timestamp_DESC
    where: { timestamp_gt: $timestamp_gt, type_eq: SALE }
		limit: 30
  ) {
    id
		type
    to {
      id
    }
    amount
    txHash
    timestamp
    nft {
        tokenId
    }
  }
}
```


## Query Punk data

### Subgraph Query
```graphql
{
  punks(where: { id: "1000" }) {
    id
    owner {
      id
    }
    assignedTo {
      id
    }
    wrapped
    currentBidCreated {
      id
    }
    currentAskCreated {
      id
    }
    numberOfTransfers
    numberOfSales
    events {
      id
    }
  }
}
```

### Squid Query
```graphql
{
  punks(where: { id_eq: "1000" }) {
    id
    owner {
      id
    }
    assignedTo {
      id
    }
    wrapped
    currentBidCreated {
      id
    }
    currentAskCreated {
      id
    }
    numberOfTransfers
    numberOfSales
    events {
      id
    }
  }
}
```

## Query the Asks for a Punk

### Subgraph Query
```graphql
{
  asks(orderDirection: desc, where: { nft: "1000" }) {
    id
    open
    amount
    created {
      blockNumber
      timestamp
    }
    removed {
      id
      blockNumber
      timestamp
    }
    from {
      id
    }
  }
}
```

### Squid Query
The query is almost same. Only difference is we have to fetch `Offer` entity with `Offer.offerType = ASK`. 
```graphql
query AsksForAPunk {
  offers(where: {nft: {id_eq: "1000"}, offerType_eq: ASK}, orderBy: id_DESC) {
    id
    open
    amount
    created {
      blockNumber
      timestamp
    }
    removed {
      id
      timestamp
      blockNumber
    }
    from {
      id
    }
  }
}
```


## Query Owner Data

### Subgraph Query
```graphql
{
  accounts(where: { id: "0xc352b534e8b987e036a93539fd6897f53488e56a" }) {
    id
    nftsOwned {
      id
    }
    bids {
      id
    }
    asks {
      id
      created {
        id
        txHash
        timestamp
      }
    }
    bought {
      id
      timestamp
      nft {
        id
      }
    }
    sent {
      id
      nft {
        id
      }
      txHash
      timestamp
    }
    received {
      id
      nft {
        id
      }
      txHash
      timestamp
    }
    assigned {
      id
      nft {
        id
      }
      timestamp
      txHash
    }
  }
}
```

### Squid Query
```graphql
query MyQ {
  accounts(where: { id_eq: "0xc352b534e8b987e036a93539fd6897f53488e56a" }) {
    id
    punksOwned {
      id
    }
    bids {
      id
    }
    asks {
      id
      created {
        id
        txHash
        timestamp
      }
    }
    bought {
      id
      timestamp
      nft {
        id
      }
    }
    sent {
      id
      nft {
        id
      }
      txHash
      timestamp
    }
    received {
      id
      nft {
        id
      }
      txHash
      timestamp
    }
    assigned {
      id
      nft {
        id
      }
      timestamp
      txHash
    }
  }
}
```


## Query male Punks

# Subgraph Query
```graphql
{
  punks(where: { type: male }) {
    id
    accessories
    type
  }
}
```

# Squid Query
```graphql
query MyQ {
  punks(where: {
		metadata: {
			traits_some: {
				trait: {
					id_eq: "male"
				}
			}
		}
	}) {
    id
  }
}
```


## Get Contract Details
```graphql
query MyQ {
	contracts {
		id
		symbol
		name
		totalSupply
		totalSales
		totalAmountTraded
		imageHash
	}
}
```

## Get cTokens By From ID
```graphql
query MyQ {
	cTokens (where: {from: {
		id_eq: "0x0053f28decb7184d73a0d776aff540ea09ec6a2c"
	}}) {
		id
		to {
			id
		}
		punkId
		owner
		referenceId
	}
}
```

## Get all Transfers of a Punk
```graphql
query MyQ {
	events(where: {type_eq: TRANSFER, nft: { id_eq: "1"}}) {
		id
		from {
			id
		}
		to {
			id
		}
		nft {
			id
		}
		timestamp
		txHash
	}
}
```

## Get Metadata of a Punk
```graphql
query MyQ {
	metaData(where: {punk: {id_eq: "12"}}) {
		tokenId,
		tokenURI,
		image,
		svg,
		contractURI,
		traits {
			trait {
				type
				id
			}
		}
	}
}
```

## Get all punks that have more than 1 transfers
```graphql
query MyQ {
	punks (where: {numberOfTransfers_gt: 1}) {
		id
		owner {
			id
		}
		wrapped
		numberOfSales
		averageSalePrice
		numberOfTransfers
	}
}
```


## Get the owner of a Proxy
```graphql
query MyQ {
	userProxies(where: {id_eq: ""}) {
		id
		user {
			id
		}
		txHash
		blockNumber
		blockHash
	}
}
```