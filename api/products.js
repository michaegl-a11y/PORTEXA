const { supabaseAdmin, jsonError } = require('./_lib');

// Public list of products shown in the shop. Hidden products are never returned.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
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
  } catch (error) {
    console.error('Products error:', error.message);
    return jsonError(res, 500, 'Could not load products.');
  }
};
