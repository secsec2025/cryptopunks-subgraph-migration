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




