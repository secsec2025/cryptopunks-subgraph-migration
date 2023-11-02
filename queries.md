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


