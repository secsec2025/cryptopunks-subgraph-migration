# Sample Queries

## Sales for the last 30 days
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query Last30DaysSales {
    sales(
        orderBy: timestamp
        orderDirection: desc
        first: 200
        where: { timestamp_gt: 1696302647 }
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

### Squid Query
Since there is no separate entity called Sales, we have to fetch `Event` entity where `Event.type = SALE`. 

```graphql
query Last30DaysSales {
    events(
        orderBy: timestamp_DESC
        where: { timestamp_gt: 1696302647000, type_eq: SALE }
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
✅ Squid data matches with subgraph.

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
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
    asks(orderDirection: asc, orderBy: id, where: { nft: "1000" }) {
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
    asks: offers(where: {nft: {id_eq: "1000"}, offerType_eq: ASK}, orderBy: id_DESC) {
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
✅ Squid data matches with subgraph.

### Subgraph Query
The Subgraph (Playground) has a max limit of fetching max 1000 items. But squid does not, which makes it better.
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
The query is very identical to the above one. The only difference is we have to use aliases with where clauses to
fetch the correct entities (Offers and Events). The response wil have no difference.
```graphql
query MyQ {
    accounts(where: { id_eq: "0xc352b534e8b987e036a93539fd6897f53488e56a" }) {
        id
        punksOwned {
            id
        }
        bids: offers(where: { offerType_eq: BID}) {
            id
        }
        asks: offers(where: { offerType_eq: ASK}) {
            id
            created {
                id
                txHash
                timestamp
            }
        }
        bought: eventsTo(where: {type_eq: SALE }) {
            id
            timestamp
            nft {
                id
            }
        }
        sent: eventsFrom(where: {type_eq: TRANSFER }) {
            id
            nft {
                id
            }
            txHash
            timestamp
        }
        received: eventsTo(where: {type_eq: TRANSFER }) {
            id
            nft {
                id
            }
            txHash
            timestamp
        }
        assigned: eventsTo(where: {type_eq: ASSIGN }) {
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
✅ Squid data matches with subgraph.

#### Subgraph Query
```graphql
{
    punks(where: {
        metadata_: {
            traits_contains: ["male"]
        }
    }, first: 1000, skip: 0) {
        id
    }
}
```

#### Squid Query
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
✅ Squid data matches with subgraph and both queries are same.

There is a slight (negligible) mismatch in `totalAmountTraded` value of Wrapped Punks contract. This is due to bigint division and rounding.

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
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
  ctokens(where: 
    {from_: 
      {id: "0x0053f28decb7184d73a0d776aff540ea09ec6a2c"}
    }) {
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

### Squid Query
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
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
  transfers(where: 
    {nft_: {id: "1"}},
    orderBy: timestamp,
    orderDirection: asc) {
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

### Squid Query
```graphql
query MyQ {
    events(where: {type_eq: TRANSFER, nft: { id_eq: "1"}},
        orderBy: timestamp_ASC) {
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
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
	metaDatas(where: {punk_: {id: "12"}}) {
		tokenId,
		tokenURI,
		image,
		svg,
		contractURI,
		traits {
      id
      type
		}
	}
}
```

### Squid Query
The only slight difference is that there is an intermediate entity that maps MetaData and Trait (Many-to-Many Relationship)
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

## Get all punks that have more than 10 transfers
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
	punks (where: {numberOfTransfers_gt: 10},
  first: 1000) {
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

### Squid Query
```graphql
query MyQ {
	punks (where: {numberOfTransfers_gt: 10}) {
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
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
	userProxies(where: {id: "0x43393caafba3d76db71b2cdb073b0174a8c0af84"}) {
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

### Squid Query
```graphql
query MyQ {
	userProxies(where: {id_eq: "0x43393caafba3d76db71b2cdb073b0174a8c0af84"}) {
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

## Who owns the 10 most expensive Punks (Highest Open ASK)
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
    offers(where: {
        open: true, offerType: ASK
    },
        orderBy: amount,
        orderDirection: desc,
        first: 10) {
        amount
        nft {
            id
            owner {
                id
            }
        }
    }
}
```

### Squid Query
```graphql
query MyQ {
    offers(where: {
        open_eq: true, offerType_eq: ASK
    }, orderBy: amount_DESC, limit: 10) {
        amount
        nft {
            id
            owner {
                id
            }
        }
    }
}
```


## Which punk has had the most transfers?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
query MyQ {
  punks(orderBy: numberOfTransfers,
    orderDirection: desc,
    first: 1) {
		id
		numberOfTransfers
	}
}
```

### Squid Query
```graphql
query MyQ {
  punks(orderBy: numberOfTransfers_DESC, limit: 1) {
		id
		numberOfTransfers
	}
}
```


## Get Account stats for a given ID
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  accounts(where: { id: "0x577ebc5de943e35cdf9ecb5bbe1f7d7cb6c7c647"}) {
    id
		numberOfPunksOwned
		numberOfPunksAssigned
		numberOfTransfers
		numberOfSales
		numberOfPurchases
		totalSpent
		totalEarned
		averageAmountSpent
    punksOwned {
      id
    }
    bought {
      id
    }
    nftsOwned {
      id
    }
  }
}
```

### Squid Query
```graphql
query MyQ {
	accounts(limit: 5, orderBy: id_ASC, where: {id_eq: "0x577ebc5de943e35cdf9ecb5bbe1f7d7cb6c7c647"}) {
		id
		numberOfPunksOwned
		numberOfPunksAssigned
		numberOfTransfers
		numberOfSales
		numberOfPurchases
		totalSpent
		totalEarned
		averageAmountSpent
    punksOwned {
      id
    }
    bought: eventsTo(where: {type_eq: SALE}) {
      id
    }
	}
}


```

## Which punk has been sold the most?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  punks(first: 1, 
    orderBy: numberOfSales, 
    orderDirection: desc) {
    id
    numberOfSales
  }
}
```

### Squid Query
```graphql
query MyQ {
  punks(orderBy: numberOfSales_DESC, limit: 1) {
		id
		numberOfSales
	}
}
```

## Who has spent the most on punks?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  accounts(first: 1, 
    orderBy: totalSpent, 
    orderDirection: desc) {
    id
    totalSpent
  }
}
```

### Squid Query
```graphql
query MyQ {
  accounts(limit: 1, 
    orderBy: totalSpent_DESC) {
    id
    totalSpent
  }
}
```

## Who owns the most number of punks?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  accounts(first: 1, 
    orderBy: numberOfPunksOwned, 
    orderDirection: desc) {
    id
    numberOfPunksOwned
  }
}
```

### Squid Query
```graphql
query MyQ {
  accounts(limit: 1, 
    orderBy: numberOfPunksOwned_DESC) {
    id
    numberOfPunksOwned
  }
}
```

## Which male punk has been sold the most?
To get the "female" punk, replace "male" with "female".

✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  punks(where: {
    metadata_: {
      traits_contains: ["male"]
    }
  }, first: 1,
  orderBy: numberOfSales,
  orderDirection: desc) {
    id
    numberOfSales
  }
}
```

### Squid Query
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
	}, orderBy: numberOfSales_DESC,
	limit: 1) {
    id
		numberOfSales
  }
}
```

## The most expensive ask for a male punk?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  punks(where: {
    metadata_: {
      traits_contains: ["male"]
    },
    currentAsk_: {
      open: true
    }
  }, orderBy: currentAsk__amount,
    orderDirection: desc,
  first: 5) {
    id
    currentAsk {
      id
      amount
    }
  }
}
```

### Squid Query
```graphql
query MyQ {
  punks(where: {
		metadata: {
			traits_some: {
				trait: {
					id_eq: "male"
				}
			}
		},
		currentAsk: {
			open_eq: true
		}
	}, orderBy: currentAsk_amount_DESC,
	limit: 5) {
    id
		currentAsk {
			id
			amount
		}
  }
}
```

Another possible way (This can't be done in Subgraph due to its schema.graphql, `which makes the squid much more versatile.`)
```graphql
query MyQ {
  offers(where: {
		offerType_eq: ASK,
		open_eq: true,
		nft: {
			metadata: {
				traits_some: {
					trait: {id_eq: "male"}
				}
			}
		}
	}, orderBy: amount_DESC, limit: 5) {
		id
		amount
		nft {
			id
		}
	}
}


```

## Which punks hasn’t been moved since assign event?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
  punks(where: {
    numberOfTransfers: 0
  }, first: 1000, skip: 0) {
    id
  }
}
```

### Squid Query
```graphql
query MyQ {
  punks(where: {numberOfTransfers_eq: 0}) {
		id
	}
}
```

## Which addresses own at least one punk that hasn’t been moved?
✅ Squid data matches with subgraph.

### Subgraph Query
```graphql
{
    accounts(where: {
        punksOwned_: {
            numberOfTransfers: 0
        }
    }, first: 1000) {
        id,
        punksOwned(where: {numberOfTransfers: 0}) {
            id
            numberOfTransfers
        }
    }
}
```

### Squid Query
```graphql
query MyQ {
    accounts(where: {
        punksOwned_some: {
            numberOfTransfers_eq: 0
        }
    }) {
        id,
        punksOwned(where: {numberOfTransfers_eq: 0}) {
            id
            numberOfTransfers
        }
    }
}
```


