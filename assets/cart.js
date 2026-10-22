window.PORTEXA_PRODUCTS = {
'white-pad':{id:'white-pad',name:'White Day Pad',detail:'245 mm · 10 pieces per pack',price:2500,image:'/images/products/white-day-pad.jpg',alt:'Portexa White Day Pad package'},
'black-pad':{id:'black-pad',name:'Black Night Pad',detail:'290 mm · 8 pieces per pack',price:2500,image:'/images/products/black-night-pad.jpg',alt:'Portexa Black Night Pad package'},
'purple-pad':{id:'purple-pad',name:'Purple Heavy-Flow Pad',detail:'360 mm · 6 pieces per pack',price:3500,image:'/images/products/purple-heavy-flow-pad.jpg',alt:'Portexa Purple Heavy-Flow Pad package'},
'blue-liner':{id:'blue-liner',name:'Blue Panty Liner',detail:'160 mm · 30 pieces per pack',price:3500,image:'/images/products/blue-panty-liner.jpg',alt:'Portexa Blue Panty Liner package'}
};
window.portexaCart={get(){try{return JSON.parse(localStorage.getItem('portexa_cart')||'{}')}catch(e){return {}}},save(c){localStorage.setItem('portexa_cart',JSON.stringify(c));document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=Object.values(c).reduce((a,b)=>a+Number(b||0),0))},add(id){const c=this.get();if(!window.PORTEXA_PRODUCTS[id])return;c[id]=(c[id]||0)+1;this.save(c)},change(id,d){const c=this.get();c[id]=(c[id]||0)+d;if(c[id]<=0)delete c[id];this.save(c)},clear(){this.save({})},count(){return Object.values(this.get()).reduce((a,b)=>a+Number(b||0),0)}};
document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=window.portexaCart.count()));
