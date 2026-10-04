import { config } from './config.js';

type ProductSearchInput = {
  search?: string;
  categorySlug?: string;
  pageSize: number;
};

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function trpcQuery(
  procedure: string,
  input: unknown,
  token?: string,
): Promise<unknown> {
  const query = input === undefined
    ? `${config.backendApiUrl}/trpc/${procedure}`
    : `${config.backendApiUrl}/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`;
  const response = await fetch(query, { headers: authHeaders(token) });
  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }
  const body = (await response.json()) as {
    result?: { data?: { json?: unknown } };
  };
  return body.result?.data?.json ?? body.result?.data;
}

export async function searchProducts(input: ProductSearchInput, token?: string) {
  const data = (await trpcQuery('product.list', input, token)) as {
    items?: Array<Record<string, unknown>>;
  };
  const products = data.items || [];
  return {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.netPrice,
      discount: product.discountPercent,
      link: `/product/${product.slug || product.id}`,
    })),
  };
}

export async function getOrderDetails(orderId: string, token?: string) {
  const data = await trpcQuery('order.getOrderDetails', { orderId }, token);
  return { success: true, order: data };
}

export async function getCheckoutData(token?: string) {
  const [cart, addresses] = await Promise.all([
    trpcQuery('cart.getCart', undefined, token),
    trpcQuery('customer.getAddresses', undefined, token),
  ]);
  return { cart, addresses };
}

export async function createCodOrder(token: string) {
  const data = (await getCheckoutData(token)) as {
    cart: {
      items?: Array<{
        quantity?: number;
        product?: { name?: string; netPrice?: number | string };
      }>;
    };
    addresses: Array<{
      isDefault?: boolean;
      fullName?: string | null;
      phone?: string | null;
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    }>;
  };
  const address = data.addresses.find((item) => item.isDefault) ?? data.addresses[0];
  if (!address) throw new Error('No saved address found');
  if (!data.cart.items?.length) throw new Error('Cart is empty');

  const shippingAddress = [
    address.fullName,
    address.phone,
    address.street,
    address.city,
    address.state,
    address.country,
    address.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const order = await trpcMutation(
    'order.createOrder',
    { shippingAddress, paymentMethod: 'COD' },
    token,
  );
  return { order, shippingAddress };
}

async function trpcMutation(
  procedure: string,
  input: unknown,
  token: string,
): Promise<unknown> {
  const response = await fetch(`${config.backendApiUrl}/trpc/${procedure}`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'content-type': 'application/json' },
    body: JSON.stringify({ json: input }),
  });
  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }
  const body: unknown = await response.json();
  return body;
}
