import {Event} from '../model';

export function updateSale(sale: Event, price: bigint, buyer: string): void {
    sale.amount = price;
    sale.toId = buyer;
}