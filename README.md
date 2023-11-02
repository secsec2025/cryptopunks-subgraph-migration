# cryptopunks-subgraph-migration
A quest to migrate CryptoPunks subgraph to Subsquid

# Introduction

This is the squid implementation of the cryptopunks subgraph. https://thegraph.com/explorer/subgraph?id=YqMJatbgbqy1GodtbYZv4U9NzyaScCgSF7CAE5ivAM7&view=Overview

# What is Changed?

<ul>
<li>Batch Processing is used.</li>
<li>The <code>schema.graphql</code> file has been changed as mentioned in the below section.</li>
<li>Punk Metadata is fetched after the squid is fully synced with the blockchain.</li>
</ul>

# How to start?

```bash
git clone https://github.com/secsec2025/cryptopunks-subgraph-migration.git
cd cryptopunks-subgraph-migration
npm ci
sqd up
sqd process &
sqd serve
```

# GraphQL Schema Changes

<ul>
<li>Interfaces have been removed. Concrete types are used instead. This is due to typegen not working with interfaces.</li>
<li>All the Event types are considered as one entity called <b>Event</b>. Events can be distinguished based on <code>Event.type</code></li>
<li>Bid and Ask are considered as one entity called <b>Offer</b>. Offers can be distinguished based on <code>Offer.offerType</code></li>
<li>NFT interface is removed and <b>Punk</b> entity is used instead.</li>
<li>Due to the above reasons, subgraph queries will have to be slightly modified to fetch the results.</li>
</ul>



# What's Next to Do?

<ul>
<li>Add sample queries. <code>queries.md</code></li>
<li>Add custom resolvers to make the querying more similar to the subgraph.</li>
</ul>

