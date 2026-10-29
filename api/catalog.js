const { supabaseAdmin, getUserFromRequest, isAdmin, jsonError } = require('./_lib');

const COLUMNS = 'id,name,category,detail,price,image,alt,available,visible,sort_order,created_at,updated_at';

function toBool(v) {
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return null;
}

// Checks the fields that were sent. Returns { values } or { error }.
function clean(body, isNew) {
  const out = {};
  if (isNew || body.name !== undefined) {
    const name = String(body.name == null ? '' : body.name).trim();
    if (name.length < 1 || name.length > 120) return { error: 'Product name must be 1 to 120 characters.' };
    out.name = name;
  }
  if (isNew || body.category !== undefined) {
    const category = String(body.category == null || body.category === '' ? 'General' : body.category).trim();
    if (category.length < 1 || category.length > 40) return { error: 'Category must be 1 to 40 characters.' };
    out.category = category;
  }
  if (body.detail !== undefined || isNew) {
    const detail = String(body.detail == null ? '' : body.detail).trim();
    if (detail.length > 200) return { error: 'Pack details must be 200 characters or fewer.' };
    out.detail = detail;
  }
  if (isNew || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isInteger(price) || price < 1 || price > 10000000) return { error: 'Price must be a whole number of naira, at least 1.' };
    out.price = price;
  }
  if (body.image !== undefined) {
    const image = String(body.image == null ? '' : body.image).trim();
    if (image === '') out.image = null;
    else if (image.length > 400 || image.includes('..') || !(image.startsWith('/images/') || image.startsWith('https://'))) {
      return { error: 'Photo must be a file in /images/ or an https address.' };
    } else out.image = image;
  }
  if (body.alt !== undefined) {
    const alt = String(body.alt == null ? '' : body.alt).trim();
    if (alt.length > 200) return { error: 'Photo description must be 200 characters or fewer.' };
    out.alt = alt;
  }
  if (body.available !== undefined) {
    const v = toBool(body.available);
    if (v === null) return { error: 'Available must be true or false.' };
    out.available = v;
  }
  if (body.visible !== undefined) {
    const v = toBool(body.visible);
    if (v === null) return { error: 'Visible must be true or false.' };
    out.visible = v;
  }
  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order);
    if (!Number.isInteger(n) || n < 0 || n > 9999) return { error: 'Order must be a whole number from 0 to 9999.' };
    out.sort_order = n;
  }
  return { values: out };
}

function slugify(name) {
  const s = String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
  return s || 'product';
}

// One function for the whole catalogue (Vercel Hobby allows only 12 functions).
//   GET             -> public list of visible products (no sign-in needed)
//   GET ?all=1      -> admin only: every product, including hidden ones
//   POST / PATCH    -> admin only: add or edit a product
module.exports = async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const wantsAll = req.method === 'GET' && String((req.query && req.query.all) || '') === '1';

    if (req.method === 'GET' && !wantsAll) {
      const pub = supabaseAdmin();
      const { data, error } = await pub
        .from('products')
        .select('id,name,category,detail,price,image,alt,available')
        .eq('visible', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) {
        console.error('Products load failed:', error.code, error.message);
        return jsonError(res, 500, 'Could not load products.');
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ products: data || [] });
    }

    const user = await getUserFromRequest(req);
    if (!user || !(await isAdmin(user.id))) {
      return jsonError(res, 403, 'Admin access required.');
    }
    const db = supabaseAdmin();

    if (req.method === 'GET') {
      const { data, error } = await db.from('products').select(COLUMNS).order('sort_order', { ascending: true }).order('name', { ascending: true });
      if (error) {
        console.error('Admin products load failed:', error.code, error.message);
        return jsonError(res, 500, 'Could not load products.');
      }
      return res.status(200).json({ products: data || [] });
    }

    const body = req.body || {};

    if (req.method === 'POST') {
      const { values, error: bad } = clean(body, true);
      if (bad) return jsonError(res, 400, bad);
      const base = slugify(values.name);
      const { data: existing, error: idError } = await db.from('products').select('id').like('id', base + '%');
      if (idError) return jsonError(res, 500, 'The product could not be created.');
      const taken = new Set((existing || []).map((r) => r.id));
      let id = base, n = 2;
      while (taken.has(id)) id = `${base}-${n++}`;
      const { data: last } = await db.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1);
      const nextOrder = last && last[0] ? Number(last[0].sort_order) + 1 : 1;
      const row = { id, sort_order: nextOrder, available: true, visible: true, ...values };
      const { data, error } = await db.from('products').insert(row).select(COLUMNS).maybeSingle();
      if (error) {
        console.error('Product create failed:', error.code, error.message);
        return jsonError(res, 500, 'The product could not be created.');
      }
      return res.status(201).json({ success: true, product: data });
    }

    // PATCH
    const id = String(body.id || '');
    if (!/^[a-z0-9-]{1,60}$/.test(id)) return jsonError(res, 400, 'Product is invalid.');
    const { values, error: bad } = clean(body, false);
    if (bad) return jsonError(res, 400, bad);
    if (Object.keys(values).length === 0) return jsonError(res, 400, 'Nothing to change.');
    values.updated_at = new Date().toISOString();
    const { data, error } = await db.from('products').update(values).eq('id', id).select(COLUMNS).maybeSingle();
    if (error) {
      console.error('Product update failed:', error.code, error.message);
      return jsonError(res, 500, 'The product could not be saved.');
    }
    if (!data) return jsonError(res, 404, 'Product not found.');
    return res.status(200).json({ success: true, product: data });
  } catch (error) {
    console.error('Admin products error:', error.message);
    return jsonError(res, 500, 'Could not update products.');
  }
};
