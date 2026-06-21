import { Prisma } from '@prisma/client';

type Numeric = Prisma.Decimal | number | string;

function toNumber(value: Numeric): number {
  return typeof value === 'number' ? value : Number(value);
}

export function computeSellingPrice(
  netPrice: Numeric,
  discountPercent: Numeric,
): number {
  const net = toNumber(netPrice);
  const discount = toNumber(discountPercent);
  const selling = net * (1 - discount / 100);
  return Math.round(selling * 100) / 100;
}

export function withProductPricing<T extends { netPrice: Numeric; discountPercent: Numeric }>(
  product: T,
) {
  const netPrice = toNumber(product.netPrice);
  const discountPercent = toNumber(product.discountPercent);
  const sellingPrice = computeSellingPrice(netPrice, discountPercent);

  return {
    ...product,
    netPrice,
    discountPercent,
    sellingPrice,
  };
}
