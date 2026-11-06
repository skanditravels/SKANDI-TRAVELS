import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../scripts/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const read = name => fs.readFile(new URL('../'+name, import.meta.url), 'utf8');
const runnable = code => code.replace(/^import [\s\S]*?;$/gm, '').replace(/^export /gm, '');

test('public Store uses fixed Wix visibility scopes and suppresses unpublished products', async () => {
  const productQuery = async (query, options) => {
    assert.equal(query.filter.visible.$eq, true);
    assert.equal(options.fields.includes('MERCHANT_DATA'), false);
    return { products: [
      { _id:'visible', name:'Travel adapter', visible:true },
      { _id:'hidden', name:'Internal sample', visible:false }
    ] };
  };
  const categoryQuery = async (_, options) => {
    assert.equal(options.returnNonVisibleCategories, false);
    assert.equal(options.treeReference.appNamespace, '@wix/stores');
    assert.equal(options.treeReference.treeKey, null);
    // Wix writes to the tree reference while normalizing the request.
    options.treeReference.appNamespace = 'normalized-namespace';
    return { categories:[{ _id:'travel', name:'Travel', visible:true },{ _id:'hidden', name:'Internal', visible:false }] };
  };
  const elevate = fn => fn === productQuery || fn === categoryQuery ? fn : async () => {};
  const context = vm.createContext({ auth:{ elevate }, elevate, coupons:{}, orders:{}, orderFulfillments:{},
    inventoryItemsV3:{}, recommendations:{}, productsV3:{ queryProducts:productQuery }, categories:{ queryCategories:categoryQuery } });
  vm.runInContext(runnable(await read('src/backend/SKANDI_CORE/storefront.js')), context);
  const result = await context.listStorefrontProductsCore();
  assert.deepEqual(Array.from(result.products, p=>p.id), ['visible']);
  assert.deepEqual(Array.from(result.categories, p=>p.id), ['travel']);
  const repeated = await context.listStorefrontProductsCore();
  assert.deepEqual(Array.from(repeated.categories, p=>p.id), ['travel']);
});

async function giftFixture({key='x'.repeat(64)}={}) {
  const product = { id:'wix-gift-product', presetVariants:[{ id:'value-100', value:{ amount:'100' }, price:{ amount:'100' } }] };
  let customItem;
  const issued = [], cards = new Map();
  const context = vm.createContext({
    auth:{ elevate:fn=>fn }, elevate:fn=>fn, createHmac, timingSafeEqual, Buffer,
    secrets:{ getSecretValue:async()=>({ value:key }) },
    giftVoucherProducts:{ queryGiftCardProducts:async()=>({ giftCardProducts:[product] }) },
    giftVouchers:{
      queryGiftCards:async query=>({ giftCards:[cards.get(query.filter.code.$eq)].filter(Boolean) }),
      createGiftCard:async (input, options)=>{
        issued.push({ input, options });
        const card={ _id:'issued-1' };
        cards.set(input.code,card);
        return card;
      }
    },
    orders:{}, currentCartV2:{ getCurrentCart:async()=>({cart:{_id:'owned-cart'}}) },
    cartV2:{ addLineItems:async (cartId,{customItems})=>{
      assert.equal(cartId,'owned-cart');
      customItem=customItems[0];
      return { cart:{ _id:cartId, lineItems:[customItem] } };
    } }
  });
  vm.runInContext(runnable(await read('src/backend/SKANDI_CORE/storeGiftCards.js')), context);
  const input={ giftCardVariantId:'value-100', amount:1, recipientName:'Guest', recipientEmail:'guest@example.test',
    senderName:'Buyer', styleId:'CLASSIC_NAVY', message:'Have a good trip!' };
  const order=()=>({ _id:'2c9f0f97-6842-4110-a671-bf33f2003c91', currency:'USD', paymentStatus:'PAID',
    lineItems:[{ _id:'line-1', quantity:1, price:{amount:'100.00'}, itemType:customItem.attributes.itemType,
      physicalProperties:customItem.attributes.physicalProperties, descriptionLines:customItem.attributes.descriptionLines }] });
  return {context,input,order,issued};
}

test('Wix gift-card values appear as Store products and purchase waits for fulfillment setup', async () => {
  const { context,input }=await giftFixture({key:''});
  const result=await context.getStoreGiftCardCatalogCore();
  assert.equal(result.products[0].virtualGiftCard,true);
  assert.equal(result.products[0].price.amount,'100');
  assert.equal(result.products[0].canAddToCart,false);
  await assert.rejects(context.addStoreGiftCardToCurrentCartCore(input),{code:"GIFT_CARD_CONFIGURATION_REQUIRED"});
});

test('gift cards are issued once for the signed paid order with native Wix recipient delivery', async () => {
  const {context,input,order,issued}=await giftFixture();
  const bag=await context.addStoreGiftCardToCurrentCartCore(input);
  assert.equal(bag.cart.lineItems[0].pricing.price.amount,'100');
  assert.equal((await context.fulfillPaidStoreGiftCardsCore({...order(),paymentStatus:'NOT_PAID'})).issued,0);
  const changed=order();
  changed.lineItems[0].price.amount='1';
  await assert.rejects(context.fulfillPaidStoreGiftCardsCore(changed),/authorized purchase/);
  const paid=await context.fulfillPaidStoreGiftCardsCore(order());
  assert.equal(paid.issued,1);
  assert.equal(issued[0].input.initialValue.amount,'100');
  assert.equal(issued[0].input.notificationInfo.recipient.email,'guest@example.test');
  assert.equal((await context.fulfillPaidStoreGiftCardsCore(order())).existing,1);
  assert.equal(issued.length,1);
});

test('a failed storefront load offers retry and a Wix gift card renders as a Store item', async t => {
  const base='skandi-embeds/the-store/skandi-the-store';
  const {window}=new JSDOM(await read(base+'.html'),{runScripts:'outside-only',url:'https://example.test'});
  t.after(()=>window.close());
  const posted=[];
  window.postMessage=message=>posted.push(message);
  window.scrollTo=()=>{};
  window.eval(await read(base+'.js'));
  const deliver=(type,payload)=>window.dispatchEvent(new window.MessageEvent('message',{
    source:window,data:{source:'SKANDI_WIX_PARENT',type,payload}
  }));
  deliver('STOREFRONT_ERROR',{stage:'STOREFRONT_READY'});
  assert.equal(window.document.getElementById('storeCatalogError').hidden,false);
  window.document.getElementById('retryStoreCatalogBtn').click();
  assert.equal(posted.at(-1).type,'STOREFRONT_REFRESH');
  deliver('STOREFRONT_PRODUCTS',{initialCategory:'Gift Cards',giftCardProducts:[{id:'gift-100',name:'SKANDI Gift Card — $100.00',
    virtualGiftCard:true,canAddToCart:false,price:{amount:'100',currency:'USD'},categoryNames:['Gift Cards']}]});
  assert.equal(window.document.getElementById('storeCatalogError').hidden,true);
  assert.match(window.document.getElementById('productGrid').textContent,/SKANDI Gift Card/);
  assert.match(window.location.hash,/Gift(%20|\+)Cards/);
});
