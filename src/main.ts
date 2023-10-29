import {TypeormDatabase} from '@subsquid/typeorm-store';
import {processor} from './processor';

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    console.log(`Batch Size - ${ctx.blocks.length} blocks`);

    for (const c of ctx.blocks) {
        for (const e of c.logs) {
            if (e.address === '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB'.toLowerCase()) {
                // console.log('from punks');
            } else if (e.address === '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6'.toLowerCase()) {
                // console.log('from wrapped punks');
            } else {
                // console.log('some other');
            }
        }
    }
})
